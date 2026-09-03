import { useState, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { auth } from '../FirebaseConfig';
import { listarPropriedades, Propriedade } from '../Services/propriedades';
import { RootStackParamList } from '../App';
import { COLORS, RADIUS } from '../constants/theme';

type DespesasNavigationProp = NavigationProp<RootStackParamList, 'Despesas'>;

export default function Despesas() {
  const navigation = useNavigation<DespesasNavigationProp>();
  const [propriedades, setPropriedades] = useState<Propriedade[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregarPropriedades() {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    try {
      setCarregando(true);
      const dados = await listarPropriedades(userId);
      setPropriedades(dados);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as propriedades.');
    } finally {
      setCarregando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregarPropriedades();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Despesas</Text>
      </View>

      <Text style={styles.subtitulo}>Escolha uma propriedade para ver as despesas</Text>

      {carregando ? (
        <ActivityIndicator size="large" color={COLORS.verde} style={{ marginTop: 40 }} />
      ) : propriedades.length === 0 ? (
        <Text style={styles.vazio}>Nenhuma propriedade cadastrada ainda.</Text>
      ) : (
        <FlatList
          data={propriedades}
          keyExtractor={(item) => item.id!}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                navigation.navigate('DespesasLista', { propriedadeId: item.id! })
              }
            >
              <View>
                <Text style={styles.itemNome}>{item.nome}</Text>
                <Text style={styles.itemInfo}>
                  {item.localizacao} · {item.areaTotal} ha
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '500',
  },
  subtitulo: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
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
    backgroundColor: COLORS.bege,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 10,
  },
  itemNome: {
    fontSize: 15,
    fontWeight: '500',
  },
  itemInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
