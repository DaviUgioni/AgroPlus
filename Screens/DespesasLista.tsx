import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useFocusEffect, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  listarDespesasPorPropriedade,
  listarDespesasPorTalhao,
  excluirDespesa,
  totalDespesas,
  totalDespesasMes,
  totalDespesasAno,
  Despesa,
  CategoriaDespesa,
} from '../Services/despesas';
import { buscarPropriedade } from '../Services/propriedades';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../FirebaseConfig';
import { RootStackParamList } from '../App';

type DespesasListaRouteProp = RouteProp<RootStackParamList, 'DespesasLista'>;
type NavProp = NavigationProp<RootStackParamList>;

const LABELS_CATEGORIA: Record<CategoriaDespesa, string> = {
  insumo: 'Insumo',
  mao_de_obra: 'Mão de obra',
  maquinario: 'Maquinário',
  outros: 'Outros',
};

const MESES = ['Todos', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function DespesasLista() {
  const route = useRoute<DespesasListaRouteProp>();
  const navigation = useNavigation<NavProp>();
  const { propriedadeId, talhaoId, talhaoNome } = (route.params ?? {}) as any;
  const insets = useSafeAreaInsets();
  const modoTalhao = !!talhaoId;

  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroCat, setFiltroCat] = useState<'todas' | CategoriaDespesa>('todas');
  const [filtroMes, setFiltroMes] = useState<number>(-1); // -1 todos, 0-11
  const [limite, setLimite] = useState<string>('');
  const [limiteSalvo, setLimiteSalvo] = useState<number | undefined>(undefined);

  async function carregarDespesas() {
    if (!propriedadeId) {
      Alert.alert('Erro', 'Propriedade não informada.');
      return;
    }
    try {
      setCarregando(true);
      const dados = modoTalhao ? await listarDespesasPorTalhao(talhaoId) : await listarDespesasPorPropriedade(propriedadeId);
      const prop = await buscarPropriedade(propriedadeId);
      setDespesas(dados);
      if (!modoTalhao && prop?.limiteMensal) {
        setLimiteSalvo(prop.limiteMensal);
        setLimite(String(prop.limiteMensal).replace('.', ','));
      } else {
        setLimiteSalvo(undefined);
        if (!modoTalhao) setLimite('');
      }
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
    }, [propriedadeId, talhaoId])
  );

  const agora = new Date();
  const anoAtual = agora.getFullYear();
  const mesAtual = agora.getMonth();

  const despesasFiltradas = useMemo(() => {
    return despesas.filter((d) => {
      if (filtroCat !== 'todas' && d.categoria !== filtroCat) return false;
      if (filtroMes !== -1) {
        const m = d.data?.toDate?.()?.getMonth?.();
        if (m === undefined || m !== filtroMes) return false;
      }
      return true;
    });
  }, [despesas, filtroCat, filtroMes]);

  // Só conta o que já venceu (data <= agora) — recorrências futuras não entram no total agora
  const despesasAteAgora = useMemo(() => despesas.filter((d) => (d.data?.toMillis?.() ?? 0) <= agora.getTime()), [despesas]);
  const despesasFiltradasAteAgora = useMemo(
    () => despesasFiltradas.filter((d) => (d.data?.toMillis?.() ?? 0) <= agora.getTime()),
    [despesasFiltradas]
  );

  const total = totalDespesas(despesasFiltradasAteAgora);
  const totalMes = totalDespesasMes(despesasAteAgora, anoAtual, filtroMes !== -1 ? filtroMes : mesAtual);
  const totalAno = totalDespesasAno(despesasAteAgora, anoAtual);

  const limiteNum = parseFloat(limite.replace(',', '.'));
  const estourou = limiteSalvo !== undefined && !isNaN(limiteNum) && totalMes > limiteNum;

  function handleExcluir(id: string) {
    Alert.alert('Excluir despesa', 'Tem certeza que deseja excluir?', [
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

  async function handleSalvarLimite() {
    if (!propriedadeId) return;
    const v = parseFloat(limite.replace(',', '.'));
    if (limite && (isNaN(v) || !isFinite(v) || v <= 0)) {
      Alert.alert('Atenção', 'Limite inválido.');
      return;
    }
    try {
      const ref = doc(db, 'propriedades', propriedadeId);
      if (limite) {
        await updateDoc(ref, { limiteMensal: v } as any);
        setLimiteSalvo(v);
        Alert.alert('Sucesso', `Limite de ${v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} salvo.`);
      } else {
        await updateDoc(ref, { limiteMensal: deleteField() } as any);
        setLimiteSalvo(undefined);
        Alert.alert('Sucesso', 'Limite removido.');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o limite.');
    }
  }

  async function handleExportar() {
    if (despesasFiltradas.length === 0) {
      Alert.alert('Aviso', 'Nada para exportar.');
      return;
    }
    try {
      const header = 'Data,Categoria,Descricao,Valor\n';
      const linhas = despesasFiltradas
        .map((d) => {
          const data = d.data.toDate().toLocaleDateString('pt-BR');
          const cat = LABELS_CATEGORIA[d.categoria];
          const desc = `"${d.descricao.replace(/"/g, '""')}"`;
          const val = d.valor.toFixed(2).replace('.', ',');
          return `${data},${cat},${desc},${val}`;
        })
        .join('\n');
      const csv = header + linhas;
      const file = new File(Paths.cache, `despesas-${propriedadeId}.csv`);
      if (!file.exists) {
        try {
          (file as any).create({ idempotent: true });
        } catch {}
      }
      // SDK57 File.write é síncrono
      (file as any).write(csv);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Compartilhar despesas' });
      } else {
        Alert.alert('Exportado', `Arquivo salvo em: ${file.uri}`);
      }
    } catch (e: any) {
      console.log('Erro export', e);
      Alert.alert('Erro', 'Não foi possível exportar.');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={{ flex: 1, flexShrink: 1, marginRight: 12 }}>
          <Text style={styles.titulo} numberOfLines={1}>
            {modoTalhao ? `Despesas — ${talhaoNome ?? 'Talhão'}` : 'Despesas'}
          </Text>
          {modoTalhao && <Text style={styles.subtitulo} numberOfLines={1}>{talhaoNome}</Text>}
        </View>
        <TouchableOpacity onPress={handleExportar} style={styles.exportBtn}>
          <Feather name="share-2" size={16} color="#3B6D11" />
          <Text style={styles.exportTexto}>Exportar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total filtrado</Text>
        <Text style={styles.totalValor}>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
        <View style={styles.totalRow}>
          <View style={styles.totalMini}>
            <Text style={styles.totalMiniLabel}>Mês {filtroMes !== -1 ? MESES[filtroMes + 1] : MESES[mesAtual + 1]}</Text>
            <Text style={styles.totalMiniValor}>{totalMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
          </View>
          <View style={styles.totalMini}>
            <Text style={styles.totalMiniLabel}>Ano {anoAtual}</Text>
            <Text style={styles.totalMiniValor}>{totalAno.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
          </View>
        </View>
      </View>

      <View style={styles.filtros}>
        <View style={styles.filtroBox}>
          <Text style={styles.filtroLabel}>Categoria</Text>
          <View style={styles.pickerBox}>
            <Picker selectedValue={filtroCat} onValueChange={(v) => setFiltroCat(v as any)} style={styles.picker}>
              <Picker.Item label="Todas" value="todas" />
              <Picker.Item label="Insumo" value="insumo" />
              <Picker.Item label="Mão de obra" value="mao_de_obra" />
              <Picker.Item label="Maquinário" value="maquinario" />
              <Picker.Item label="Outros" value="outros" />
            </Picker>
          </View>
        </View>
        <View style={styles.filtroBox}>
          <Text style={styles.filtroLabel}>Mês</Text>
          <View style={styles.pickerBox}>
            <Picker selectedValue={filtroMes} onValueChange={(v) => setFiltroMes(Number(v))} style={styles.picker}>
              {MESES.map((m, i) => (
                <Picker.Item key={m} label={m} value={i - 1} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {!modoTalhao && (
        <View style={styles.limiteBox}>
          <Text style={styles.limiteLabel}>Limite mensal (R$) — só por propriedade</Text>
          <View style={styles.limiteRow}>
            <TextInput
              style={[styles.limiteInput, estourou ? styles.limiteInputAlerta : null]}
              value={limite}
              onChangeText={setLimite}
              placeholder="Ex: 2000"
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.limiteBtn} onPress={handleSalvarLimite}>
              <Text style={styles.limiteBtnTexto}>Salvar</Text>
            </TouchableOpacity>
          </View>
          {estourou && <Text style={styles.alerta}>⚠️ Você passou do limite mensal!</Text>}
        </View>
      )}

      {carregando ? (
        <ActivityIndicator size="large" color="#3B6D11" style={{ marginTop: 40 }} />
      ) : despesasFiltradas.length === 0 ? (
        <Text style={styles.vazio}>Nenhuma despesa com esse filtro.</Text>
      ) : (
        <FlatList
          data={despesasFiltradas}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
          renderItem={({ item }) => {
            const isFutura = (item.data?.toMillis?.() ?? 0) > agora.getTime();
            return (
              <View style={[styles.item, isFutura ? styles.itemFuturo : null]}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemCategoria}>
                    {LABELS_CATEGORIA[item.categoria]} • {item.data?.toDate?.()?.toLocaleDateString('pt-BR') ?? '--'}
                    {item.recorrente ? ' • Recorrente' : ''} {isFutura ? ' • Agendada' : ''}
                  </Text>
                  <Text style={styles.itemDescricao}>{item.descricao}</Text>
                  {item.notaFiscalUri ? <Text style={styles.itemNota}>📎 Nota anexada</Text> : null}
                  {isFutura && <Text style={styles.itemFuturoTexto}>Será contabilizada quando o mês chegar</Text>}
                  <Text style={[styles.itemValor, isFutura ? styles.itemValorFuturo : null]}>
                    {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </Text>
                </View>
              <View style={styles.acoes}>
                <TouchableOpacity
                  style={styles.acaoBotao}
                  onPress={() => navigation.navigate('DespesaForm', { propriedadeId, despesaId: item.id })}
                  accessibilityLabel="Editar despesa"
                >
                  <Feather name="edit-2" size={18} color="#666" />
                  <Text style={styles.acaoTexto}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.acaoBotao, styles.acaoExcluir]}
                  onPress={() => handleExcluir(item.id!)}
                  accessibilityLabel="Excluir despesa"
                >
                  <Feather name="trash-2" size={18} color="#c0392b" />
                  <Text style={[styles.acaoTexto, { color: '#c0392b' }]}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
            );
          }}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, 12) + 8 }]}
        onPress={() => navigation.navigate('DespesaForm', { propriedadeId, talhaoId })}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '500',
  },
  subtitulo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#3B6D11',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  exportTexto: {
    color: '#3B6D11',
    fontSize: 13,
    fontWeight: '600',
  },
  totalCard: {
    backgroundColor: '#3B6D11',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  totalRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  totalMini: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    padding: 8,
  },
  totalMiniLabel: {
    fontSize: 11,
    color: '#EAF3DE',
  },
  totalMiniValor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 2,
  },
  filtros: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filtroBox: {
    flex: 1,
  },
  filtroLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  pickerBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    paddingHorizontal: 4,
  },
  picker: {
    marginHorizontal: -4,
    marginVertical: -2,
  },
  limiteBox: {
    marginBottom: 12,
    backgroundColor: '#F1EFE8',
    borderRadius: 10,
    padding: 10,
  },
  limiteLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  limiteRow: {
    flexDirection: 'row',
    gap: 8,
  },
  limiteInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    textAlignVertical: 'center',
  },
  limiteInputAlerta: {
    borderColor: '#E74C3C',
  },
  limiteBtn: {
    backgroundColor: '#3B6D11',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  limiteBtnTexto: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  alerta: {
    color: '#E74C3C',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  vazio: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
    fontSize: 14,
  },
  item: {
    backgroundColor: '#F1EFE8',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  itemFuturo: {
    opacity: 0.7,
    borderWidth: 1,
    borderColor: '#d1c9a8',
    borderStyle: 'dashed',
  },
  itemInfo: {
    flex: 1,
  },
  itemCategoria: {
    fontSize: 11,
    color: '#666',
  },
  itemDescricao: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 2,
  },
  itemNota: {
    fontSize: 11,
    color: '#3B6D11',
    marginTop: 2,
  },
  itemValor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B6D11',
    marginTop: 6,
  },
  itemValorFuturo: {
    color: '#888',
    fontWeight: '500',
  },
  itemFuturoTexto: {
    fontSize: 11,
    color: '#8a7d4b',
    marginTop: 2,
    fontStyle: 'italic',
  },
  acoes: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0ddd4',
    paddingTop: 10,
  },
  acaoBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acaoExcluir: {
    borderColor: '#e9b4b4',
    backgroundColor: '#fff5f5',
  },
  acaoTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
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
