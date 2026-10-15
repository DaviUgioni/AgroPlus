// Components/ui/Dica.tsx
// Caixa de ajuda para explicar termos ou próximos passos ao usuário.
import { ReactNode } from 'react';
import { Feather } from '@expo/vector-icons';
import { Text, XStack, XStackProps } from 'tamagui';
import { cores } from '../../tamagui.config';
import { IconeFeather } from './Botao';

type DicaProps = XStackProps & {
  children: ReactNode;
  icone?: IconeFeather;
  tom?: 'info' | 'alerta';
};

export default function Dica({ children, icone = 'info', tom = 'info', ...props }: DicaProps) {
  const alerta = tom === 'alerta';
  return (
    <XStack
      gap={10}
      alignItems="flex-start"
      backgroundColor={alerta ? 'erroSuave' : 'verdeSuave'}
      borderRadius="lg"
      paddingVertical={10}
      paddingHorizontal={12}
      {...props}
    >
      <Feather name={icone} size={16} color={alerta ? cores.erro : cores.verde} style={{ marginTop: 2 }} />
      <Text flex={1} fontSize={13} lineHeight="19px" color={alerta ? 'erro' : 'texto'}>
        {children}
      </Text>
    </XStack>
  );
}
