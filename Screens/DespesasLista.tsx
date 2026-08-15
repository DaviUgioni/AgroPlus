import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import {
  listarDespesasPorPropriedade,
  totalDespesas,
  Despesa,
  CategoriaDespesa,
} from '../Services/despesas';
import { RootStackParamList } from '../App';

type DespesasListaRouteProp = RouteProp<RootStackParamList, 'DespesasLista'>;

const LABELS_CATEGORIA: Record<CategoriaDespesa, string> = {
  insumo: 'Insumo',
  mao_de_obra: 'Mão de obra',
  maquinario: 'Maquinário',
  outros: 'Outros',
};

export default function DespesasLista() {
  const route = useRoute<DespesasListaRouteProp>();
  const { propriedadeId } = route.params;

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

  const total = totalDespesas(despesas);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemCategoria}>{LABELS_CATEGORIA[item.categoria]}</Text>
                <Text style={styles.itemDescricao}>{item.descricao}</Text>
              </View>
              <Text style={styles.itemValor}>
                {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </Text>
            </View>
          )}
        />
      )}
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
    fontSize: 15,
    fontWeight: '500',
    color: '#3B6D11',
  },
});
