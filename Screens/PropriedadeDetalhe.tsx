import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect, RouteProp, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { buscarPropriedade, excluirPropriedade, Propriedade } from '../Services/propriedades';
import { listarTalhoes, excluirTalhao, Talhao } from '../Services/talhoes';
import { RootStackParamList } from '../App';

type DetalheRouteProp = RouteProp<RootStackParamList, 'PropriedadeDetalhe'>;
type DetalheNavigationProp = NavigationProp<RootStackParamList, 'PropriedadeDetalhe'>;

export default function PropriedadeDetalhe() {
  const navigation = useNavigation<DetalheNavigationProp>();
  const route = useRoute<DetalheRouteProp>();
  const { propriedadeId } = route.params;

  const [propriedade, setPropriedade] = useState<Propriedade | null>(null);
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
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
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados.');
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
    Alert.alert('Excluir propriedade', 'Tem certeza? Todos os talhões vinculados também serão excluídos.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirPropriedade(propriedadeId);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível excluir.');
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
            Alert.alert('Erro', 'Não foi possível excluir o talhão.');
          }
        },
      },
    ]);
  }

  if (carregando) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B6D11" />
      </SafeAreaView>
    );
  }

  if (!propriedade) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Propriedade não encontrada.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.nome}>{propriedade.nome}</Text>
          <Text style={styles.info}>
            {propriedade.localizacao} · {propriedade.areaTotal} ha
          </Text>
        </View>

        <View style={styles.headerAcoes}>
          <TouchableOpacity
            style={styles.acaoBotao}
            onPress={() => navigation.navigate('PropriedadeForm', { propriedadeId })}
          >
            <Feather name="edit-2" size={18} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acaoBotao}
            onPress={handleExcluirPropriedade}
          >
            <Feather name="trash-2" size={18} color="#c0392b" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.talhoesHeader}>
        <Text style={styles.talhoesTitulo}>Talhões</Text>
      </View>

      {talhoes.length === 0 ? (
        <View>
          <Text style={styles.vazio}>Nenhum talhão cadastrado ainda.</Text>

          <TouchableOpacity
            style={styles.botaoNovoTalhao}
            onPress={() => navigation.navigate('TalhaoForm', { propriedadeId })}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.botaoNovoTexto}>Novo talhão</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={talhoes}
          keyExtractor={(item) => item.id!}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listaTalhoes}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.botaoNovoTalhao}
              onPress={() => navigation.navigate('TalhaoForm', { propriedadeId })}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.botaoNovoTexto}>Novo talhão</Text>
            </TouchableOpacity>
          }
          renderItem={({ item }) => (
            <View style={styles.talhaoItem}>
              <View>
                <Text style={styles.talhaoNome}>{item.nome}</Text>
                <Text style={styles.talhaoInfo}>{item.area} ha</Text>
              </View>

              <View style={styles.talhaoAcoes}>
                <TouchableOpacity
                  style={styles.acaoBotao}
                  onPress={() =>
                    navigation.navigate('TalhaoForm', {
                      propriedadeId,
                      talhaoId: item.id,
                    })
                  }
                >
                  <Feather name="edit-2" size={16} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.acaoBotao}
                  onPress={() => handleExcluirTalhao(item.id!)}
                >
                  <Feather name="trash-2" size={16} color="#c0392b" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <View style={styles.despesasHeader}>
        <Text style={styles.talhoesTitulo}>Despesas</Text>

        <TouchableOpacity
          style={styles.botaoNovo}
          onPress={() => navigation.navigate('DespesaForm', { propriedadeId })}
        >
          <Feather name="plus" size={14} color="#fff" />
          <Text style={styles.botaoNovoTexto}>Nova despesa</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 16,
    marginBottom: 24,
  },

  nome: {
    fontSize: 20,
    fontWeight: '500',
  },

  info: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },

  headerAcoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },

  acaoBotao: {
    padding: 5,
  },

  talhoesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  talhoesTitulo: {
    fontSize: 15,
    fontWeight: '500',
  },

  botaoNovoTalhao: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B6D11',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 2,
    marginBottom: 15,
    gap: 6,
  },

  botaoNovo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B6D11',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 5,
  },

  botaoNovoTexto: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },

  vazio: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
    fontSize: 14,
  },

  listaTalhoes: {
    paddingBottom: 10,
  },

  talhaoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1EFE8',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },

  talhaoNome: {
    fontSize: 14,
    fontWeight: '500',
  },

  talhaoInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  talhaoAcoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  despesasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
    paddingBottom: 20,
  },
});