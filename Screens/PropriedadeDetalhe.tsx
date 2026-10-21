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
import { BarraProgresso, Botao, Cabecalho, Cartao, EstadoVazio, IconeLista, MenuAcoes, Tela, TelaCarregando, TituloSecao, confirmar, toast } from '../Components/ui';
import { mensagemErro } from '../Services/erros';

type DetalheRouteProp = RouteProp<RootStackParamList, 'PropriedadeDetalhe'>;
type DetalheNavigationProp = NavigationProp<RootStackParamList, 'PropriedadeDetalhe'>;
type IconeFeather = ComponentProps<typeof Feather>['name'];

// Ação principal de cada talhão (as secundárias ficam no menu "⋯")
function AcaoTalhao({ icone, label, onPress }: { icone: IconeFeather; label: string; onPress: () => void }) {
  return (
    <XStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      gap={8}
      minHeight={50}
      backgroundColor="transparent press:begeClaro"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Feather name={icone} size={18} color={cores.verde} />
      <Text fontSize={14} fontWeight="700" color="verde" textAlign="center">
        {label}
      </Text>
    </XStack>
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
      toast.erro(mensagemErro(error, 'Não foi possível carregar os dados.'));
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
    confirmar({ titulo: 'Excluir propriedade', texto: 'Tem certeza? Os talhões, plantios e despesas desta propriedade também serão apagados. Não dá para desfazer.', confirmar: 'Excluir' }).then(async (ok) => {
      if (!ok) return;
          try {
            await excluirPropriedade(propriedadeId);
            navigation.goBack();
          } catch (error) {
            toast.erro(mensagemErro(error, 'Não foi possível excluir.'));
          }
    });
  }

  function handleExcluirTalhao(talhaoId: string) {
    confirmar({ titulo: 'Excluir talhão', texto: 'Tem certeza?', confirmar: 'Excluir' }).then(async (ok) => {
      if (!ok) return;
          try {
            await excluirTalhao(talhaoId);
            carregarDados();
          } catch (error) {
            toast.erro(mensagemErro(error, 'Não foi possível excluir o talhão.'));
          }
    });
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
                <MenuAcoes
                  titulo={propriedade.nome}
                  rotulo="Opções da propriedade"
                  acoes={[
                    { titulo: 'Editar propriedade', icone: 'edit-2', onPress: () => navigation.navigate('PropriedadeForm', { propriedadeId }) },
                    { titulo: 'Excluir propriedade', icone: 'trash-2', perigo: true, onPress: handleExcluirPropriedade },
                  ]}
                />
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
            <XStack alignItems="center" justifyContent="space-between" paddingVertical={10} paddingLeft={14} paddingRight={4} gap={12}>
              <IconeLista icone="grid" />
              <YStack flex={1}>
                <Text fontSize={16} fontWeight="700" color="texto">
                  {item.nome}
                </Text>
                <Text fontSize={13} color="textoSec" marginTop={2}>
                  {item.area} ha · gasto {formatarMoeda(totaisPorTalhao[item.id!] ?? 0)}
                </Text>
              </YStack>
              <MenuAcoes
                titulo={item.nome}
                rotulo={`Opções do talhão ${item.nome}`}
                acoes={[
                  { titulo: 'Editar talhão', icone: 'edit-2', onPress: () => navigation.navigate('TalhaoForm', { propriedadeId, talhaoId: item.id }) },
                  { titulo: 'Excluir talhão', icone: 'trash-2', perigo: true, onPress: () => handleExcluirTalhao(item.id!) },
                ]}
              />
            </XStack>
            <XStack borderTopWidth={1} borderTopColor="borda">
              <AcaoTalhao
                icone="list"
                label="Despesas"
                onPress={() => navigation.navigate('DespesasLista', { propriedadeId, talhaoId: item.id, talhaoNome: item.nome })}
              />
              <YStack width={1} backgroundColor="borda" />
              <AcaoTalhao
                icone="plus-circle"
                label="Nova despesa"
                onPress={() => navigation.navigate('DespesaForm', { propriedadeId, talhaoId: item.id })}
              />
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
