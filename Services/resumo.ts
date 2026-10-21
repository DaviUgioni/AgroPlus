// Services/resumo.ts
// Números gerais da conta (propriedades, gastos, plantios). Usado pela Home e pela tela Resumo.
import { listarPropriedades, Propriedade } from './propriedades';
import { listarDespesasPorPropriedade, totalDespesasMes, totalDespesasAno, Despesa } from './despesas';
import { listarPlantiosPorPropriedade, estimativaColheita, textoEstimativa, Plantio } from './plantios';

export interface ProximaColheita {
  propriedadeNome: string;
  tipoNome: string;
  diasRestantes: number;
  texto: string;
}

export interface DadosResumo {
  propriedades: Propriedade[];
  areaTotal: number;
  gastoMes: number;
  gastoAno: number;
  plantiosAtivos: number;
  proximaColheita: ProximaColheita | null;
  /** Gasto dos últimos 6 meses, do mais antigo ao atual */
  gastosPorMes: { ano: number; mes: number; valor: number }[];
  /** Despesas que já venceram (sem as agendadas para o futuro) */
  despesas: Despesa[];
  plantios: (Plantio & { propriedadeNome: string })[];
}

export async function carregarResumo(userId: string): Promise<DadosResumo> {
  const propriedades = await listarPropriedades(userId);
  const agora = new Date();

  let todasDespesas: Despesa[] = [];
  let todosPlantios: (Plantio & { propriedadeNome: string })[] = [];

  for (const prop of propriedades) {
    const [despesas, plantios] = await Promise.all([listarDespesasPorPropriedade(prop.id!), listarPlantiosPorPropriedade(prop.id!)]);
    todasDespesas = todasDespesas.concat(despesas);
    todosPlantios = todosPlantios.concat(plantios.map((p) => ({ ...p, propriedadeNome: prop.nome })));
  }

  // Despesas agendadas para o futuro não entram nos totais de agora
  const despesasAteAgora = todasDespesas.filter((d) => (d.data?.toMillis?.() ?? 0) <= agora.getTime());

  let proximaColheita: ProximaColheita | null = null;
  let menorDias = Infinity;
  for (const plantio of todosPlantios) {
    const estimativa = estimativaColheita(plantio.dataPlantio, plantio.diasParaColheita);
    if (estimativa.diasRestantes < menorDias) {
      menorDias = estimativa.diasRestantes;
      proximaColheita = {
        propriedadeNome: plantio.propriedadeNome,
        tipoNome: plantio.tipoNome,
        diasRestantes: estimativa.diasRestantes,
        texto: textoEstimativa(estimativa),
      };
    }
  }

  const gastosPorMes = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - (5 - i), 1);
    return { ano: d.getFullYear(), mes: d.getMonth(), valor: totalDespesasMes(despesasAteAgora, d.getFullYear(), d.getMonth()) };
  });

  return {
    propriedades,
    areaTotal: propriedades.reduce((soma, p) => soma + (p.areaTotal || 0), 0),
    gastoMes: totalDespesasMes(despesasAteAgora, agora.getFullYear(), agora.getMonth()),
    gastoAno: totalDespesasAno(despesasAteAgora, agora.getFullYear()),
    plantiosAtivos: todosPlantios.length,
    proximaColheita,
    gastosPorMes,
    despesas: despesasAteAgora,
    plantios: todosPlantios,
  };
}

export const formatarMoeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
