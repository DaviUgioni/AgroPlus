// Screens/CriarConta.tsx
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, TextInput, Alert } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../FirebaseConfig';
import { RootStackParamList } from '../App';

type CriarContaNavigationProp = NavigationProp<RootStackParamList, 'CriarConta'>;

export default function CriarConta() {
  const navigation = useNavigation<CriarContaNavigationProp>();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function handleCriarConta() {
    if (!email || !senha || !confirmacaoSenha) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
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
      await createUserWithEmailAndPassword(auth, email.trim(), senha);
      Alert.alert('Sucesso', 'Conta criada com sucesso!');
      navigation.navigate('Home');
    } catch (error: any) {
      let mensagem = 'Ocorreu um erro ao criar a conta.';
      if (error.code === 'auth/email-already-in-use') {
        mensagem = 'Este e-mail já está em uso.';
      } else if (error.code === 'auth/invalid-email') {
        mensagem = 'E-mail inválido.';
      } else if (error.code === 'auth/weak-password') {
        mensagem = 'Senha muito fraca.';
      }
      Alert.alert('Erro', mensagem);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar conta</Text>

      <Text style={styles.label}>E-mail</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="seuemail@exemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Senha</Text>
      <TextInput
        style={styles.input}
        value={senha}
        onChangeText={setSenha}
        placeholder="Mínimo 6 caracteres"
        secureTextEntry
      />

      <Text style={styles.label}>Confirmar senha</Text>
      <TextInput
        style={styles.input}
        value={confirmacaoSenha}
        onChangeText={setConfirmacaoSenha}
        placeholder="Repita a senha"
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleCriarConta} disabled={salvando}>
        <Text style={styles.buttonText}>{salvando ? 'Criando...' : 'Criar conta'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Já tenho conta. Fazer login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
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
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
  },
  button: {
    backgroundColor: '#0F6E56',
    borderRadius: 8,
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
    color: '#0F6E56',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 13,
  },
});