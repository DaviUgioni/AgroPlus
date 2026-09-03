import { Picker } from '@react-native-picker/picker';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { Timestamp } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { criarDespesa, atualizarDespesa, buscarDespesa, CategoriaDespesa } from '../Services/despesas';
import { listarTalhoes, Talhao } from '../Services/talhoes';
import { enviarNotaFiscal } from '../Services/imagens';
import { RootStackParamList } from '../App';

type DespesaFormRouteProp = RouteProp<RootStackParamList, 'DespesaForm'>;
type DespesaFormNavProp = NavigationProp<RootStackParamList, 'DespesaForm'>;

export default function DespesaForm() {
  const route = useRoute<DespesaFormRouteProp>();
  const navigation = useNavigation<DespesaFormNavProp>();
  const { propriedadeId, talhaoId, despesaId } = route.params ?? {} as any;
  const modoEdicao = !!despesaId;

  const [categoria, setCategoria] = useState<CategoriaDespesa>('insumo');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [carregando, setCarregando] = useState(modoEdicao);
  const [salvando, setSalvando] = useState(false);
  const [notaLocal, setNotaLocal] = useState<string | null>(null);
  const [notaUrlExistente, setNotaUrlExistente] = useState<string | null>(null);
  const [recorrente, setRecorrente] = useState(false);
  const [meses, setMeses] = useState<number>(3);
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
  const [talhaoSel, setTalhaoSel] = useState<string | undefined>(talhaoId);

  useEffect(() => {
    if (modoEdicao) carregarDespesa();
    if (propriedadeId) listarTalhoes(propriedadeId).then(setTalhoes).catch(() => {});
  }, []);

  useEffect(() => {
    setTalhaoSel(talhaoId);
  }, [talhaoId]);

  async function carregarDespesa() {
    try {
      const d = await buscarDespesa(despesaId!);
      if (d) {
        setCategoria(d.categoria);
        setDescricao(d.descricao);
        setValor(String(d.valor).replace('.', ','));
        if (d.notaFiscalUri) setNotaUrlExistente(d.notaFiscalUri);
        setRecorrente(!!d.recorrente);
        if (d.recorrenciaMeses) setMeses(d.recorrenciaMeses);
        if (d.talhaoId) setTalhaoSel(d.talhaoId);
      } else {
        Alert.alert('Erro', 'Despesa não encontrada.');
        navigation.goBack();
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar a despesa.');
    } finally {
      setCarregando(false);
    }
  }

  async function handleEscolherNota() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Atenção', 'Permissão de galeria necessária.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!res.canceled) {
      const uri = res.assets?.[0]?.uri;
      if (uri) setNotaLocal(uri);
    }
  }

  const handleSalvar = async () => {
    if (!descricao.trim()) {
      Alert.alert('Atenção', 'Preencha a descrição.');
      return;
    }
    if (!valor.trim()) {
      Alert.alert('Atenção', 'Preencha o valor.');
      return;
    }
    const valorNum = parseFloat(valor.replace(',', '.'));
    if (isNaN(valorNum) || !isFinite(valorNum) || valorNum <= 0) {
      Alert.alert('Atenção', 'Valor inválido. Digite apenas números, ex: 150,50');
      return;
    }
    if (!propriedadeId) {
      Alert.alert('Erro', 'Propriedade não informada.');
      return;
    }

    try {
      setSalvando(true);
      const talhaoFinal = talhaoSel ?? null;
      if (modoEdicao) {
        const dados: any = {
          categoria,
          descricao: descricao.trim(),
          valor: valorNum,
          talhaoId: talhaoFinal,
        };
        if (notaLocal) {
          const url = await enviarNotaFiscal(notaLocal, despesaId!);
          dados.notaFiscalUri = url;
        }
        await atualizarDespesa(despesaId!, dados);
        Alert.alert('Sucesso', 'Despesa atualizada!');
      } else {
        const base = new Date();
        const totalMeses = recorrente ? meses : 1;
        for (let i = 0; i < totalMeses; i++) {
          const d = new Date(base);
          d.setMonth(base.getMonth() + i);
          const ts = Timestamp.fromDate(d);
          const id = await criarDespesa({
            propriedadeId,
            talhaoId: talhaoFinal,
            categoria,
            descricao: totalMeses > 1 ? `${descricao.trim()} (${i + 1}/${totalMeses})` : descricao.trim(),
            valor: valorNum,
            data: ts,
            notaFiscalUri: null,
            recorrente: recorrente && i === 0,
            recorrenciaMeses: recorrente ? totalMeses : undefined,
          } as any);
          if (i === 0 && notaLocal) {
            const url = await enviarNotaFiscal(notaLocal, id);
            await atualizarDespesa(id, { notaFiscalUri: url } as any);
          }
        }
        Alert.alert('Sucesso', recorrente ? `Despesas criadas para ${totalMeses} meses!` : 'Despesa cadastrada!');
      }
      navigation.goBack();
    } catch (error: any) {
      console.log('Erro ao salvar despesa:', error);
      Alert.alert('Erro', error?.message || 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B6D11" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.titulo}>{modoEdicao ? 'Editar Despesa' : 'Nova Despesa'}</Text>

        <Text style={styles.label}>Categoria</Text>
        <View style={styles.input}>
          <Picker selectedValue={categoria} onValueChange={setCategoria} style={styles.picker}>
            <Picker.Item label="Insumo" value="insumo" />
            <Picker.Item label="Mão de Obra" value="mao_de_obra" />
            <Picker.Item label="Maquinário" value="maquinario" />
            <Picker.Item label="Outros" value="outros" />
          </Picker>
        </View>

        <Text style={styles.label}>Talhão</Text>
        <View style={styles.input}>
          <Picker selectedValue={talhaoSel ?? 'geral'} onValueChange={(v) => setTalhaoSel(v === 'geral' ? undefined : (v as string))} style={styles.picker}>
            <Picker.Item label="Geral — propriedade toda" value="geral" />
            {talhoes.map((t) => (
              <Picker.Item key={t.id} label={t.nome} value={t.id} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={styles.input}
          value={descricao}
          onChangeText={setDescricao}
          placeholder="Descrição da despesa"
          maxLength={120}
        />

        <Text style={styles.label}>Valor (R$)</Text>
        <TextInput
          style={styles.input}
          value={valor}
          onChangeText={setValor}
          placeholder="0,00"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Nota fiscal (foto)</Text>
        <View style={styles.notaContainer}>
          {(notaLocal || notaUrlExistente) && (
            <Image source={{ uri: notaLocal || notaUrlExistente! }} style={styles.notaPreview} />
          )}
          <View style={styles.notaBotoes}>
            <TouchableOpacity style={styles.notaBtn} onPress={handleEscolherNota}>
              <Feather name="camera" size={16} color="#3B6D11" />
              <Text style={styles.notaBtnTexto}>{notaLocal || notaUrlExistente ? 'Trocar foto' : 'Anexar foto'}</Text>
            </TouchableOpacity>
            {(notaLocal || notaUrlExistente) && (
              <TouchableOpacity
                style={styles.notaBtn}
                onPress={() => {
                  setNotaLocal(null);
                  setNotaUrlExistente(null);
                }}
              >
                <Feather name="trash-2" size={16} color="#c0392b" />
                <Text style={[styles.notaBtnTexto, { color: '#c0392b' }]}>Remover</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {!modoEdicao && (
          <>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Repetir todo mês</Text>
              <Switch value={recorrente} onValueChange={setRecorrente} trackColor={{ true: '#3B6D11' }} />
            </View>
            {recorrente && (
              <>
                <Text style={styles.label}>Por quantos meses?</Text>
                <View style={styles.input}>
                  <Picker selectedValue={meses} onValueChange={(v) => setMeses(Number(v))} style={styles.picker}>
                    <Picker.Item label="2 meses" value={2} />
                    <Picker.Item label="3 meses" value={3} />
                    <Picker.Item label="6 meses" value={6} />
                    <Picker.Item label="12 meses" value={12} />
                  </Picker>
                </View>
              </>
            )}
          </>
        )}

        <TouchableOpacity style={styles.botao} onPress={handleSalvar} disabled={salvando}>
          {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>Salvar</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 20,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  picker: {
    marginHorizontal: -4,
    marginVertical: -2,
  },
  notaContainer: {
    gap: 8,
  },
  notaPreview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  notaBotoes: {
    flexDirection: 'row',
    gap: 8,
  },
  notaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 10,
  },
  notaBtnTexto: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3B6D11',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  botao: {
    backgroundColor: '#3B6D11',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 15,
  },
});
