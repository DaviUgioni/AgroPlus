import { useState, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { auth } from '../FirebaseConfig';
import { listarPropriedades, Propriedade } from '../Services/propriedades';
import { listarPlantiosPorPropriedade, Plantio, estimativaColheita, textoEstimativa } from '../Services/plantios';
import { RootStackParamList } from '../App';
import { COLORS, RADIUS } from '../constants/theme';
import BotaoVoltar from '../Components/BotaoVoltar';

type PlantiosNavigationProp = NavigationProp<RootStackParamList, 'Plantios'>;

interface PropriedadeComPlantio extends Propriedade {
  plantioAtual?: Plantio;
}

export default function Plantios() {
  const navigation = useNavigation<PlantiosNavigationProp>();
  const [propriedades, setPropriedades] = useState<PropriedadeComPlantio[]>([]);
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
      const comPlantios = await Promise.all(
        dados.map(async (prop) => {
          const plantios = await listarPlantiosPorPropriedade(prop.id!);
          return { ...prop, plantioAtual: plantios[0] };
        })
      );
      setPropriedades(comPlantios);
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
        <BotaoVoltar />
        <Text style={styles.titulo}>Plantios</Text>
      </View>

      <Text style={styles.subtitulo}>Escolha uma propriedade para ver os plantios</Text>

      {carregando ? (
        <ActivityIndicator size="large" color={COLORS.verde} style={{ marginTop: 40 }} />
      ) : propriedades.length === 0 ? (
        <Text style={styles.vazio}>Nenhuma propriedade cadastrada ainda.</Text>
      ) : (
        <FlatList
          data={propriedades}
          keyExtractor={(item) => item.id!}
          renderItem={({ item }) => {
            const estimativa = item.plantioAtual
              ? estimativaColheita(item.plantioAtual.dataPlantio, item.plantioAtual.diasParaColheita)
              : null;
            return (
              <TouchableOpacity
                style={styles.item}
                onPress={() =>
                  navigation.navigate('PlantiosLista', { propriedadeId: item.id!, propriedadeNome: item.nome })
                }
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemNome}>{item.nome}</Text>
                  <Text style={styles.itemInfo}>
                    {item.localizacao} · {item.areaTotal} ha
                  </Text>
                  {item.plantioAtual && estimativa ? (
                    <View style={styles.plantioCard}>
                      <Feather name="feather" size={14} color={COLORS.verde} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.plantioNome}>{item.plantioAtual.tipoNome}</Text>
                        <Text style={styles.plantioEstimativa}>{textoEstimativa(estimativa)}</Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.semPlantio}>Nenhum plantio ativo</Text>
                  )}
                </View>
                <Feather name="chevron-right" size={20} color="#999" />
              </TouchableOpacity>
            );
          }}
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
  plantioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: RADIUS.sm,
    padding: 8,
    marginTop: 8,
  },
  plantioNome: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.texto,
  },
  plantioEstimativa: {
    fontSize: 11,
    color: COLORS.verde,
    marginTop: 1,
  },
  semPlantio: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
});
