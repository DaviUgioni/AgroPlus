import { useState, useCallback } from 'react';
import { FlatList, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect, RouteProp, NavigationProp } from '@react-navigation/native';
import { XStack, YStack } from 'tamagui';
import { buscarPropriedade, excluirPropriedade, Propriedade } from '../Services/propriedades';
import { listarTalhoes, excluirTalhao, Talhao } from '../Services/talhoes';
import { listarDespesasPorTalhao, totalDespesas } from '../Services/despesas';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import { BarraProgresso, Botao, Cabecalho, Corpo, EstadoVazio, ItemLista, MenuAcoes, Tela, TelaCarregando, TituloSecao, confirmar, toast } from '../Components/ui';
import { mensagemErro } from '../Services/erros';

type DetalheRouteProp = RouteProp<RootStackParamList, 'PropriedadeDetalhe'>;
type DetalheNavigationProp = NavigationProp<RootStackParamList, 'PropriedadeDetalhe'>;

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
              subtitulo={`${propriedade.localizacao} · ${(propriedade.areaTotal || 0).toLocaleString('pt-BR')} ha`}
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
                style={{ width: '100%', height: 180, borderRadius: 8, marginBottom: 16, backgroundColor: cores.bege }}
              />
            )}

            {talhoes.length > 0 && (
              <YStack marginBottom={16} gap={8}>
                <XStack justifyContent="space-between" gap={12}>
                  <Corpo flex={1} fontSize={14} fontWeight="600">
                    Área dividida em talhões
                  </Corpo>
                  <Corpo fontSize={14} fontWeight="700">
                    {areaUsada.toLocaleString('pt-BR')} de {propriedade.areaTotal.toLocaleString('pt-BR')} ha
                  </Corpo>
                </XStack>
                <BarraProgresso valor={areaUsada / (propriedade.areaTotal || 1)} />
              </YStack>
            )}

            <XStack alignItems="center" justifyContent="space-between">
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
          <ItemLista
            titulo={item.nome}
            subtitulo={`${(item.area || 0).toLocaleString('pt-BR')} ha · gasto ${formatarMoeda(totaisPorTalhao[item.id!] ?? 0)}`}
            direita={
              <MenuAcoes
                titulo={item.nome}
                rotulo={`Opções do talhão ${item.nome}`}
                acoes={[
                  { titulo: 'Editar talhão', icone: 'edit-2', onPress: () => navigation.navigate('TalhaoForm', { propriedadeId, talhaoId: item.id }) },
                  { titulo: 'Excluir talhão', icone: 'trash-2', perigo: true, onPress: () => handleExcluirTalhao(item.id!) },
                ]}
              />
            }
          >
            {/* marginLeft compensa o padding do botão de texto, para alinhar com o nome do talhão */}
            <XStack marginTop={4} marginLeft={-8} flexWrap="wrap">
              <Botao
                variante="texto"
                tamanho="sm"
                titulo="Despesas"
                onPress={() => navigation.navigate('DespesasLista', { propriedadeId, talhaoId: item.id, talhaoNome: item.nome })}
              />
              <Botao
                variante="texto"
                tamanho="sm"
                titulo="Nova despesa"
                onPress={() => navigation.navigate('DespesaForm', { propriedadeId, talhaoId: item.id })}
              />
            </XStack>
          </ItemLista>
        )}
        ListFooterComponent={
          <YStack marginTop={24} gap={12}>
            <TituloSecao marginBottom={0}>Despesas da propriedade</TituloSecao>
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
                variante={talhoes.length === 0 ? 'secundario' : 'primario'}
                tamanho="sm"
                icone="plus"
                titulo="Nova despesa"
                onPress={() => navigation.navigate('DespesaForm', { propriedadeId })}
              />
            </XStack>
          </YStack>
        }
      />
    </Tela>
  );
}
