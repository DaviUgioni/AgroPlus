import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

// Preferência guardada por usuário: no mesmo aparelho cada conta decide se usa a digital
function chave(userId: string) {
  return `agroplus:biometria:${userId}`;
}

export async function biometriaDisponivel(): Promise<boolean> {
  try {
    const [compativel, cadastrada] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return compativel && cadastrada;
  } catch {
    return false;
  }
}

// null = usuário ainda não escolheu (usado para oferecer a ativação após o login)
export async function lerPreferenciaBiometria(userId: string): Promise<boolean | null> {
  try {
    const valor = await AsyncStorage.getItem(chave(userId));
    if (valor === null) return null;
    return valor === '1';
  } catch {
    return null;
  }
}

export async function salvarPreferenciaBiometria(userId: string, ativa: boolean) {
  await AsyncStorage.setItem(chave(userId), ativa ? '1' : '0');
}

export async function removerPreferenciaBiometria(userId: string) {
  try {
    await AsyncStorage.removeItem(chave(userId));
  } catch {}
}

export async function autenticarBiometria(mensagem: string): Promise<boolean> {
  try {
    const resultado = await LocalAuthentication.authenticateAsync({
      promptMessage: mensagem,
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    return resultado.success;
  } catch {
    return false;
  }
}
