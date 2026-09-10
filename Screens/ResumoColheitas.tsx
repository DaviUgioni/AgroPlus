import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { auth } from '../FirebaseConfig';
import { listarPropriedades } from '../Services/propriedades';
import { listarPlantiosPorPropriedade, estimativaColheita, textoEstimativa, Plantio } from '../Services/plantios';
import { RootStackParamList } from '../App';
import { COLORS, RADIUS } from '../constants/theme';
import BotaoVoltar from '../Components/BotaoVoltar';

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
  const [linhas, setLinhas] = useState<Linha[]>([]);

  async function carregar() {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      setCarregando(true);
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
    } finally {
      setCarregando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BotaoVoltar />
        <Text style={styles.titulo}>Colheitas</Text>
      </View>

      {carregando ? (
        <ActivityIndicator size="large" color={COLORS.verde} style={{ marginTop: 40 }} />
      ) : linhas.length === 0 ? (
        <Text style={styles.vazio}>Nenhum plantio cadastrado ainda.</Text>
      ) : (
        <FlatList
          data={linhas}
          keyExtractor={(item) => item.plantio.id!}
          contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                navigation.navigate('PlantiosLista', {
                  propriedadeId: item.propriedadeId,
                  propriedadeNome: item.propriedadeNome,
                })
              }
            >
              <View style={styles.itemEsquerda}>
                <Feather name="feather" size={16} color={COLORS.verde} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTipo}>{item.plantio.tipoNome}</Text>
                <Text style={styles.itemDetalhe}>
                  {item.propriedadeNome} · {item.plantio.talhaoNome ?? 'Propriedade toda'}
                </Text>
                <Text style={[styles.itemEstimativa, item.pronto && styles.itemEstimativaPronta]}>{item.texto}</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#999" />
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
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  titulo: {
    fontSize: 20,
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
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.bege,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 10,
  },
  itemEsquerda: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 4,
  },
  itemEstimativaPronta: {
    color: '#c0392b',
  },
});
