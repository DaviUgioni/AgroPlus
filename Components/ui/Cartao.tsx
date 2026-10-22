// Components/ui/Cartao.tsx
import { YStack, styled } from 'tamagui';

const SOMBRA = '0 1px 3px rgba(0, 0, 0, 0.06)';

export const Cartao = styled(YStack, {
  backgroundColor: 'branco',
  borderRadius: 'xl',
  borderWidth: 1,
  borderColor: 'borda',
  padding: 16,
  transition: 'quick',

  variants: {
    tom: {
      branco: { boxShadow: SOMBRA },
      bege: { backgroundColor: 'bege', borderColor: 'bege' },
      verde: { backgroundColor: 'verdeDestaque', borderColor: 'verdeDestaque', boxShadow: SOMBRA },
    },
    // Use em cartões clicáveis (com onPress): reduz a opacidade ao tocar
    interativo: {
      true: { opacity: '1 press:0.85', scale: '1 press:0.98', borderColor: 'borda press:bordaForte' },
    },
  } as const,

  defaultVariants: {
    tom: 'branco',
  },
});
