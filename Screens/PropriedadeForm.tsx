// Screens/PropriedadeForm.tsx
import { useState, useEffect } from 'react';
import {View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../FirebaseConfig';
import { criarPropriedade, buscarPropriedade, atualizarPropriedade, type Propriedade } from '../Services/propriedades';
import { enviarImagemPropriedade } from '../Services/imagens';
import { RootStackParamList } from '../App';

type PropriedadeFormRouteProp = RouteProp<RootStackParamList, 'PropriedadeForm'>;
type PropriedadeFormNavigationProp = NavigationProp<RootStackParamList, 'PropriedadeForm'>;

export default function PropriedadeForm() {
  const navigation = useNavigation<PropriedadeFormNavigationProp>();
  const route = useRoute<PropriedadeFormRouteProp>();
  const propriedadeId = route.params?.propriedadeId;
  const modoEdicao = !!propriedadeId;

  const [nome, setNome] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [areaTotal, setAreaTotal] = useState('');
  const [carregando, setCarregando] = useState(modoEdicao);
  const [salvando, setSalvando] = useState(false);
  const [imagemUrl, setImagemUrl] = useState<string | undefined>();
  const [imagemLocal, setImagemLocal] = useState<string | undefined>();

  useEffect(() => {
    if (modoEdicao) {
      carregarDados();
    }
  }, []);

  async function carregarDados() {
    try {
      const propriedade = await buscarPropriedade(propriedadeId!);
      if (propriedade) {
        setNome(propriedade.nome);
        setLocalizacao(propriedade.localizacao);
        setLatitude(propriedade.latitude);
        setLongitude(propriedade.longitude);
        setAreaTotal(String(propriedade.areaTotal));
        setImagemUrl(propriedade.imagemUrl);
      }
    } catch (error) {
      console.log('Erro ao carregar propriedade:', error);
      Alert.alert('Erro', 'Não foi possível carregar a propriedade.');
    } finally {
      setCarregando(false);
    }
  }

  const handleEscolherImagem = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Atenção', 'Permissão de acesso à galeria necessária.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!resultado.canceled) {
      setImagemLocal(resultado.assets[0].uri);
    }
  };

  const handleAbrirMapa = () => {
    navigation.navigate('MapaSelecao', {
      latitude,
      longitude,
      onSelect: (coords: { latitude: number; longitude: number; endereco?: string }) => {
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        setLocalizacao(coords.endereco || `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
      },
    });
  };

  const handleLimparLocalizacao = () => {
    setLocalizacao('');
    setLatitude(undefined);
    setLongitude(undefined);
  };

  async function handleSalvar() {
    if (!nome.trim() || !localizacao.trim() || !areaTotal.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }

    const area = Number(areaTotal.replace(',', '.'));
    if (isNaN(area) || area <= 0) {
      Alert.alert('Atenção', 'Área total inválida.');
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    try {
      setSalvando(true);
      const dados: Partial<Omit<Propriedade, 'id'>> = {
        nome,
        localizacao,
        areaTotal: area,
        userId,
      };
      if (latitude !== undefined) dados.latitude = latitude;
      if (longitude !== undefined) dados.longitude = longitude;

      let id = propriedadeId;
      if (modoEdicao) {
        await atualizarPropriedade(id!, dados);
      } else {
        id = await criarPropriedade(dados as Omit<Propriedade, 'id'>);
      }

      if (imagemLocal) {
        const url = await enviarImagemPropriedade(imagemLocal, id!);
        await atualizarPropriedade(id!, { imagemUrl: url });
      }

      Alert.alert('Sucesso', modoEdicao ? 'Propriedade atualizada!' : 'Propriedade cadastrada!');
      navigation.goBack();
    } catch (error) {
      console.log('Erro ao salvar propriedade:', error);
      const mensagem =
        error instanceof Error ? error.message : 'Não foi possível salvar. Tente novamente.';
      Alert.alert('Erro', mensagem);
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
      <Text style={styles.titulo}>{modoEdicao ? 'Editar propriedade' : 'Nova propriedade'}</Text>

      <Text style={styles.label}>Imagem</Text>
      <View style={styles.imagemContainer}>
        {(imagemLocal || imagemUrl) && (
          <Image
            source={{ uri: imagemLocal || imagemUrl }}
            style={styles.imagemPreview}
          />
        )}
        <View style={styles.imagemBotoes}>
          <TouchableOpacity style={styles.imagemBotao} onPress={handleEscolherImagem}>
            <Ionicons name="image-outline" size={20} color="#3B6D11" />
            <Text style={styles.imagemBotaoTexto}>
              {imagemLocal || imagemUrl ? 'Trocar imagem' : 'Escolher imagem da galeria'}
            </Text>
          </TouchableOpacity>
          {(imagemLocal || imagemUrl) && (
            <TouchableOpacity
              style={styles.imagemBotao}
              onPress={() => {
                setImagemLocal(undefined);
                setImagemUrl(undefined);
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#c0392b" />
              <Text style={[styles.imagemBotaoTexto, { color: '#c0392b' }]}>Remover</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.label}>Nome da propriedade</Text>
      <TextInput
        style={styles.input}
        value={nome}
        onChangeText={setNome}
        placeholder="Sítio Boa Vista"
      />

      <Text style={styles.label}>Localização</Text>
      <View style={styles.localizacaoContainer}>
        <TextInput
          style={[styles.input, styles.inputComBotao]}
          value={localizacao}
          onChangeText={setLocalizacao}
          placeholder="Criciúma, SC"
        />
        <TouchableOpacity style={styles.botaoMapa} onPress={handleAbrirMapa}>
          <Ionicons name="map-outline" size={24} color="#3B6D11" />
        </TouchableOpacity>
      </View>
      {localizacao && (
        <TouchableOpacity style={styles.botaoLimpar} onPress={handleLimparLocalizacao}>
          <Text style={styles.botaoLimparTexto}>Remover localização</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.label}>Área total (ha)</Text>
      <TextInput
        style={styles.input}
        value={areaTotal}
        onChangeText={setAreaTotal}
        placeholder="12.5"
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
  inputComBotao: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    paddingRight: 0,
  },
  localizacaoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botaoMapa: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderLeftWidth: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagemContainer: {
    gap: 8,
  },
  imagemPreview: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  imagemBotoes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  imagemBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flex: 1,
  },
  imagemBotaoTexto: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3B6D11',
  },
  botaoLimpar: {
    marginTop: 8,
    padding: 8,
    alignSelf: 'flex-start',
  },
  botaoLimparTexto: {
    color: '#E74C3C',
    fontSize: 13,
    fontWeight: '500',
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