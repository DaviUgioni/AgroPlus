// Components/BotaoVoltar.tsx
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { YStack, YStackProps } from 'tamagui';
import { cores } from '../tamagui.config';

export default function BotaoVoltar(props: YStackProps) {
  const navigation = useNavigation();

  return (
    <YStack
      width={44}
      height={44}
      borderRadius="full"
      alignItems="center"
      justifyContent="center"
      backgroundColor="branco press:verdeSuave"
      borderWidth={1}
      borderColor="borda press:verde"
      onPress={() => navigation.goBack()}
      hitSlop={10}
      accessibilityLabel="Voltar"
      accessibilityRole="button"
      {...props}
    >
      <Feather name="arrow-left" size={20} color={cores.verde} />
    </YStack>
  );
}
