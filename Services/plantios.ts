import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../FirebaseConfig';
import { invalidarResumo } from './cacheResumo';

export interface Plantio {
  id?: string;
  propriedadeId: string;
  talhaoId?: string | null;
  talhaoNome?: string | null;
  tipoChave: string;
  tipoNome: string;
  diasParaColheita: number;
  dataPlantio: Timestamp;
  criadoEm?: Timestamp;
}

const plantiosCollection = collection(db, 'plantios');

export async function criarPlantio(plantio: Omit<Plantio, 'id' | 'criadoEm'>) {
  const docRef = await addDoc(plantiosCollection, {
    ...plantio,
    criadoEm: Timestamp.now(),
  });
  invalidarResumo();
  return docRef.id;
}

export async function listarPlantiosPorPropriedade(propriedadeId: string): Promise<Plantio[]> {
  const q = query(plantiosCollection, where('propriedadeId', '==', propriedadeId));
  const snapshot = await getDocs(q);
  const lista = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Plantio));
  return lista.sort((a, b) => (b.dataPlantio?.toMillis?.() ?? 0) - (a.dataPlantio?.toMillis?.() ?? 0));
}

export async function excluirPlantio(id: string) {
  const ref = doc(db, 'plantios', id);
  await deleteDoc(ref);
  invalidarResumo();
}

export interface EstimativaColheita {
  dataPrevista: Date;
  diasRestantes: number;
  pronto: boolean;
}

export function estimativaColheita(dataPlantio: Timestamp, diasParaColheita: number): EstimativaColheita {
  const dataPrevista = dataPlantio.toDate();
  dataPrevista.setDate(dataPrevista.getDate() + diasParaColheita);

  const previstaSemHora = new Date(dataPrevista).setHours(0, 0, 0, 0);
  const hojeSemHora = new Date().setHours(0, 0, 0, 0);
  const diasRestantes = Math.ceil((previstaSemHora - hojeSemHora) / (1000 * 60 * 60 * 24));

  return {
    dataPrevista,
    diasRestantes,
    pronto: diasRestantes <= 0,
  };
}

export function textoEstimativa(estimativa: EstimativaColheita): string {
  if (estimativa.pronto) return 'Pronto para colher';
  if (estimativa.diasRestantes === 1) return 'Colheita em 1 dia';
  if (estimativa.diasRestantes < 30) return `Colheita em ${estimativa.diasRestantes} dias`;
  const meses = Math.round(estimativa.diasRestantes / 30);
  return `Colheita em ~${meses} ${meses === 1 ? 'mês' : 'meses'}`;
}
