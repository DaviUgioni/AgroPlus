// tamagui.config.ts
import { createFont, createTamagui } from 'tamagui';
import { createV6Config, themes, tokens } from '@tamagui/config/v6';
import { animations } from './animacoes';

// Paleta do AgroPlus. Use nos componentes como token (sem "$" no Tamagui 3):
// color="verde", backgroundColor="bege"... Em ícones, use o valor: cores.verde
// As cores que mudam entre claro e escuro ficam nos temas; as fixas, nos tokens.
const paletaClara = {
  verde: '#158540', // contraste ≥ 4,5:1 com texto branco
  verdeEscuro: '#0F6B31', // estado pressionado de botões verdes
  verdeSuave: '#EAF3DE', // fundo de selos e ícones
  verdeDestaque: '#158540', // fundo de cartões de destaque (totais)
  bege: '#E4DEC9',
  begeClaro: '#FAF8F3', // fundo das telas
  branco: '#FFFFFF', // superfície: cartões, campos, barras
  texto: '#1C1C1A',
  textoSec: '#66655F',
  textoTerc: '#76746B', // contraste ≥ 4,5:1 sobre branco (placeholders e legendas)
  borda: '#D3D1C7',
  bordaForte: '#BDBAAE',
  erro: '#C0392B',
  erroSuave: '#FDF0EE',
  alerta: '#B7791F', // atenção que não é erro (ex.: pronto para colher)
  alertaSuave: '#FDF4E3',
};

const paletaEscura: typeof paletaClara = {
  // No escuro o verde fica mais vivo (texto e ícones sobre fundo escuro); botões e blocos
  // com texto branco usam verdeDestaque, que é mais fechado.
  verde: '#34C26A',
  verdeEscuro: '#115A2E',
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

// Fonte Nunito (arredondada, boa leitura ao ar livre). Cada peso é um arquivo, então o
// Tamagui troca de família conforme o fontWeight. Os arquivos são carregados no App.
const faceNunito = {
  400: { normal: 'Nunito_400Regular' },
  500: { normal: 'Nunito_500Medium' },
  600: { normal: 'Nunito_600SemiBold' },
  700: { normal: 'Nunito_700Bold' },
  800: { normal: 'Nunito_800ExtraBold' },
};
const comNunito = (fonte: any) => createFont({ ...fonte, family: 'Nunito_400Regular', face: faceNunito } as any);

export const config = createTamagui({
  ...base,
  fonts: { ...base.fonts, body: comNunito(base.fonts.body), heading: comNunito(base.fonts.heading) },
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
