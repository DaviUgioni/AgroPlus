// Components/ui/ItemLista.tsx
import { ReactNode } from 'react';
import { Feather } from '@expo/vector-icons';
import { Text, XStack, XStackProps, YStack } from 'tamagui';
import { cores } from '../../tamagui.config';
import { IconeFeather } from './Botao';
import IconeLista from './IconeLista';
import { Legenda } from './Textos';

type ItemListaProps = XStackProps & {
  titulo: string;
  subtitulo?: string;
  /** Conteúdo à esquerda (imagem, ícone) */
  esquerda?: ReactNode;
  /** Atalho: mostra este ícone à esquerda (quando não há `esquerda`) */
  icone?: IconeFeather;
  /** Conteúdo à direita. Se omitido e houver onPress, mostra uma seta */
  direita?: ReactNode;
  /** Conteúdo extra abaixo do subtítulo */
  children?: ReactNode;
};

// Linha padrão das listas (propriedades, plantios, despesas...): sem caixa, separada por um divisor.
export default function ItemLista({ titulo, subtitulo, esquerda, icone, direita, children, onPress, ...props }: ItemListaProps) {
  return (
    // O wrapper faz o item surgir suavemente quando a lista aparece
    <YStack transition="medium" opacity="1 enter:0" y="0 enter:12">
      <XStack
        alignItems="center"
        gap={12}
        minHeight={48}
        paddingVertical={12}
        borderBottomWidth={1}
        borderBottomColor="borda"
        transition="quick"
        opacity={onPress ? '1 press:0.6' : undefined}
        onPress={onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        {...props}
      >
        {esquerda ?? (icone ? <IconeLista icone={icone} /> : null)}
        <YStack flex={1}>
          <Text fontSize={16} fontWeight="700" color="texto">
            {titulo}
          </Text>
          {subtitulo ? <Legenda marginTop={2}>{subtitulo}</Legenda> : null}
          {children}
        </YStack>
        {direita ?? (onPress ? <Feather name="chevron-right" size={20} color={cores.textoTerc} /> : null)}
      </XStack>
    </YStack>
  );
}
