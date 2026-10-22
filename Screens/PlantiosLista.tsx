import { useState, useCallback } from 'react';
import { FlatList, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useFocusEffect, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { YStack } from 'tamagui';
import { listarPlantiosPorPropriedade, excluirPlantio, estimativaColheita, textoEstimativa, Plantio } from '../Services/plantios';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import { BarraProgresso, BotaoFlutuante, Cabecalho, Corpo, EstadoVazio, ItemLista, Legenda, ListaEsqueleto, Tela, confirmar, toast } from '../Components/ui';
import { mensagemErro } from '../Services/erros';

type PlantiosListaRouteProp = RouteProp<RootStackParamList, 'PlantiosLista'>;
type NavProp = NavigationProp<RootStackParamList>;

/** `embutido`: usado dentro da aba Plantios, sem cabeçalho nem moldura de tela */
export default function PlantiosLista({ embutido, propriedadeId: idEmbutido }: { embutido?: boolean; propriedadeId?: string }) {
  const route = useRoute<PlantiosListaRouteProp>();
  const navigation = useNavigation<NavProp>();
  const { propriedadeId, propriedadeNome } = { ...(route.params ?? {}), ...(idEmbutido ? { propriedadeId: idEmbutido } : {}) } as { propriedadeId: string; propriedadeNome?: string };
  const insets = useSafeAreaInsets();

  const [plantios, setPlantios] = useState<Plantio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  async function carregarPlantios(opts?: { silent?: boolean }) {
    try {
      if (!opts?.silent) setCarregando(true);
      const dados = await listarPlantiosPorPropriedade(propriedadeId);
      setPlantios(dados);
    } catch (error) {
      toast.erro(mensagemErro(error, 'Não foi possível carregar os plantios.'));
    } finally {
      if (!opts?.silent) setCarregando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregarPlantios();
    }, [propriedadeId])
  );

  async function handleAtualizar() {
    setAtualizando(true);
    await carregarPlantios({ silent: true });
    setAtualizando(false);
  }

  function handleExcluir(id: string) {
    confirmar({ titulo: 'Excluir plantio', texto: 'Tem certeza que deseja excluir?', confirmar: 'Excluir' }).then(async (ok) => {
      if (!ok) return;
          try {
            await excluirPlantio(id);
            carregarPlantios();
          } catch (error) {
            toast.erro(mensagemErro(error, 'Não foi possível excluir.'));
          }
    });
  }

  const Raiz: any = embutido ? YStack : Tela;
  const propsRaiz = embutido ? { flex: 1 } : { edges: ['top', 'left', 'right'] };

  return (
    <Raiz {...propsRaiz}>
      {embutido ? null : <Cabecalho titulo="Plantios" subtitulo={propriedadeNome} />}

      {carregando ? (
        <ListaEsqueleto quantidade={3} />
      ) : plantios.length === 0 ? (
        <EstadoVazio
          icone="feather"
          titulo="Nenhum plantio ainda"
          texto="Registre o que você plantou e o app avisa quando estiver perto da colheita."
          acao={{ titulo: 'Cadastrar plantio', onPress: () => navigation.navigate('PlantioForm', { propriedadeId }) }}
        />
      ) : (
        <FlatList
          data={plantios}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={{ paddingBottom: embutido ? 96 : 100 + insets.bottom }}
          showsVerticalScrollIndicator={false}
          refreshing={atualizando}
          onRefresh={handleAtualizar}
          renderItem={({ item }) => {
            const estimativa = estimativaColheita(item.dataPlantio, item.diasParaColheita);
            // Quanto do ciclo já passou (0 a 1), para a barra de progresso
            const progresso = 1 - estimativa.diasRestantes / (item.diasParaColheita || 1);
            return (
              <ItemLista
                icone="feather"
                titulo={item.tipoNome}
                subtitulo={`${item.talhaoNome ? `Talhão: ${item.talhaoNome}` : 'Propriedade toda'} · Plantado em ${item.dataPlantio.toDate().toLocaleDateString('pt-BR')}`}
                direita={
                  <YStack
                    padding={13}
                    borderRadius="lg"
                    backgroundColor="transparent press:erroSuave"
                    onPress={() => handleExcluir(item.id!)}
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir plantio de ${item.tipoNome}`}
                  >
                    <Feather name="trash-2" size={18} color={cores.erro} />
                  </YStack>
                }
              >
                <YStack marginTop={10} marginBottom={8} gap={2}>
                  <Corpo fontSize={14} fontWeight="700" color={estimativa.pronto ? 'alerta' : 'verde'}>
                    {textoEstimativa(estimativa)}
                  </Corpo>
                  <Legenda>Colheita em {estimativa.dataPrevista.toLocaleDateString('pt-BR')}</Legenda>
                </YStack>
                <BarraProgresso valor={progresso} cor={estimativa.pronto ? 'alerta' : 'verde'} />
              </ItemLista>
            );
          }}
        />
      )}

      {plantios.length > 0 && (
        <BotaoFlutuante naAba={embutido} icone="plus" titulo="Novo plantio" onPress={() => navigation.navigate('PlantioForm', { propriedadeId })} />
      )}
    </Raiz>
  );
}
