import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useFocusEffect, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import {
  listarDespesasPorPropriedade,
  excluirDespesa,
  totalDespesas,
  Despesa,
  CategoriaDespesa,
} from '../Services/despesas';
import { RootStackParamList } from '../App';

type DespesasListaRouteProp = RouteProp<RootStackParamList, 'DespesasLista'>;
type NavProp = NavigationProp<RootStackParamList>;

const LABELS_CATEGORIA: Record<CategoriaDespesa, string> = {
  insumo: 'Insumo',
  mao_de_obra: 'Mão de obra',
  maquinario: 'Maquinário',
  outros: 'Outros',
};

export default function DespesasLista() {
  const route = useRoute<DespesasListaRouteProp>();
  const navigation = useNavigation<NavProp>();
  const { propriedadeId } = route.params;
  const insets = useSafeAreaInsets();

  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregarDespesas() {
    try {
      setCarregando(true);
      const dados = await listarDespesasPorPropriedade(propriedadeId);
      setDespesas(dados);
    } catch (error) {
      console.log('ERRO DESPESAS:', error);
      Alert.alert('Erro', 'Não foi possível carregar as despesas.');
    } finally {
      setCarregando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregarDespesas();
    }, [propriedadeId])
  );

  function handleExcluir(id: string) {
    Alert.alert('Excluir despesa', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirDespesa(id);
            carregarDespesas();
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir.');
          }
        },
      },
    ]);
  }

  const total = totalDespesas(despesas);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Text style={styles.titulo}>Despesas</Text>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total gasto</Text>
        <Text style={styles.totalValor}>
          {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </Text>
      </View>

      {carregando ? (
        <ActivityIndicator size="large" color="#3B6D11" style={{ marginTop: 40 }} />
      ) : despesas.length === 0 ? (
        <Text style={styles.vazio}>Nenhuma despesa cadastrada ainda.</Text>
      ) : (
        <FlatList
          data={despesas}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemCategoria}>{LABELS_CATEGORIA[item.categoria]}</Text>
                <Text style={styles.itemDescricao}>{item.descricao}</Text>
                <Text style={styles.itemValor}>
                  {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Text>
              </View>
              <View style={styles.acoes}>
                <TouchableOpacity
                  style={styles.acaoBotao}
                  onPress={() => navigation.navigate('DespesaForm', { propriedadeId, despesaId: item.id })}
                >
                  <Feather name="edit-2" size={16} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.acaoBotao} onPress={() => handleExcluir(item.id!)}>
                  <Feather name="trash-2" size={16} color="#c0392b" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, 12) + 8 }]}
        onPress={() => navigation.navigate('DespesaForm', { propriedadeId })}
      >
        <Feather name="plus" size={18} color="#fff" />
        <Text style={styles.fabTexto}>Nova despesa</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 16,
  },
  totalCard: {
    backgroundColor: '#3B6D11',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 13,
    color: '#EAF3DE',
  },
  totalValor: {
    fontSize: 22,
    fontWeight: '500',
    color: '#fff',
    marginTop: 2,
  },
  vazio: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
    fontSize: 14,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1EFE8',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemCategoria: {
    fontSize: 12,
    color: '#666',
  },
  itemDescricao: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 2,
  },
  itemValor: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B6D11',
    marginTop: 4,
  },
  acoes: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 12,
  },
  acaoBotao: {
    padding: 6,
  },
  fab: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: '#3B6D11',
    borderRadius: 12,
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
