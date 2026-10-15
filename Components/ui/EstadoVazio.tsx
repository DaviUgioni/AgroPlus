// Components/ui/EstadoVazio.tsx
// Mensagem para listas vazias: explica o que é a tela e oferece o próximo passo.
import { Feather } from '@expo/vector-icons';
import { Text, YStack, YStackProps } from 'tamagui';
import { cores } from '../../tamagui.config';
import Botao, { IconeFeather } from './Botao';

type EstadoVazioProps = YStackProps & {
  texto: string;
  titulo?: string;
  icone?: IconeFeather;
  /** Botão com o próximo passo (ex.: "Cadastrar propriedade") */
  acao?: { titulo: string; icone?: IconeFeather; onPress: () => void };
};

export default function EstadoVazio({ texto, titulo, icone = 'inbox', acao, ...props }: EstadoVazioProps) {
  return (
    <YStack alignItems="center" gap={10} marginTop={40} paddingHorizontal={16} {...props}>
      <YStack
        width={64}
        height={64}
        borderRadius="full"
        backgroundColor="verdeSuave"
        alignItems="center"
        justifyContent="center"
        marginBottom={4}
      >
        <Feather name={icone} size={28} color={cores.verde} />
      </YStack>
      {titulo ? (
        <Text fontSize={17} fontWeight="600" color="texto" textAlign="center">
          {titulo}
        </Text>
      ) : null}
      <Text fontSize={15} lineHeight="22px" color="textoSec" textAlign="center">
        {texto}
      </Text>
      {acao ? <Botao icone={acao.icone ?? 'plus'} titulo={acao.titulo} marginTop={8} onPress={acao.onPress} /> : null}
    </YStack>
  );
}
