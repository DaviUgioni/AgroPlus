import { ComponentProps, useState, useCallback } from 'react';
import { FlatList, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect, RouteProp, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Text, XStack, YStack } from 'tamagui';
import { buscarPropriedade, excluirPropriedade, Propriedade } from '../Services/propriedades';
import { listarTalhoes, excluirTalhao, Talhao } from '../Services/talhoes';
import { listarDespesasPorTalhao, totalDespesas } from '../Services/despesas';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import { BarraProgresso, Botao, Cabecalho, Cartao, EstadoVazio, Tela, TelaCarregando, TituloSecao } from '../Components/ui';
import { mensagemErro } from '../Services/erros';

type DetalheRouteProp = RouteProp<RootStackParamList, 'PropriedadeDetalhe'>;
type DetalheNavigationProp = NavigationProp<RootStackParamList, 'PropriedadeDetalhe'>;
type IconeFeather = ComponentProps<typeof Feather>['name'];

// Botão pequeno de ícone + legenda usado nas ações de cada talhão
function AcaoTalhao({ icone, label, cor = cores.verde, onPress }: { icone: IconeFeather; label: string; cor?: string; onPress: () => void }) {
  return (
    <YStack
      flex={1}
      alignItems="center"
      gap={4}
      minHeight={56}
      justifyContent="center"
      paddingVertical={8}
      borderRadius="lg"
      backgroundColor="transparent press:begeClaro"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Feather name={icone} size={19} color={cor} />
      <Text fontSize={13} fontWeight="600" color={cor} textAlign="center">
        {label}
      </Text>
    </YStack>
  );
}

// Botão redondo só com ícone (editar/excluir no cabeçalho)
function BotaoIcone({ icone, cor, label, onPress }: { icone: IconeFeather; cor: string; label: string; onPress: () => void }) {
  return (
    <YStack
      width={44}
      height={44}
      borderRadius="full"
      borderWidth={1}
      borderColor="borda"
      backgroundColor="branco press:begeClaro"
      alignItems="center"
      justifyContent="center"
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Feather name={icone} size={18} color={cor} />
    </YStack>
  );
}

