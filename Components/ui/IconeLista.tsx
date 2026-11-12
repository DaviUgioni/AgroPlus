// Components/ui/IconeLista.tsx
// Ícone neutro, sem fundo, no lugar da foto. O tamanho é o da foto, para manter a coluna alinhada.
import { Feather } from '@expo/vector-icons';
import { YStack } from 'tamagui';
import { cores } from '../../tamagui.config';
import { IconeFeather } from './Botao';

export default function IconeLista({ icone, tamanho = 48 }: { icone: IconeFeather; tamanho?: number }) {
  return (
    <YStack width={tamanho} height={tamanho} alignItems="center" justifyContent="center">
      <Feather name={icone} size={Math.round(tamanho * 0.45)} color={cores.textoTerc} />
    </YStack>
  );
}
