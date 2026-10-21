// Components/ui/IconeLista.tsx
// Quadrado com ícone para a esquerda dos itens de lista (no lugar de foto, quando não há).
import { Feather } from '@expo/vector-icons';
import { YStack } from 'tamagui';
import { cores } from '../../tamagui.config';
import { IconeFeather } from './Botao';

export default function IconeLista({ icone, tamanho = 48, tom = 'verde' }: { icone: IconeFeather; tamanho?: number; tom?: 'verde' | 'alerta' }) {
  const alerta = tom === 'alerta';
  return (
    <YStack
      width={tamanho}
      height={tamanho}
      borderRadius="lg"
      backgroundColor={alerta ? 'alertaSuave' : 'verdeSuave'}
      alignItems="center"
      justifyContent="center"
    >
      <Feather name={icone} size={Math.round(tamanho * 0.45)} color={alerta ? cores.alerta : cores.verde} />
    </YStack>
  );
}
