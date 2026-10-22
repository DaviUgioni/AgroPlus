// Components/ui/Confirmar.tsx
// Confirmação em folha inferior, no lugar do Alert do sistema.
// Uso: if (!(await confirmar({ titulo: 'Excluir plantio?', texto: '...' }))) return;
import { ReactNode, useEffect, useRef, useState } from 'react';
import { Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text, XStack, YStack } from 'tamagui';
import { cores } from '../../tamagui.config';
import Botao from './Botao';

export type OpcoesConfirmar = {
  titulo: string;
  texto?: string;
  /** Texto do botão de confirmação (padrão: "Excluir" se for perigoso, senão "Confirmar") */
  confirmar?: string;
  /** Ação destrutiva: botão vermelho. Padrão: true */
  perigo?: boolean;
};

let abrirConfirmacao: ((o: OpcoesConfirmar) => Promise<boolean>) | null = null;

/** Abre a folha de confirmação e resolve true (confirmou) ou false (cancelou). */
export function confirmar(opcoes: OpcoesConfirmar): Promise<boolean> {
  return abrirConfirmacao ? abrirConfirmacao(opcoes) : Promise.resolve(true);
}

export function ProvedorConfirmar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [opcoes, setOpcoes] = useState<OpcoesConfirmar | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  useEffect(() => {
    abrirConfirmacao = (o) =>
      new Promise<boolean>((resolve) => {
        resolver.current?.(false);
        resolver.current = resolve;
        setOpcoes(o);
      });
    return () => {
      abrirConfirmacao = null;
    };
  }, []);

  function responder(valor: boolean) {
    setOpcoes(null);
    resolver.current?.(valor);
    resolver.current = null;
  }

  const perigo = opcoes?.perigo ?? true;

  return (
    <>
      {children}
      <Modal visible={!!opcoes} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={() => responder(false)}>
        <YStack flex={1} justifyContent="flex-end" backgroundColor="rgba(0, 0, 0, 0.4)">
          <YStack position="absolute" top={0} left={0} right={0} bottom={0} onPress={() => responder(false)} accessibilityLabel="Fechar" />
          <YStack
            backgroundColor="branco"
            borderTopLeftRadius="3xl"
            borderTopRightRadius="3xl"
            padding={20}
            paddingBottom={insets.bottom + 20}
            gap={12}
            transition="medium"
            y="0 enter:400"
          >
            <XStack alignItems="center" gap={12}>
              <YStack width={44} height={44} borderRadius="full" alignItems="center" justifyContent="center" backgroundColor={perigo ? 'erroSuave' : 'verdeSuave'}>
                <Feather name={perigo ? 'alert-triangle' : 'help-circle'} size={22} color={perigo ? cores.erro : cores.verde} />
              </YStack>
              <Text flex={1} fontSize={19} fontWeight="800" color="texto">
                {opcoes?.titulo}
              </Text>
            </XStack>
            {opcoes?.texto ? (
              <Text fontSize={15} lineHeight="22px" color="textoSec">
                {opcoes.texto}
              </Text>
            ) : null}
            <XStack gap={8} marginTop={4}>
              <Botao flex={1} variante="contorno" titulo="Cancelar" onPress={() => responder(false)} />
              <Botao
                flex={1}
                variante={perigo ? 'perigo' : 'primario'}
                titulo={opcoes?.confirmar ?? (perigo ? 'Excluir' : 'Confirmar')}
                onPress={() => responder(true)}
              />
            </XStack>
          </YStack>
        </YStack>
      </Modal>
    </>
  );
}
