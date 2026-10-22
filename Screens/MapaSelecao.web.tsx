// Screens/MapaSelecao.web.tsx
// react-native-maps não tem versão web; no navegador a tela só explica e volta.
import { useNavigation } from '@react-navigation/native';
import { Cabecalho, EstadoVazio, Tela } from '../Components/ui';

export default function MapaSelecao() {
  const navigation = useNavigation();
  return (
    <Tela>
      <Cabecalho titulo="Selecionar localização" />
      <EstadoVazio
        icone="map"
        titulo="Mapa só no celular"
        texto="A escolha da localização no mapa funciona no app para Android e iOS."
        acao={{ titulo: 'Voltar', icone: 'arrow-left', onPress: () => navigation.goBack() }}
      />
    </Tela>
  );
}
