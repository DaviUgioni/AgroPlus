import { useState, useEffect } from 'react';
import { Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { criarTalhao, atualizarTalhao, listarTalhoes } from '../Services/talhoes';
import { buscarPropriedade } from '../Services/propriedades';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../FirebaseConfig';
import { RootStackParamList } from '../App';
import { Botao, Cabecalho, Campo, Dica, Tela, TelaCarregando } from '../Components/ui';
import { mensagemErro } from '../Services/erros';

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
  // Área da propriedade e soma dos talhões, para mostrar quanto ainda está livre
  const [areaInfo, setAreaInfo] = useState<{ total: number; usada: number } | null>(null);

  useEffect(() => {
    if (modoEdicao) {
      carregarDados();
    }
    Promise.all([buscarPropriedade(propriedadeId), listarTalhoes(propriedadeId)])
      .then(([prop, lista]) => {
        if (prop) setAreaInfo({ total: prop.areaTotal, usada: lista.reduce((s, t) => s + t.area, 0) });
      })
      .catch(() => {});
  }, [talhaoId]);

  async function carregarDados() {
    try {
      const snap = await getDoc(doc(db, 'talhoes', talhaoId!));
      if (snap.exists()) {
        const talhao = snap.data() as any;
        setNome(talhao.nome);
        setArea(String(talhao.area));
        setAreaTalhaoEdicao(talhao.area);
      } else {
        Alert.alert('Erro', 'Talhão não encontrado.');
      }
    } catch (error) {
      Alert.alert('Erro', mensagemErro(error, 'Não foi possível carregar o talhão.'));
    } finally {
      setCarregando(false);
    }
  }

  async function handleSalvar() {
    if (!nome.trim()) {
      Alert.alert('Falta o nome', 'Dê um nome ao talhão, por exemplo "Área do milho".');
      return;
    }
    if (!area.trim()) {
      Alert.alert('Falta a área', 'Informe o tamanho do talhão em hectares.');
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
      Alert.alert('Erro', mensagemErro(error, 'Não foi possível salvar. Tente novamente.'));
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <TelaCarregando />;
  }

  const formatarHa = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  const disponivel = areaInfo ? areaInfo.total - areaInfo.usada + areaTalhaoEdicao : null;
  const areaDigitada = Number(area.replace(',', '.'));
  const erroArea =
    area.trim() && (isNaN(areaDigitada) || areaDigitada <= 0)
      ? 'Digite um número maior que zero, ex.: 2,5'
      : disponivel !== null && areaDigitada > disponivel + 1e-9
        ? `Maior que a área disponível (${formatarHa(disponivel)} ha)`
        : undefined;

  return (
    <Tela>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <Cabecalho titulo={modoEdicao ? 'Editar talhão' : 'Novo talhão'} />

          <Dica icone="grid">
            Talhão é uma parte da propriedade, como uma lavoura ou um pasto. Assim você separa plantios e gastos por área.
          </Dica>

          <Campo
            rotulo="Nome do talhão"
            value={nome}
            onChangeText={setNome}
            placeholder="Ex.: Área do milho"
            ajuda="Use um nome fácil de reconhecer no dia a dia."
          />

          <Campo
            rotulo="Área em hectares (ha)"
            value={area}
            onChangeText={setArea}
            placeholder="Ex.: 2,5"
            keyboardType="numeric"
            erro={erroArea}
            ajuda={
              disponivel !== null && areaInfo
                ? `Disponível: ${formatarHa(disponivel)} ha de ${formatarHa(areaInfo.total)} ha da propriedade.`
                : undefined
            }
          />

          <Botao
            titulo={modoEdicao ? 'Salvar alterações' : 'Cadastrar talhão'}
            carregando={salvando}
            marginTop={28}
            onPress={handleSalvar}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Tela>
  );
}
