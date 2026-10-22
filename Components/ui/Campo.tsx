// Components/ui/Campo.tsx
import { ReactNode, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Input, InputProps, Text, XStack, YStack, styled } from 'tamagui';
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
  minHeight: 52,
  gap: 10,
  transition: 'quick',

  variants: {
    // Anel suave em volta do campo ativo: destaca o foco sem mudar o tamanho da caixa
    focado: {
      true: { borderColor: 'verde', boxShadow: '0 0 0 3px rgba(21, 133, 64, 0.18)' },
    },
    comErro: {
      true: { borderColor: 'erro', backgroundColor: 'erroSuave', boxShadow: '0 0 0 3px rgba(192, 57, 43, 0.15)' },
    },
  } as const,
});

type CampoProps = InputProps & {
  rotulo?: string;
  erro?: string;
  /** Explicação curta abaixo do campo (some quando há erro) */
  ajuda?: string;
  icone?: IconeFeather;
  /** Texto fixo antes do valor digitado (ex.: "R$") */
  prefixo?: string;
  /** Texto fixo depois do valor digitado (ex.: "ha") */
  sufixo?: string;
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
  prefixo,
  sufixo,
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
        {prefixo ? (
          <Text fontSize={16} fontWeight="700" color={focado ? 'verde' : 'textoSec'} marginTop={multiline ? 14 : 0}>
            {prefixo}
          </Text>
        ) : null}
        {/* A borda e o fundo ficam na CaixaCampo, então o Input vem "limpo" */}
        <Input
          flex={1}
          borderWidth={0}
          borderRadius={0}
          backgroundColor="transparent"
          paddingHorizontal={0}
          paddingVertical={13}
          fontSize={16}
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
        {sufixo ? (
          <Text fontSize={15} fontWeight="700" color="textoSec">
            {sufixo}
          </Text>
        ) : null}
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
