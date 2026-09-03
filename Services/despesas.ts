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

export type CategoriaDespesa = 'insumo' | 'mao_de_obra' | 'maquinario' | 'outros';

export interface Despesa {
  id?: string;
  propriedadeId: string;
  talhaoId?: string | null;
  categoria: CategoriaDespesa;
  descricao: string;
  valor: number;
  data: Timestamp;
  criadoEm?: Timestamp;
}

const despesasCollection = collection(db, 'despesas');

export async function criarDespesa(despesa: Omit<Despesa, 'id' | 'criadoEm'>) {
  const docRef = await addDoc(despesasCollection, {
    ...despesa,
    talhaoId: despesa.talhaoId ?? null,
    criadoEm: Timestamp.now(),
  });
  return docRef.id;
}

export async function atualizarDespesa(id: string, despesa: Partial<Despesa>) {
  const despesaRef = doc(db, 'despesas', id);
  await updateDoc(despesaRef, despesa);
}

export async function excluirDespesa(id: string) {
  const despesaRef = doc(db, 'despesas', id);
  await deleteDoc(despesaRef);
}

export async function buscarDespesa(id: string): Promise<Despesa | null> {
  const ref = doc(db, 'despesas', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Despesa;
}

export async function listarDespesasPorPropriedade(propriedadeId: string): Promise<Despesa[]> {
  const q = query(
    despesasCollection,
    where('propriedadeId', '==', propriedadeId),
    orderBy('data', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Despesa));
}

export async function listarDespesasPorTalhao(talhaoId: string): Promise<Despesa[]> {
  const q = query(
    despesasCollection,
    where('talhaoId', '==', talhaoId),
    orderBy('data', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Despesa));
}

export function totalDespesas(despesas: Despesa[]): number {
  return despesas.reduce((soma, d) => soma + d.valor, 0);
}
