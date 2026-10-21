// Screens/Configuracoes.tsx
import { ComponentProps, ReactNode, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text, XStack, YStack } from 'tamagui';
import { signOut } from 'firebase/auth';
import * as LocalAuthentication from 'expo-local-authentication';
import { auth } from '../FirebaseConfig';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import appConfig from '../app.json';
import { Botao, Cabecalho, Campo, Cartao, Dica, Tela, TituloSecao, toast, confirmar } from '../Components/ui';
import { alterarNome, enviarLinkTrocaSenha, excluirConta, nomeDoUsuario } from '../Services/conta';
import { lerPreferencias, salvarPreferencia } from '../Services/preferencias';
import {
  baixarPlanilha,
  CanceladoError,
  compartilharPlanilha,
  esquecerPastaDeDownload,
  pastaDeDownload,
  SemPropriedadesError,
} from '../Services/planilha';
import { useModo } from '../Components/ModoContext';
import { mensagemErro } from '../Services/erros';
import { apagarPropriedadesExemplo, criarPropriedadesExemplo } from '../Services/dadosExemplo';

type NavProp = NavigationProp<RootStackParamList>;
type IconeFeather = ComponentProps<typeof Feather>['name'];

// Uma linha de opção: ícone, título, descrição e algo à direita (seta ou interruptor)
function Opcao({
  icone,
  titulo,
  descricao,
  direita,
  cor = cores.verde,
  onPress,
  primeira,
}: {
  icone: IconeFeather;
  titulo: string;
  descricao?: string;
  direita?: ReactNode;
  cor?: string;
  onPress?: () => void;
  primeira?: boolean;
}) {
  return (
    <XStack
      alignItems="center"
      gap={12}
      paddingVertical={14}
      paddingHorizontal={16}
      minHeight={64}
      borderTopWidth={primeira ? 0 : 1}
      borderTopColor="borda"
      backgroundColor={onPress ? 'transparent press:begeClaro' : 'transparent'}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={descricao ? `${titulo}. ${descricao}` : titulo}
    >
      <YStack width={38} height={38} borderRadius="lg" backgroundColor="verdeSuave" alignItems="center" justifyContent="center">
        <Feather name={icone} size={18} color={cor} />
      </YStack>
      <YStack flex={1}>
        <Text fontSize={15} fontWeight="600" color={cor === cores.erro ? 'erro' : 'texto'}>
          {titulo}
        </Text>
        {descricao ? (
          <Text fontSize={13} color="textoSec" marginTop={2}>
            {descricao}
          </Text>
        ) : null}
      </YStack>
      {direita ?? (onPress ? <Feather name="chevron-right" size={20} color={cores.textoTerc} /> : null)}
    </XStack>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <YStack marginTop={24}>
      <TituloSecao>{titulo}</TituloSecao>
      <Cartao padding={0} overflow="hidden">
        {children}
      </Cartao>
    </YStack>
  );
}

