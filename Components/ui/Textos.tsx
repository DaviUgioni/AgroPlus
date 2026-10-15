// Components/ui/Textos.tsx
// Tipografia padrão do app. Cores vêm dos tokens definidos em tamagui.config.ts.
// Nenhum texto de leitura fica abaixo de 13 px, para ser legível ao ar livre.
import { styled, Text } from 'tamagui';

export const Titulo = styled(Text, {
  fontSize: 22,
  fontWeight: '600',
  color: 'texto',
});

export const Subtitulo = styled(Text, {
  fontSize: 15,
  color: 'textoSec',
});

export const Rotulo = styled(Text, {
  fontSize: 14,
  fontWeight: '600',
  color: 'texto',
  marginTop: 14,
  marginBottom: 6,
});

export const Corpo = styled(Text, {
  fontSize: 15,
  color: 'texto',
});

export const Legenda = styled(Text, {
  fontSize: 13,
  color: 'textoSec',
});

export const TituloSecao = styled(Text, {
  fontSize: 13,
  fontWeight: '700',
  color: 'textoSec',
  textTransform: 'uppercase',
  letterSpacing: 0.6,
  marginBottom: 8,
});

export const TextoAjuda = styled(Text, {
  fontSize: 13,
  color: 'textoSec',
  marginTop: 6,
});

export const TextoErro = styled(Text, {
  fontSize: 13,
  fontWeight: '500',
  color: 'erro',
  marginTop: 6,
});
