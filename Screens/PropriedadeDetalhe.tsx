import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Image} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect, RouteProp, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { buscarPropriedade, excluirPropriedade, Propriedade } from '../Services/propriedades';
import { listarTalhoes, excluirTalhao, Talhao } from '../Services/talhoes';
import { listarDespesasPorTalhao, totalDespesas } from '../Services/despesas';
import { RootStackParamList } from '../App';
import { COLORS, RADIUS } from '../constants/theme';
import BotaoVoltar from '../Components/BotaoVoltar';

type DetalheRouteProp = RouteProp<RootStackParamList, 'PropriedadeDetalhe'>;
type DetalheNavigationProp = NavigationProp<RootStackParamList, 'PropriedadeDetalhe'>;

export default function PropriedadeDetalhe() {
  const navigation = useNavigation<DetalheNavigationProp>();
  const route = useRoute<DetalheRouteProp>();
  const { propriedadeId } = route.params;
  const insets = useSafeAreaInsets();

  const [propriedade, setPropriedade] = useState<Propriedade | null>(null);
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
  const [totaisPorTalhao, setTotaisPorTalhao] = useState<Record<string, number>>({});
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
      // totais por talhão para controle fino
      if (listaTalhoes.length > 0) {
        const totais = await Promise.all(
          listaTalhoes.map(async (t) => {
            try {
              const desps = await listarDespesasPorTalhao(t.id!);
              return [t.id!, totalDespesas(desps)] as const;
            } catch {
              return [t.id!, 0] as const;
            }
          })
        );
        const map: Record<string, number> = {};
        totais.forEach(([id, v]) => (map[id] = v));
        setTotaisPorTalhao(map);
      } else {
        setTotaisPorTalhao({});
      }
    } catch (error) {
      console.log('Erro ao carregar detalhe:', error);
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
        <ActivityIndicator size="large" color={COLORS.verde} />
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
    <SafeAreaView style={[styles.container, { paddingTop: 8, paddingBottom: Math.max(insets.bottom, 12) }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BotaoVoltar style={styles.botaoVoltar} />
        <View style={{ flex: 1, flexShrink: 1, marginRight: 12 }}>
          <Text style={styles.nome} numberOfLines={2}>{propriedade.nome}</Text>
          <Text style={styles.info} numberOfLines={2}>
            {propriedade.localizacao} · {propriedade.areaTotal} ha
          </Text>
        </View>

        <View style={styles.headerAcoes}>
          <TouchableOpacity
            style={styles.acaoBotao}
            onPress={() => navigation.navigate('PropriedadeForm', { propriedadeId })}
            hitSlop={8}
          >
            <Feather name="edit-2" size={18} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acaoBotao}
            onPress={handleExcluirPropriedade}
            hitSlop={8}
          >
            <Feather name="trash-2" size={18} color="#c0392b" />
          </TouchableOpacity>
        </View>
      </View>

      {propriedade.imagemUrl && (
        <Image source={{ uri: propriedade.imagemUrl }} style={styles.imagem} />
      )}

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
              <View style={{ flex: 1 }}>
                <Text style={styles.talhaoNome}>{item.nome}</Text>
                <Text style={styles.talhaoInfo}>
                  {item.area} ha • {(totaisPorTalhao[item.id!] ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Text>
              </View>

              <View style={styles.talhaoAcoes}>
                <TouchableOpacity
                  style={styles.acaoBotaoIcon}
                  onPress={() => navigation.navigate('DespesasLista', { propriedadeId, talhaoId: item.id, talhaoNome: item.nome })}
                  accessibilityLabel="Ver gastos do talhão"
                >
                  <Feather name="list" size={16} color={COLORS.verde} />
                  <Text style={styles.acaoIconLabel}>Gastos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acaoBotaoIcon}
                  onPress={() => navigation.navigate('DespesaForm', { propriedadeId, talhaoId: item.id })}
                  accessibilityLabel="Nova despesa no talhão"
                >
                  <Feather name="plus-circle" size={16} color={COLORS.verde} />
                  <Text style={styles.acaoIconLabel}>Novo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acaoBotaoIcon}
                  onPress={() =>
                    navigation.navigate('TalhaoForm', {
                      propriedadeId,
                      talhaoId: item.id,
                    })
                  }
                  accessibilityLabel="Editar talhão"
                >
                  <Feather name="edit-2" size={14} color="#666" />
                  <Text style={styles.acaoIconLabel}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.acaoBotaoIcon}
                  onPress={() => handleExcluirTalhao(item.id!)}
                  accessibilityLabel="Excluir talhão"
                >
                  <Feather name="trash-2" size={14} color="#c0392b" />
                  <Text style={[styles.acaoIconLabel, { color: '#c0392b' }]}>Excluir</Text>
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

  imagem: {
    width: '100%',
    height: 180,
    borderRadius: RADIUS.md,
    marginBottom: 16,
    backgroundColor: '#eee',
  },

  headerAcoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },

  acaoBotao: {
    padding: 6,
  },
  botaoVoltar: {
    marginRight: 4,
    marginLeft: -6,
    padding: 6,
  },
  acaoBotaoIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    padding: 6,
    minWidth: 44,
  },
  acaoIconLabel: {
    fontSize: 9,
    color: COLORS.verde,
    fontWeight: '600',
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
    backgroundColor: COLORS.verde,
    borderRadius: RADIUS.md,
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
    backgroundColor: COLORS.verde,
    borderRadius: RADIUS.md,
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
    backgroundColor: COLORS.bege,
    borderRadius: RADIUS.md,
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
    gap: 8,
    flexShrink: 0,
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