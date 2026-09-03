// Screens/MapaSelecao.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation, useRoute, useFocusEffect, RouteProp, NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../App';

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

const OSM_TILE_URL = 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png';

export default function MapaSelecao() {
  const navigation = useNavigation<MapaSelecaoNavigationProp>();
  const route = useRoute<MapaSelecaoRouteProp>();
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();

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
    setCarregandoEndereco(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pt-BR`,
        {
          headers: {
            'User-Agent': 'AgroPlus/1.0 (https://seusite.com; seuemail@exemplo.com)'
          }
        }
      );
      const data = await response.json();
      const endereco = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setEnderecoAtual(endereco);
      setLocalizacaoSelecionada((prev) => (prev ? { ...prev, endereco } : null));
    } catch (error) {
      setEnderecoAtual(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setCarregandoEndereco(false);
    }
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
    // Retorna via navigation params (serializável) — Opção A
    (navigation as any).navigate('PropriedadeForm', {
      latitude: localizacaoSelecionada.latitude,
      longitude: localizacaoSelecionada.longitude,
      endereco: localizacaoSelecionada.endereco || enderecoAtual,
    });
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
      Alert.alert('Erro', 'Não foi possível obter a localização.');
      console.error(err);
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
          <Text style={styles.botaoVoltarTexto}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Selecionar Localização</Text>
        <TouchableOpacity onPress={handleConfirmar} style={[styles.botaoConfirmar, localizacaoSelecionada ? {} : styles.botaoDesabilitado]} disabled={!localizacaoSelecionada}>
          <Text style={styles.botaoConfirmarTexto}>Confirmar</Text>
        </TouchableOpacity>
      </View>

      <MapView
        ref={mapRef}
        style={styles.mapa}
        initialRegion={regiao}
        onRegionChangeComplete={setRegiao}
        onPress={handlePressMap}
        showsUserLocation={true}
        showsMyLocationButton={true}
        loadingEnabled={true}
      >
        {/* OSM Tiles */}
        <UrlTile urlTemplate={OSM_TILE_URL} maximumZ={19} flipY={false} />
        {localizacaoSelecionada && (
          <Marker
            coordinate={{
              latitude: localizacaoSelecionada.latitude,
              longitude: localizacaoSelecionada.longitude,
            }}
            title="Local selecionado"
            description={enderecoAtual}
            pinColor="#3B6D11"
          />
        )}
      </MapView>

      {localizacaoSelecionada && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Localização selecionada:</Text>
          <View style={styles.enderecoContainer}>
            {carregandoEndereco ? (
              <ActivityIndicator size="small" color="#3B6D11" />
            ) : (
              <Text style={styles.enderecoTexto} numberOfLines={2}>{enderecoAtual}</Text>
            )}
          </View>
          <Text style={styles.coordenadasTexto}>
            {localizacaoSelecionada.latitude.toFixed(6)}, {localizacaoSelecionada.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      {!localizacaoSelecionada && (
        <View style={styles.dicaContainer}>
          <Text style={styles.dicaTexto}>Toque no mapa para selecionar a localização</Text>
        </View>
      )}

      <TouchableOpacity style={styles.botaoMinhaLoc} onPress={handleMinhaLocalizacao} disabled={locationLoading}>
        {locationLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.botaoMinhaLocTexto}>Usar minha localização</Text>
        )}
      </TouchableOpacity>

      {/* Attribution for OpenStreetMap */}
      <View style={[styles.attributionContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Text style={styles.attributionText}>Map data © OpenStreetMap contributors</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  botaoVoltar: {
    padding: 6,
  },
  botaoVoltarTexto: {
    color: '#3B6D11',
    fontSize: 14,
    fontWeight: '500',
  },
  titulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  botaoConfirmar: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3B6D11',
    borderRadius: 6,
  },
  botaoDesabilitado: {
    backgroundColor: '#ccc',
  },
  botaoConfirmarTexto: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  mapa: {
    flex: 1,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 130,
    left: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 3,
  },
  enderecoContainer: {
    minHeight: 36,
  },
  enderecoTexto: {
    fontSize: 13,
    color: '#333',
  },
  coordenadasTexto: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
    fontFamily: 'monospace',
  },
  dicaContainer: {
    position: 'absolute',
    bottom: 80,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  dicaTexto: {
    color: '#fff',
    fontSize: 13,
  },
  botaoMinhaLoc: {
    position: 'absolute',
    bottom: 80, // moved up above attribution
    left: 12,
    right: 12,
    backgroundColor: '#3B6D11',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  botaoMinhaLocTexto: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  attributionContainer: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 4,
  },
  attributionText: {
    fontSize: 9,
    color: '#666',
  },
});