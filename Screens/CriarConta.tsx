// Screens/CriarConta.tsx
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Text, XStack, YStack } from 'tamagui';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../FirebaseConfig';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import BotaoVoltar from '../Components/BotaoVoltar';
import { Botao, Campo, Subtitulo, Titulo } from '../Components/ui';
import { mensagemErro } from '../Services/erros';

type CriarContaNavigationProp = NavigationProp<RootStackParamList, 'CriarConta'>;

export default function CriarConta() {
  const navigation = useNavigation<CriarContaNavigationProp>();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [emailErro, setEmailErro] = useState('');

  function isEmailValido(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function forcaSenha(s: string): { nivel: 0 | 1 | 2 | 3; label: string; cor: string } {
    if (!s) return { nivel: 0, label: '', cor: cores.bege };
    let score = 0;
    if (s.length >= 6) score++;
    if (s.length >= 8 && /[A-Z]/.test(s)) score++;
    if (/[0-9]/.test(s) && /[a-z]/.test(s)) score++;
    if (/[^A-Za-z0-9]/.test(s)) score++;
    if (score <= 1) return { nivel: 1, label: 'Fraca', cor: cores.erro };
    if (score === 2) return { nivel: 2, label: 'Média', cor: cores.alerta };
    return { nivel: 3, label: 'Forte', cor: cores.verde };
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
      let mensagem = mensagemErro(error, 'Ocorreu um erro ao criar a conta.');
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

  const forca = forcaSenha(senha);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.branco }}>
      <XStack paddingHorizontal={20} marginTop={8}>
        <BotaoVoltar />
      </XStack>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <YStack flex={1} justifyContent="center" padding={24}>
              <Titulo fontSize={26}>Criar conta</Titulo>
              <Subtitulo marginTop={4} marginBottom={12}>
                Cadastre-se para começar a gerenciar suas propriedades
              </Subtitulo>

              <Campo
                rotulo="E-mail"
                icone="mail"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  const norm = v.trim().toLowerCase();
                  if (!norm) setEmailErro('');
                  else if (!isEmailValido(norm)) setEmailErro('E-mail inválido.');
                  else setEmailErro('');
                }}
                erro={emailErro}
                placeholder="seuemail@exemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                onBlur={() => {
                  const norm = email.trim().toLowerCase();
                  if (norm && !isEmailValido(norm)) setEmailErro('E-mail inválido.');
                }}
              />

              <Campo
                rotulo="Senha"
                icone="lock"
                senha
                value={senha}
                onChangeText={setSenha}
                placeholder="Mínimo 6 caracteres"
                ajuda={senha ? undefined : "Use 6 ou mais caracteres. Misture letras e números para ficar mais segura."}
                returnKeyType="next"
              />
              {senha ? (
                <XStack alignItems="center" gap={8} marginTop={8}>
                  <YStack flex={1} height={6} backgroundColor="bege" borderRadius="full" overflow="hidden">
                    <YStack
                      height="100%"
                      width={`${(forca.nivel / 3) * 100}%`}
                      backgroundColor={forca.cor}
                      borderRadius="full"
                    />
                  </YStack>
                  <Text fontSize={13} fontWeight="600" minWidth={40} color={forca.cor}>
                    {forca.label}
                  </Text>
                </XStack>
              ) : null}

              <Campo
                rotulo="Confirmar senha"
                icone="lock"
                senha
                value={confirmacaoSenha}
                onChangeText={setConfirmacaoSenha}
                placeholder="Digite a mesma senha de novo"
                erro={confirmacaoSenha && confirmacaoSenha !== senha ? "As senhas não são iguais." : undefined}
                returnKeyType="done"
                onSubmitEditing={handleCriarConta}
              />

              <Botao
                titulo={salvando ? 'Criando...' : 'Criar conta'}
                carregando={salvando}
                marginTop={28}
                onPress={handleCriarConta}
              />

              <Text
                fontSize={14}
                color="textoSec"
                textAlign="center"
                marginTop={20}
                padding={8}
                onPress={() => navigation.navigate('Login')}
              >
                Já tem conta?{' '}
                <Text color="verde" fontWeight="600">
                  Fazer login
                </Text>
              </Text>
            </YStack>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
