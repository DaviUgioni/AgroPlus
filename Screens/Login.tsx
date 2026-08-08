// Screens/Login.tsx
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, TextInput, Alert } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../FirebaseConfig';
import { RootStackParamList } from '../App';

type LoginNavigationProp = NavigationProp<RootStackParamList, 'Login'>;

export default function Login() {
  const navigation = useNavigation<LoginNavigationProp>();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [entrando, setEntrando] = useState(false);

  async function handleLogin() {
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }

    try {
      setEntrando(true);
      await signInWithEmailAndPassword(auth, email.trim(), senha);
      navigation.navigate('Home');
    } catch (error: any) {
      let mensagem = 'Não foi possível entrar.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        mensagem = 'E-mail ou senha incorretos.';
      } else if (error.code === 'auth/user-not-found') {
        mensagem = 'Usuário não encontrado.';
      } else if (error.code === 'auth/invalid-email') {
        mensagem = 'E-mail inválido.';
      }
      Alert.alert('Erro', mensagem);
    } finally {
      setEntrando(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconeApp}>
        <Feather name="feather" size={36} color="white" />
      </View>

      <Text style={styles.titulo}>Bem-vindo ao AgroPlus</Text>
      <Text style={styles.subtitulo}>Gerencie sua produção com facilidade</Text>

      <View style={styles.card}>
        <View style={styles.linha}>
          <Feather name="mail" size={18} color="#888780" style={styles.icone} />
          <TextInput
            placeholder="Usuário ou e-mail"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={[styles.linha, styles.linhaSemBorda]}>
          <Feather name="lock" size={18} color="#888780" style={styles.icone} />
          <TextInput
            placeholder="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            style={styles.input}
          />
        </View>
      </View>

      <TouchableOpacity>
        <Text style={styles.esqueciSenha}>Esqueci minha senha</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botao} onPress={handleLogin} disabled={entrando}>
        <Text style={styles.textoBotao}>{entrando ? 'Entrando...' : 'Entrar'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('CriarConta')}>
        <Text style={styles.criarConta}>
          Não tem conta? <Text style={styles.criarContaLink}>Criar conta</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const VERDE = '#3B6D11';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  iconeApp: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: VERDE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
    backgroundColor: '#F1EFE8',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
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
  esqueciSenha: {
    alignSelf: 'flex-end',
    fontSize: 13,
    color: VERDE,
    marginBottom: 24,
  },
  botao: {
    width: '100%',
    backgroundColor: VERDE,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
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