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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { XStack, YStack } from 'tamagui';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../FirebaseConfig';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import FaixaMarca from '../Components/FaixaMarca';
import { Botao, Campo, Corpo, Legenda, toast } from '../Components/ui';
import { mensagemErro } from '../Services/erros';

type CriarContaNavigationProp = NavigationProp<RootStackParamList, 'CriarConta'>;

export default function CriarConta() {
  const navigation = useNavigation<CriarContaNavigationProp>();
  const insets = useSafeAreaInsets();

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
      toast.erro('Por favor, preencha todos os campos.');
      if (!isEmailValido(emailNorm)) setEmailErro('E-mail inválido.');
      return;
    }

    if (!isEmailValido(emailNorm)) {
      setEmailErro('E-mail inválido.');
      toast.erro('Digite um e-mail válido.');
      return;
    }

    if (senha !== confirmacaoSenha) {
      toast.erro('As senhas não coincidem.');
      return;
    }

    if (senha.length < 6) {
      toast.erro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setSalvando(true);
      await createUserWithEmailAndPassword(auth, emailNorm, senha);
      toast.sucesso('Conta criada com sucesso!');
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
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
      toast.erro(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  const forca = forcaSenha(senha);

  return (
    <YStack flex={1} backgroundColor="branco">
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <YStack flex={1}>
              <FaixaMarca compacta voltar titulo="Criar conta" subtitulo="Cadastre-se para gerenciar suas propriedades" />

              <YStack padding={24} paddingBottom={insets.bottom + 24} flex={1} justifyContent="center">
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
                  <Legenda fontWeight="600" minWidth={40} color={forca.cor}>
                    {forca.label}
                  </Legenda>
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

              <Corpo
                fontSize={14}
                color="textoSec"
                textAlign="center"
                marginTop={20}
                padding={8}
                onPress={() => navigation.navigate('Login')}
              >
                Já tem conta?{' '}
                <Corpo fontSize={14} color="verde" fontWeight="600">
                  Fazer login
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
