import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, serverTimestamp, writeBatch,} from 'firebase/firestore';
import { db } from '../FirebaseConfig';

export interface Propriedade {
  id?: string;
  nome: string;
  localizacao: string;
  latitude?: number;
  longitude?: number;
  areaTotal: number;
  userId: string;
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
  const talhoesSnapshot = await getDocs(talhoesQuery);


  const batch = writeBatch(db);
  batch.delete(doc(db, 'propriedades', id));
  talhoesSnapshot.docs.forEach((talhaoDoc) => {
    batch.delete(talhaoDoc.ref);
  });

  await batch.commit();
}