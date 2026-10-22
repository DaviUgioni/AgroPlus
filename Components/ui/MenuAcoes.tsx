// Components/ui/MenuAcoes.tsx
// Botão de três pontinhos que abre uma folha inferior com ações secundárias (editar, excluir...).
import { useState } from 'react';
import { Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text, XStack, YStack, YStackProps } from 'tamagui';
import { cores } from '../../tamagui.config';
import { IconeFeather } from './Botao';
import { vibrar } from './vibrar';

export type AcaoMenu = {
  titulo: string;
  icone: IconeFeather;
  onPress: () => void;
  /** Ação destrutiva: aparece em vermelho */
  perigo?: boolean;
};

type MenuAcoesProps = YStackProps & {
  acoes: AcaoMenu[];
  titulo?: string;
  rotulo?: string;
};

export default function MenuAcoes({ acoes, titulo, rotulo = 'Mais opções', ...props }: MenuAcoesProps) {
  const [aberto, setAberto] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <>
      <YStack
        width={44}
        height={44}
        borderRadius="full"
        alignItems="center"
        justifyContent="center"
        backgroundColor="transparent press:begeClaro"
        onPress={() => setAberto(true)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={rotulo}
        {...props}
      >
        <Feather name="more-horizontal" size={22} color={cores.textoSec} />
      </YStack>

      <Modal visible={aberto} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={() => setAberto(false)}>
        <YStack flex={1} justifyContent="flex-end" backgroundColor="rgba(0, 0, 0, 0.35)">
          <YStack position="absolute" top={0} left={0} right={0} bottom={0} onPress={() => setAberto(false)} accessibilityLabel="Fechar" />
          <YStack
            backgroundColor="branco"
            borderTopLeftRadius="3xl"
            borderTopRightRadius="3xl"
            paddingTop={12}
            paddingBottom={insets.bottom + 12}
            transition="medium"
            y="0 enter:400"
          >
            <YStack alignSelf="center" width={40} height={4} borderRadius="full" backgroundColor="borda" />
            {titulo ? (
              <Text fontSize={16} fontWeight="700" color="texto" paddingHorizontal={20} paddingTop={16} paddingBottom={4}>
                {titulo}
              </Text>
            ) : null}
            {acoes.map((a) => (
              <XStack
                key={a.titulo}
                alignItems="center"
                gap={14}
                minHeight={54}
                paddingHorizontal={20}
                backgroundColor="transparent press:begeClaro"
                onPress={() => {
                  vibrar(a.perigo ? 'aviso' : 'leve');
                  setAberto(false);
                  // espera a folha fechar para o Alert ou a tela seguinte não competirem com o Modal
                  setTimeout(a.onPress, 220);
                }}
                accessibilityRole="button"
              >
                <Feather name={a.icone} size={20} color={a.perigo ? cores.erro : cores.textoSec} />
                <Text fontSize={16} fontWeight="600" color={a.perigo ? 'erro' : 'texto'}>
                  {a.titulo}
                </Text>
              </XStack>
            ))}
          </YStack>
        </YStack>
      </Modal>
    </>
  );
}
