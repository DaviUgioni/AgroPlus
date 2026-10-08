import { useState, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, FlatList, ActivityIndicator, Alert, Image} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { auth } from '../FirebaseConfig';
import { listarPropriedades, Propriedade } from '../Services/propriedades';
import { RootStackParamList } from '../App';
import { COLORS, RADIUS } from '../constants/theme';
import BotaoVoltar from '../Components/BotaoVoltar';
import { mensagemErro } from '../Services/erros';

type PropriedadesNavigationProp = NavigationProp<RootStackParamList, 'Propriedades'>;

export default function Propriedades() {
  const navigation = useNavigation<PropriedadesNavigationProp>();
  const insets = useSafeAreaInsets();
  const [propriedades, setPropriedades] = useState<Propriedade[]>([]);
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
      setPropriedades(dados);
    } catch (error) {
      console.log('Erro ao listar propriedades:', error);
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.headerRow}>
        <BotaoVoltar />
        <Text style={styles.titulo}>Minhas propriedades</Text>
      </View>

      {carregando ? (
        <ActivityIndicator size="large" color={COLORS.verde} style={{ marginTop: 40 }} />
      ) : propriedades.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.vazio}>Nenhuma propriedade cadastrada ainda.</Text>
        </View>
      ) : (
        <FlatList
          data={propriedades}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={styles.listContent}
          refreshing={atualizando}
          onRefresh={handleAtualizar}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                navigation.navigate('PropriedadeDetalhe', { propriedadeId: item.id! })
              }
            >
              {item.imagemUrl && (
                <Image source={{ uri: item.imagemUrl }} style={styles.itemImagem} />
              )}
              <View style={styles.itemTexto}>
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

      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, 12) + 8 }]}
        onPress={() => navigation.navigate('PropriedadeForm')}
      >
        <Feather name="plus" size={20} color="#fff" />
        <Text style={styles.fabText}>Nova propriedade</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 120,
    alignContent:'center'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vazio: {
    color: '#888',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 120,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bege,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  itemImagem: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: '#ddd',
  },
  itemTexto: {
    flex: 1,
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
  fab: {
    position: 'absolute',
    left: 24,
    right: 24,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.verde,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});