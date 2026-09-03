import { Picker } from '@react-native-picker/picker';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { Timestamp } from 'firebase/firestore';
import { criarDespesa, atualizarDespesa, buscarDespesa, CategoriaDespesa } from '../Services/despesas';
import { RootStackParamList } from '../App';

type DespesaFormRouteProp = RouteProp<RootStackParamList, 'DespesaForm'>;
type DespesaFormNavProp = NavigationProp<RootStackParamList, 'DespesaForm'>;

export default function DespesaForm() {
  const route = useRoute<DespesaFormRouteProp>();
  const navigation = useNavigation<DespesaFormNavProp>();
  const { propriedadeId, talhaoId, despesaId } = route.params;
  const modoEdicao = !!despesaId;

  const [categoria, setCategoria] = useState<CategoriaDespesa>('insumo');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [carregando, setCarregando] = useState(modoEdicao);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (modoEdicao) carregarDespesa();
  }, []);

  async function carregarDespesa() {
    try {
      const d = await buscarDespesa(despesaId!);
      if (d) {
        setCategoria(d.categoria);
        setDescricao(d.descricao);
        setValor(String(d.valor).replace('.', ','));
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
      Alert.alert('Atenção', 'Valor inválido.');
      return;
    }
    if (!propriedadeId) {
      Alert.alert('Erro', 'Propriedade não informada.');
      return;
    }

    try {
      setSalvando(true);
      if (modoEdicao) {
        await atualizarDespesa(despesaId!, {
          categoria,
          descricao: descricao.trim(),
          valor: valorNum,
        });
        Alert.alert('Sucesso', 'Despesa atualizada!');
      } else {
        await criarDespesa({
          propriedadeId,
          talhaoId: talhaoId ?? null,
          categoria,
          descricao: descricao.trim(),
          valor: valorNum,
          data: Timestamp.now(),
        });
        Alert.alert('Sucesso', 'Despesa cadastrada!');
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

      <TouchableOpacity style={styles.botao} onPress={handleSalvar} disabled={salvando}>
        {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>Salvar</Text>}
      </TouchableOpacity>
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
    padding: 10,
    fontSize: 15,
  },
  picker: {
    marginHorizontal: -10,
    marginVertical: -6,
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
