import { useState, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { auth } from '../FirebaseConfig';
import { listarPropriedades, Propriedade } from '../Services/propriedades';
import { RootStackParamList } from '../App';

type PropriedadesNavigationProp = NavigationProp<RootStackParamList, 'Propriedades'>;

export default function Propriedades() {
  const navigation = useNavigation<PropriedadesNavigationProp>();
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Minhas propriedades</Text>
        <TouchableOpacity
          style={styles.botaoNovo}
          onPress={() => navigation.navigate('PropriedadeForm')}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.botaoNovoTexto}>Nova</Text>
        </TouchableOpacity>
      </View>

      {carregando ? (
        <ActivityIndicator size="large" color="#3B6D11" style={{ marginTop: 40 }} />
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
                navigation.navigate('PropriedadeDetalhe', { propriedadeId: item.id! })
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
    marginBottom: 16,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '500',
  },
  botaoNovo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B6D11',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
  },
  botaoNovoTexto: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
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