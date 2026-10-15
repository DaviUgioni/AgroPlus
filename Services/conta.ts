import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { Directory, Paths } from 'expo-file-system';
import { auth } from '../FirebaseConfig';
import { excluirPropriedade, listarPropriedades } from './propriedades';

/** Nome curto para saudações: o nome cadastrado ou, se não houver, o início do e-mail */
export function nomeDoUsuario(): string {
  const user = auth.currentUser;
  const cadastrado = user?.displayName?.trim();
  if (cadastrado) return cadastrado.split(' ')[0];
  const parte = (user?.email ?? '').split('@')[0].split(/[._\-0-9]/)[0];
  if (!parte) return '';
  return parte.charAt(0).toUpperCase() + parte.slice(1);
}

export async function alterarNome(nome: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado.');
  await updateProfile(user, { displayName: nome.trim() });
}

export async function enviarLinkTrocaSenha() {
  const email = auth.currentUser?.email;
  if (!email) throw new Error('Usuário sem e-mail.');
  await sendPasswordResetEmail(auth, email);
}

/**
 * Apaga a conta e todos os dados dela: propriedades (com talhões, plantios e despesas),
 * fotos guardadas no aparelho e, por último, o usuário no Firebase Auth.
 * O Firebase exige login recente para excluir a conta, por isso a senha é pedida de novo.
 */
export async function excluirConta(senha: string, aoAvancar?: (etapa: string) => void) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('Usuário não autenticado.');

  aoAvancar?.('Confirmando sua senha...');
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, senha));

  const propriedades = await listarPropriedades(user.uid);
  for (let i = 0; i < propriedades.length; i++) {
    aoAvancar?.(`Apagando propriedades (${i + 1} de ${propriedades.length})...`);
    await excluirPropriedade(propriedades[i].id!);
  }

  try {
    const notas = new Directory(Paths.document, 'notas');
    if (notas.exists) notas.delete();
  } catch {}

  aoAvancar?.('Removendo sua conta...');
  await deleteUser(user);
}
