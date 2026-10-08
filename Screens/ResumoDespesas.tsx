import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useFocusEffect, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { auth } from '../FirebaseConfig';
import { listarPropriedades } from '../Services/propriedades';
import { listarDespesasPorPropriedade, totalDespesasMes, totalDespesasAno, CategoriaDespesa } from '../Services/despesas';
import { RootStackParamList } from '../App';
import { COLORS, RADIUS } from '../constants/theme';
import BotaoVoltar from '../Components/BotaoVoltar';
import { mensagemErro } from '../Services/erros';

type ResumoDespesasRouteProp = RouteProp<RootStackParamList, 'ResumoDespesas'>;
type NavProp = NavigationProp<RootStackParamList>;

const LABELS_CATEGORIA: Record<CategoriaDespesa, string> = {
  insumo: 'Insumo',
  mao_de_obra: 'Mão de obra',
  maquinario: 'Maquinário',
  outros: 'Outros',
};

interface LinhaPropriedade {
  propriedadeId: string;
  nome: string;
  valor: number;
}

export default function ResumoDespesas() {
  const route = useRoute<ResumoDespesasRouteProp>();
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const [periodo, setPeriodo] = useState<'mes' | 'ano'>(route.params?.periodo ?? 'mes');

  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [total, setTotal] = useState(0);
  const [porPropriedade, setPorPropriedade] = useState<LinhaPropriedade[]>([]);
  const [porCategoria, setPorCategoria] = useState<{ categoria: CategoriaDespesa; valor: number }[]>([]);

  async function carregar(opts?: { silent?: boolean }) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      if (!opts?.silent) setCarregando(true);
      const propriedades = await listarPropriedades(userId);
      const agora = new Date();
      const anoAtual = agora.getFullYear();
      const mesAtual = agora.getMonth();

      const linhas: LinhaPropriedade[] = [];
      const categorias: Record<CategoriaDespesa, number> = { insumo: 0, mao_de_obra: 0, maquinario: 0, outros: 0 };
      let somaTotal = 0;

      for (const prop of propriedades) {
        const despesas = (await listarDespesasPorPropriedade(prop.id!)).filter(
          (d) => (d.data?.toMillis?.() ?? 0) <= agora.getTime()
        );
        const valor = periodo === 'mes'
          ? totalDespesasMes(despesas, anoAtual, mesAtual)
          : totalDespesasAno(despesas, anoAtual);
        if (valor > 0) linhas.push({ propriedadeId: prop.id!, nome: prop.nome, valor });
        somaTotal += valor;

        const filtradas = despesas.filter((d) => {
          const dt = d.data?.toDate?.();
          if (!dt) return false;
          return periodo === 'mes'
            ? dt.getFullYear() === anoAtual && dt.getMonth() === mesAtual
            : dt.getFullYear() === anoAtual;
        });
        for (const d of filtradas) {
          categorias[d.categoria] = (categorias[d.categoria] || 0) + d.valor;
        }
      }

      linhas.sort((a, b) => b.valor - a.valor);
      setPorPropriedade(linhas);
      setTotal(somaTotal);
      setPorCategoria(
        (Object.keys(categorias) as CategoriaDespesa[])
          .map((c) => ({ categoria: c, valor: categorias[c] }))
          .filter((c) => c.valor > 0)
          .sort((a, b) => b.valor - a.valor)
      );
    } catch (error) {
      Alert.alert('Erro', mensagemErro(error, 'Não foi possível carregar os gastos.'));
    } finally {
      if (!opts?.silent) setCarregando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [periodo])
  );

  async function handleAtualizar() {
    setAtualizando(true);
    await carregar({ silent: true });
    setAtualizando(false);
  }

  const formatarMoeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BotaoVoltar />
        <Text style={styles.titulo}>Gastos por propriedade</Text>
      </View>

      <View style={styles.chips}>
        <TouchableOpacity
          style={[styles.chip, periodo === 'mes' && styles.chipAtivo]}
          onPress={() => setPeriodo('mes')}
        >
          <Text style={[styles.chipTexto, periodo === 'mes' && styles.chipTextoAtivo]}>Este mês</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, periodo === 'ano' && styles.chipAtivo]}
          onPress={() => setPeriodo('ano')}
        >
          <Text style={[styles.chipTexto, periodo === 'ano' && styles.chipTextoAtivo]}>Este ano</Text>
        </TouchableOpacity>
      </View>

      {carregando ? (
        <ActivityIndicator size="large" color={COLORS.verde} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={porPropriedade}
          keyExtractor={(item) => item.propriedadeId}
          contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}
          refreshing={atualizando}
          onRefresh={handleAtualizar}
          ListHeaderComponent={
            <>
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Total {periodo === 'mes' ? 'do mês' : 'do ano'}</Text>
                <Text style={styles.totalValor}>{formatarMoeda(total)}</Text>
              </View>

              {porCategoria.length > 0 && (
                <View style={styles.categoriaBox}>
                  <Text style={styles.secaoTitulo}>Por categoria</Text>
                  {porCategoria.map((c) => (
                    <View key={c.categoria} style={styles.categoriaLinha}>
                      <Text style={styles.categoriaNome}>{LABELS_CATEGORIA[c.categoria]}</Text>
                      <Text style={styles.categoriaValor}>{formatarMoeda(c.valor)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {porPropriedade.length > 0 && <Text style={styles.secaoTitulo}>Por propriedade</Text>}
            </>
          }
          ListEmptyComponent={<Text style={styles.vazio}>Nenhuma despesa nesse período.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => navigation.navigate('DespesasLista', { propriedadeId: item.propriedadeId })}
            >
              <Text style={styles.itemNome}>{item.nome}</Text>
              <View style={styles.itemDireita}>
                <Text style={styles.itemValor}>{formatarMoeda(item.valor)}</Text>
                <Feather name="chevron-right" size={18} color="#999" />
              </View>
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
    marginBottom: 12,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '500',
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.borda,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipAtivo: {
    backgroundColor: COLORS.verde,
    borderColor: COLORS.verde,
  },
  chipTexto: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  chipTextoAtivo: {
    color: '#fff',
  },
  totalCard: {
    backgroundColor: COLORS.verde,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 13,
    color: '#EAF3DE',
  },
  totalValor: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginTop: 2,
  },
  categoriaBox: {
    backgroundColor: COLORS.bege,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 16,
  },
  secaoTitulo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  categoriaLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  categoriaNome: {
    fontSize: 13,
    color: COLORS.texto,
  },
  categoriaValor: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.verde,
  },
  vazio: {
    textAlign: 'center',
    color: '#888',
    marginTop: 24,
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
  itemDireita: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemValor: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.verde,
  },
});
