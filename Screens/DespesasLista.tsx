import { useState, useCallback, useEffect, useMemo } from 'react';
import { FlatList, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useFocusEffect, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Text, XStack, YStack } from 'tamagui';
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
import { buscarPropriedade } from '../Services/propriedades';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../FirebaseConfig';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import { BarraProgresso, Botao, BotaoFlutuante, Cabecalho, Campo, Carregando, Cartao, EstadoVazio, Seletor, Tela } from '../Components/ui';
import { mensagemErro } from '../Services/erros';
import { baixarPlanilha, CanceladoError, compartilharPlanilha } from '../Services/planilha';

type DespesasListaRouteProp = RouteProp<RootStackParamList, 'DespesasLista'>;
type NavProp = NavigationProp<RootStackParamList>;

const MESES = ['Todos', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function DespesasLista() {
  const route = useRoute<DespesasListaRouteProp>();
  const navigation = useNavigation<NavProp>();
  const { propriedadeId, talhaoId, talhaoNome } = (route.params ?? {}) as any;
  const insets = useSafeAreaInsets();
  const modoTalhao = !!talhaoId;

  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [filtroCat, setFiltroCat] = useState<'todas' | CategoriaDespesa>('todas');
  const [filtroMes, setFiltroMes] = useState<number>(-1); // -1 todos, 0-11
  const [limite, setLimite] = useState<string>('');
  const [limiteSalvo, setLimiteSalvo] = useState<number | undefined>(undefined);
  const [salvandoLimite, setSalvandoLimite] = useState(false);
  const [editandoLimite, setEditandoLimite] = useState(false);
  const [exportando, setExportando] = useState(false);

  // Fecha o editor do limite assim que um valor é salvo ou removido
  useEffect(() => {
    setEditandoLimite(false);
  }, [limiteSalvo]);

  async function carregarDespesas(opts?: { silent?: boolean }) {
    if (!propriedadeId) {
      Alert.alert('Erro', 'Propriedade não informada.');
      return;
    }
    try {
      if (!opts?.silent) setCarregando(true);
      const dados = modoTalhao ? await listarDespesasPorTalhao(talhaoId) : await listarDespesasPorPropriedade(propriedadeId);
      const prop = await buscarPropriedade(propriedadeId);
      setDespesas(dados);
      if (!modoTalhao && prop?.limiteMensal) {
        setLimiteSalvo(prop.limiteMensal);
        setLimite(String(prop.limiteMensal).replace('.', ','));
      } else {
        setLimiteSalvo(undefined);
        if (!modoTalhao) setLimite('');
      }
    } catch (error) {
      console.log('ERRO DESPESAS:', error);
      Alert.alert('Erro', mensagemErro(error, 'Não foi possível carregar as despesas.'));
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

  const limiteNum = parseFloat(limite.replace(',', '.'));
  const estourou = limiteSalvo !== undefined && !isNaN(limiteNum) && totalMes > limiteNum;

  function handleExcluir(id: string) {
    Alert.alert('Excluir despesa', 'Tem certeza que deseja excluir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirDespesa(id);
            carregarDespesas();
          } catch (error) {
            Alert.alert('Erro', mensagemErro(error, 'Não foi possível excluir.'));
          }
        },
      },
    ]);
  }

  async function handleSalvarLimite() {
    if (!propriedadeId) return;
    const v = parseFloat(limite.replace(',', '.'));
    if (limite && (isNaN(v) || !isFinite(v) || v <= 0)) {
      Alert.alert('Atenção', 'Limite inválido.');
      return;
    }
    try {
      setSalvandoLimite(true);
      const ref = doc(db, 'propriedades', propriedadeId);
      if (limite) {
        await updateDoc(ref, { limiteMensal: v } as any);
        setLimiteSalvo(v);
        Alert.alert('Sucesso', `Limite de ${v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} salvo.`);
      } else {
        await updateDoc(ref, { limiteMensal: deleteField() } as any);
        setLimiteSalvo(undefined);
        Alert.alert('Sucesso', 'Limite removido.');
      }
    } catch (error) {
      Alert.alert('Erro', mensagemErro(error, 'Não foi possível salvar o limite.'));
    } finally {
      setSalvandoLimite(false);
    }
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
      Alert.alert('Erro', mensagemErro(e, 'Não foi possível gerar a planilha.'));
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
  const usoLimite = limiteSalvo ? totalMes / limiteSalvo : 0;

  const topo = (
    <>
      <Cartao tom="verde" marginBottom={12}>
        <Text fontSize={14} color="sobreVerdeSuave">
          {temFiltro ? 'Total com os filtros escolhidos' : 'Total gasto até hoje'}
        </Text>
        <Text fontSize={28} fontWeight="700" color="sobreVerde" marginTop={2}>
          {formatarMoeda(total)}
        </Text>
        <XStack gap={10} marginTop={12}>
          <YStack flex={1} backgroundColor="rgba(255,255,255,0.15)" borderRadius="lg" padding={10}>
            <Text fontSize={13} color="sobreVerdeSuave">
              Mês de {nomeMes}
            </Text>
            <Text fontSize={16} fontWeight="700" color="sobreVerde" marginTop={2}>
              {formatarMoeda(totalMes)}
            </Text>
          </YStack>
          <YStack flex={1} backgroundColor="rgba(255,255,255,0.15)" borderRadius="lg" padding={10}>
            <Text fontSize={13} color="sobreVerdeSuave">
              Ano de {anoAtual}
            </Text>
            <Text fontSize={16} fontWeight="700" color="sobreVerde" marginTop={2}>
              {formatarMoeda(totalAno)}
            </Text>
          </YStack>
        </XStack>
      </Cartao>

      {!modoTalhao && (
        <Cartao marginBottom={12} padding={14} gap={10}>
          {limiteSalvo !== undefined && !editandoLimite ? (
            <>
              <XStack justifyContent="space-between" alignItems="center">
                <YStack flex={1}>
                  <Text fontSize={14} fontWeight="600" color="texto">
                    Limite de gastos do mês
                  </Text>
                  <Text fontSize={13} color={estourou ? 'erro' : 'textoSec'} marginTop={2}>
                    {formatarMoeda(totalMes)} de {formatarMoeda(limiteSalvo)} ({Math.round(usoLimite * 100)}%)
                  </Text>
                </YStack>
                <Botao variante="texto" tamanho="sm" titulo="Alterar" onPress={() => setEditandoLimite(true)} />
              </XStack>
              <BarraProgresso valor={usoLimite} cor={estourou ? 'erro' : usoLimite >= 0.8 ? 'alerta' : 'verde'} />
              {estourou && (
                <Text fontSize={13} fontWeight="600" color="erro">
                  Você passou do limite deste mês.
                </Text>
              )}
            </>
          ) : editandoLimite ? (
            <>
              <Text fontSize={14} fontWeight="600" color="texto">
                Limite de gastos do mês
              </Text>
              <Text fontSize={13} color="textoSec">
                O app avisa quando os gastos do mês passarem desse valor. Deixe vazio e salve para remover.
              </Text>
              <XStack gap={8} alignItems="flex-start">
                <YStack flex={1}>
                  <Campo
                    value={limite}
                    onChangeText={setLimite}
                    placeholder="Ex.: 2000"
                    keyboardType="numeric"
                    icone="dollar-sign"
                  />
                </YStack>
                <Botao titulo="Salvar" carregando={salvandoLimite} minHeight={50} onPress={handleSalvarLimite} />
              </XStack>
              <Botao
                variante="texto"
                tamanho="sm"
                titulo="Cancelar"
                alignSelf="flex-start"
                paddingHorizontal={0}
                onPress={() => setEditandoLimite(false)}
              />
            </>
          ) : (
            <XStack
              alignItems="center"
              gap={10}
              onPress={() => setEditandoLimite(true)}
              opacity="press:0.7"
              accessibilityRole="button"
            >
              <Feather name="target" size={20} color={cores.verde} />
              <YStack flex={1}>
                <Text fontSize={14} fontWeight="600" color="verde">
                  Definir um limite de gastos por mês
                </Text>
                <Text fontSize={13} color="textoSec" marginTop={2}>
                  Opcional: o app avisa quando você passar dele.
                </Text>
              </YStack>
              <Feather name="chevron-right" size={18} color={cores.textoTerc} />
            </XStack>
          )}
        </Cartao>
      )}

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

  return (
    <Tela edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Cabecalho
          titulo="Despesas"
          subtitulo={modoTalhao ? `Talhão: ${talhaoNome ?? ''}` : undefined}
          direita={<Botao variante="contorno" tamanho="sm" icone="download" titulo="Planilha" carregando={exportando} onPress={handleExportar} />}
        />

        {carregando ? (
          <Carregando />
        ) : (
          <FlatList
            data={despesasFiltradas}
            keyExtractor={(item) => item.id!}
            contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
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
                      <Text fontSize={12} fontWeight="700" color="alerta">
                        Agendada · entra no total quando o mês chegar
                      </Text>
                    </XStack>
                  )}
                  <XStack justifyContent="space-between" alignItems="flex-start" gap={12}>
                    <YStack flex={1}>
                      <Text fontSize={16} fontWeight="600" color="texto">
                        {item.descricao}
                      </Text>
                      <Text fontSize={13} color="textoSec" marginTop={2}>
                        {detalhes.join(' • ')}
                      </Text>
                      {item.notaFiscalUri ? (
                        <XStack alignItems="center" gap={4} marginTop={4}>
                          <Feather name="paperclip" size={13} color={cores.verde} />
                          <Text fontSize={13} color="verde">
                            Nota fiscal anexada
                          </Text>
                        </XStack>
                      ) : null}
                    </YStack>
                    <Text fontSize={17} fontWeight="700" color={isFutura ? 'textoTerc' : 'verde'}>
                      {formatarMoeda(item.valor)}
                    </Text>
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
          icone="plus"
          titulo="Nova despesa"
          onPress={() => navigation.navigate('DespesaForm', { propriedadeId, talhaoId })}
        />
      )}
    </Tela>
  );
}
