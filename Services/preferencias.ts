import AsyncStorage from '@react-native-async-storage/async-storage';

// Preferências guardadas no próprio aparelho (não vão para o Firebase).
export interface Preferencias {
  /** Mostra o botão "Entrar com impressão digital" no login */
  biometria: boolean;
  /** Tema escuro do app */
  modoEscuro: boolean;
  /** Pasta (URI do Android) onde as planilhas são salvas ao tocar em "Baixar" */
  pastaPlanilha?: string;
  /** Esconde os valores dos cartões de gasto (botão de olho) */
  ocultarValores?: boolean;
}

const PADRAO: Preferencias = {
  biometria: true,
  modoEscuro: false,
};

const CHAVE = '@agroplus/preferencias';

export async function lerPreferencias(): Promise<Preferencias> {
  try {
    const salvo = await AsyncStorage.getItem(CHAVE);
    return salvo ? { ...PADRAO, ...JSON.parse(salvo) } : PADRAO;
  } catch {
    return PADRAO;
  }
}

export async function salvarPreferencia<K extends keyof Preferencias>(chave: K, valor: Preferencias[K]) {
  const atuais = await lerPreferencias();
  await AsyncStorage.setItem(CHAVE, JSON.stringify({ ...atuais, [chave]: valor }));
}
