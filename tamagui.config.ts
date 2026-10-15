// tamagui.config.ts
import { createTamagui } from 'tamagui';
import { createV6Config, themes, tokens } from '@tamagui/config/v6';
import { animations } from './animacoes';

// Paleta do AgroPlus. Use nos componentes como token (sem "$" no Tamagui 3):
// color="verde", backgroundColor="bege"... Em ícones, use o valor: cores.verde
// As cores que mudam entre claro e escuro ficam nos temas; as fixas, nos tokens.
const paletaClara = {
  verde: '#1A9E4A',
  verdeEscuro: '#147A3A', // estado pressionado de botões verdes
  verdeSuave: '#EAF3DE', // fundo de selos e ícones
  verdeDestaque: '#1A9E4A', // fundo de cartões de destaque (totais)
  bege: '#E4DEC9',
  begeClaro: '#FAF8F3', // fundo das telas
  branco: '#FFFFFF', // superfície: cartões, campos, barras
  texto: '#1C1C1A',
  textoSec: '#66655F',
  textoTerc: '#8A8880',
  borda: '#D3D1C7',
  bordaForte: '#BDBAAE',
  erro: '#C0392B',
  erroSuave: '#FDF0EE',
  alerta: '#B7791F', // atenção que não é erro (ex.: pronto para colher)
  alertaSuave: '#FDF4E3',
};

const paletaEscura: typeof paletaClara = {
  verde: '#1A9E4A',
  verdeEscuro: '#147A3A',
  verdeSuave: '#1A3524',
  // Verde mais fechado: um bloco grande e saturado ofusca no fundo escuro
  verdeDestaque: '#176B37',
  bege: '#2A2925',
  begeClaro: '#121211',
  branco: '#1C1C1A',
  texto: '#F2F1EC',
  textoSec: '#B5B3A9',
  textoTerc: '#8F8D84',
  borda: '#34332F',
  bordaForte: '#5C5A52',
  erro: '#E5594B',
  erroSuave: '#3A1F1B',
  alerta: '#D9972F',
  alertaSuave: '#3A2D14',
};

// Cores que não mudam com o tema: texto e ícones sobre fundo verde.
const fixas = {
  sobreVerde: '#FFFFFF',
  sobreVerdeSuave: '#EAF3DE',
};

let paletaAtiva = paletaClara;

/** Troca a paleta usada por `cores` (ícones e estilos em JS). Chamado pelo App ao mudar o modo. */
export function aplicarModo(escuro: boolean) {
  paletaAtiva = escuro ? paletaEscura : paletaClara;
}

type NomeCor = keyof typeof paletaClara | keyof typeof fixas;

// Leitura sempre da paleta ativa; o App remonta as telas quando o modo muda.
export const cores = Object.defineProperties(
  {} as Record<NomeCor, string>,
  {
    ...Object.fromEntries(
      (Object.keys(paletaClara) as (keyof typeof paletaClara)[]).map((k) => [
        k,
        { enumerable: true, get: () => paletaAtiva[k] },
      ])
    ),
    ...Object.fromEntries(
      (Object.keys(fixas) as (keyof typeof fixas)[]).map((k) => [k, { enumerable: true, value: fixas[k] }])
    ),
  }
) as Record<NomeCor, string>;

function temaDe(paleta: typeof paletaClara, base: Record<string, any>) {
  return {
    ...base,
    ...paleta,
    ...fixas,
    background: paleta.branco,
    'background-hover': paleta.begeClaro,
    'background-press': paleta.begeClaro,
    'background-focus': paleta.branco,
    color: paleta.texto,
    'color-hover': paleta.texto,
    'color-press': paleta.texto,
    'color-focus': paleta.texto,
    'border-color': paleta.borda,
    'border-color-hover': paleta.bordaForte,
    'border-color-press': paleta.bordaForte,
    'border-color-focus': paleta.verde,
    'placeholder-color': paleta.textoTerc,
    'outline-color': paleta.verde,
    'accent-background': paleta.verde,
    'accent-color': fixas.sobreVerde,
  };
}

// Os tokens de cor têm prioridade sobre o tema, então só entram os que nunca mudam.
const base = createV6Config({
  themes: { ...themes, light: temaDe(paletaClara, themes.light), dark: temaDe(paletaEscura, themes.dark) },
  colorTokens: { ...tokens.color, ...fixas },
});

export const config = createTamagui({
  ...base,
  animations,
  settings: {
    ...base.settings,
    // O preset v6 obriga atalhos estilo Tailwind (p, bg, rounded). Aqui liberamos os nomes
    // completos (padding, backgroundColor, borderRadius) para o código ficar mais legível.
    onlyAllowShorthands: false,
    allowedStyleValues: false,
    // Mantém o comportamento de layout do React Native (flex, flexBasis etc.)
    styleCompat: 'react-native',
  },
});

export type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
