// Screens/Login.tsx
import { useState, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { YStack } from 'tamagui';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import * as LocalAuthentication from 'expo-local-authentication';
import { auth } from '../FirebaseConfig';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import { Botao, Campo, Corpo, toast } from '../Components/ui';
import FaixaMarca from '../Components/FaixaMarca';
import { mensagemErro } from '../Services/erros';
import { lerPreferencias } from '../Services/preferencias';

type LoginNavigationProp = NavigationProp<RootStackParamList, 'Login'>;

export default function Login() {
  const navigation = useNavigation<LoginNavigationProp>();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [emailErro, setEmailErro] = useState('');
  const [bioDisponivel, setBioDisponivel] = useState(false);

  function isEmailValido(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  // Verifica se biometria está disponível
  useEffect(() => {
    (async () => {
      const compativel = await LocalAuthentication.hasHardwareAsync();
      const enrolado = await LocalAuthentication.isEnrolledAsync();
      const { biometria } = await lerPreferencias(); // pode ser desligada nas Configurações
      setBioDisponivel(compativel && enrolado && biometria);
    })();
  }, []);

  async function handleLogin() {
    const emailNorm = email.trim().toLowerCase();
    if (!emailNorm) setEmailErro('Preencha o e-mail.');
    else if (!isEmailValido(emailNorm)) setEmailErro('E-mail inválido.');
    if (!email || !senha) {
      toast.erro('Preencha e-mail e senha.');
      return;
    }
    if (emailNorm && !isEmailValido(emailNorm)) {
      toast.erro('Digite um e-mail válido.');
      return;
    }

    try {
      setEntrando(true);
      setEmailErro('');
      await signInWithEmailAndPassword(auth, emailNorm, senha);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (error: any) {
      let mensagem = mensagemErro(error, 'Não foi possível entrar.');
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        mensagem = 'E-mail ou senha incorretos.';
      } else if (error.code === 'auth/user-not-found') {
        mensagem = 'Usuário não encontrado.';
        setEmailErro('E-mail não encontrado.');
      } else if (error.code === 'auth/invalid-email') {
        mensagem = 'E-mail inválido.';
        setEmailErro('E-mail inválido.');
      }
      toast.erro(mensagem);
    } finally {
      setEntrando(false);
    }
  }

  async function handleEsqueciSenha() {
    if (!email.trim()) {
      toast.erro('Digite seu e-mail no campo acima para recuperar a senha.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      toast.sucesso('E-mail de recuperação enviado. Verifique sua caixa de entrada.');
    } catch (error: any) {
      let msg = 'Não foi possível enviar.';
      if (error.code === 'auth/user-not-found') msg = 'E-mail não encontrado.';
      else if (error.code === 'auth/invalid-email') msg = 'E-mail inválido.';
      toast.erro(msg);
    }
  }

  async function handleBiometria() {
    if (auth.currentUser) {
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      return;
    }
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Entrar com biometria',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });
      if (result.success) {
        if (auth.currentUser) {
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        } else {
          toast.erro('Nenhuma sessão salva. Faça login com e-mail e senha primeiro.');
        }
      }
    } catch {
      toast.erro('Não foi possível usar a biometria.');
    }
  }

  function handleMudarEmail(v: string) {
    setEmail(v);
    const norm = v.trim().toLowerCase();
    if (!norm) setEmailErro('');
    else if (!isEmailValido(norm)) setEmailErro('E-mail inválido.');
    else setEmailErro('');
  }

  return (
    <YStack flex={1} backgroundColor="branco">
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <YStack flex={1}>
              <FaixaMarca titulo="Bem-vindo ao AgroPlus" subtitulo="Gerencie sua produção com facilidade" />

              <YStack padding={24} paddingBottom={insets.bottom + 24} flex={1} justifyContent="center">
              <YStack gap={4}>
                <Campo
                  rotulo="E-mail"
                  icone="mail"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChangeText={handleMudarEmail}
                  erro={emailErro}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                  onBlur={() => {
                    const norm = email.trim().toLowerCase();
                    if (norm && !isEmailValido(norm)) setEmailErro('E-mail inválido.');
                  }}
                />
                <Campo
                  rotulo="Senha"
                  icone="lock"
                  placeholder="Sua senha"
                  senha
                  value={senha}
                  onChangeText={setSenha}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
              </YStack>

              <Botao
                variante="texto"
                titulo="Esqueci minha senha"
                tamanho="sm"
                alignSelf="flex-end"
                marginTop={4}
                marginBottom={20}
                onPress={handleEsqueciSenha}
              />

              <Botao titulo={entrando ? 'Entrando...' : 'Entrar'} carregando={entrando} onPress={handleLogin} />

              {bioDisponivel ? (
                <Botao
                  variante="secundario"
                  icone="smartphone"
                  titulo="Entrar com impressão digital"
                  marginTop={12}
                  onPress={handleBiometria}
                />
              ) : null}

              <Corpo
                fontSize={14}
                color="textoSec"
                textAlign="center"
                marginTop={24}
                padding={8}
                onPress={() => navigation.navigate('CriarConta')}
              >
                Não tem conta?{' '}
                <Corpo fontSize={14} color="verde" fontWeight="600">
                  Criar conta
                </Corpo>
              </Corpo>
              </YStack>
            </YStack>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </YStack>
  );
}