export default function PropriedadeDetalhe() {
  const navigation = useNavigation<DetalheNavigationProp>();
  const route = useRoute<DetalheRouteProp>();
  const { propriedadeId } = route.params;
  const insets = useSafeAreaInsets();

  const [propriedade, setPropriedade] = useState<Propriedade | null>(null);
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
  const [totaisPorTalhao, setTotaisPorTalhao] = useState<Record<string, number>>({});
  const [carregando, setCarregando] = useState(true);

  async function carregarDados() {
    try {
      setCarregando(true);
      const [prop, listaTalhoes] = await Promise.all([
        buscarPropriedade(propriedadeId),
        listarTalhoes(propriedadeId),
      ]);
      setPropriedade(prop);
      setTalhoes(listaTalhoes);
      // totais por talhão para controle fino
      if (listaTalhoes.length > 0) {
        const totais = await Promise.all(
          listaTalhoes.map(async (t) => {
            try {
              const desps = await listarDespesasPorTalhao(t.id!, propriedadeId);
              return [t.id!, totalDespesas(desps)] as const;
            } catch {
              return [t.id!, 0] as const;
            }
          })
        );
        const map: Record<string, number> = {};
        totais.forEach(([id, v]) => (map[id] = v));
        setTotaisPorTalhao(map);
      } else {
        setTotaisPorTalhao({});
      }
    } catch (error) {
      console.log('Erro ao carregar detalhe:', error);
      Alert.alert('Erro', mensagemErro(error, 'Não foi possível carregar os dados.'));
    } finally {
      setCarregando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [propriedadeId])
  );

  function handleExcluirPropriedade() {
    Alert.alert('Excluir propriedade', 'Tem certeza? Os talhões, plantios e despesas desta propriedade também serão apagados. Não dá para desfazer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirPropriedade(propriedadeId);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Erro', mensagemErro(error, 'Não foi possível excluir.'));
          }
        },
      },
    ]);
  }

  function handleExcluirTalhao(talhaoId: string) {
    Alert.alert('Excluir talhão', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirTalhao(talhaoId);
            carregarDados();
          } catch (error) {
            Alert.alert('Erro', mensagemErro(error, 'Não foi possível excluir o talhão.'));
          }
        },
      },
    ]);
  }

  if (carregando) {
    return <TelaCarregando />;
  }

  if (!propriedade) {
    return (
      <Tela>
        <Cabecalho titulo="Propriedade" />
        <EstadoVazio icone="alert-circle" texto="Propriedade não encontrada." />
      </Tela>
    );
  }

  const formatarMoeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const areaUsada = talhoes.reduce((soma, t) => soma + (t.area || 0), 0);

  return (
    <Tela edges={['top', 'left', 'right']}>
      <FlatList
        data={talhoes}
        keyExtractor={(item) => item.id!}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 12) + 16 }}
        ListHeaderComponent={
          <>
            <Cabecalho
              titulo={propriedade.nome}
              subtitulo={`${propriedade.localizacao} · ${propriedade.areaTotal} ha`}
              direita={
                <XStack gap={8}>
                  <BotaoIcone
                    icone="edit-2"
                    cor={cores.textoSec}
                    label="Editar propriedade"
                    onPress={() => navigation.navigate('PropriedadeForm', { propriedadeId })}
                  />
                  <BotaoIcone icone="trash-2" cor={cores.erro} label="Excluir propriedade" onPress={handleExcluirPropriedade} />
                </XStack>
              }
            />

            {propriedade.imagemUrl && (
              <Image
                source={{ uri: propriedade.imagemUrl }}
                style={{ width: '100%', height: 180, borderRadius: 12, marginBottom: 20, backgroundColor: cores.bege }}
              />
            )}

            {talhoes.length > 0 && (
              <Cartao tom="bege" marginBottom={16} gap={8}>
                <XStack justifyContent="space-between">
                  <Text fontSize={14} fontWeight="600" color="texto">
                    Área dividida em talhões
                  </Text>
                  <Text fontSize={14} fontWeight="700" color="verde">
                    {areaUsada.toLocaleString('pt-BR')} de {propriedade.areaTotal.toLocaleString('pt-BR')} ha
                  </Text>
                </XStack>
                <BarraProgresso valor={areaUsada / (propriedade.areaTotal || 1)} fundo="branco" />
              </Cartao>
            )}

            <XStack alignItems="center" justifyContent="space-between" marginBottom={4}>
              <TituloSecao marginBottom={0}>Talhões</TituloSecao>
              <Botao
                variante="texto"
                tamanho="sm"
                icone="plus"
                titulo="Novo talhão"
                onPress={() => navigation.navigate('TalhaoForm', { propriedadeId })}
              />
            </XStack>
          </>
        }
        ListEmptyComponent={
          <EstadoVazio
            icone="grid"
            titulo="Nenhum talhão ainda"
            texto="Talhões são as partes da propriedade (ex.: &quot;Área do milho&quot;, &quot;Pasto&quot;). Eles ajudam a separar plantios e gastos de cada área."
            acao={{ titulo: 'Cadastrar talhão', onPress: () => navigation.navigate('TalhaoForm', { propriedadeId }) }}
            marginTop={8}
            marginBottom={16}
          />
        }
        renderItem={({ item }) => (
          <Cartao marginBottom={10} padding={0} overflow="hidden">
            <XStack alignItems="center" justifyContent="space-between" padding={14}>
              <YStack flex={1}>
                <Text fontSize={15} fontWeight="600" color="texto">
                  {item.nome}
                </Text>
                <Text fontSize={13} color="textoSec" marginTop={2}>
                  {item.area} ha
                </Text>
              </YStack>
              <YStack alignItems="flex-end">
                <Text fontSize={13} color="textoSec">
                  Total gasto
                </Text>
                <Text fontSize={14} fontWeight="700" color="verde">
                  {formatarMoeda(totaisPorTalhao[item.id!] ?? 0)}
                </Text>
              </YStack>
            </XStack>
            <XStack borderTopWidth={1} borderTopColor="borda" paddingHorizontal={6}>
              <AcaoTalhao
                icone="list"
                label="Despesas"
                onPress={() => navigation.navigate('DespesasLista', { propriedadeId, talhaoId: item.id, talhaoNome: item.nome })}
              />
              <AcaoTalhao
                icone="plus-circle"
                label="Nova despesa"
                onPress={() => navigation.navigate('DespesaForm', { propriedadeId, talhaoId: item.id })}
              />
              <AcaoTalhao
                icone="edit-2"
                label="Editar"
                cor={cores.textoSec}
                onPress={() => navigation.navigate('TalhaoForm', { propriedadeId, talhaoId: item.id })}
              />
              <AcaoTalhao icone="trash-2" label="Excluir" cor={cores.erro} onPress={() => handleExcluirTalhao(item.id!)} />
            </XStack>
          </Cartao>
        )}
        ListFooterComponent={
          <Cartao tom="bege" marginTop={12} gap={12}>
            <YStack>
              <Text fontSize={15} fontWeight="600" color="texto">
                Despesas da propriedade
              </Text>
              <Text fontSize={13} color="textoSec" marginTop={2}>
                Lance gastos gerais ou consulte o histórico
              </Text>
            </YStack>
            <XStack gap={8}>
              <Botao
                flex={1}
                variante="contorno"
                tamanho="sm"
                icone="list"
                titulo="Ver despesas"
                onPress={() => navigation.navigate('DespesasLista', { propriedadeId })}
              />
              <Botao
                flex={1}
                tamanho="sm"
                icone="plus"
                titulo="Nova despesa"
                onPress={() => navigation.navigate('DespesaForm', { propriedadeId })}
              />
            </XStack>
          </Cartao>
        }
      />
    </Tela>
  );
}
