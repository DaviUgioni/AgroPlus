// Services/talhoes.ts
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../FirebaseConfig';

export interface Talhao {
  id?: string;
  nome: string;
  area: number;
  propriedadeId: string;
}

export async function criarTalhao(dados: Omit<Talhao, 'id'>) {
  const ref = await addDoc(collection(db, 'talhoes'), {
    ...dados,
    criadoEm: serverTimestamp(),
  });
  return ref.id;
}

export async function listarTalhoes(propriedadeId: string) {
  const q = query(collection(db, 'talhoes'), where('propriedadeId', '==', propriedadeId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Talhao[];
}

export async function atualizarTalhao(id: string, dados: Partial<Omit<Talhao, 'id'>>) {
  const ref = doc(db, 'talhoes', id);
  await updateDoc(ref, dados);
}

export async function excluirTalhao(id: string) {
  const ref = doc(db, 'talhoes', id);
  await deleteDoc(ref);
}