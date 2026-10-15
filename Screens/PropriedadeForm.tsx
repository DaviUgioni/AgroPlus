// Screens/PropriedadeForm.tsx
import { useState, useEffect, useCallback } from 'react';
import { Alert, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Text, XStack, YStack } from 'tamagui';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../FirebaseConfig';
import { criarPropriedade, buscarPropriedade, atualizarPropriedade, type Propriedade } from '../Services/propriedades';
import { enviarImagemPropriedade } from '../Services/imagens';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import { Botao, Cabecalho, Campo, Rotulo, Tela, TelaCarregando } from '../Components/ui';
import { mensagemErro } from '../Services/erros';

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
  }, [propriedadeId]);

  // Recebe retorno do MapaSelecao via params (Opção A serializável)
  useFocusEffect(
    useCallback(() => {
      const p = route.params as any;
      if (p?.latitude !== undefined && p?.longitude !== undefined) {
        setLatitude(p.latitude);
        setLongitude(p.longitude);
        if (p.endereco) setLocalizacao(p.endereco);
        else setLocalizacao(`${p.latitude.toFixed(6)}, ${p.longitude.toFixed(6)}`);
        // Limpa params para não reaplicar ao voltar novamente
        // @ts-ignore
        navigation.setParams({ latitude: undefined, longitude: undefined, endereco: undefined });
      }
    }, [route.params])
  );

  async function carregarDados() {
    try {
      const propriedade = await buscarPropriedade(propriedadeId!);
      if (propriedade) {
        setNome(propriedade.nome);
        // Se já há params de mapa (retorno), não sobrescreve localização
        const p = route.params as any;
        const temRetornoMapa = p?.latitude !== undefined && p?.longitude !== undefined;
        if (!temRetornoMapa) {
          setLocalizacao(propriedade.localizacao);
          setLatitude(propriedade.latitude);
          setLongitude(propriedade.longitude);
        }
        setAreaTotal(String(propriedade.areaTotal));
        setImagemUrl(propriedade.imagemUrl);
      }
    } catch (error) {
      console.log('Erro ao carregar propriedade:', error);
      Alert.alert('Erro', mensagemErro(error, 'Não foi possível carregar a propriedade.'));
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
      propriedadeId,
    });
  };

  const handleLimparLocalizacao = () => {
    setLocalizacao('');
    setLatitude(undefined);
    setLongitude(undefined);
  };

  const handleRemoverImagem = () => {
    if (imagemUrl) {
      Alert.alert('Remover imagem', 'Tem certeza que deseja remover a imagem desta propriedade?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            setImagemLocal(undefined);
            setImagemUrl(undefined);
          },
        },
      ]);
    } else {
      setImagemLocal(undefined);
      setImagemUrl(undefined);
    }
  };

  async function handleSalvar() {
    if (!nome.trim()) {
      Alert.alert('Falta o nome', 'Dê um nome à propriedade, por exemplo "Sítio Boa Vista".');
      return;
    }
    if (!localizacao.trim()) {
      Alert.alert('Falta a localização', 'Digite a cidade ou toque em "Marcar no mapa".');
      return;
    }
    if (!areaTotal.trim()) {
      Alert.alert('Falta o tamanho', 'Informe o tamanho da propriedade em hectares.');
      return;
    }

    const area = Number(areaTotal.replace(',', '.'));
    if (isNaN(area) || area <= 0) {
      Alert.alert('Tamanho inválido', 'Digite só números, por exemplo 12,5.');
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
      Alert.alert('Erro', mensagemErro(error, 'Não foi possível salvar. Tente novamente.'));
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <TelaCarregando />;
  }

  const imagemAtual = imagemLocal || imagemUrl;

  return (
    <Tela>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <Cabecalho titulo={modoEdicao ? 'Editar propriedade' : 'Nova propriedade'} />

          <Campo
            rotulo="Nome da propriedade"
            value={nome}
            onChangeText={setNome}
            placeholder="Ex.: Sítio Boa Vista"
            ajuda="Como você chama este lugar."
          />

          <Campo
            rotulo="Localização"
            icone="map-pin"
            value={localizacao}
            onChangeText={setLocalizacao}
            placeholder="Ex.: Criciúma, SC"
            multiline
            textAlignVertical="top"
            ajuda="Digite a cidade ou o endereço, ou marque o ponto exato no mapa."
          />
          <XStack gap={8} marginTop={8} alignItems="center">
            <Botao variante="secundario" tamanho="sm" icone="map" titulo="Marcar no mapa" onPress={handleAbrirMapa} />
            {localizacao ? (
              <Botao
                variante="texto"
                tamanho="sm"
                icone="x"
                titulo="Limpar"
                cor={cores.erro}
                onPress={handleLimparLocalizacao}
              />
            ) : null}
          </XStack>

          <Campo
            rotulo="Tamanho total em hectares (ha)"
            value={areaTotal}
            onChangeText={setAreaTotal}
            placeholder="Ex.: 12,5"
            keyboardType="numeric"
            ajuda="1 hectare = 10.000 m² (mais ou menos um campo de futebol)."
          />

          <Rotulo>Foto (opcional)</Rotulo>
          {imagemAtual ? (
            <YStack gap={8}>
              <Image source={{ uri: imagemAtual }} style={{ width: '100%', height: 170, borderRadius: 12 }} />
              <XStack gap={8}>
                <Botao flex={1} variante="contorno" tamanho="sm" icone="image" titulo="Trocar foto" onPress={handleEscolherImagem} />
                <Botao flex={1} variante="perigo" tamanho="sm" icone="trash-2" titulo="Remover" onPress={handleRemoverImagem} />
              </XStack>
            </YStack>
          ) : (
            <YStack
              height={100}
              borderRadius="xl"
              borderWidth={1.5}
              borderStyle="dashed"
              borderColor="bordaForte"
              backgroundColor="branco press:verdeSuave"
              alignItems="center"
              justifyContent="center"
              gap={6}
              onPress={handleEscolherImagem}
              accessibilityRole="button"
            >
              <Feather name="image" size={24} color={cores.verde} />
              <Text fontSize={15} fontWeight="600" color="verde">
                Escolher foto da galeria
              </Text>
              <Text fontSize={13} color="textoSec">
                Ajuda a reconhecer a propriedade na lista
              </Text>
            </YStack>
          )}

          <Botao
            titulo={modoEdicao ? 'Salvar alterações' : 'Cadastrar propriedade'}
            carregando={salvando}
            marginTop={28}
            onPress={handleSalvar}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Tela>
  );
}
