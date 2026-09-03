import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, serverTimestamp, writeBatch,} from 'firebase/firestore';
import { db } from '../FirebaseConfig';
import { excluirImagemPropriedade } from './imagens';

export interface Propriedade {
  id?: string;
  nome: string;
  localizacao: string;
  latitude?: number;
  longitude?: number;
  areaTotal: number;
  userId: string;
  imagemUrl?: string;
}

export async function criarPropriedade(dados: Omit<Propriedade, 'id'>) {
  const ref = await addDoc(collection(db, 'propriedades'), {
    ...dados,
    criadoEm: serverTimestamp(),
  });
  return ref.id;
}

export async function listarPropriedades(userId: string) {
  const q = query(collection(db, 'propriedades'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Propriedade[];
}

export async function buscarPropriedade(id: string) {
  const ref = doc(db, 'propriedades', id);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Propriedade;
}

export async function atualizarPropriedade(id: string, dados: Partial<Omit<Propriedade, 'id'>>) {
  const ref = doc(db, 'propriedades', id);
  await updateDoc(ref, dados);
}

export async function excluirPropriedade(id: string) {
  const talhoesQuery = query(collection(db, 'talhoes'), where('propriedadeId', '==', id));
  const despesasQuery = query(collection(db, 'despesas'), where('propriedadeId', '==', id));
  const [talhoesSnapshot, despesasSnapshot] = await Promise.all([getDocs(talhoesQuery), getDocs(despesasQuery)]);

  const allDocs = [doc(db, 'propriedades', id), ...talhoesSnapshot.docs.map((d) => d.ref), ...despesasSnapshot.docs.map((d) => d.ref)];

  // Firestore batch limit 500 — chunk em lotes de 400
  for (let i = 0; i < allDocs.length; i += 400) {
    const chunk = allDocs.slice(i, i + 400);
    const batch = writeBatch(db);
    chunk.forEach((ref) => batch.delete(ref as any));
    await batch.commit();
  }

  try {
    excluirImagemPropriedade(id);
  } catch (e) {
    console.log('Erro ao excluir imagem local:', e);
  }
}