export default function Configuracoes() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const usuario = auth.currentUser;

  const [nome, setNome] = useState(usuario?.displayName || nomeDoUsuario());
  const [editandoNome, setEditandoNome] = useState(false);
  const [salvandoNome, setSalvandoNome] = useState(false);

  const [bioSuportada, setBioSuportada] = useState(false);
  const [bioAtiva, setBioAtiva] = useState(true);
  const [planilha, setPlanilha] = useState<'baixando' | 'compartilhando' | null>(null);
  const [pasta, setPasta] = useState<string | null>(null);

  const { escuro, alternar: alternarModo } = useModo();
  const [excluirAberto, setExcluirAberto] = useState(false);
  const [senhaExclusao, setSenhaExclusao] = useState('');
  const [erroExclusao, setErroExclusao] = useState('');
  const [etapaExclusao, setEtapaExclusao] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [hardware, cadastrada, prefs] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        lerPreferencias(),
      ]);
      setBioSuportada(hardware && cadastrada);
      setBioAtiva(prefs.biometria);
      setPasta(await pastaDeDownload());
    })();
  }, []);

  const nomeExibido = usuario?.displayName?.trim() || nomeDoUsuario() || 'Produtor';
  const membroDesde = usuario?.metadata.creationTime
    ? new Date(usuario.metadata.creationTime).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : null;

  async function handleSalvarNome() {
    if (!nome.trim()) {
      toast.erro('Digite como você quer ser chamado no app.');
      return;
    }
    try {
      setSalvandoNome(true);
      await alterarNome(nome);
      setEditandoNome(false);
    } catch (error) {
      toast.erro(mensagemErro(error, 'Não foi possível salvar o nome.'));
    } finally {
      setSalvandoNome(false);
    }
  }

  function handleTrocarSenha() {
    Alert.alert('Alterar senha', `Vamos enviar um link para ${usuario?.email} para você criar uma nova senha.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Enviar link',
        onPress: async () => {
          try {
            await enviarLinkTrocaSenha();
            Alert.alert('Link enviado', 'Abra seu e-mail e siga as instruções. Confira também a caixa de spam.');
          } catch (error) {
            toast.erro(mensagemErro(error, 'Não foi possível enviar o link.'));
          }
        },
      },
    ]);
  }

  async function handleBiometria(ativar: boolean) {
    setBioAtiva(ativar);
    await salvarPreferencia('biometria', ativar);
  }

  function erroPlanilha(error: unknown) {
    if (error instanceof CanceladoError) return; // fechou o seletor de pasta
    if (error instanceof SemPropriedadesError) {
      Alert.alert('Nada para exportar', 'Cadastre uma propriedade primeiro.');
      return;
    }
    toast.erro(mensagemErro(error, 'Não foi possível gerar a planilha.'));
  }

  async function handleBaixar() {
    try {
      setPlanilha('baixando');
      const salvo = await baixarPlanilha();
      if (salvo) {
        setPasta(salvo.pasta);
        Alert.alert('Planilha baixada', `"${salvo.arquivo}" foi salva na pasta ${salvo.pasta}. Abra pelo app Arquivos ou pelo Excel.`);
      }
    } catch (error) {
      erroPlanilha(error);
    } finally {
      setPlanilha(null);
    }
  }

  async function handleCompartilhar() {
    try {
      setPlanilha('compartilhando');
      await compartilharPlanilha();
    } catch (error) {
      erroPlanilha(error);
    } finally {
      setPlanilha(null);
    }
  }

  async function handleTrocarPasta() {
    await esquecerPastaDeDownload();
    setPasta(null);
    handleBaixar(); // abre o seletor de pasta de novo
  }

  function handleSair() {
    confirmar({ titulo: 'Sair da conta', texto: 'Você vai precisar do e-mail e da senha para entrar de novo.', confirmar: 'Sair' }).then(async (ok) => {
      if (!ok) return;
          try {
            await signOut(auth);
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          } catch {
            toast.erro('Não foi possível sair.');
          }
    });
  }

  function fecharExclusao() {
    if (etapaExclusao) return; // não fecha no meio do processo
    setExcluirAberto(false);
    setSenhaExclusao('');
    setErroExclusao('');
  }

  async function handleExcluirConta() {
    if (!senhaExclusao) {
      setErroExclusao('Digite sua senha para confirmar.');
      return;
    }
    try {
      setErroExclusao('');
      await excluirConta(senhaExclusao, setEtapaExclusao);
      setEtapaExclusao(null);
      setExcluirAberto(false);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      Alert.alert('Conta excluída', 'Sua conta e todos os seus dados foram apagados.');
    } catch (error: any) {
      setEtapaExclusao(null);
      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        setErroExclusao('Senha incorreta.');
      } else if (error?.code === 'auth/too-many-requests') {
        setErroExclusao('Muitas tentativas. Aguarde alguns minutos e tente de novo.');
      } else {
        setErroExclusao(mensagemErro(error, 'Não foi possível excluir a conta. Tente novamente.'));
      }
    }
  }

  return (
    <Tela edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <Cabecalho titulo="Configurações" />

        {/* Perfil */}
        <Cartao gap={14}>
          <XStack alignItems="center" gap={14}>
            <YStack width={56} height={56} borderRadius="full" backgroundColor="verdeDestaque" alignItems="center" justifyContent="center">
              <Text fontSize={24} fontWeight="700" color="sobreVerde">
                {nomeExibido.charAt(0).toUpperCase()}
              </Text>
            </YStack>
            <YStack flex={1}>
              <Text fontSize={18} fontWeight="700" color="texto" numberOfLines={1}>
                {nomeExibido}
              </Text>
              <Text fontSize={13} color="textoSec" numberOfLines={1}>
                {usuario?.email}
              </Text>
              {membroDesde ? (
                <Text fontSize={13} color="textoSec">
                  Usa o AgroPlus desde {membroDesde}
                </Text>
              ) : null}
            </YStack>
          </XStack>

          {editandoNome ? (
            <YStack>
              <Campo
                rotulo="Como quer ser chamado?"
                value={nome}
                onChangeText={setNome}
                placeholder="Ex.: Maria"
                autoCapitalize="words"
                autoFocus
                ajuda="Aparece na saudação da tela inicial."
              />
              <XStack gap={8} marginTop={12}>
                <Botao flex={1} variante="contorno" tamanho="sm" titulo="Cancelar" onPress={() => setEditandoNome(false)} />
                <Botao flex={1} tamanho="sm" titulo="Salvar nome" carregando={salvandoNome} onPress={handleSalvarNome} />
              </XStack>
            </YStack>
          ) : (
            <Botao variante="contorno" tamanho="sm" icone="edit-2" titulo="Editar meu nome" onPress={() => setEditandoNome(true)} />
          )}
        </Cartao>

        <Secao titulo="Conta e segurança">
          <Opcao
            primeira
            icone="lock"
            titulo="Alterar senha"
            descricao="Enviamos um link para o seu e-mail"
            onPress={handleTrocarSenha}
          />
          <Opcao
            icone="smartphone"
            titulo="Entrar com impressão digital"
            descricao={
              bioSuportada
                ? 'Mostra o botão de biometria na tela de login'
                : 'Seu aparelho não tem biometria cadastrada'
            }
            direita={
              <Switch
                value={bioSuportada && bioAtiva}
                disabled={!bioSuportada}
                onValueChange={handleBiometria}
                trackColor={{ true: cores.verde, false: cores.bordaForte }}
                thumbColor={cores.sobreVerde}
                accessibilityLabel="Entrar com impressão digital"
              />
            }
          />
          <Opcao
            icone="moon"
            titulo="Modo escuro"
            descricao="Fundo escuro, mais confortável à noite"
            direita={
              <Switch
                value={escuro}
                onValueChange={alternarModo}
                trackColor={{ true: cores.verde, false: cores.bordaForte }}
                thumbColor={cores.sobreVerde}
                accessibilityLabel="Modo escuro"
              />
            }
          />
        </Secao>

        <Secao titulo="Planilha do Excel">
          <YStack padding={16} gap={4}>
            <Text fontSize={15} fontWeight="600" color="texto">
              Relatório completo da produção
            </Text>
            <Text fontSize={13} color="textoSec">
              5 abas: resumo, despesas, gastos por mês, plantios e propriedades com talhões. Sempre com os dados de agora.
            </Text>
          </YStack>
          <Opcao
            icone="download"
            titulo={planilha === 'baixando' ? 'Preparando planilha...' : 'Baixar planilha'}
            descricao={
              Platform.OS === 'android'
                ? pasta
                  ? `Salva direto na pasta ${pasta}`
                  : 'Na primeira vez, escolha a pasta (ex.: Download)'
                : 'Escolha "Salvar em Arquivos"'
            }
            onPress={planilha ? undefined : handleBaixar}
          />
          <Opcao
            icone="share-2"
            titulo={planilha === 'compartilhando' ? 'Preparando planilha...' : 'Compartilhar planilha'}
            descricao="Enviar por WhatsApp, e-mail ou Drive"
            onPress={planilha ? undefined : handleCompartilhar}
          />
          {Platform.OS === 'android' && pasta ? (
            <Opcao
              icone="folder"
              titulo="Trocar pasta de download"
              descricao={`Atual: ${pasta}`}
              onPress={planilha ? undefined : handleTrocarPasta}
            />
          ) : null}
        </Secao>

        <Secao titulo="Ajuda">
          <Opcao
            primeira
            icone="help-circle"
            titulo="Como usar o AgroPlus"
            descricao="Respostas para as dúvidas mais comuns"
            onPress={() => navigation.navigate('Ajuda')}
          />
          <Opcao icone="info" titulo="Versão do app" direita={<Text fontSize={14} color="textoSec">{appConfig.expo.version}</Text>} />
        </Secao>

        {__DEV__ && (
          <Secao titulo="Desenvolvimento">
            <YStack padding={12} gap={8}>
              <Botao
                variante="contorno"
                tamanho="sm"
                titulo="Criar dados de exemplo"
                onPress={async () => {
                  try {
                    const n = await criarPropriedadesExemplo();
                    Alert.alert('Pronto', `${n} propriedades criadas, com talhões, plantios e despesas.`);
                  } catch (e) {
                    toast.erro(mensagemErro(e, 'Não foi possível criar.'));
                  }
                }}
              />
              <Botao
                variante="texto"
                tamanho="sm"
                titulo="Apagar dados de exemplo"
                cor={cores.erro}
                onPress={async () => {
                  try {
                    const n = await apagarPropriedadesExemplo();
                    Alert.alert('Pronto', `${n} propriedades apagadas.`);
                  } catch (e) {
                    toast.erro(mensagemErro(e, 'Não foi possível apagar.'));
                  }
                }}
              />
            </YStack>
          </Secao>
        )}

        <Botao
          variante="contorno"
          icone="log-out"
          titulo="Sair da conta"
          cor={cores.erro}
          marginTop={28}
          onPress={handleSair}
        />

        <Botao
          variante="texto"
          tamanho="sm"
          titulo="Excluir minha conta"
          cor={cores.textoSec}
          alignSelf="center"
          marginTop={12}
          onPress={() => setExcluirAberto(true)}
        />
      </ScrollView>

      {/* Confirmação de exclusão da conta */}
      <Modal
        visible={excluirAberto}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={fecharExclusao}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <YStack flex={1} justifyContent="flex-end" backgroundColor="rgba(0, 0, 0, 0.4)">
            <YStack position="absolute" top={0} left={0} right={0} bottom={0} onPress={fecharExclusao} />
            <YStack
              backgroundColor="branco"
              borderTopLeftRadius="3xl"
              borderTopRightRadius="3xl"
              padding={20}
              paddingBottom={insets.bottom + 20}
              gap={12}
            >
              <Text fontSize={20} fontWeight="700" color="texto">
                Excluir conta
              </Text>
              <Dica tom="alerta" icone="alert-triangle">
                Isso apaga para sempre sua conta e todas as propriedades, talhões, plantios e despesas. Não dá para
                desfazer. Se quiser guardar seus gastos, exporte a planilha antes.
              </Dica>
              <Campo
                rotulo="Digite sua senha para confirmar"
                icone="lock"
                senha
                value={senhaExclusao}
                onChangeText={(v) => {
                  setSenhaExclusao(v);
                  setErroExclusao('');
                }}
                erro={erroExclusao || undefined}
                disabled={!!etapaExclusao}
              />
              {etapaExclusao ? (
                <Text fontSize={13} color="textoSec">
                  {etapaExclusao}
                </Text>
              ) : null}
              <XStack gap={8} marginTop={4}>
                <Botao flex={1} variante="contorno" titulo="Cancelar" disabled={!!etapaExclusao} onPress={fecharExclusao} />
                <Botao
                  flex={1}
                  variante="perigo"
                  titulo="Excluir tudo"
                  carregando={!!etapaExclusao}
                  onPress={handleExcluirConta}
                />
              </XStack>
            </YStack>
          </YStack>
        </KeyboardAvoidingView>
      </Modal>
    </Tela>
  );
}
