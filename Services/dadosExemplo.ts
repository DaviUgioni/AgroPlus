// Dados de exemplo para testes. Usado só em desenvolvimento (botão em Configurações).
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { auth, db } from '../FirebaseConfig';
import { criarPropriedade, excluirPropriedade } from './propriedades';
import { criarTalhao } from './talhoes';
import { criarPlantio } from './plantios';
import { criarDespesa, CategoriaDespesa } from './despesas';
import { TIPOS_PLANTIO } from '../constants/plantios';

const EXEMPLOS = [
  { nome: 'Fazenda Santa Clara', localizacao: 'Araranguá, SC', latitude: -28.935, longitude: -49.486, areaTotal: 42 },
  { nome: 'Sítio Boa Vista', localizacao: 'Turvo, SC', latitude: -28.927, longitude: -49.68, areaTotal: 8.5 },
  { nome: 'Chácara Três Irmãos', localizacao: 'Jacinto Machado, SC', latitude: -29.0, longitude: -49.77, areaTotal: 15 },
  { nome: 'Fazenda Vale Verde', localizacao: 'Sombrio, SC', latitude: -29.108, longitude: -49.63, areaTotal: 120 },
  { nome: 'Sítio Recanto do Sol', localizacao: 'Praia Grande, SC', latitude: -29.195, longitude: -49.95, areaTotal: 22.3 },
];

function usuarioAtual() {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Você precisa estar logado.');
  return userId;
}

const DESPESAS: { categoria: CategoriaDespesa; descricao: string; valor: number }[] = [
  { categoria: 'insumo', descricao: 'Sementes', valor: 1850 },
  { categoria: 'insumo', descricao: 'Adubo NPK', valor: 2400 },
  { categoria: 'mao_de_obra', descricao: 'Diária de colheita', valor: 960 },
  { categoria: 'maquinario', descricao: 'Diesel do trator', valor: 780 },
  { categoria: 'outros', descricao: 'Manutenção da cerca', valor: 350 },
];

function diasAtras(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return Timestamp.fromDate(d);
}

// Cria propriedades com talhões, plantios e despesas para testar todas as telas.
export async function criarPropriedadesExemplo() {
  const userId = usuarioAtual();
  let n = 0;
  for (const p of EXEMPLOS) {
    const propriedadeId = await criarPropriedade({ ...p, userId, exemplo: true } as any);
    const talhoes: { id: string; nome: string }[] = [];
    for (const nome of ['Área Norte', 'Área Sul']) {
      const id = await criarTalhao({ nome, area: Math.round((p.areaTotal / 2) * 10) / 10, propriedadeId });
      talhoes.push({ id, nome });
    }
    for (let i = 0; i < 3; i++) {
      const tipo = TIPOS_PLANTIO[(n * 3 + i) % TIPOS_PLANTIO.length];
      const t = talhoes[i % talhoes.length];
      await criarPlantio({
        propriedadeId,
        talhaoId: t.id,
        talhaoNome: t.nome,
        tipoChave: tipo.chave,
        tipoNome: tipo.nome,
        diasParaColheita: tipo.diasParaColheita,
        dataPlantio: diasAtras(20 + i * 45 + n * 7),
      });
    }
    for (let i = 0; i < DESPESAS.length; i++) {
      const d = DESPESAS[i];
      await criarDespesa({
        propriedadeId,
        talhaoId: i % 2 === 0 ? talhoes[0].id : null,
        categoria: d.categoria,
        descricao: d.descricao,
        valor: Math.round(d.valor * (1 + n * 0.15)),
        data: diasAtras(i * 20 + n * 3),
      });
    }
    n++;
  }
  return EXEMPLOS.length;
}

export async function apagarPropriedadesExemplo() {
  const userId = usuarioAtual();
  const snap = await getDocs(
    query(collection(db, 'propriedades'), where('userId', '==', userId), where('exemplo', '==', true))
  );
  for (const d of snap.docs) await excluirPropriedade(d.id);
  return snap.size;
}
