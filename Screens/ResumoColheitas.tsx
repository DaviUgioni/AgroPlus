import { useState, useCallback } from 'react';
import { FlatList, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { YStack } from 'tamagui';
import { auth } from '../FirebaseConfig';
import { listarPropriedades } from '../Services/propriedades';
import { listarPlantiosPorPropriedade, estimativaColheita, textoEstimativa, Plantio } from '../Services/plantios';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import { Cabecalho, EstadoVazio, IconeLista, ItemLista, Legenda, ListaEsqueleto, Tela, toast } from '../Components/ui';
import { mensagemErro } from '../Services/erros';

type NavProp = NavigationProp<RootStackParamList>;

interface Linha {
  plantio: Plantio;
  propriedadeId: string;
  propriedadeNome: string;
  diasRestantes: number;
  texto: string;
  pronto: boolean;
}

export default function ResumoColheitas() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [linhas, setLinhas] = useState<Linha[]>([]);

  async function carregar(opts?: { silent?: boolean }) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      if (!opts?.silent) setCarregando(true);
      const propriedades = await listarPropriedades(userId);
      const todas: Linha[] = [];

      for (const prop of propriedades) {
        const plantios = await listarPlantiosPorPropriedade(prop.id!);
        for (const plantio of plantios) {
          const estimativa = estimativaColheita(plantio.dataPlantio, plantio.diasParaColheita);
          todas.push({
            plantio,
            propriedadeId: prop.id!,
            propriedadeNome: prop.nome,
            diasRestantes: estimativa.diasRestantes,
            texto: textoEstimativa(estimativa),
            pronto: estimativa.pronto,
          });
        }
      }

      todas.sort((a, b) => a.diasRestantes - b.diasRestantes);
      setLinhas(todas);
    } catch (error) {
      toast.erro(mensagemErro(error, 'Não foi possível carregar as colheitas.'));
    } finally {
      if (!opts?.silent) setCarregando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [])
  );

  async function handleAtualizar() {
    setAtualizando(true);
    await carregar({ silent: true });
    setAtualizando(false);
  }

  return (
    <Tela edges={['top', 'left', 'right']}>
      <Cabecalho titulo="Colheitas" subtitulo="Ordenadas pela mais próxima" />

      {carregando ? (
        <ListaEsqueleto quantidade={3} />
      ) : linhas.length === 0 ? (
        <EstadoVazio icone="feather" texto="Nenhum plantio cadastrado ainda." />
      ) : (
        <FlatList
          data={linhas}
          keyExtractor={(item) => item.plantio.id!}
          contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}
          showsVerticalScrollIndicator={false}
          refreshing={atualizando}
          onRefresh={handleAtualizar}
          renderItem={({ item }) => (
            <ItemLista
              titulo={item.plantio.tipoNome}
              subtitulo={`${item.propriedadeNome} · ${item.plantio.talhaoNome ?? 'Propriedade toda'}`}
              onPress={() =>
                navigation.navigate('PlantiosLista', {
                  propriedadeId: item.propriedadeId,
                  propriedadeNome: item.propriedadeNome,
                })
              }
              esquerda={<IconeLista icone="feather" tom={item.pronto ? 'alerta' : 'verde'} />}
            >
              <Legenda fontWeight="600" color={item.pronto ? 'alerta' : 'verde'} marginTop={4}>
                {item.texto}
              </Legenda>
            </ItemLista>
          )}
        />
      )}
    </Tela>
  );
}
