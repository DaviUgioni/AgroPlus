// Components/ui/Chip.tsx
import { Text, XStack } from 'tamagui';
import { vibrar } from './vibrar';

type ChipProps = {
  texto: string;
  ativo?: boolean;
  onPress?: () => void;
};

export default function Chip({ texto, ativo, onPress }: ChipProps) {
  return (
    <XStack
      borderWidth={1}
      borderColor={ativo ? 'verdeDestaque' : 'borda'}
      backgroundColor={ativo ? 'verdeDestaque' : 'branco'}
      boxShadow={ativo ? '0 2px 4px rgba(21, 133, 64, 0.25)' : undefined}
      borderRadius="full"
      paddingHorizontal={16}
      minHeight={40}
      alignItems="center"
      paddingVertical={8}
      transition="quick"
      opacity="1 press:0.8"
      scale="1 press:0.96"
      onPress={() => {
        vibrar();
        onPress?.();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: !!ativo }}
    >
      <Text fontSize={14} fontWeight="600" color={ativo ? 'sobreVerde' : 'textoSec'}>
        {texto}
      </Text>
    </XStack>
  );
}
