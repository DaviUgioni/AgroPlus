// Components/ui/ItemLista.tsx
import { ReactNode } from 'react';
import { Feather } from '@expo/vector-icons';
import { GetProps, Text, YStack } from 'tamagui';
import { cores } from '../../tamagui.config';
import { Cartao } from './Cartao';
import { Legenda } from './Textos';

type ItemListaProps = GetProps<typeof Cartao> & {
  titulo: string;
  subtitulo?: string;
  /** Conteúdo à esquerda (imagem, ícone) */
  esquerda?: ReactNode;
  /** Conteúdo à direita. Se omitido e houver onPress, mostra uma seta */
  direita?: ReactNode;
  /** Conteúdo extra abaixo do subtítulo */
  children?: ReactNode;
};

// Linha padrão das listas (propriedades, plantios, despesas...).
export default function ItemLista({ titulo, subtitulo, esquerda, direita, children, onPress, ...props }: ItemListaProps) {
  return (
    <Cartao
      interativo={!!onPress}
      onPress={onPress}
      flexDirection="row"
      alignItems="center"
      gap={12}
      padding={14}
      marginBottom={10}
      {...props}
    >
      {esquerda}
      <YStack flex={1}>
        <Text fontSize={15} fontWeight="600" color="texto">
          {titulo}
        </Text>
        {subtitulo ? <Legenda marginTop={2}>{subtitulo}</Legenda> : null}
        {children}
      </YStack>
      {direita ?? (onPress ? <Feather name="chevron-right" size={20} color={cores.textoTerc} /> : null)}
    </Cartao>
  );
}
