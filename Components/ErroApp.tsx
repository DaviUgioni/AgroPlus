// Components/ErroApp.tsx
// Rede de segurança: se uma tela lançar erro ao renderizar, mostra um aviso com botão para
// tentar de novo em vez de fechar o app.
import { Component, ReactNode } from 'react';
import { Text, YStack } from 'tamagui';
import { Botao } from './ui';

type Estado = { erro: Error | null };

export default class ErroApp extends Component<{ children: ReactNode }, Estado> {
  state: Estado = { erro: null };

  static getDerivedStateFromError(erro: Error): Estado {
    return { erro };
  }

  componentDidCatch(erro: Error) {
    console.log('Erro de renderização:', erro);
  }

  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap={12} padding={32} backgroundColor="begeClaro">
        <Text fontSize={22} fontWeight="800" color="texto" textAlign="center">
          Algo deu errado
        </Text>
        <Text fontSize={15} color="textoSec" textAlign="center">
          Não foi possível mostrar esta tela. Seus dados estão salvos. Toque abaixo para tentar de novo.
        </Text>
        <Botao icone="refresh-cw" titulo="Tentar de novo" marginTop={8} onPress={() => this.setState({ erro: null })} />
      </YStack>
    );
  }
}
