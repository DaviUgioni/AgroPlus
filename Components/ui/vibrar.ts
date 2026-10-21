// Components/ui/vibrar.ts
// O módulo nativo é carregado só quando necessário. Se o app instalado ainda não o tem
// (build antigo, sem expo-haptics), a vibração é ignorada em vez de derrubar o app.
let haptics: typeof import('expo-haptics') | null | undefined;

function carregar() {
  if (haptics === undefined) {
    try {
      haptics = require('expo-haptics');
    } catch {
      haptics = null;
    }
  }
  return haptics;
}

/** Vibração leve de confirmação de toque. Ignora erros (ex.: aparelho sem vibração). */
export function vibrar(tipo: 'leve' | 'aviso' = 'leve') {
  try {
    const h = carregar();
    if (!h) return;
    if (tipo === 'aviso') h.notificationAsync(h.NotificationFeedbackType.Warning).catch(() => {});
    else h.impactAsync(h.ImpactFeedbackStyle.Light).catch(() => {});
  } catch {}
}
