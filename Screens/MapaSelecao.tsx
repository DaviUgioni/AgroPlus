// Screens/MapaSelecao.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation, useRoute, useFocusEffect, RouteProp, NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Spinner, Text, XStack, YStack } from 'tamagui';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import { Botao } from '../Components/ui';
import { useModo } from '../Components/ModoContext';
import { mensagemErro } from '../Services/erros';

// Estilo noturno do Google Maps (Android). No iOS o mapa usa userInterfaceStyle.
const ESTILO_MAPA_ESCURO = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];

type MapaSelecaoRouteProp = RouteProp<RootStackParamList, 'MapaSelecao'>;
type MapaSelecaoNavigationProp = NavigationProp<RootStackParamList, 'MapaSelecao'>;

interface LocalizacaoSelecionada {
  latitude: number;
  longitude: number;
  endereco?: string;
}

const REGIAO_INICIAL = {
  latitude: -28.68,
  longitude: -49.37,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

export default function MapaSelecao() {
  const navigation = useNavigation<MapaSelecaoNavigationProp>();
  const route = useRoute<MapaSelecaoRouteProp>();
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();
  const { escuro } = useModo();

  const [regiao, setRegiao] = useState(REGIAO_INICIAL);
  const [localizacaoSelecionada, setLocalizacaoSelecionada] = useState<LocalizacaoSelecionada | null>(null);
  const [carregandoEndereco, setCarregandoEndereco] = useState(false);
  const [enderecoAtual, setEnderecoAtual] = useState('');
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Request location permission when screen gains focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermissionGranted(status === 'granted');
      })();
      return () => {};
    }, [])
  );

  useEffect(() => {
    if (route.params?.latitude && route.params?.longitude) {
      const coords = {
        latitude: route.params.latitude,
        longitude: route.params.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegiao(coords);
      setLocalizacaoSelecionada({
        latitude: route.params.latitude,
        longitude: route.params.longitude,
      });
      buscarEndereco(route.params.latitude, route.params.longitude);
    }
  }, []);

  const buscarEndereco = async (lat: number, lng: number) => {
    // Mostra coordenada imediata e depois tenta geocoding nativo (sem OSM)
    setEnderecoAtual(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setCarregandoEndereco(true);
    try {
      const res = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (res && res.length > 0) {
        const p = res[0] as any;
        const partes = [p.street, p.streetNumber, p.district, p.city || p.subregion, p.region, p.country].filter(Boolean);
        const endereco = partes.length > 0 ? partes.join(', ') : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setEnderecoAtual(endereco);
        setLocalizacaoSelecionada((prev) => (prev ? { ...prev, endereco } : null));
      }
    } catch {}
    setCarregandoEndereco(false);
  };

  const handlePressMap = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLocalizacaoSelecionada({ latitude, longitude });
    buscarEndereco(latitude, longitude);
  };

  const handleConfirmar = () => {
    if (!localizacaoSelecionada) {
      Alert.alert('Atenção', 'Selecione uma localização no mapa.');
      return;
    }
    // No React Navigation 7 o navigate() empilha uma nova tela; popTo volta
    // para o formulário que já está na pilha e preserva o que foi digitado.
    (navigation as any).popTo(
      'PropriedadeForm',
      {
        propriedadeId: route.params?.propriedadeId,
        latitude: localizacaoSelecionada.latitude,
        longitude: localizacaoSelecionada.longitude,
        endereco: localizacaoSelecionada.endereco || enderecoAtual,
      },
      { merge: true }
    );
  };

  const handleMinhaLocalizacao = async () => {
    if (!locationPermissionGranted) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Permita o acesso à localização nas configurações do app.');
        return;
      }
      setLocationPermissionGranted(true);
    }
    setLocationLoading(true);
    try {
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      setLocalizacaoSelecionada({ latitude, longitude });
      buscarEndereco(latitude, longitude);
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    } catch (err) {
      Alert.alert('Erro', mensagemErro(err, 'Não foi possível obter a localização.'));
      console.error(err);
    } finally {
      setLocationLoading(false);
    }
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.branco }} edges={['left', 'right']}>
      <XStack
        alignItems="center"
        justifyContent="space-between"
        gap={8}
        paddingHorizontal={12}
        paddingBottom={12}
        paddingTop={Math.max(insets.top, 8) + 12}
        backgroundColor="branco"
        borderBottomWidth={1}
        borderBottomColor="borda"
      >
        <Botao variante="contorno" tamanho="sm" titulo="Cancelar" onPress={() => navigation.goBack()} />
        <YStack flex={1} alignItems="center">
          <Text fontSize={15} fontWeight="700" color="texto">
            Selecionar localização
          </Text>
          <Text fontSize={13} color="textoSec" marginTop={1}>
            Toque no mapa ou arraste o pino
          </Text>
        </YStack>
        <Botao tamanho="sm" titulo="Confirmar" disabled={!localizacaoSelecionada} onPress={handleConfirmar} />
      </XStack>

      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={regiao}
        onRegionChangeComplete={setRegiao}
        onPress={handlePressMap}
        showsUserLocation={true}
        showsMyLocationButton={false}
        loadingEnabled={true}
        loadingBackgroundColor={cores.begeClaro}
        loadingIndicatorColor={cores.verde}
        customMapStyle={escuro ? ESTILO_MAPA_ESCURO : []}
        userInterfaceStyle={escuro ? 'dark' : 'light'}
      >
        {localizacaoSelecionada && (
          <Marker
            coordinate={{
              latitude: localizacaoSelecionada.latitude,
              longitude: localizacaoSelecionada.longitude,
            }}
            title="Local selecionado"
            description={enderecoAtual}
            pinColor={cores.verde}
            draggable
            onDragEnd={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setLocalizacaoSelecionada({ latitude, longitude });
              buscarEndereco(latitude, longitude);
            }}
          />
        )}
      </MapView>

      {!localizacaoSelecionada && (
        <XStack
          position="absolute"
          left={12}
          right={12}
          bottom={80 + insets.bottom}
          backgroundColor="rgba(28, 28, 26, 0.9)"
          borderRadius="lg"
          paddingVertical={10}
          paddingHorizontal={14}
          alignItems="center"
          justifyContent="center"
          gap={8}
        >
          <Feather name="map-pin" size={14} color={cores.sobreVerde} />
          <Text fontSize={13} fontWeight="500" color="sobreVerde" textAlign="center">
            Toque no mapa para selecionar • Arraste o pino para ajustar
          </Text>
        </XStack>
      )}

      {localizacaoSelecionada && (
        <YStack
          position="absolute"
          left={12}
          right={12}
          bottom={88 + insets.bottom}
          backgroundColor="branco"
          borderRadius="xl"
          borderWidth={1}
          borderColor="borda"
          padding={14}
          boxShadow="0 4px 12px rgba(0, 0, 0, 0.12)"
        >
          <XStack justifyContent="space-between" alignItems="center" marginBottom={6}>
            <Text fontSize={13} fontWeight="700" color="verde" textTransform="uppercase" letterSpacing={0.5}>
              Localização selecionada
            </Text>
            <XStack backgroundColor="verdeSuave" paddingHorizontal={8} paddingVertical={3} borderRadius="lg" gap={4} alignItems="center">
              <Feather name="move" size={10} color={cores.verde} />
              <Text fontSize={12} fontWeight="600" color="verde">
                Pino arrastável
              </Text>
            </XStack>
          </XStack>
          <YStack minHeight={40} justifyContent="center">
            {carregandoEndereco ? (
              <Spinner size="small" color="verde" alignSelf="flex-start" />
            ) : (
              <Text fontSize={13} color="texto" lineHeight="18px" numberOfLines={3}>
                {enderecoAtual}
              </Text>
            )}
          </YStack>
          <Text
            fontSize={13}
            color="textoSec"
            marginTop={8}
            fontFamily="monospace"
            backgroundColor="begeClaro"
            paddingHorizontal={8}
            paddingVertical={4}
            borderRadius="lg"
            alignSelf="flex-start"
          >
            {localizacaoSelecionada.latitude.toFixed(6)}, {localizacaoSelecionada.longitude.toFixed(6)}
          </Text>
        </YStack>
      )}

      <Botao
        position="absolute"
        left={12}
        right={12}
        bottom={16 + insets.bottom}
        variante="secundario"
        icone="crosshair"
        titulo="Usar minha localização"
        carregando={locationLoading}
        boxShadow="0 2px 6px rgba(0, 0, 0, 0.1)"
        onPress={handleMinhaLocalizacao}
      />
    </SafeAreaView>
  );
}
