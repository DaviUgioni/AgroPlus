import { useState, useEffect } from 'react';
import { Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { Timestamp } from 'firebase/firestore';
import { criarPlantio } from '../Services/plantios';
import { listarTalhoes, Talhao } from '../Services/talhoes';
import { TIPOS_PLANTIO, buscarTipoPlantio } from '../constants/plantios';
import { RootStackParamList } from '../App';
import { Feather } from '@expo/vector-icons';
import { Text, XStack, YStack } from 'tamagui';
import { cores } from '../tamagui.config';
import { Botao, Cabecalho, Cartao, Seletor, Tela } from '../Components/ui';
import { mensagemErro } from '../Services/erros';

type PlantioFormRouteProp = RouteProp<RootStackParamList, 'PlantioForm'>;
type PlantioFormNavProp = NavigationProp<RootStackParamList, 'PlantioForm'>;

export default function PlantioForm() {
  const route = useRoute<PlantioFormRouteProp>();
  const navigation = useNavigation<PlantioFormNavProp>();
  const { propriedadeId } = route.params;

  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
  const [talhaoSel, setTalhaoSel] = useState<string | undefined>(undefined);
  const [tipoSel, setTipoSel] = useState<string>(TIPOS_PLANTIO[0].chave);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    listarTalhoes(propriedadeId).then(setTalhoes).catch(() => {});
  }, [propriedadeId]);

  async function handleSalvar() {
    const tipo = buscarTipoPlantio(tipoSel);
    if (!tipo) {
      Alert.alert('Atenção', 'Selecione um tipo de plantio.');
      return;
    }
    const talhao = talhoes.find((t) => t.id === talhaoSel);

    try {
      setSalvando(true);
      await criarPlantio({
        propriedadeId,
        talhaoId: talhaoSel ?? null,
        talhaoNome: talhao?.nome ?? null,
        tipoChave: tipo.chave,
        tipoNome: tipo.nome,
        diasParaColheita: tipo.diasParaColheita,
        dataPlantio: Timestamp.now(),
      });
      Alert.alert('Sucesso', 'Plantio cadastrado!');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Erro', mensagemErro(error, error?.message || 'Não foi possível salvar.'));
    } finally {
      setSalvando(false);
    }
  }

  // Prévia da colheita, calculada a partir de hoje
  const tipoAtual = buscarTipoPlantio(tipoSel);
  const dataColheita = new Date();
  if (tipoAtual) dataColheita.setDate(dataColheita.getDate() + tipoAtual.diasParaColheita);
  const formatarData = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Tela>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <Cabecalho titulo="Novo plantio" subtitulo="Registre o que foi plantado hoje" />

          <Seletor
            rotulo="O que foi plantado?"
            valor={tipoSel}
            aoMudar={setTipoSel}
            opcoes={TIPOS_PLANTIO.map((t) => ({
              label: `${t.nome} (~${t.diasParaColheita} dias até a colheita)`,
              valor: t.chave,
            }))}
          />

          <Seletor
            rotulo="Onde foi plantado?"
            valor={talhaoSel ?? 'geral'}
            aoMudar={(v) => setTalhaoSel(v === 'geral' ? undefined : v)}
            ajuda={talhoes.length === 0 ? 'Esta propriedade ainda não tem talhões. O plantio vale para a área toda.' : undefined}
            opcoes={[
              { label: 'Propriedade toda', valor: 'geral' },
              ...talhoes.map((t) => ({ label: `Talhão: ${t.nome}`, valor: t.id! })),
            ]}
          />

          {tipoAtual && (
            <Cartao tom="bege" marginTop={20} gap={12}>
              <XStack gap={12} alignItems="center">
                <YStack width={40} height={40} borderRadius="full" backgroundColor="branco" alignItems="center" justifyContent="center">
                  <Feather name="calendar" size={18} color={cores.verde} />
                </YStack>
                <YStack flex={1}>
                  <Text fontSize={13} color="textoSec">
                    Data do plantio
                  </Text>
                  <Text fontSize={15} fontWeight="600" color="texto">
                    Hoje, {formatarData(new Date())}
                  </Text>
                </YStack>
              </XStack>
              <XStack gap={12} alignItems="center">
                <YStack width={40} height={40} borderRadius="full" backgroundColor="verde" alignItems="center" justifyContent="center">
                  <Feather name="sun" size={18} color={cores.sobreVerde} />
                </YStack>
                <YStack flex={1}>
                  <Text fontSize={13} color="textoSec">
                    Colheita prevista
                  </Text>
                  <Text fontSize={15} fontWeight="700" color="verde">
                    {formatarData(dataColheita)}
                  </Text>
                </YStack>
              </XStack>
              <Text fontSize={13} color="textoSec">
                Estimativa média para {tipoAtual.nome.toLowerCase()}. Pode variar com clima e manejo.
              </Text>
            </Cartao>
          )}

          <Botao titulo="Cadastrar plantio" carregando={salvando} marginTop={28} onPress={handleSalvar} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Tela>
  );
}
