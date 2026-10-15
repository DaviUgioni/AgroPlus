import { useState, useCallback } from 'react';
import { FlatList, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useFocusEffect, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Text, XStack, YStack } from 'tamagui';
import { listarPlantiosPorPropriedade, excluirPlantio, estimativaColheita, textoEstimativa, Plantio } from '../Services/plantios';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import { BarraProgresso, BotaoFlutuante, Cabecalho, Carregando, EstadoVazio, ItemLista, Tela } from '../Components/ui';
import { mensagemErro } from '../Services/erros';

type PlantiosListaRouteProp = RouteProp<RootStackParamList, 'PlantiosLista'>;
type NavProp = NavigationProp<RootStackParamList>;

export default function PlantiosLista() {
  const route = useRoute<PlantiosListaRouteProp>();
  const navigation = useNavigation<NavProp>();
  const { propriedadeId, propriedadeNome } = route.params;
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
      Alert.alert('Erro', mensagemErro(error, 'Não foi possível carregar os plantios.'));
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
    Alert.alert('Excluir plantio', 'Tem certeza que deseja excluir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirPlantio(id);
            carregarPlantios();
          } catch (error) {
            Alert.alert('Erro', mensagemErro(error, 'Não foi possível excluir.'));
          }
        },
      },
    ]);
  }

  return (
    <Tela edges={['top', 'left', 'right']}>
      <Cabecalho titulo="Plantios" subtitulo={propriedadeNome} />

      {carregando ? (
        <Carregando />
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
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
          showsVerticalScrollIndicator={false}
          refreshing={atualizando}
          onRefresh={handleAtualizar}
          renderItem={({ item }) => {
            const estimativa = estimativaColheita(item.dataPlantio, item.diasParaColheita);
            // Quanto do ciclo já passou (0 a 1), para a barra de progresso
            const progresso = 1 - estimativa.diasRestantes / (item.diasParaColheita || 1);
            return (
              <ItemLista
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
                <XStack justifyContent="space-between" alignItems="center" marginTop={10} marginBottom={6}>
                  <Text fontSize={14} fontWeight="700" color={estimativa.pronto ? 'alerta' : 'verde'}>
                    {textoEstimativa(estimativa)}
                  </Text>
                  <Text fontSize={13} color="textoSec">
                    {estimativa.dataPrevista.toLocaleDateString('pt-BR')}
                  </Text>
                </XStack>
                <BarraProgresso valor={progresso} cor={estimativa.pronto ? 'alerta' : 'verde'} />
              </ItemLista>
            );
          }}
        />
      )}

      {plantios.length > 0 && (
        <BotaoFlutuante icone="plus" titulo="Novo plantio" onPress={() => navigation.navigate('PlantioForm', { propriedadeId })} />
      )}
    </Tela>
  );
}
