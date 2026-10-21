// Components/ui/Seletor.tsx
// Substitui o @react-native-picker/picker: abre uma lista de opções numa folha inferior.
import { useState } from 'react';
import { Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text, XStack, YStack } from 'tamagui';
import { cores } from '../../tamagui.config';
import { CaixaCampo } from './Campo';
import { Rotulo, TextoAjuda } from './Textos';
import { vibrar } from './vibrar';

export interface OpcaoSeletor<T> {
  label: string;
  valor: T;
}

type SeletorProps<T> = {
  rotulo?: string;
  valor: T;
  opcoes: OpcaoSeletor<T>[];
  aoMudar: (valor: T) => void;
  placeholder?: string;
  /** Explicação curta abaixo do campo */
  ajuda?: string;
  /** Versão mais baixa, para filtros lado a lado */
  compacto?: boolean;
};

export default function Seletor<T extends string | number>({
  rotulo,
  valor,
  opcoes,
  aoMudar,
  placeholder = 'Selecione',
  ajuda,
  compacto,
}: SeletorProps<T>) {
  const [aberto, setAberto] = useState(false);
  const insets = useSafeAreaInsets();
  const selecionada = opcoes.find((o) => o.valor === valor);

  function escolher(v: T) {
    vibrar();
    aoMudar(v);
    setAberto(false);
  }

  return (
    <YStack>
      {rotulo ? (
        <Rotulo marginTop={compacto ? 0 : 12} fontSize={compacto ? 13 : 14}>
          {rotulo}
        </Rotulo>
      ) : null}

      <CaixaCampo
        focado={aberto}
        minHeight={compacto ? 42 : 50}
        justifyContent="space-between"
        onPress={() => setAberto(true)}
        accessibilityRole="button"
        accessibilityLabel={rotulo ? `${rotulo}: ${selecionada?.label ?? placeholder}` : undefined}
      >
        <Text
          flex={1}
          numberOfLines={1}
          fontSize={compacto ? 14 : 15}
          color={selecionada ? 'texto' : 'textoTerc'}
        >
          {selecionada?.label ?? placeholder}
        </Text>
        <Feather name="chevron-down" size={18} color={cores.textoSec} />
      </CaixaCampo>
      {ajuda ? <TextoAjuda>{ajuda}</TextoAjuda> : null}

      <Modal
        visible={aberto}
        transparent
        animationType="fade" // só o fundo escurece; a folha sobe pela animação abaixo
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setAberto(false)}
      >
        <YStack flex={1} justifyContent="flex-end" backgroundColor="rgba(0, 0, 0, 0.35)">
          {/* Toque fora da folha fecha o seletor */}
          <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            onPress={() => setAberto(false)}
            accessibilityLabel="Fechar"
          />
          <YStack
            backgroundColor="branco"
            borderTopLeftRadius="3xl"
            borderTopRightRadius="3xl"
            paddingTop={12}
            paddingBottom={insets.bottom + 12}
            maxHeight="70%"
            animation="medium"
            y="enter:400"
          >
            <YStack alignSelf="center" width={40} height={4} borderRadius="full" backgroundColor="borda" />
            <Text fontSize={16} fontWeight="600" color="texto" paddingHorizontal={20} paddingTop={16} paddingBottom={8}>
              {rotulo ?? placeholder}
            </Text>
            <ScrollView>
              {opcoes.map((o) => {
                const ativa = o.valor === valor;
                return (
                  <XStack
                    key={String(o.valor)}
                    alignItems="center"
                    justifyContent="space-between"
                    paddingHorizontal={20}
                    paddingVertical={14}
                    backgroundColor={ativa ? 'verdeSuave' : 'transparent press:begeClaro'}
                    onPress={() => escolher(o.valor)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: ativa }}
                  >
                    <Text flex={1} fontSize={15} color={ativa ? 'verde' : 'texto'} fontWeight={ativa ? '600' : '400'}>
                      {o.label}
                    </Text>
                    {ativa ? <Feather name="check" size={18} color={cores.verde} /> : null}
                  </XStack>
                );
              })}
            </ScrollView>
          </YStack>
        </YStack>
      </Modal>
    </YStack>
  );
}
