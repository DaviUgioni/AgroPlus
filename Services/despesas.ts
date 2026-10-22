import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../FirebaseConfig';
import { invalidarResumo } from './cacheResumo';

export type CategoriaDespesa = 'insumo' | 'mao_de_obra' | 'maquinario' | 'outros';

export const LABELS_CATEGORIA: Record<CategoriaDespesa, string> = {
  insumo: 'Insumo',
  mao_de_obra: 'Mão de obra',
  maquinario: 'Maquinário',
  outros: 'Outros',
};

export interface Despesa {
  id?: string;
  propriedadeId: string;
  talhaoId?: string | null;
  categoria: CategoriaDespesa;
  descricao: string;
  valor: number;
  data: Timestamp;
  criadoEm?: Timestamp;
  notaFiscalUri?: string | null;
  recorrente?: boolean;
  recorrenciaMeses?: number;
}

const despesasCollection = collection(db, 'despesas');

export async function criarDespesa(despesa: Omit<Despesa, 'id' | 'criadoEm'>) {
  const docRef = await addDoc(despesasCollection, {
    ...despesa,
    talhaoId: despesa.talhaoId ?? null,
    criadoEm: Timestamp.now(),
  });
  invalidarResumo();
  return docRef.id;
}

export async function atualizarDespesa(id: string, despesa: Partial<Despesa>) {
  const despesaRef = doc(db, 'despesas', id);
  await updateDoc(despesaRef, despesa);
  invalidarResumo();
}

export async function excluirDespesa(id: string) {
  const despesaRef = doc(db, 'despesas', id);
  await deleteDoc(despesaRef);
  invalidarResumo();
  try {
    const { excluirNotaFiscal } = await import('./imagens');
    excluirNotaFiscal(id);
  } catch {}
}

export async function buscarDespesa(id: string): Promise<Despesa | null> {
  const ref = doc(db, 'despesas', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Despesa;
}

export async function listarDespesasPorPropriedade(propriedadeId: string): Promise<Despesa[]> {
  // Evita exigir índice composto (where + orderBy) — ordena no cliente para não quebrar se índice não existir
  const q = query(despesasCollection, where('propriedadeId', '==', propriedadeId));
  try {
    const snapshot = await getDocs(q);
    const lista = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Despesa));
    return lista.sort((a, b) => (b.data?.toMillis?.() ?? 0) - (a.data?.toMillis?.() ?? 0));
  } catch (e: any) {
    // Fallback se mesmo o where simples falhar, tenta com orderBy e propaga link do console
    if (e?.code === 'failed-precondition' || e?.message?.includes('requires an index')) {
      console.warn('Índice Firestore faltando para despesas: crie via link no erro ou rode: firebase deploy --only firestore:indexes');
    }
    throw e;
  }
}

// O filtro por propriedadeId é exigido pelas regras do Firestore (firestore.rules):
// elas só liberam a consulta se provarem que as despesas pertencem à propriedade do usuário.
export async function listarDespesasPorTalhao(talhaoId: string, propriedadeId: string): Promise<Despesa[]> {
  const q = query(
    despesasCollection,
    where('propriedadeId', '==', propriedadeId),
    where('talhaoId', '==', talhaoId),
  );
  const snapshot = await getDocs(q);
  const lista = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Despesa));
  return lista.sort((a, b) => (b.data?.toMillis?.() ?? 0) - (a.data?.toMillis?.() ?? 0));
}

export function totalDespesas(despesas: Despesa[]): number {
  return despesas.reduce((soma, d) => soma + (typeof d.valor === 'number' ? d.valor : 0), 0);
}

export function totalDespesasMes(despesas: Despesa[], ano: number, mes: number): number {
  return despesas
    .filter((d) => {
      const dt = d.data?.toDate?.();
      if (!dt) return false;
      return dt.getFullYear() === ano && dt.getMonth() === mes;
    })
    .reduce((s, d) => s + (typeof d.valor === 'number' ? d.valor : 0), 0);
}

export function totalDespesasAno(despesas: Despesa[], ano: number): number {
  return despesas
    .filter((d) => {
      const dt = d.data?.toDate?.();
      return dt?.getFullYear() === ano;
    })
    .reduce((s, d) => s + (typeof d.valor === 'number' ? d.valor : 0), 0);
}
