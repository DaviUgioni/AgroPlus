// Components/escalaFonte.ts
// Limita o quanto a fonte do sistema (Configurações do celular) pode aumentar o texto do app,
// para os cartões e botões não quebrarem. Importe uma vez, no início do App.
import { Text, TextInput } from 'react-native';

const LIMITE = 1.3;

function limitar(componente: any) {
  const original = componente?.render;
  if (typeof original !== 'function') return;
  componente.render = function (props: any, ref: any) {
    return original.call(this, { maxFontSizeMultiplier: LIMITE, ...props }, ref);
  };
}

limitar(Text);
limitar(TextInput);
