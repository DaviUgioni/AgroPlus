import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { Timestamp } from 'firebase/firestore';
import { criarPlantio } from '../Services/plantios';
import { listarTalhoes, Talhao } from '../Services/talhoes';
import { TIPOS_PLANTIO, buscarTipoPlantio } from '../constants/plantios';
import { RootStackParamList } from '../App';
import { COLORS, RADIUS } from '../constants/theme';
import BotaoVoltar from '../Components/BotaoVoltar';
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <BotaoVoltar />
            <Text style={styles.titulo}>Novo Plantio</Text>
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

          <Text style={styles.label}>Tipo de plantio</Text>
          <View style={styles.input}>
            <Picker selectedValue={tipoSel} onValueChange={(v) => setTipoSel(v as string)} style={styles.picker}>
              {TIPOS_PLANTIO.map((t) => (
                <Picker.Item key={t.chave} label={`${t.nome} (~${t.diasParaColheita} dias até a colheita)`} value={t.chave} />
              ))}
            </Picker>
          </View>

          <TouchableOpacity style={styles.botao} onPress={handleSalvar} disabled={salvando}>
            {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>Salvar</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '500',
  },
  label: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borda,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  picker: {
    marginHorizontal: -4,
    marginVertical: -2,
  },
  botao: {
    backgroundColor: COLORS.verde,
    borderRadius: RADIUS.sm,
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
