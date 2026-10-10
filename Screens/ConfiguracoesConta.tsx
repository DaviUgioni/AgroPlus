// Screens/ConfiguracoesConta.tsx
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../FirebaseConfig';
import { RootStackParamList } from '../App';
import { COLORS, RADIUS } from '../constants/theme';
import BotaoVoltar from '../Components/BotaoVoltar';
import {
  autenticarBiometria,
  biometriaDisponivel,
  lerPreferenciaBiometria,
  salvarPreferenciaBiometria,
} from '../Services/biometria';
import { atualizarNome, alterarSenha, alterarEmail, excluirConta, mensagemErroConta } from '../Services/conta';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'ConfiguracoesConta'>;
type Acao = 'senha' | 'email' | 'excluir';

function isEmailValido(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function ConfiguracoesConta() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const user = auth.currentUser;

  const [nome, setNome] = useState(user?.displayName ?? '');
  const [salvandoNome, setSalvandoNome] = useState(false);

  const [bioDisponivel, setBioDisponivel] = useState(false);
  const [bioAtiva, setBioAtiva] = useState(false);

  const [acaoAberta, setAcaoAberta] = useState<Acao | null>(null);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [mostrarSenhas, setMostrarSenhas] = useState(false);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [disponivel, ativa] = await Promise.all([biometriaDisponivel(), lerPreferenciaBiometria(user.uid)]);
      setBioDisponivel(disponivel);
      setBioAtiva(disponivel && ativa === true);
    })();
  }, []);

  if (!user) return null;
  const usuario = user;

  function abrirAcao(acao: Acao) {
    setAcaoAberta((atual) => (atual === acao ? null : acao));
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmacaoSenha('');
    setNovoEmail('');
    setMostrarSenhas(false);
  }

  async function handleSalvarNome() {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Digite seu nome.');
      return;
    }
    try {
      setSalvandoNome(true);
      await atualizarNome(usuario, nome);
      Alert.alert('Pronto', 'Nome atualizado.');
    } catch (error) {
      Alert.alert('Erro', mensagemErroConta(error, 'Não foi possível salvar o nome.'));
    } finally {
      setSalvandoNome(false);
    }
  }

  async function handleBiometria(ativar: boolean) {
    // Confirma a digital antes de ligar, para não travar o app com um sensor que não reconhece o usuário
    if (ativar && !(await autenticarBiometria('Confirme sua impressão digital'))) return;
    try {
      await salvarPreferenciaBiometria(usuario.uid, ativar);
      setBioAtiva(ativar);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a preferência.');
    }
  }

  async function handleAlterarSenha() {
    if (!senhaAtual || !novaSenha || !confirmacaoSenha) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (novaSenha.length < 6) {
      Alert.alert('Atenção', 'A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmacaoSenha) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }
    try {
      setProcessando(true);
      await alterarSenha(usuario, senhaAtual, novaSenha);
      abrirAcao('senha');
      Alert.alert('Pronto', 'Senha alterada com sucesso.');
    } catch (error) {
      Alert.alert('Erro', mensagemErroConta(error, 'Não foi possível alterar a senha.'));
    } finally {
      setProcessando(false);
    }
  }

  async function handleAlterarEmail() {
    const emailNorm = novoEmail.trim().toLowerCase();
    if (!emailNorm || !senhaAtual) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (!isEmailValido(emailNorm)) {
      Alert.alert('Atenção', 'Digite um e-mail válido.');
      return;
    }
    if (emailNorm === usuario.email) {
      Alert.alert('Atenção', 'Este já é o seu e-mail atual.');
      return;
    }
    try {
      setProcessando(true);
      await alterarEmail(usuario, senhaAtual, emailNorm);
      abrirAcao('email');
      Alert.alert(
        'Confirme o novo e-mail',
        `Enviamos um link para ${emailNorm}. O e-mail da conta só muda depois que você clicar nele.`
      );
    } catch (error) {
      Alert.alert('Erro', mensagemErroConta(error, 'Não foi possível alterar o e-mail.'));
    } finally {
      setProcessando(false);
    }
  }

  function handleExcluirConta() {
    if (!senhaAtual) {
      Alert.alert('Atenção', 'Digite sua senha para confirmar.');
      return;
    }
    Alert.alert(
      'Excluir conta',
      'Todas as suas propriedades, talhões, despesas e plantios serão apagados. Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessando(true);
              await excluirConta(usuario, senhaAtual);
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } catch (error) {
              Alert.alert('Erro', mensagemErroConta(error, 'Não foi possível excluir a conta.'));
            } finally {
              setProcessando(false);
            }
          },
        },
      ]
    );
  }

  function handleSair() {
    Alert.alert('Sair', 'Deseja realmente sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          } catch {
            Alert.alert('Erro', 'Não foi possível sair.');
          }
        },
      },
    ]);
  }

  function campoSenha(placeholder: string, valor: string, onChange: (v: string) => void) {
    return (
      <TextInput
        placeholder={placeholder}
        value={valor}
        onChangeText={onChange}
        secureTextEntry={!mostrarSenhas}
        autoCapitalize="none"
        style={styles.input}
      />
    );
  }

  function botaoMostrarSenhas() {
    return (
      <TouchableOpacity onPress={() => setMostrarSenhas((v) => !v)} style={styles.mostrarBtn} hitSlop={8}>
        <Feather name={mostrarSenhas ? 'eye-off' : 'eye'} size={14} color={COLORS.cinza} />
        <Text style={styles.mostrarTexto}>{mostrarSenhas ? 'Ocultar senhas' : 'Mostrar senhas'}</Text>
      </TouchableOpacity>
    );
  }

  function botaoConfirmar(texto: string, onPress: () => void, perigo = false) {
    return (
      <TouchableOpacity
        style={[styles.botao, perigo && styles.botaoPerigo]}
        onPress={onPress}
        disabled={processando}
      >
        {processando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>{texto}</Text>}
      </TouchableOpacity>
    );
  }

  function linhaAcao(acao: Acao, icone: keyof typeof Feather.glyphMap, titulo: string, perigo = false) {
    const aberta = acaoAberta === acao;
    return (
      <TouchableOpacity style={styles.linha} onPress={() => abrirAcao(acao)}>
        <Feather name={icone} size={18} color={perigo ? COLORS.erro : COLORS.verde} />
        <Text style={[styles.linhaTexto, perigo && { color: COLORS.erro }]}>{titulo}</Text>
        <Feather name={aberta ? 'chevron-up' : 'chevron-down'} size={18} color="#999" />
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BotaoVoltar />
        <Text style={styles.titulo}>Configurações da conta</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.secao}>Perfil</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Nome</Text>
            <View style={styles.nomeLinha}>
              <TextInput
                placeholder="Como quer ser chamado"
                value={nome}
                onChangeText={setNome}
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                returnKeyType="done"
                onSubmitEditing={handleSalvarNome}
              />
              <TouchableOpacity
                style={styles.salvarNomeBtn}
                onPress={handleSalvarNome}
                disabled={salvandoNome || nome.trim() === (usuario.displayName ?? '')}
              >
                {salvandoNome ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Feather name="check" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={[styles.label, { marginTop: 12 }]}>E-mail</Text>
            <Text style={styles.valor}>{usuario.email}</Text>
          </View>

          <Text style={styles.secao}>Segurança</Text>
          <View style={styles.card}>
            <View style={styles.linha}>
              <Feather name="lock" size={18} color={COLORS.verde} />
              <View style={{ flex: 1 }}>
                <Text style={styles.linhaTexto}>Desbloqueio por digital</Text>
                <Text style={styles.ajuda}>
                  {bioDisponivel
                    ? 'Pede a impressão digital ao abrir o app'
                    : 'Cadastre uma digital nas configurações do celular para usar'}
                </Text>
              </View>
              <Switch
                value={bioAtiva}
                onValueChange={handleBiometria}
                disabled={!bioDisponivel}
                trackColor={{ true: COLORS.verde, false: COLORS.borda }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divisor} />
            {linhaAcao('senha', 'key', 'Alterar senha')}
            {acaoAberta === 'senha' && (
              <View style={styles.formAcao}>
                {campoSenha('Senha atual', senhaAtual, setSenhaAtual)}
                {campoSenha('Nova senha', novaSenha, setNovaSenha)}
                {campoSenha('Confirmar nova senha', confirmacaoSenha, setConfirmacaoSenha)}
                {botaoMostrarSenhas()}
                {botaoConfirmar('Salvar nova senha', handleAlterarSenha)}
              </View>
            )}

            <View style={styles.divisor} />
            {linhaAcao('email', 'mail', 'Alterar e-mail')}
            {acaoAberta === 'email' && (
              <View style={styles.formAcao}>
                <TextInput
                  placeholder="Novo e-mail"
                  value={novoEmail}
                  onChangeText={setNovoEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                />
                {campoSenha('Senha atual', senhaAtual, setSenhaAtual)}
                {botaoMostrarSenhas()}
                {botaoConfirmar('Enviar confirmação', handleAlterarEmail)}
              </View>
            )}
          </View>

          <Text style={styles.secao}>Conta</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.linha} onPress={handleSair}>
              <Feather name="log-out" size={18} color={COLORS.verde} />
              <Text style={styles.linhaTexto}>Sair da conta</Text>
            </TouchableOpacity>

            <View style={styles.divisor} />
            {linhaAcao('excluir', 'trash-2', 'Excluir conta', true)}
            {acaoAberta === 'excluir' && (
              <View style={styles.formAcao}>
                <Text style={styles.aviso}>
                  Apaga sua conta e todos os dados: propriedades, talhões, despesas e plantios.
                </Text>
                {campoSenha('Digite sua senha para confirmar', senhaAtual, setSenhaAtual)}
                {botaoMostrarSenhas()}
                {botaoConfirmar('Excluir minha conta', handleExcluirConta, true)}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '500',
  },
  secao: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textoSec,
    marginTop: 8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: COLORS.bege,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: COLORS.textoSec,
    marginBottom: 6,
  },
  valor: {
    fontSize: 15,
    color: COLORS.texto,
  },
  nomeLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  salvarNomeBtn: {
    backgroundColor: COLORS.verde,
    borderRadius: RADIUS.sm,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.bordaClara,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  linhaTexto: {
    flex: 1,
    fontSize: 15,
    color: COLORS.texto,
  },
  ajuda: {
    fontSize: 12,
    color: COLORS.textoSec,
    marginTop: 2,
  },
  divisor: {
    height: 0.5,
    backgroundColor: COLORS.bordaClara,
    marginVertical: 10,
  },
  formAcao: {
    marginTop: 12,
  },
  mostrarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  mostrarTexto: {
    fontSize: 12,
    color: COLORS.cinza,
  },
  aviso: {
    fontSize: 13,
    color: COLORS.erro,
    marginBottom: 10,
  },
  botao: {
    backgroundColor: COLORS.verde,
    borderRadius: RADIUS.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoPerigo: {
    backgroundColor: COLORS.erro,
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
});
