// Screens/Login.tsx
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
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
import { Feather } from '@expo/vector-icons';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import * as LocalAuthentication from 'expo-local-authentication';
import { auth } from '../FirebaseConfig';
import { RootStackParamList } from '../App';
import { COLORS, RADIUS } from '../constants/theme';
import { mensagemErro } from '../Services/erros';

type LoginNavigationProp = NavigationProp<RootStackParamList, 'Login'>;

export default function Login() {
  const navigation = useNavigation<LoginNavigationProp>();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
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
      setBioDisponivel(compativel && enrolado);
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />

            <Text style={styles.titulo}>Bem-vindo ao AgroPlus</Text>
            <Text style={styles.subtitulo}>Gerencie sua produção com facilidade</Text>

            <View style={[styles.card, emailErro ? styles.cardErro : null]}>
              <View style={styles.linha}>
                <Feather name="mail" size={18} color="#888780" style={styles.icone} />
                <TextInput
                  placeholder="Usuário ou e-mail"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    const norm = v.trim().toLowerCase();
                    if (!norm) setEmailErro('');
                    else if (!isEmailValido(norm)) setEmailErro('E-mail inválido.');
                    else setEmailErro('');
                  }}
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                  onBlur={() => {
                    const norm = email.trim().toLowerCase();
                    if (norm && !isEmailValido(norm)) setEmailErro('E-mail inválido.');
                  }}
                />
              </View>

              <View style={[styles.linha, styles.linhaSemBorda]}>
                <Feather name="lock" size={18} color="#888780" style={styles.icone} />
                <TextInput
                  placeholder="Senha"
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry={!mostrarSenha}
                  style={styles.input}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setMostrarSenha((v) => !v)}
                  hitSlop={8}
                  style={styles.olhoBtn}
                  accessibilityLabel={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <Feather name={mostrarSenha ? 'eye-off' : 'eye'} size={18} color="#888780" />
                </TouchableOpacity>
              </View>
            </View>
            {emailErro ? <Text style={styles.emailErroTexto}>{emailErro}</Text> : null}

            <TouchableOpacity onPress={handleEsqueciSenha} style={styles.esqueciBtn}>
              <Text style={styles.esqueciSenha}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botao} onPress={handleLogin} disabled={entrando}>
              <Text style={styles.textoBotao}>{entrando ? 'Entrando...' : 'Entrar'}</Text>
            </TouchableOpacity>

            {bioDisponivel ? (
              <TouchableOpacity style={styles.botaoBio} onPress={handleBiometria}>
                <Feather name="smartphone" size={18} color={COLORS.verde} />
                <Text style={styles.botaoBioTexto}>Entrar com impressão digital</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity onPress={() => navigation.navigate('CriarConta')}>
              <Text style={styles.criarConta}>
                Não tem conta? <Text style={styles.criarContaLink}>Criar conta</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const VERDE = COLORS.verde;

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: 16,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.bege,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardErro: {
    borderColor: '#E74C3C',
  },
  emailErroTexto: {
    alignSelf: 'flex-start',
    color: '#E74C3C',
    fontSize: 12,
    marginBottom: 8,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#D3D1C7',
  },
  linhaSemBorda: {
    borderBottomWidth: 0,
  },
  icone: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  olhoBtn: {
    padding: 4,
    marginLeft: 8,
  },
  esqueciBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  esqueciSenha: {
    fontSize: 13,
    color: VERDE,
  },
  botao: {
    width: '100%',
    backgroundColor: VERDE,
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  botaoBio: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: VERDE,
    borderRadius: RADIUS.pill,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  botaoBioTexto: {
    color: VERDE,
    fontSize: 14,
    fontWeight: '600',
  },
  textoBotao: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  criarConta: {
    fontSize: 13,
    color: '#666',
  },
  criarContaLink: {
    color: VERDE,
    fontWeight: '500',
  },
});
