// Components/ui/Campo.tsx
import { ReactNode, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Input, InputProps, XStack, YStack, styled } from 'tamagui';
import { cores } from '../../tamagui.config';
import { IconeFeather } from './Botao';
import { Rotulo, TextoAjuda, TextoErro } from './Textos';

// Moldura de campo, compartilhada com o Seletor.
export const CaixaCampo = styled(XStack, {
  alignItems: 'center',
  backgroundColor: 'branco',
  borderWidth: 1,
  borderColor: 'borda',
  borderRadius: 'lg',
  paddingHorizontal: 14,
  minHeight: 50,
  gap: 10,

  variants: {
    focado: {
      true: { borderColor: 'verde' },
    },
    comErro: {
      true: { borderColor: 'erro' },
    },
  } as const,
});

type CampoProps = InputProps & {
  rotulo?: string;
  erro?: string;
  /** Explicação curta abaixo do campo (some quando há erro) */
  ajuda?: string;
  icone?: IconeFeather;
  /** Mostra o botão de olho para exibir/ocultar a senha */
  senha?: boolean;
  /** Conteúdo extra à direita do campo (ex.: um botão) */
  direita?: ReactNode;
};

export default function Campo({
  rotulo,
  erro,
  ajuda,
  icone,
  senha,
  direita,
  secureTextEntry,
  multiline,
  onFocus,
  onBlur,
  ...props
}: CampoProps) {
  const [focado, setFocado] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  return (
    <YStack>
      {rotulo ? <Rotulo>{rotulo}</Rotulo> : null}
      <CaixaCampo focado={focado} comErro={!!erro} alignItems={multiline ? 'flex-start' : 'center'}>
        {icone ? (
          <Feather
            name={icone}
            size={18}
            color={focado ? cores.verde : cores.textoTerc}
            style={multiline ? { marginTop: 15 } : undefined}
          />
        ) : null}
        {/* A borda e o fundo ficam na CaixaCampo, então o Input vem "limpo" */}
        <Input
          flex={1}
          borderWidth={0}
          borderRadius={0}
          backgroundColor="transparent"
          paddingHorizontal={0}
          paddingVertical={13}
          fontSize={15}
          color="texto"
          placeholderTextColor="textoTerc"
          selectionColor="verde"
          multiline={multiline}
          secureTextEntry={senha ? !mostrarSenha : secureTextEntry}
          onFocus={(e) => {
            setFocado(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocado(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {senha ? (
          <YStack
            padding={4}
            onPress={() => setMostrarSenha((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
          >
            <Feather name={mostrarSenha ? 'eye-off' : 'eye'} size={18} color={cores.textoTerc} />
          </YStack>
        ) : null}
        {direita}
      </CaixaCampo>
      {erro ? <TextoErro>{erro}</TextoErro> : ajuda ? <TextoAjuda>{ajuda}</TextoAjuda> : null}
    </YStack>
  );
}
