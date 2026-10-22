import React, { useState, useEffect } from 'react';
import { Alert, Image, Switch, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { Timestamp } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { XStack, YStack } from 'tamagui';
import { criarDespesa, atualizarDespesa, buscarDespesa, CategoriaDespesa } from '../Services/despesas';
import { listarTalhoes, Talhao } from '../Services/talhoes';
import { enviarNotaFiscal } from '../Services/imagens';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import { Botao, Cabecalho, Campo, Cartao, Chip, Corpo, Legenda, Rotulo, Seletor, Tela, TelaCarregando, toast, confirmar } from '../Components/ui';
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
  const [erros, setErros] = useState<{ valor?: string; descricao?: string }>({});
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
        toast.erro('Despesa não encontrada.');
        navigation.goBack();
      }
    } catch (e) {
      toast.erro(mensagemErro(e, 'Não foi possível carregar a despesa.'));
    } finally {
      setCarregando(false);
    }
  }

  async function handleEscolherNota() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.erro('Permissão de galeria necessária.');
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
      confirmar({ titulo: 'Remover nota fiscal', texto: 'Tem certeza que deseja remover a nota fiscal anexada a esta despesa?', confirmar: 'Remover' }).then(async (ok) => {
      if (!ok) return;
            setNotaLocal(null);
            setNotaUrlExistente(null);
    });
    } else {
      setNotaLocal(null);
      setNotaUrlExistente(null);
    }
  }

  const handleSalvar = async () => {
    const valorNum = parseFloat(valor.replace(',', '.'));
    const novosErros: typeof erros = {};
    if (!valor.trim()) novosErros.valor = 'Informe quanto custou, por exemplo 150,50.';
    else if (isNaN(valorNum) || !isFinite(valorNum) || valorNum <= 0) novosErros.valor = 'Digite só números, por exemplo 150,50.';
    if (!descricao.trim()) novosErros.descricao = 'Escreva com o que foi gasto, por exemplo "Adubo".';
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) {
      toast.erro('Confira os campos em vermelho.');
      return;
    }
    if (!propriedadeId) {
      toast.erro('Propriedade não informada.');
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
        toast.sucesso('Despesa atualizada!');
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
        toast.sucesso(recorrente ? `Despesas criadas para ${totalMeses} meses!` : 'Despesa cadastrada!');
      }
      navigation.goBack();
    } catch (error: any) {
      console.log('Erro ao salvar despesa:', error);
      const fallback = progresso && progresso.atual > 1
        ? `Não foi possível salvar. ${progresso.atual - 1} de ${progresso.total} parcelas já foram criadas — confira a lista antes de tentar novamente.`
        : 'Não foi possível salvar.';
      toast.erro(mensagemErro(error, fallback));
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
            rotulo="Quanto custou?"
            prefixo="R$"
            value={valor}
            onChangeText={(v) => {
              setValor(v);
              setErros((e) => ({ ...e, valor: undefined }));
            }}
            placeholder="150,50"
            keyboardType="numeric"
            erro={erros.valor ?? erroValor}
            ajuda="Use vírgula para os centavos."
          />

          <Campo
            rotulo="Com o que foi gasto?"
            value={descricao}
            onChangeText={(v) => {
              setDescricao(v);
              setErros((e) => ({ ...e, descricao: undefined }));
            }}
            erro={erros.descricao}
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
              <Corpo fontSize={14} fontWeight="600" color="verde">
                Anexar foto
              </Corpo>
            </XStack>
          )}

          {!modoEdicao && (
            <Cartao marginTop={20} padding={14}>
              <XStack justifyContent="space-between" alignItems="center" gap={12}>
                <YStack flex={1}>
                  <Corpo fontWeight="600">Repetir todo mês</Corpo>
                  <Legenda marginTop={2}>
                    Para gastos fixos, como salário ou aluguel. Lança o mesmo valor nos próximos meses.
                  </Legenda>
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
                    <Legenda marginTop={10}>
                      Serão lançadas {meses} despesas de{' '}
                      {valorDigitado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, uma por mês, a
                      partir de hoje.
                    </Legenda>
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
