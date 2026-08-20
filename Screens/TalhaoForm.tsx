import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { criarTalhao, atualizarTalhao, listarTalhoes } from '../Services/talhoes';
import { buscarPropriedade } from '../Services/propriedades';
import { RootStackParamList } from '../App';

type TalhaoFormRouteProp = RouteProp<RootStackParamList, 'TalhaoForm'>;
type TalhaoFormNavigationProp = NavigationProp<RootStackParamList, 'TalhaoForm'>;

export default function TalhaoForm() {
  const navigation = useNavigation<TalhaoFormNavigationProp>();
  const route = useRoute<TalhaoFormRouteProp>();
  const { propriedadeId, talhaoId } = route.params;
  const modoEdicao = !!talhaoId;

  const [nome, setNome] = useState('');
  const [area, setArea] = useState('');
  const [areaTalhaoEdicao, setAreaTalhaoEdicao] = useState(0);
  const [carregando, setCarregando] = useState(modoEdicao);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (modoEdicao) {
      carregarDados();
    }
  }, []);

  async function carregarDados() {
    try {

      const talhoes = await listarTalhoes(propriedadeId);
      const talhao = talhoes.find((t) => t.id === talhaoId);
      if (talhao) {
        setNome(talhao.nome);
        setArea(String(talhao.area));
        setAreaTalhaoEdicao(talhao.area);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o talhão.');
    } finally {
      setCarregando(false);
    }
  }

  async function handleSalvar() {
    if (!nome.trim() || !area.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }

    const areaNumero = Number(area.replace(',', '.'));
    if (isNaN(areaNumero) || areaNumero <= 0) {
      Alert.alert('Atenção', 'Área inválida.');
      return;
    }

    try {
      setSalvando(true);

      const [propriedade, talhoes] = await Promise.all([
        buscarPropriedade(propriedadeId),
        listarTalhoes(propriedadeId),
      ]);

      if (!propriedade) {
        Alert.alert('Erro', 'Propriedade não encontrada.');
        return;
      }

      const somaTalhoes = talhoes.reduce((acc, t) => acc + t.area, 0);
      const somaComNovoTalhao = somaTalhoes - areaTalhaoEdicao + areaNumero;

      if (somaComNovoTalhao > propriedade.areaTotal) {
        const disponivel = propriedade.areaTotal - somaTalhoes + areaTalhaoEdicao;
        Alert.alert(
          'Área excede o total',
          `A soma das áreas (${somaComNovoTalhao} ha) ultrapassa o total da propriedade (${propriedade.areaTotal} ha).\n\nDisponível: ${disponivel.toFixed(2)} ha.`
        );
        return;
      }

      if (modoEdicao) {
        await atualizarTalhao(talhaoId!, { nome, area: areaNumero });
      } else {
        await criarTalhao({ nome, area: areaNumero, propriedadeId });
      }
      Alert.alert('Sucesso', modoEdicao ? 'Talhão atualizado!' : 'Talhão cadastrado!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B6D11" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titulo}>{modoEdicao ? 'Editar talhão' : 'Novo talhão'}</Text>

      <Text style={styles.label}>Nome do talhão</Text>
      <TextInput
        style={styles.input}
        value={nome}
        onChangeText={setNome}
        placeholder="Talhão A"
      />

      <Text style={styles.label}>Área (ha)</Text>
      <TextInput
        style={styles.input}
        value={area}
        onChangeText={setArea}
        placeholder="5.0"
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.botao} onPress={handleSalvar} disabled={salvando}>
        {salvando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.botaoTexto}>Salvar</Text>
        )}
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