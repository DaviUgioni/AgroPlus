// Components/ui/ValoresOcultos.tsx
// Botão de olho que esconde ou mostra os valores dos cartões de gasto. O estado é único
// para o app inteiro e fica salvo no aparelho. Só o botão e os textos (`Oculto`) assinam
// o estado: assim o toque não re-renderiza as telas inteiras, que ficam montadas nas abas.
import { useSyncExternalStore } from 'react';
import { Feather } from '@expo/vector-icons';
import { YStack } from 'tamagui';
import { cores } from '../../tamagui.config';
import { lerPreferencias, salvarPreferencia } from '../../Services/preferencias';

let ocultos = false;
const ouvintes = new Set<() => void>();

function definir(valor: boolean) {
  ocultos = valor;
  ouvintes.forEach((o) => o());
}

lerPreferencias().then((p) => definir(!!p.ocultarValores));

function inscrever(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

const useOcultos = () => useSyncExternalStore(inscrever, () => ocultos);

/** Valor em reais que some quando o olho está fechado. Use dentro de um texto. */
export function Oculto({ children }: { children: string }) {
  return <>{useOcultos() ? 'R$ ••••' : children}</>;
}

export function BotaoOlho() {
  const valor = useOcultos();
  return (
    <YStack
      width={40}
      height={40}
      marginVertical={-8}
      borderRadius="full"
      alignItems="center"
      justifyContent="center"
      backgroundColor="transparent press:sobreVerdeFundo"
      onPress={() => {
        definir(!valor);
        salvarPreferencia('ocultarValores', !valor);
      }}
      accessibilityRole="button"
      accessibilityLabel={valor ? 'Mostrar valores' : 'Esconder valores'}
      accessibilityState={{ selected: valor }}
    >
      <Feather name={valor ? 'eye-off' : 'eye'} size={20} color={cores.sobreVerdeSuave} />
    </YStack>
  );
}
