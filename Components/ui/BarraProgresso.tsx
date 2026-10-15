// Components/ui/BarraProgresso.tsx
import { YStack, YStackProps } from 'tamagui';

type BarraProgressoProps = YStackProps & {
  /** Valor entre 0 e 1 */
  valor: number;
  cor?: string;
  fundo?: string;
};

export default function BarraProgresso({ valor, cor = 'verde', fundo = 'bege', ...props }: BarraProgressoProps) {
  const pct = Math.max(0, Math.min(1, valor)) * 100;
  return (
    <YStack height={8} borderRadius="full" backgroundColor={fundo} overflow="hidden" {...props}>
      <YStack height="100%" width={`${pct}%`} borderRadius="full" backgroundColor={cor} />
    </YStack>
  );
}
