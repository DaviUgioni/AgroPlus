// Components/FaixaMarca.tsx
// Faixa verde do topo das telas de entrada (login e criar conta): logo, título e subtítulo.
import { Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';
import BotaoVoltar from './BotaoVoltar';
import { Subtitulo, Titulo } from './ui';

type Props = {
  titulo: string;
  subtitulo: string;
  /** Mostra o botão de voltar no canto (usado em "Criar conta") */
  voltar?: boolean;
  /** Versão mais baixa, com logo menor */
  compacta?: boolean;
};

export default function FaixaMarca({ titulo, subtitulo, voltar, compacta }: Props) {
  const insets = useSafeAreaInsets();
  const logo = compacta ? 72 : 112;
  return (
    <YStack
      backgroundColor="verdeDestaque"
      alignItems="center"
      paddingTop={insets.top + (compacta ? 16 : 36)}
      paddingBottom={compacta ? 28 : 44}
      paddingHorizontal={24}
      borderBottomLeftRadius={40}
      borderBottomRightRadius={40}
    >
      {voltar ? (
        <YStack position="absolute" top={insets.top + 8} left={16}>
          <BotaoVoltar />
        </YStack>
      ) : null}
      <YStack
        width={logo}
        height={logo}
        borderRadius="full"
        backgroundColor="branco"
        alignItems="center"
        justifyContent="center"
        marginBottom={compacta ? 12 : 16}
        boxShadow="0 6px 16px rgba(0, 0, 0, 0.2)"
      >
        <Image source={require('../assets/logo.png')} style={{ width: logo * 0.75, height: logo * 0.75 }} resizeMode="contain" />
      </YStack>
      <Titulo fontSize={compacta ? 24 : 26} fontWeight="800" color="sobreVerde" textAlign="center">
        {titulo}
      </Titulo>
      <Subtitulo textAlign="center" marginTop={4} color="sobreVerdeSuave">
        {subtitulo}
      </Subtitulo>
    </YStack>
  );
}
