import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useFocusEffect, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { listarPlantiosPorPropriedade, excluirPlantio, estimativaColheita, textoEstimativa, Plantio } from '../Services/plantios';
import { RootStackParamList } from '../App';
import { COLORS, RADIUS } from '../constants/theme';
import BotaoVoltar from '../Components/BotaoVoltar';
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BotaoVoltar style={styles.botaoVoltar} />
        <View style={{ flex: 1, flexShrink: 1 }}>
          <Text style={styles.titulo} numberOfLines={1}>Plantios</Text>
          {propriedadeNome && <Text style={styles.subtitulo} numberOfLines={1}>{propriedadeNome}</Text>}
        </View>
      </View>

      {carregando ? (
        <ActivityIndicator size="large" color={COLORS.verde} style={{ marginTop: 40 }} />
      ) : plantios.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.vazio}>Nenhum plantio cadastrado ainda.</Text>
        </View>
      ) : (
        <FlatList
          data={plantios}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
          refreshing={atualizando}
          onRefresh={handleAtualizar}
          renderItem={({ item }) => {
            const estimativa = estimativaColheita(item.dataPlantio, item.diasParaColheita);
            return (
              <View style={styles.item}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTipo}>{item.tipoNome}</Text>
                  <Text style={styles.itemDetalhe}>
                    {item.talhaoNome ?? 'Propriedade toda'} · Plantado em {item.dataPlantio.toDate().toLocaleDateString('pt-BR')}
                  </Text>
                  <Text style={[styles.itemEstimativa, estimativa.pronto ? styles.itemEstimativaPronta : null]}>
                    {textoEstimativa(estimativa)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.acaoExcluir}
                  onPress={() => handleExcluir(item.id!)}
                  accessibilityLabel="Excluir plantio"
                >
                  <Feather name="trash-2" size={18} color="#c0392b" />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, 12) + 8 }]}
        onPress={() => navigation.navigate('PlantioForm', { propriedadeId })}
      >
        <Feather name="plus" size={18} color="#fff" />
        <Text style={styles.fabTexto}>Novo plantio</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  botaoVoltar: {
    marginRight: 4,
    marginLeft: -6,
    padding: 6,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '500',
  },
  subtitulo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  vazio: {
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bege,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemTipo: {
    fontSize: 15,
    fontWeight: '500',
  },
  itemDetalhe: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemEstimativa: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.verde,
    marginTop: 6,
  },
  itemEstimativaPronta: {
    color: '#c0392b',
  },
  acaoExcluir: {
    padding: 10,
  },
  fab: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: COLORS.verde,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fabTexto: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
