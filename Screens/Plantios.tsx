import { useState, useCallback } from 'react';
import { FlatList, Alert } from 'react-native';
import { useNavigation, useFocusEffect, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Text, XStack, YStack } from 'tamagui';
import { auth } from '../FirebaseConfig';
import { listarPropriedades, Propriedade } from '../Services/propriedades';
import { listarPlantiosPorPropriedade, Plantio, estimativaColheita, textoEstimativa } from '../Services/plantios';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import { Cabecalho, Carregando, EstadoVazio, ItemLista, Tela } from '../Components/ui';
import { mensagemErro } from '../Services/erros';

type PlantiosNavigationProp = NavigationProp<RootStackParamList, 'Plantios'>;

interface PropriedadeComPlantio extends Propriedade {
  plantioAtual?: Plantio;
}

export default function Plantios() {
  const navigation = useNavigation<PlantiosNavigationProp>();
  const [propriedades, setPropriedades] = useState<PropriedadeComPlantio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  async function carregarPropriedades(opts?: { silent?: boolean }) {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    try {
      if (!opts?.silent) setCarregando(true);
      const dados = await listarPropriedades(userId);
      const comPlantios = await Promise.all(
        dados.map(async (prop) => {
          const plantios = await listarPlantiosPorPropriedade(prop.id!);
          return { ...prop, plantioAtual: plantios[0] };
        })
      );
      setPropriedades(comPlantios);
    } catch (error) {
      Alert.alert('Erro', mensagemErro(error, 'Não foi possível carregar as propriedades.'));
    } finally {
      if (!opts?.silent) setCarregando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregarPropriedades();
    }, [])
  );

  async function handleAtualizar() {
    setAtualizando(true);
    await carregarPropriedades({ silent: true });
    setAtualizando(false);
  }

  return (
    <Tela>
      <Cabecalho titulo="Plantios" subtitulo="Escolha uma propriedade para ver os plantios" />

      {carregando ? (
        <Carregando />
      ) : propriedades.length === 0 ? (
        <EstadoVazio
          icone="map"
          titulo="Cadastre uma propriedade primeiro"
          texto="Os registros ficam organizados por propriedade. Depois de cadastrar, volte aqui."
          acao={{ titulo: 'Cadastrar propriedade', onPress: () => navigation.navigate('PropriedadeForm') }}
        />
      ) : (
        <FlatList
          data={propriedades}
          keyExtractor={(item) => item.id!}
          showsVerticalScrollIndicator={false}
          refreshing={atualizando}
          onRefresh={handleAtualizar}
          renderItem={({ item }) => {
            const estimativa = item.plantioAtual
              ? estimativaColheita(item.plantioAtual.dataPlantio, item.plantioAtual.diasParaColheita)
              : null;
            return (
              <ItemLista
                titulo={item.nome}
                subtitulo={`${item.localizacao} · ${item.areaTotal} ha`}
                onPress={() =>
                  navigation.navigate('PlantiosLista', { propriedadeId: item.id!, propriedadeNome: item.nome })
                }
              >
                {item.plantioAtual && estimativa ? (
                  <XStack
                    alignItems="center"
                    gap={8}
                    backgroundColor="verdeSuave"
                    borderRadius="lg"
                    paddingVertical={8}
                    paddingHorizontal={10}
                    marginTop={10}
                  >
                    <Feather name="feather" size={14} color={cores.verde} />
                    <YStack flex={1}>
                      <Text fontSize={13} fontWeight="600" color="texto">
                        {item.plantioAtual.tipoNome}
                      </Text>
                      <Text fontSize={13} color="verde" marginTop={1}>
                        {textoEstimativa(estimativa)}
                      </Text>
                    </YStack>
                  </XStack>
                ) : (
                  <Text fontSize={13} color="textoTerc" fontStyle="italic" marginTop={8}>
                    Nenhum plantio ativo
                  </Text>
                )}
              </ItemLista>
            );
          }}
        />
      )}
    </Tela>
  );
}
