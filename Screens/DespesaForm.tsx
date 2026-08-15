import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Timestamp } from 'firebase/firestore';
import { criarDespesa, CategoriaDespesa } from '../Services/despesas';

export default function DespesaForm({ route, navigation }: any) {
  const { propriedadeId, talhaoId } = route.params;

  const [categoria, setCategoria] = useState<CategoriaDespesa>('insumo');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');

  const handleSalvar = async () => {
    await criarDespesa({
      propriedadeId,
      talhaoId: talhaoId ?? null,
      categoria,
      descricao,
      valor: parseFloat(valor.replace(',', '.')),
      data: Timestamp.now(),
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Nova Despesa</Text>

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
      />

      <Text style={styles.label}>Valor</Text>
      <TextInput
        style={styles.input}
        value={valor}
        onChangeText={setValor}
        placeholder="Valor da despesa"
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.botao} onPress={handleSalvar}>
        <Text style={styles.botaoTexto}>Salvar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
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
