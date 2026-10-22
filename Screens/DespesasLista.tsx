import { useState, useCallback, useMemo } from 'react';
import { FlatList, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useFocusEffect, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { XStack, YStack } from 'tamagui';
import {
  listarDespesasPorPropriedade,
  listarDespesasPorTalhao,
  excluirDespesa,
  totalDespesas,
  totalDespesasMes,
  totalDespesasAno,
  Despesa,
  CategoriaDespesa,
  LABELS_CATEGORIA,
} from '../Services/despesas';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import { Botao, BotaoFlutuante, BotaoOlho, Cabecalho, Cartao, Corpo, EstadoVazio, GraficoColunas, Legenda, ListaEsqueleto, Seletor, Tela, Titulo, toast, confirmar, Oculto } from '../Components/ui';
import { mensagemErro } from '../Services/erros';
import { baixarPlanilha, CanceladoError, compartilharPlanilha } from '../Services/planilha';

type DespesasListaRouteProp = RouteProp<RootStackParamList, 'DespesasLista'>;
type NavProp = NavigationProp<RootStackParamList>;

const MESES = ['Todos', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** `embutido`: usado dentro da aba Despesas, sem cabeçalho nem moldura de tela */
export default function DespesasLista({ embutido, propriedadeId: idEmbutido }: { embutido?: boolean; propriedadeId?: string }) {
  const route = useRoute<DespesasListaRouteProp>();
  const navigation = useNavigation<NavProp>();
  const { propriedadeId, talhaoId, talhaoNome } = { ...(route.params ?? {}), ...(idEmbutido ? { propriedadeId: idEmbutido } : {}) } as any;
  const insets = useSafeAreaInsets();
  const modoTalhao = !!talhaoId;

  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [filtroCat, setFiltroCat] = useState<'todas' | CategoriaDespesa>('todas');
  const [filtroMes, setFiltroMes] = useState<number>(-1); // -1 todos, 0-11
  const [exportando, setExportando] = useState(false);

  async function carregarDespesas(opts?: { silent?: boolean }) {
    if (!propriedadeId) {
      toast.erro('Propriedade não informada.');
      return;
    }
    try {
      if (!opts?.silent) setCarregando(true);
      const dados = modoTalhao ? await listarDespesasPorTalhao(talhaoId, propriedadeId) : await listarDespesasPorPropriedade(propriedadeId);
      setDespesas(dados);
    } catch (error) {
      console.log('ERRO DESPESAS:', error);
      toast.erro(mensagemErro(error, 'Não foi possível carregar as despesas.'));
    } finally {
      if (!opts?.silent) setCarregando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregarDespesas();
    }, [propriedadeId, talhaoId])
  );

  async function handleAtualizar() {
    setAtualizando(true);
    await carregarDespesas({ silent: true });
    setAtualizando(false);
  }

  const agora = new Date();
  const anoAtual = agora.getFullYear();
  const mesAtual = agora.getMonth();

  const despesasFiltradas = useMemo(() => {
    return despesas.filter((d) => {
      if (filtroCat !== 'todas' && d.categoria !== filtroCat) return false;
      if (filtroMes !== -1) {
        const m = d.data?.toDate?.()?.getMonth?.();
        if (m === undefined || m !== filtroMes) return false;
      }
      return true;
    });
  }, [despesas, filtroCat, filtroMes]);

  // Só conta o que já venceu (data <= agora) — recorrências futuras não entram no total agora
  const despesasAteAgora = useMemo(() => despesas.filter((d) => (d.data?.toMillis?.() ?? 0) <= agora.getTime()), [despesas]);
  const despesasFiltradasAteAgora = useMemo(
    () => despesasFiltradas.filter((d) => (d.data?.toMillis?.() ?? 0) <= agora.getTime()),
    [despesasFiltradas]
  );

  const total = totalDespesas(despesasFiltradasAteAgora);
  const totalMes = totalDespesasMes(despesasAteAgora, anoAtual, filtroMes !== -1 ? filtroMes : mesAtual);
  const totalAno = totalDespesasAno(despesasAteAgora, anoAtual);

  function handleExcluir(id: string) {
    confirmar({ titulo: 'Excluir despesa', texto: 'Tem certeza que deseja excluir?', confirmar: 'Excluir' }).then(async (ok) => {
      if (!ok) return;
          try {
            await excluirDespesa(id);
            carregarDespesas();
          } catch (error) {
            toast.erro(mensagemErro(error, 'Não foi possível excluir.'));
          }
    });
  }

  async function gerarPlanilha(acao: 'baixar' | 'compartilhar') {
    try {
      setExportando(true);
      if (acao === 'compartilhar') {
        await compartilharPlanilha(propriedadeId);
      } else {
        const salvo = await baixarPlanilha(propriedadeId);
        if (salvo) Alert.alert('Planilha baixada', `"${salvo.arquivo}" foi salva na pasta ${salvo.pasta}.`);
      }
    } catch (e: any) {
      if (e instanceof CanceladoError) return;
      console.log('Erro export', e);
      toast.erro(mensagemErro(e, 'Não foi possível gerar a planilha.'));
    } finally {
      setExportando(false);
    }
  }

  function handleExportar() {
    Alert.alert('Planilha desta propriedade', 'Relatório em Excel com resumo, despesas, gastos por mês, plantios e talhões.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Compartilhar', onPress: () => gerarPlanilha('compartilhar') },
      { text: 'Baixar', onPress: () => gerarPlanilha('baixar') },
    ]);
  }

  const formatarMoeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const temFiltro = filtroCat !== 'todas' || filtroMes !== -1;
  const nomeMes = filtroMes !== -1 ? MESES[filtroMes + 1] : MESES[mesAtual + 1];
  const mesDestaque = filtroMes !== -1 ? filtroMes : mesAtual;

  // Gasto de cada mês do ano (respeita a categoria escolhida; só o que já venceu)
  const gastoPorMes = useMemo(() => {
    const meses = Array.from({ length: 12 }, () => 0);
    for (const d of despesasAteAgora) {
      if (filtroCat !== 'todas' && d.categoria !== filtroCat) continue;
      const dt = d.data?.toDate?.();
      if (dt && dt.getFullYear() === anoAtual) meses[dt.getMonth()] += d.valor;
    }
    return meses;
  }, [despesasAteAgora, filtroCat, anoAtual]);

  const topo = (
    <>
      <Cartao tom="verde" marginBottom={12}>
        <XStack alignItems="center" justifyContent="space-between">
          <Corpo color="sobreVerdeSuave" flexShrink={1}>
            {temFiltro ? 'Total com os filtros escolhidos' : 'Total gasto até hoje'}
          </Corpo>
          <BotaoOlho />
        </XStack>
        <Titulo tamanho="grande" fontWeight="700" color="sobreVerde" marginTop={2}>
          <Oculto>{formatarMoeda(total)}</Oculto>
        </Titulo>
        <XStack gap={10} marginTop={12}>
          <YStack flex={1} backgroundColor="sobreVerdeFundo" borderRadius="lg" padding={10}>
            <Legenda color="sobreVerdeSuave">Mês de {nomeMes}</Legenda>
            <Corpo fontWeight="700" color="sobreVerde" marginTop={2}>
              <Oculto>{formatarMoeda(totalMes)}</Oculto>
            </Corpo>
          </YStack>
          <YStack flex={1} backgroundColor="sobreVerdeFundo" borderRadius="lg" padding={10}>
            <Legenda color="sobreVerdeSuave">Ano de {anoAtual}</Legenda>
            <Corpo fontWeight="700" color="sobreVerde" marginTop={2}>
              <Oculto>{formatarMoeda(totalAno)}</Oculto>
            </Corpo>
          </YStack>
        </XStack>
      </Cartao>

      <Cartao marginBottom={12} padding={14} gap={10}>
        <XStack justifyContent="space-between" alignItems="center">
          <YStack flex={1}>
            <Corpo fontWeight="700">Gasto por mês em {anoAtual}</Corpo>
            <Legenda marginTop={2}>
              {MESES[mesDestaque + 1]}: {formatarMoeda(gastoPorMes[mesDestaque])}
            </Legenda>
          </YStack>
          {filtroMes !== -1 ? (
            <Legenda fontWeight="700" color="verde" onPress={() => setFiltroMes(-1)} accessibilityRole="button" hitSlop={14}>
              Ver todos os meses
            </Legenda>
          ) : (
            <Legenda>Toque num mês</Legenda>
          )}
        </XStack>
        <GraficoColunas
          altura={96}
          valores="nenhum"
          aoTocar={(i) => setFiltroMes(filtroMes === i ? -1 : i)}
          dados={gastoPorMes.map((valor, i) => ({ rotulo: MESES[i + 1].charAt(0), valor, destaque: i === mesDestaque }))}
        />
      </Cartao>

      <XStack gap={10} marginBottom={12}>
        <YStack flex={1}>
          <Seletor
            compacto
            rotulo="Filtrar por categoria"
            valor={filtroCat}
            aoMudar={setFiltroCat}
            opcoes={[
              { label: 'Todas', valor: 'todas' as const },
              ...(Object.keys(LABELS_CATEGORIA) as CategoriaDespesa[]).map((c) => ({ label: LABELS_CATEGORIA[c], valor: c })),
            ]}
          />
        </YStack>
        <YStack flex={1}>
          <Seletor
            compacto
            rotulo="Filtrar por mês"
            valor={filtroMes}
            aoMudar={setFiltroMes}
            opcoes={MESES.map((m, i) => ({ label: m, valor: i - 1 }))}
          />
        </YStack>
      </XStack>
    </>
  );

  const botaoPlanilha = <Botao variante="contorno" tamanho="sm" icone="download" titulo="Planilha" carregando={exportando} onPress={handleExportar} />;
  const Raiz: any = embutido ? YStack : Tela;
  const propsRaiz = embutido ? { flex: 1 } : { edges: ['top', 'left', 'right'] };

  return (
    <Raiz {...propsRaiz}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {embutido ? (
          <XStack justifyContent="flex-end" marginBottom={8}>
            {botaoPlanilha}
          </XStack>
        ) : (
          <Cabecalho titulo="Despesas" subtitulo={modoTalhao ? `Talhão: ${talhaoNome ?? ''}` : undefined} direita={botaoPlanilha} />
        )}

        {carregando ? (
          <ListaEsqueleto quantidade={3} />
        ) : (
          <FlatList
            data={despesasFiltradas}
            keyExtractor={(item) => item.id!}
            contentContainerStyle={{ paddingBottom: embutido ? 96 : 100 + insets.bottom }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshing={atualizando}
            onRefresh={handleAtualizar}
            ListHeaderComponent={topo}
            ListEmptyComponent={
              despesas.length === 0 ? (
                <EstadoVazio
                  icone="dollar-sign"
                  titulo="Nenhuma despesa ainda"
                  texto="Lance aqui compras de insumos, diárias, combustível e outros gastos."
                  acao={{
                    titulo: 'Lançar despesa',
                    onPress: () => navigation.navigate('DespesaForm', { propriedadeId, talhaoId }),
                  }}
                  marginTop={16}
                />
              ) : (
                <EstadoVazio
                  icone="filter"
                  titulo="Nada com esses filtros"
                  texto="Tente outra categoria ou outro mês."
                  acao={{
                    titulo: 'Limpar filtros',
                    icone: 'x',
                    onPress: () => {
                      setFiltroCat('todas');
                      setFiltroMes(-1);
                    },
                  }}
                  marginTop={16}
                />
              )
            }
            renderItem={({ item }) => {
              const isFutura = (item.data?.toMillis?.() ?? 0) > agora.getTime();
              const detalhes = [
                LABELS_CATEGORIA[item.categoria],
                item.data?.toDate?.()?.toLocaleDateString('pt-BR') ?? '--',
                item.recorrente ? 'Mensal' : null,
              ].filter(Boolean);
              return (
                <Cartao
                  marginBottom={10}
                  padding={14}
                  backgroundColor={isFutura ? 'begeClaro' : 'branco'}
                  borderStyle={isFutura ? 'dashed' : 'solid'}
                  borderColor={isFutura ? 'bordaForte' : 'borda'}
                >
                  {isFutura && (
                    <XStack
                      alignSelf="flex-start"
                      backgroundColor="alertaSuave"
                      borderRadius="full"
                      paddingHorizontal={10}
                      paddingVertical={3}
                      marginBottom={8}
                      gap={6}
                      alignItems="center"
                    >
                      <Feather name="clock" size={12} color={cores.alerta} />
                      <Legenda fontWeight="700" color="alerta">
                        Agendada · entra no total quando o mês chegar
                      </Legenda>
                    </XStack>
                  )}
                  <XStack justifyContent="space-between" alignItems="flex-start" gap={12}>
                    <YStack flex={1}>
                      <Corpo fontSize={16} fontWeight="600">
                        {item.descricao}
                      </Corpo>
                      <Legenda marginTop={2}>{detalhes.join(' • ')}</Legenda>
                      {item.notaFiscalUri ? (
                        <XStack alignItems="center" gap={4} marginTop={4}>
                          <Feather name="paperclip" size={13} color={cores.verde} />
                          <Legenda color="verde">Nota fiscal anexada</Legenda>
                        </XStack>
                      ) : null}
                    </YStack>
                    <Corpo fontSize={17} fontWeight="700" color={isFutura ? 'textoTerc' : 'verde'}>
                      {formatarMoeda(item.valor)}
                    </Corpo>
                  </XStack>
                  <XStack
                    justifyContent="flex-end"
                    gap={8}
                    marginTop={12}
                    paddingTop={10}
                    borderTopWidth={1}
                    borderTopColor="borda"
                  >
                    <Botao
                      variante="contorno"
                      tamanho="sm"
                      icone="edit-2"
                      titulo="Editar"
                      onPress={() => navigation.navigate('DespesaForm', { propriedadeId, despesaId: item.id })}
                    />
                    <Botao variante="perigo" tamanho="sm" icone="trash-2" titulo="Excluir" onPress={() => handleExcluir(item.id!)} />
                  </XStack>
                </Cartao>
              );
            }}
          />
        )}
      </KeyboardAvoidingView>

      {despesas.length > 0 && (
        <BotaoFlutuante
          naAba={embutido}
          icone="plus"
          titulo="Nova despesa"
          onPress={() => navigation.navigate('DespesaForm', { propriedadeId, talhaoId })}
        />
      )}
    </Raiz>
  );
}
