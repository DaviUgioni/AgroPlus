import React, { useState, useEffect } from 'react';
import { Alert, Image, Switch, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { Timestamp } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { Text, XStack, YStack } from 'tamagui';
import { criarDespesa, atualizarDespesa, buscarDespesa, CategoriaDespesa } from '../Services/despesas';
import { listarTalhoes, Talhao } from '../Services/talhoes';
import { enviarNotaFiscal } from '../Services/imagens';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import { Botao, Cabecalho, Campo, Cartao, Chip, Rotulo, Seletor, Tela, TelaCarregando } from '../Components/ui';
import { mensagemErro } from '../Services/erros';

const CATEGORIAS: { valor: CategoriaDespesa; label: string }[] = [
  { valor: 'insumo', label: 'Insumo' },
  { valor: 'mao_de_obra', label: 'Mão de obra' },
  { valor: 'maquinario', label: 'Maquinário' },
  { valor: 'outros', label: 'Outros' },
];

const OPCOES_MESES = [2, 3, 6, 12];

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
  const [progresso, setProgresso] = useState<{ atual: number; total: number } | null>(null);

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
      Alert.alert('Erro', mensagemErro(e, 'Não foi possível carregar a despesa.'));
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

  function handleRemoverNota() {
    if (notaUrlExistente) {
      Alert.alert('Remover nota fiscal', 'Tem certeza que deseja remover a nota fiscal anexada a esta despesa?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            setNotaLocal(null);
            setNotaUrlExistente(null);
          },
        },
      ]);
    } else {
      setNotaLocal(null);
      setNotaUrlExistente(null);
    }
  }

  const handleSalvar = async () => {
    if (!valor.trim()) {
      Alert.alert('Falta o valor', 'Informe quanto custou, por exemplo 150,50.');
      return;
    }
    const valorNum = parseFloat(valor.replace(',', '.'));
    if (isNaN(valorNum) || !isFinite(valorNum) || valorNum <= 0) {
      Alert.alert('Valor inválido', 'Digite só números, por exemplo 150,50.');
      return;
    }
    if (!descricao.trim()) {
      Alert.alert('Falta a descrição', 'Escreva com o que foi gasto, por exemplo "Adubo".');
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
          if (totalMeses > 1) setProgresso({ atual: i + 1, total: totalMeses });
          const d = new Date(base);
          d.setMonth(base.getMonth() + i);
          const ts = Timestamp.fromDate(d);
          const novaDespesa: any = {
            propriedadeId,
            talhaoId: talhaoFinal,
            categoria,
            descricao: totalMeses > 1 ? `${descricao.trim()} (${i + 1}/${totalMeses})` : descricao.trim(),
            valor: valorNum,
            data: ts,
            notaFiscalUri: null,
            recorrente: recorrente && i === 0,
          };
          if (recorrente) {
            novaDespesa.recorrenciaMeses = totalMeses;
          }
          const id = await criarDespesa(novaDespesa);
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
      const fallback = progresso && progresso.atual > 1
        ? `Não foi possível salvar. ${progresso.atual - 1} de ${progresso.total} parcelas já foram criadas — confira a lista antes de tentar novamente.`
        : 'Não foi possível salvar.';
      Alert.alert('Erro', mensagemErro(error, fallback));
    } finally {
      setSalvando(false);
      setProgresso(null);
    }
  };

  if (carregando) {
    return <TelaCarregando />;
  }

  const notaAtual = notaLocal || notaUrlExistente;
  const valorDigitado = parseFloat(valor.replace(',', '.'));
  const erroValor =
    valor.trim() && (isNaN(valorDigitado) || valorDigitado <= 0) ? 'Digite só números, ex.: 150,50' : undefined;

  return (
    <Tela>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <Cabecalho
            titulo={modoEdicao ? 'Editar despesa' : 'Nova despesa'}
            subtitulo={modoEdicao ? undefined : 'Será registrada com a data de hoje'}
          />

          <Campo
            rotulo="Quanto custou? (R$)"
            icone="dollar-sign"
            value={valor}
            onChangeText={setValor}
            placeholder="Ex.: 150,50"
            keyboardType="numeric"
            erro={erroValor}
            ajuda="Use vírgula para os centavos."
          />

          <Campo
            rotulo="Com o que foi gasto?"
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Ex.: Adubo NPK, diária do trator"
            maxLength={120}
          />

          <Rotulo>Categoria</Rotulo>
          <XStack flexWrap="wrap" gap={8}>
            {CATEGORIAS.map((c) => (
              <Chip key={c.valor} texto={c.label} ativo={categoria === c.valor} onPress={() => setCategoria(c.valor)} />
            ))}
          </XStack>

          <Seletor
            rotulo="Onde foi usado?"
            valor={talhaoSel ?? 'geral'}
            aoMudar={(v) => setTalhaoSel(v === 'geral' ? undefined : v)}
            ajuda="Escolha um talhão ou deixe a propriedade toda."
            opcoes={[
              { label: 'Propriedade toda', valor: 'geral' },
              ...talhoes.map((t) => ({ label: `Talhão: ${t.nome}`, valor: t.id! })),
            ]}
          />

          <Rotulo>Foto da nota fiscal (opcional)</Rotulo>
          {notaAtual ? (
            <YStack gap={8}>
              <Image source={{ uri: notaAtual }} style={{ width: '100%', height: 180, borderRadius: 12 }} />
              <XStack gap={8}>
                <Botao flex={1} variante="contorno" tamanho="sm" icone="camera" titulo="Trocar foto" onPress={handleEscolherNota} />
                <Botao flex={1} variante="perigo" tamanho="sm" icone="trash-2" titulo="Remover" onPress={handleRemoverNota} />
              </XStack>
            </YStack>
          ) : (
            <XStack
              height={56}
              borderRadius="lg"
              borderWidth={1.5}
              borderStyle="dashed"
              borderColor="bordaForte"
              backgroundColor="branco press:verdeSuave"
              alignItems="center"
              justifyContent="center"
              gap={8}
              onPress={handleEscolherNota}
              accessibilityRole="button"
            >
              <Feather name="camera" size={18} color={cores.verde} />
              <Text fontSize={14} fontWeight="600" color="verde">
                Anexar foto
              </Text>
            </XStack>
          )}

          {!modoEdicao && (
            <Cartao marginTop={20} padding={14}>
              <XStack justifyContent="space-between" alignItems="center" gap={12}>
                <YStack flex={1}>
                  <Text fontSize={15} fontWeight="600" color="texto">
                    Repetir todo mês
                  </Text>
                  <Text fontSize={13} color="textoSec" marginTop={2}>
                    Para gastos fixos, como salário ou aluguel. Lança o mesmo valor nos próximos meses.
                  </Text>
                </YStack>
                <Switch
                  value={recorrente}
                  onValueChange={setRecorrente}
                  trackColor={{ true: cores.verde, false: cores.bordaForte }}
                  thumbColor={cores.sobreVerde}
                />
              </XStack>
              {recorrente && (
                <>
                  <Rotulo>Por quantos meses?</Rotulo>
                  <XStack flexWrap="wrap" gap={8}>
                    {OPCOES_MESES.map((m) => (
                      <Chip key={m} texto={`${m} meses`} ativo={meses === m} onPress={() => setMeses(m)} />
                    ))}
                  </XStack>
                  {valorDigitado > 0 && (
                    <Text fontSize={13} color="textoSec" marginTop={10}>
                      Serão lançadas {meses} despesas de{' '}
                      {valorDigitado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, uma por mês, a
                      partir de hoje.
                    </Text>
                  )}
                </>
              )}
            </Cartao>
          )}

          <Botao
            titulo={progresso && progresso.total > 1 ? `Salvando ${progresso.atual}/${progresso.total}...` : modoEdicao ? 'Salvar alterações' : 'Salvar despesa'}
            carregando={salvando}
            marginTop={28}
            onPress={handleSalvar}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Tela>
  );
}
