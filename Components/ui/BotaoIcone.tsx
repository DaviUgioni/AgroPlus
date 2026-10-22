// Components/ui/BotaoIcone.tsx
// Botão redondo só com ícone (ajuda, configurações, menu). O rótulo é obrigatório
// porque é o único texto que o leitor de tela anuncia.
import { Feather } from '@expo/vector-icons';
import { YStack, YStackProps } from 'tamagui';
import { cores } from '../../tamagui.config';
import { IconeFeather } from './Botao';

type BotaoIconeProps = YStackProps & {
  icone: IconeFeather;
  rotulo: string;
};

export default function BotaoIcone({ icone, rotulo, ...props }: BotaoIconeProps) {
  return (
    <YStack
      width={44}
      height={44}
      borderRadius="full"
      alignItems="center"
      justifyContent="center"
      backgroundColor="transparent press:begeClaro"
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      {...props}
    >
      <Feather name={icone} size={22} color={cores.textoSec} />
    </YStack>
  );
}
