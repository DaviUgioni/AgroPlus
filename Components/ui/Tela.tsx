// Components/ui/Tela.tsx
import { ReactNode } from 'react';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { Spinner, YStack, YStackProps } from 'tamagui';
import { cores } from '../../tamagui.config';

type TelaProps = YStackProps & {
  edges?: Edge[];
  fundo?: 'claro' | 'branco';
  children: ReactNode;
};

// Container padrão das telas: área segura, fundo e margem lateral de 20.
export default function Tela({ edges, fundo = 'claro', children, ...props }: TelaProps) {
  const backgroundColor = fundo === 'branco' ? cores.branco : cores.begeClaro;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={edges}>
      <YStack
        flex={1}
        paddingHorizontal={20}
        animation="medium"
        opacity="enter:0"
        y="enter:8"
        {...props}
      >
        {children}
      </YStack>
    </SafeAreaView>
  );
}

export function TelaCarregando() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.begeClaro }}>
      <Carregando flex={1} marginTop={0} />
    </SafeAreaView>
  );
}

export function Carregando(props: YStackProps) {
  return (
    <YStack alignItems="center" justifyContent="center" marginTop={40} {...props}>
      <Spinner size="large" color="verde" />
    </YStack>
  );
}
