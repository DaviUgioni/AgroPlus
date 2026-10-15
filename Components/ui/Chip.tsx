// Components/ui/Chip.tsx
import { Text, XStack } from 'tamagui';

type ChipProps = {
  texto: string;
  ativo?: boolean;
  onPress?: () => void;
};

export default function Chip({ texto, ativo, onPress }: ChipProps) {
  return (
    <XStack
      borderWidth={1}
      borderColor={ativo ? 'verde' : 'borda'}
      backgroundColor={ativo ? 'verde' : 'branco'}
      borderRadius="full"
      paddingHorizontal={16}
      minHeight={40}
      alignItems="center"
      paddingVertical={8}
      opacity="press:0.8"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!ativo }}
    >
      <Text fontSize={14} fontWeight="600" color={ativo ? 'sobreVerde' : 'textoSec'}>
        {texto}
      </Text>
    </XStack>
  );
}
