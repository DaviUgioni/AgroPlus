// Screens/CriarConta.tsx
import { useState } from 'react';
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
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../FirebaseConfig';
import { RootStackParamList } from '../App';
import { COLORS, RADIUS } from '../constants/theme';

type CriarContaNavigationProp = NavigationProp<RootStackParamList, 'CriarConta'>;

export default function CriarConta() {
  const navigation = useNavigation<CriarContaNavigationProp>();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [emailErro, setEmailErro] = useState('');

  function isEmailValido(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function forcaSenha(s: string): { nivel: 0 | 1 | 2 | 3; label: string; cor: string } {
    if (!s) return { nivel: 0, label: '', cor: '#eee' };
    let score = 0;
    if (s.length >= 6) score++;
    if (s.length >= 8 && /[A-Z]/.test(s)) score++;
    if (/[0-9]/.test(s) && /[a-z]/.test(s)) score++;
    if (/[^A-Za-z0-9]/.test(s)) score++;
    if (score <= 1) return { nivel: 1, label: 'Fraca', cor: '#E74C3C' };
    if (score === 2) return { nivel: 2, label: 'Média', cor: '#F1C40F' };
    return { nivel: 3, label: 'Forte', cor: '#2ECC71' };
  }

  async function handleCriarConta() {
    const emailNorm = email.trim().toLowerCase();
    setEmailErro('');

    if (!emailNorm || !senha || !confirmacaoSenha) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
      if (!isEmailValido(emailNorm)) setEmailErro('E-mail inválido.');
      return;
    }

    if (!isEmailValido(emailNorm)) {
      setEmailErro('E-mail inválido.');
      Alert.alert('Atenção', 'Digite um e-mail válido.');
      return;
    }

    if (senha !== confirmacaoSenha) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }

    if (senha.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setSalvando(true);
      await createUserWithEmailAndPassword(auth, emailNorm, senha);
      Alert.alert('Sucesso', 'Conta criada com sucesso!');
      navigation.navigate('Home');
    } catch (error: any) {
      let mensagem = 'Ocorreu um erro ao criar a conta.';
      if (error.code === 'auth/email-already-in-use') {
        mensagem = 'Este e-mail já está em uso. Faça login ou recupere a senha.';
        setEmailErro('E-mail já cadastrado.');
      } else if (error.code === 'auth/invalid-email') {
        mensagem = 'E-mail inválido.';
        setEmailErro('E-mail inválido.');
      } else if (error.code === 'auth/weak-password') {
        mensagem = 'Senha muito fraca.';
      }
      Alert.alert('Erro', mensagem);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <Text style={styles.title}>Criar conta</Text>

            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={[styles.input, emailErro ? styles.inputErro : null]}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                const norm = v.trim().toLowerCase();
                if (!norm) setEmailErro('');
                else if (!isEmailValido(norm)) setEmailErro('E-mail inválido.');
                else setEmailErro('');
              }}
              placeholder="seuemail@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onBlur={() => {
                const norm = email.trim().toLowerCase();
                if (norm && !isEmailValido(norm)) setEmailErro('E-mail inválido.');
              }}
            />
            {emailErro ? <Text style={styles.erroTexto}>{emailErro}</Text> : null}

            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputComIcone}>
              <TextInput
                style={styles.inputFlex}
                value={senha}
                onChangeText={setSenha}
                placeholder="Mínimo 6 caracteres"
                secureTextEntry={!mostrarSenha}
                returnKeyType="next"
              />
              <TouchableOpacity onPress={() => setMostrarSenha((v) => !v)} hitSlop={8} style={styles.olhoBtn}>
                <Feather name={mostrarSenha ? 'eye-off' : 'eye'} size={18} color="#888" />
              </TouchableOpacity>
            </View>
            {senha ? (
              <View style={styles.forcaContainer}>
                <View style={styles.forcaBarraFundo}>
                  <View
                    style={[
                      styles.forcaBarra,
                      {
                        width: `${(forcaSenha(senha).nivel / 3) * 100}%`,
                        backgroundColor: forcaSenha(senha).cor,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.forcaTexto, { color: forcaSenha(senha).cor }]}>{forcaSenha(senha).label}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Confirmar senha</Text>
            <View style={styles.inputComIcone}>
              <TextInput
                style={styles.inputFlex}
                value={confirmacaoSenha}
                onChangeText={setConfirmacaoSenha}
                placeholder="Repita a senha"
                secureTextEntry={!mostrarConfirmacao}
                returnKeyType="done"
                onSubmitEditing={handleCriarConta}
              />
              <TouchableOpacity onPress={() => setMostrarConfirmacao((v) => !v)} hitSlop={8} style={styles.olhoBtn}>
                <Feather name={mostrarConfirmacao ? 'eye-off' : 'eye'} size={18} color="#888" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleCriarConta} disabled={salvando}>
              <Text style={styles.buttonText}>{salvando ? 'Criando...' : 'Criar conta'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Já tenho conta. Fazer login</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '500',
    marginBottom: 20,
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
    padding: 10,
    fontSize: 15,
  },
  inputErro: {
    borderColor: '#E74C3C',
  },
  erroTexto: {
    color: '#E74C3C',
    fontSize: 12,
    marginTop: 4,
  },
  inputComIcone: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borda,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
  },
  inputFlex: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
  },
  olhoBtn: {
    padding: 4,
    marginLeft: 8,
  },
  forcaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  forcaBarraFundo: {
    flex: 1,
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    overflow: 'hidden',
  },
  forcaBarra: {
    height: '100%',
    borderRadius: 3,
  },
  forcaTexto: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 40,
  },
  button: {
    backgroundColor: COLORS.verde,
    borderRadius: RADIUS.sm,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 15,
  },
  link: {
    color: COLORS.verde,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 13,
  },
});
