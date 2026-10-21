// Components/ui/Toast.tsx
// Aviso rápido no topo da tela (sucesso, erro, info). Substitui os Alert de uma linha só.
// Uso: toast.sucesso('Despesa cadastrada!') em qualquer lugar; o ProvedorToast fica no App.
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text, XStack } from 'tamagui';
import { cores } from '../../tamagui.config';
import { vibrar } from './vibrar';

type Tipo = 'sucesso' | 'erro' | 'info';
type Aviso = { id: number; tipo: Tipo; texto: string };

let mostrarAviso: ((tipo: Tipo, texto: string) => void) | null = null;

export const toast = {
  sucesso: (texto: string) => mostrarAviso?.('sucesso', texto),
  erro: (texto: string) => mostrarAviso?.('erro', texto),
  info: (texto: string) => mostrarAviso?.('info', texto),
};

const ICONES = { sucesso: 'check-circle', erro: 'alert-circle', info: 'info' } as const;
const DURACAO_MS = 3200;
const DURACAO_ERRO_MS = 5000;

export function ProvedorToast({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const progresso = useRef(new Animated.Value(0)).current;
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const esconder = useCallback(() => {
    Animated.timing(progresso, { toValue: 0, duration: 180, easing: Easing.in(Easing.ease), useNativeDriver: true }).start(
      ({ finished }) => finished && setAviso(null)
    );
  }, [progresso]);

  useEffect(() => {
    mostrarAviso = (tipo, texto) => {
      if (temporizador.current) clearTimeout(temporizador.current);
      setAviso({ id: Date.now(), tipo, texto });
      if (tipo === 'erro') vibrar('aviso');
      Animated.timing(progresso, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      temporizador.current = setTimeout(esconder, tipo === 'erro' ? DURACAO_ERRO_MS : DURACAO_MS);
    };
    return () => {
      mostrarAviso = null;
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [esconder, progresso]);

  const cor = aviso?.tipo === 'erro' ? cores.erro : aviso?.tipo === 'info' ? cores.textoSec : cores.verde;

  return (
    <>
      {children}
      {aviso ? (
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: insets.top + 8,
            left: 16,
            right: 16,
            opacity: progresso,
            transform: [{ translateY: progresso.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
          }}
        >
          <XStack
            alignItems="center"
            gap={10}
            backgroundColor="branco"
            borderWidth={1}
            borderColor="borda"
            borderLeftWidth={4}
            borderLeftColor={aviso.tipo === 'erro' ? 'erro' : aviso.tipo === 'info' ? 'textoSec' : 'verde'}
            borderRadius="lg"
            paddingVertical={12}
            paddingHorizontal={14}
            boxShadow="0 4px 14px rgba(0, 0, 0, 0.18)"
            onPress={esconder}
            accessibilityRole="alert"
          >
            <Feather name={ICONES[aviso.tipo]} size={20} color={cor} />
            <Text flex={1} fontSize={15} fontWeight="600" color="texto">
              {aviso.texto}
            </Text>
          </XStack>
        </Animated.View>
      ) : null}
    </>
  );
}
