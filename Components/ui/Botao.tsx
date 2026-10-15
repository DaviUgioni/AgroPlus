// Components/ui/Botao.tsx
import { ComponentProps } from 'react';
import { Feather } from '@expo/vector-icons';
import { GetProps, Spinner, Text, XStack, styled } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores } from '../../tamagui.config';

export type IconeFeather = ComponentProps<typeof Feather>['name'];

type Variante = 'primario' | 'secundario' | 'contorno' | 'perigo' | 'texto';
type Tamanho = 'sm' | 'md';

// No Tamagui 3 o estado pressionado é uma "cláusula" no próprio valor:
// backgroundColor: 'verde press:verdeEscuro' = verde normal, verde escuro ao tocar.
const Moldura = styled(XStack, {
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  borderRadius: 'xl',
  borderWidth: 1.5,
  borderColor: 'transparent',
  paddingVertical: 14,
  paddingHorizontal: 16,

  variants: {
    variante: {
      primario: {
        backgroundColor: 'verde press:verdeEscuro',
        borderColor: 'verde press:verdeEscuro',
      },
      secundario: {
        backgroundColor: 'branco press:verdeSuave',
        borderColor: 'verde',
      },
      contorno: {
        backgroundColor: 'branco press:begeClaro',
        borderColor: 'borda',
        borderWidth: 1,
      },
      perigo: {
        backgroundColor: 'erroSuave',
        borderColor: 'erroSuave',
        opacity: 'press:0.75',
      },
      texto: {
        backgroundColor: 'transparent',
        paddingHorizontal: 8,
        opacity: 'press:0.6',
      },
    },
    tamanho: {
      sm: {
        minHeight: 42,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 'lg',
        gap: 6,
      },
      md: {},
    },
    desabilitado: {
      true: { opacity: 0.55 },
    },
  } as const,

  defaultVariants: {
    variante: 'primario',
    tamanho: 'md',
  },
});

const corDoConteudo = (variante: Variante): string =>
  ({
    primario: cores.sobreVerde,
    secundario: cores.verde,
    contorno: cores.verde,
    perigo: cores.erro,
    texto: cores.verde,
  })[variante];

export type BotaoProps = Omit<GetProps<typeof Moldura>, 'children' | 'variante' | 'tamanho'> & {
  titulo?: string;
  icone?: IconeFeather;
  variante?: Variante;
  tamanho?: Tamanho;
  carregando?: boolean;
  disabled?: boolean;
  /** Sobrescreve a cor do texto e do ícone */
  cor?: string;
};

export default function Botao({
  titulo,
  icone,
  variante = 'primario',
  tamanho = 'md',
  carregando,
  disabled,
  cor,
  onPress,
  ...props
}: BotaoProps) {
  const corConteudo = cor ?? corDoConteudo(variante);
  const bloqueado = !!(disabled || carregando);
  const pequeno = tamanho === 'sm';

  return (
    <Moldura
      variante={variante}
      tamanho={tamanho}
      desabilitado={bloqueado}
      onPress={bloqueado ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: bloqueado, busy: !!carregando }}
      {...props}
    >
      {carregando ? (
        <Spinner color={corConteudo} />
      ) : icone ? (
        <Feather name={icone} size={pequeno ? 15 : 18} color={corConteudo} />
      ) : null}
      {titulo ? (
        <Text color={corConteudo} fontSize={pequeno ? 14 : 16} fontWeight="600">
          {titulo}
        </Text>
      ) : null}
    </Moldura>
  );
}

// Botão fixo no rodapé da tela, acima da área segura (ex.: "Nova propriedade").
export function BotaoFlutuante(props: BotaoProps) {
  const insets = useSafeAreaInsets();
  return (
    <Botao
      position="absolute"
      left={20}
      right={20}
      bottom={Math.max(insets.bottom, 12) + 8}
      boxShadow="0 4px 12px rgba(0, 0, 0, 0.18)"
      {...props}
    />
  );
}
