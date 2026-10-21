// Components/ui/Esqueleto.tsx
// Blocos cinza que pulsam enquanto os dados carregam (no lugar do spinner solto).
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { YStack, YStackProps } from 'tamagui';
import { cores } from '../../tamagui.config';

export function Esqueleto({ largura = '100%', altura = 16, raio = 8 }: { largura?: number | string; altura?: number; raio?: number }) {
  const opacidade = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const laco = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidade, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacidade, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ])
    );
    laco.start();
    return () => laco.stop();
  }, [opacidade]);

  return (
    <Animated.View
      style={{ width: largura as any, height: altura, borderRadius: raio, backgroundColor: cores.bege, opacity: opacidade }}
    />
  );
}

/** Lista de cartões-fantasma, com o mesmo formato de um ItemLista. */
export function ListaEsqueleto({ quantidade = 4, ...props }: { quantidade?: number } & YStackProps) {
  return (
    <YStack gap={10} {...props} accessibilityLabel="Carregando" accessibilityRole="progressbar">
      {Array.from({ length: quantidade }).map((_, i) => (
        <YStack key={i} backgroundColor="branco" borderWidth={1} borderColor="borda" borderRadius="xl" padding={14} gap={8}>
          <Esqueleto largura="55%" altura={16} />
          <Esqueleto largura="80%" altura={13} />
        </YStack>
      ))}
    </YStack>
  );
}
