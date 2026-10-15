// Components/ui/Cabecalho.tsx
import { ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';
import BotaoVoltar from '../BotaoVoltar';
import { Subtitulo, Titulo } from './Textos';

type CabecalhoProps = {
  titulo: string;
  subtitulo?: string;
  /** Mostra o botão de voltar (padrão: true) */
  voltar?: boolean;
  /** Ações à direita do título */
  direita?: ReactNode;
};

export default function Cabecalho({ titulo, subtitulo, voltar = true, direita }: CabecalhoProps) {
  return (
    <XStack alignItems="center" gap={12} marginTop={12} marginBottom={16}>
      {voltar ? <BotaoVoltar /> : null}
      <YStack flex={1}>
        <Titulo numberOfLines={2}>{titulo}</Titulo>
        {subtitulo ? <Subtitulo numberOfLines={1}>{subtitulo}</Subtitulo> : null}
      </YStack>
      {direita}
    </XStack>
  );
}
