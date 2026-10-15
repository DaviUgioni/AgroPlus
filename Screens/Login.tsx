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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Text, YStack } from 'tamagui';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import * as LocalAuthentication from 'expo-local-authentication';
import { auth } from '../FirebaseConfig';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import { Botao, Campo, Subtitulo, Titulo } from '../Components/ui';
import { mensagemErro } from '../Services/erros';
import { lerPreferencias } from '../Services/preferencias';

type LoginNavigationProp = NavigationProp<RootStackParamList, 'Login'>;

export default function Login() {
  const navigation = useNavigation<LoginNavigationProp>();
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
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }
    if (emailNorm && !isEmailValido(emailNorm)) {
      Alert.alert('Atenção', 'Digite um e-mail válido.');
      return;
    }

    try {
      setEntrando(true);
      setEmailErro('');
      await signInWithEmailAndPassword(auth, emailNorm, senha);
      navigation.navigate('Home');
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
      Alert.alert('Erro', mensagem);
    } finally {
      setEntrando(false);
    }
  }

  async function handleEsqueciSenha() {
    if (!email.trim()) {
      Alert.alert('Atenção', 'Digite seu e-mail no campo acima para recuperar a senha.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('Enviado', 'E-mail de recuperação enviado. Verifique sua caixa de entrada.');
    } catch (error: any) {
      let msg = 'Não foi possível enviar.';
      if (error.code === 'auth/user-not-found') msg = 'E-mail não encontrado.';
      else if (error.code === 'auth/invalid-email') msg = 'E-mail inválido.';
      Alert.alert('Erro', msg);
    }
  }

  async function handleBiometria() {
    if (auth.currentUser) {
      navigation.navigate('Home');
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
          navigation.navigate('Home');
        } else {
          Alert.alert('Atenção', 'Nenhuma sessão salva. Faça login com e-mail e senha primeiro.');
        }
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível usar a biometria.');
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
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.branco }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <YStack flex={1} justifyContent="center" padding={24}>
              <YStack alignItems="center" marginBottom={32}>
                <YStack
                  width={104}
                  height={104}
                  borderRadius="full"
                  backgroundColor="verdeSuave"
                  alignItems="center"
                  justifyContent="center"
                  marginBottom={16}
                >
                  <Image source={require('../assets/logo.png')} style={{ width: 80, height: 80 }} resizeMode="contain" />
                </YStack>
                <Titulo fontSize={24} textAlign="center">
                  Bem-vindo ao AgroPlus
                </Titulo>
                <Subtitulo textAlign="center" marginTop={4}>
                  Gerencie sua produção com facilidade
                </Subtitulo>
              </YStack>

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

              <Text
                fontSize={14}
                color="textoSec"
                textAlign="center"
                marginTop={24}
                padding={8}
                onPress={() => navigation.navigate('CriarConta')}
              >
                Não tem conta?{' '}
                <Text color="verde" fontWeight="600">
                  Criar conta
                </Text>
              </Text>
            </YStack>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
