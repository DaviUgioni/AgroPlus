// Screens/EstatisticasPropriedade.tsx
import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { buscarPropriedade, Propriedade } from '../Services/propriedades';
import { listarTalhoes, Talhao } from '../Services/talhoes';
import { listarDespesasPorPropriedade, totalDespesas, totalDespesasMes, CategoriaDespesa, Despesa } from '../Services/despesas';
import { listarPlantiosPorPropriedade, estimativaColheita, textoEstimativa, Plantio } from '../Services/plantios';
import { RootStackParamList } from '../App';
import { COLORS, RADIUS } from '../constants/theme';
import BotaoVoltar from '../Components/BotaoVoltar';
import { mensagemErro } from '../Services/erros';

type EstatisticasRouteProp = RouteProp<RootStackParamList, 'EstatisticasPropriedade'>;
type Periodo = 'mes' | 'ano' | 'tudo';

const LABELS_CATEGORIA: Record<CategoriaDespesa, string> = {
  insumo: 'Insumo',
  mao_de_obra: 'Mão de obra',
  maquinario: 'Maquinário',
  outros: 'Outros',
};

const LABELS_PERIODO: Record<Periodo, string> = {
  mes: 'Este mês',
  ano: 'Este ano',
  tudo: 'Tudo',
};

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

interface Linha {
  chave: string;
  nome: string;
  valor: number;
}

const formatarMoeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatarNumero = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

function noPeriodo(d: Despesa, periodo: Periodo, agora: Date) {
  if (periodo === 'tudo') return true;
  const dt = d.data?.toDate?.();
  if (!dt || dt.getFullYear() !== agora.getFullYear()) return false;
  return periodo === 'ano' || dt.getMonth() === agora.getMonth();
}

function BarraHorizontal({ linha, maximo }: { linha: Linha; maximo: number }) {
  const pct = maximo > 0 ? (linha.valor / maximo) * 100 : 0;
  return (
    <View style={styles.barraLinha}>
      <View style={styles.barraTopo}>
        <Text style={styles.barraNome} numberOfLines={1}>{linha.nome}</Text>
        <Text style={styles.barraValor}>{formatarMoeda(linha.valor)}</Text>
      </View>
      <View style={styles.barraFundo}>
        <View style={[styles.barraPreenchida, { width: `${Math.max(pct, 2)}%` }]} />
      </View>
    </View>
  );
}

