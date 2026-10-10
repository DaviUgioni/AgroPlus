import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
  deleteUser,
  User,
} from 'firebase/auth';
import { listarPropriedades, excluirPropriedade } from './propriedades';
import { removerPreferenciaBiometria } from './biometria';
import { mensagemErro } from './erros';

// Firebase exige login recente para trocar senha/e-mail ou excluir a conta
async function reautenticar(user: User, senhaAtual: string) {
  if (!user.email) throw new Error('Conta sem e-mail.');
  const credencial = EmailAuthProvider.credential(user.email, senhaAtual);
  await reauthenticateWithCredential(user, credencial);
}

export async function atualizarNome(user: User, nome: string) {
  await updateProfile(user, { displayName: nome.trim() });
}

export async function alterarSenha(user: User, senhaAtual: string, novaSenha: string) {
  await reautenticar(user, senhaAtual);
  await updatePassword(user, novaSenha);
}

// O e-mail só muda depois que o usuário clicar no link enviado para o novo endereço
export async function alterarEmail(user: User, senhaAtual: string, novoEmail: string) {
  await reautenticar(user, senhaAtual);
  await verifyBeforeUpdateEmail(user, novoEmail.trim().toLowerCase());
}

export async function excluirConta(user: User, senhaAtual: string) {
  await reautenticar(user, senhaAtual);
  const propriedades = await listarPropriedades(user.uid);
  for (const prop of propriedades) {
    await excluirPropriedade(prop.id!);
  }
  await removerPreferenciaBiometria(user.uid);
  await deleteUser(user);
}

export function mensagemErroConta(error: any, fallback: string): string {
  switch (error?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Senha atual incorreta.';
    case 'auth/weak-password':
      return 'A nova senha precisa ter pelo menos 6 caracteres.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está em uso por outra conta.';
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
    case 'auth/requires-recent-login':
      return 'Por segurança, saia e entre novamente antes de fazer esta alteração.';
    default:
      return mensagemErro(error, fallback);
  }
}
