// Components/ui/Cartao.tsx
// Bloco com borda, sem sombra. Reserve para o que é mesmo um bloco (totais); listas usam ItemLista.
import { YStack, styled } from 'tamagui';

export const Cartao = styled(YStack, {
  backgroundColor: 'branco',
  borderRadius: 'lg',
  borderWidth: 1,
  borderColor: 'borda',
  padding: 12,
  transition: 'quick',

  variants: {
    tom: {
      branco: {},
      bege: { backgroundColor: 'bege', borderColor: 'bege' },
      verde: { backgroundColor: 'verdeDestaque', borderColor: 'verdeDestaque' },
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
