// Components/ui/ItemLista.tsx
import { ReactNode } from 'react';
import { Feather } from '@expo/vector-icons';
import { GetProps, Text, YStack } from 'tamagui';
import { cores } from '../../tamagui.config';
import { IconeFeather } from './Botao';
import { Cartao } from './Cartao';
import IconeLista from './IconeLista';
import { Legenda } from './Textos';

type ItemListaProps = GetProps<typeof Cartao> & {
  titulo: string;
  subtitulo?: string;
  /** Conteúdo à esquerda (imagem, ícone) */
  esquerda?: ReactNode;
  /** Atalho: mostra um quadrado com este ícone à esquerda (quando não há `esquerda`) */
  icone?: IconeFeather;
  /** Conteúdo à direita. Se omitido e houver onPress, mostra uma seta */
  direita?: ReactNode;
  /** Conteúdo extra abaixo do subtítulo */
  children?: ReactNode;
};

// Linha padrão das listas (propriedades, plantios, despesas...).
export default function ItemLista({
  titulo,
  subtitulo,
  esquerda,
  icone,
  direita,
  children,
  onPress,
  marginBottom = 10,
  ...props
}: ItemListaProps) {
  return (
    // O wrapper faz o item surgir suavemente quando a lista aparece
    <YStack transition="medium" opacity="1 enter:0" y="0 enter:12" marginBottom={marginBottom}>
      <Cartao interativo={!!onPress} onPress={onPress} flexDirection="row" alignItems="center" gap={12} padding={14} {...props}>
        {esquerda ?? (icone ? <IconeLista icone={icone} /> : null)}
        <YStack flex={1}>
          <Text fontSize={16} fontWeight="700" color="texto">
            {titulo}
          </Text>
          {subtitulo ? <Legenda marginTop={2}>{subtitulo}</Legenda> : null}
          {children}
        </YStack>
        {direita ?? (onPress ? <Feather name="chevron-right" size={20} color={cores.textoTerc} /> : null)}
      </Cartao>
    </YStack>
  );
}