export default function EstatisticasPropriedade() {
  const route = useRoute<EstatisticasRouteProp>();
  const { propriedadeId } = route.params;
  const insets = useSafeAreaInsets();

  const [periodo, setPeriodo] = useState<Periodo>('ano');
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [propriedade, setPropriedade] = useState<Propriedade | null>(null);
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [plantios, setPlantios] = useState<Plantio[]>([]);

  async function carregar(opts?: { silent?: boolean }) {
    try {
      if (!opts?.silent) setCarregando(true);
      const [prop, listaTalhoes, listaDespesas, listaPlantios] = await Promise.all([
        buscarPropriedade(propriedadeId),
        listarTalhoes(propriedadeId),
        listarDespesasPorPropriedade(propriedadeId),
        listarPlantiosPorPropriedade(propriedadeId),
      ]);
      const agora = Date.now();
      setPropriedade(prop);
      setTalhoes(listaTalhoes);
      // Despesas recorrentes futuras ainda não aconteceram
      setDespesas(listaDespesas.filter((d) => (d.data?.toMillis?.() ?? 0) <= agora));
      setPlantios(listaPlantios);
    } catch (error) {
      Alert.alert('Erro', mensagemErro(error, 'Não foi possível carregar as estatísticas.'));
    } finally {
      if (!opts?.silent) setCarregando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [propriedadeId])
  );

  async function handleAtualizar() {
    setAtualizando(true);
    await carregar({ silent: true });
    setAtualizando(false);
  }

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.verde} />
      </View>
    );
  }

  if (!propriedade) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BotaoVoltar />
          <Text style={styles.titulo}>Estatísticas</Text>
        </View>
        <Text style={styles.vazio}>Propriedade não encontrada.</Text>
      </SafeAreaView>
    );
  }

  const agora = new Date();
  const despesasPeriodo = despesas.filter((d) => noPeriodo(d, periodo, agora));
  const gastoPeriodo = totalDespesas(despesasPeriodo);
  const gastoMes = totalDespesasMes(despesas, agora.getFullYear(), agora.getMonth());
  const areaTotal = propriedade.areaTotal || 0;
  const custoPorHa = areaTotal > 0 ? gastoPeriodo / areaTotal : 0;
  const areaTalhoes = talhoes.reduce((s, t) => s + (t.area || 0), 0);
  const pctAreaTalhoes = areaTotal > 0 ? Math.min((areaTalhoes / areaTotal) * 100, 100) : 0;

  // Últimos 6 meses, do mais antigo para o atual
  const meses = Array.from({ length: 6 }, (_, i) => {
    const ref = new Date(agora.getFullYear(), agora.getMonth() - 5 + i, 1);
    return {
      chave: `${ref.getFullYear()}-${ref.getMonth()}`,
      rotulo: MESES_CURTOS[ref.getMonth()],
      valor: totalDespesasMes(despesas, ref.getFullYear(), ref.getMonth()),
    };
  });
  const maiorMes = Math.max(...meses.map((m) => m.valor), 0);

  const somaCategorias: Record<CategoriaDespesa, number> = { insumo: 0, mao_de_obra: 0, maquinario: 0, outros: 0 };
  despesasPeriodo.forEach((d) => {
    somaCategorias[d.categoria] = (somaCategorias[d.categoria] || 0) + (d.valor || 0);
  });
  const porCategoria: Linha[] = (Object.keys(somaCategorias) as CategoriaDespesa[])
    .map((c) => ({ chave: c, nome: LABELS_CATEGORIA[c], valor: somaCategorias[c] }))
    .filter((l) => l.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  const nomesTalhoes: Record<string, string> = {};
  talhoes.forEach((t) => (nomesTalhoes[t.id!] = t.nome));
  const somaTalhoes: Record<string, number> = {};
  despesasPeriodo.forEach((d) => {
    const chave = d.talhaoId && nomesTalhoes[d.talhaoId] ? d.talhaoId : 'geral';
    somaTalhoes[chave] = (somaTalhoes[chave] || 0) + (d.valor || 0);
  });
  const porTalhao: Linha[] = Object.keys(somaTalhoes)
    .map((k) => ({ chave: k, nome: k === 'geral' ? 'Geral (sem talhão)' : nomesTalhoes[k], valor: somaTalhoes[k] }))
    .sort((a, b) => b.valor - a.valor);

  const colheitas = plantios
    .map((p) => ({ plantio: p, estimativa: estimativaColheita(p.dataPlantio, p.diasParaColheita) }))
    .sort((a, b) => a.estimativa.diasRestantes - b.estimativa.diasRestantes)
    .slice(0, 3);

  const limite = propriedade.limiteMensal ?? 0;
  const pctLimite = limite > 0 ? (gastoMes / limite) * 100 : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BotaoVoltar />
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>Estatísticas</Text>
          <Text style={styles.subtitulo} numberOfLines={1}>{propriedade.nome}</Text>
        </View>
      </View>

      <View style={styles.chips}>
        {(Object.keys(LABELS_PERIODO) as Periodo[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.chip, periodo === p && styles.chipAtivo]}
            onPress={() => setPeriodo(p)}
          >
            <Text style={[styles.chipTexto, periodo === p && styles.chipTextoAtivo]}>{LABELS_PERIODO[p]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={handleAtualizar} colors={[COLORS.verde]} tintColor={COLORS.verde} />}
      >
        <View style={styles.grid}>
          <View style={[styles.card, styles.cardDestaque]}>
            <Feather name="dollar-sign" size={18} color="#fff" />
            <Text style={[styles.cardValor, { color: '#fff' }]}>{formatarMoeda(gastoPeriodo)}</Text>
            <Text style={[styles.cardLabel, { color: '#EAF3DE' }]}>Gasto · {LABELS_PERIODO[periodo].toLowerCase()}</Text>
          </View>
          <View style={styles.card}>
            <Feather name="maximize" size={18} color={COLORS.verde} />
            <Text style={styles.cardValor}>{areaTotal > 0 ? formatarMoeda(custoPorHa) : '—'}</Text>
            <Text style={styles.cardLabel}>Custo por hectare</Text>
          </View>
          <View style={styles.card}>
            <Feather name="grid" size={18} color={COLORS.verde} />
            <Text style={styles.cardValor}>{formatarNumero(areaTalhoes)} de {formatarNumero(areaTotal)} ha</Text>
            <Text style={styles.cardLabel}>Área em talhões ({Math.round(pctAreaTalhoes)}%)</Text>
          </View>
          <View style={styles.card}>
            <Feather name="feather" size={18} color={COLORS.verde} />
            <Text style={styles.cardValor}>{plantios.length}</Text>
            <Text style={styles.cardLabel}>{plantios.length === 1 ? 'Plantio' : 'Plantios'} · {talhoes.length} {talhoes.length === 1 ? 'talhão' : 'talhões'}</Text>
          </View>
        </View>

        {limite > 0 && (
          <View style={styles.box}>
            <Text style={styles.secaoTitulo}>Limite mensal</Text>
            <View style={styles.barraTopo}>
              <Text style={styles.barraNome}>{formatarMoeda(gastoMes)} de {formatarMoeda(limite)}</Text>
              <Text style={[styles.barraValor, pctLimite > 100 && { color: COLORS.erro }]}>{Math.round(pctLimite)}%</Text>
            </View>
            <View style={styles.barraFundo}>
              <View
                style={[
                  styles.barraPreenchida,
                  { width: `${Math.min(pctLimite, 100)}%` },
                  pctLimite > 100 && { backgroundColor: COLORS.erro },
                ]}
              />
            </View>
          </View>
        )}

        <View style={styles.box}>
          <Text style={styles.secaoTitulo}>Gastos nos últimos 6 meses</Text>
          {maiorMes === 0 ? (
            <Text style={styles.vazioBox}>Nenhuma despesa nesse intervalo.</Text>
          ) : (
            <View style={styles.colunas}>
              {meses.map((m) => (
                <View key={m.chave} style={styles.coluna}>
                  <Text style={styles.colunaValor} numberOfLines={1}>
                    {m.valor > 0 ? formatarNumero(Math.round(m.valor)) : ''}
                  </Text>
                  <View style={styles.colunaArea}>
                    <View style={[styles.colunaBarra, { height: `${Math.max((m.valor / maiorMes) * 100, m.valor > 0 ? 3 : 0)}%` }]} />
                  </View>
                  <Text style={styles.colunaRotulo}>{m.rotulo}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.box}>
          <Text style={styles.secaoTitulo}>Por categoria</Text>
          {porCategoria.length === 0 ? (
            <Text style={styles.vazioBox}>Nenhuma despesa nesse período.</Text>
          ) : (
            porCategoria.map((l) => <BarraHorizontal key={l.chave} linha={l} maximo={porCategoria[0].valor} />)
          )}
        </View>

        <View style={styles.box}>
          <Text style={styles.secaoTitulo}>Por talhão</Text>
          {porTalhao.length === 0 ? (
            <Text style={styles.vazioBox}>Nenhuma despesa nesse período.</Text>
          ) : (
            porTalhao.map((l) => <BarraHorizontal key={l.chave} linha={l} maximo={porTalhao[0].valor} />)
          )}
        </View>

        <View style={styles.box}>
          <Text style={styles.secaoTitulo}>Próximas colheitas</Text>
          {colheitas.length === 0 ? (
            <Text style={styles.vazioBox}>Nenhum plantio cadastrado.</Text>
          ) : (
            colheitas.map(({ plantio, estimativa }) => (
              <View key={plantio.id} style={styles.colheitaLinha}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.barraNome}>{plantio.tipoNome}</Text>
                  {plantio.talhaoNome ? <Text style={styles.colheitaSub}>{plantio.talhaoNome}</Text> : null}
                </View>
                <Text style={[styles.barraValor, estimativa.pronto && { color: COLORS.erro }]}>
                  {textoEstimativa(estimativa)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '500',
  },
  subtitulo: {
    fontSize: 13,
    color: COLORS.textoSec,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.borda,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipAtivo: {
    backgroundColor: COLORS.verde,
    borderColor: COLORS.verde,
  },
  chipTexto: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  chipTextoAtivo: {
    color: '#fff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 16,
  },
  card: {
    width: '48%',
    backgroundColor: COLORS.bege,
    borderRadius: RADIUS.md,
    padding: 14,
    gap: 6,
  },
  cardDestaque: {
    backgroundColor: COLORS.verde,
  },
  cardValor: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.texto,
  },
  cardLabel: {
    fontSize: 12,
    color: COLORS.textoSec,
  },
  box: {
    backgroundColor: COLORS.bege,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 16,
  },
  secaoTitulo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  vazio: {
    textAlign: 'center',
    color: '#888',
    marginTop: 24,
    fontSize: 14,
  },
  vazioBox: {
    color: '#888',
    fontSize: 13,
  },
  barraLinha: {
    marginBottom: 10,
  },
  barraTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  barraNome: {
    flexShrink: 1,
    fontSize: 13,
    color: COLORS.texto,
  },
  barraValor: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.verde,
  },
  barraFundo: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  barraPreenchida: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.verde,
  },
  colunas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  coluna: {
    flex: 1,
    alignItems: 'center',
  },
  colunaValor: {
    fontSize: 10,
    color: COLORS.textoSec,
    marginBottom: 4,
  },
  colunaArea: {
    height: 110,
    width: '70%',
    justifyContent: 'flex-end',
  },
  colunaBarra: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: COLORS.verde,
  },
  colunaRotulo: {
    fontSize: 11,
    color: COLORS.textoSec,
    marginTop: 4,
  },
  colheitaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  colheitaSub: {
    fontSize: 12,
    color: COLORS.textoSec,
  },
});
