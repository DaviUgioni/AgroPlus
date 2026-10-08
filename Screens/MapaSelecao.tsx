// Screens/MapaSelecao.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation, useRoute, useFocusEffect, RouteProp, NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../App';
import { COLORS, RADIUS } from '../constants/theme';
import { mensagemErro } from '../Services/erros';

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
    (navigation as any).navigate({
      name: 'PropriedadeForm',
      params: {
        propriedadeId: route.params?.propriedadeId,
        latitude: localizacaoSelecionada.latitude,
        longitude: localizacaoSelecionada.longitude,
        endereco: localizacaoSelecionada.endereco || enderecoAtual,
      },
      merge: true,
    } as any);
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
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
          <Text style={styles.botaoVoltarTexto}>Cancelar</Text>
        </TouchableOpacity>
        <View style={styles.headerCentro}>
          <Text style={styles.titulo}>Selecionar Localização</Text>
          <Text style={styles.subtituloHeader}>Toque no mapa ou arraste o pino</Text>
        </View>
        <TouchableOpacity
          onPress={handleConfirmar}
          style={[styles.botaoConfirmar, localizacaoSelecionada ? {} : styles.botaoDesabilitado]}
          disabled={!localizacaoSelecionada}
        >
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
        showsMyLocationButton={false}
        loadingEnabled={true}
      >
        {localizacaoSelecionada && (
          <Marker
            coordinate={{
              latitude: localizacaoSelecionada.latitude,
              longitude: localizacaoSelecionada.longitude,
            }}
            title="Local selecionado"
            description={enderecoAtual}
            pinColor={COLORS.verde}
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
        <View style={[styles.dicaContainer, { bottom: 72 + insets.bottom }]}>
          <Text style={styles.dicaTexto}>📍 Toque no mapa para selecionar • Arraste o pino para ajustar</Text>
        </View>
      )}

      {localizacaoSelecionada && (
        <View style={[styles.infoContainer, { bottom: 88 + insets.bottom }]}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoLabel}>Localização selecionada</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeTexto}>📍 Pino arrastável</Text>
            </View>
          </View>
          <View style={styles.enderecoContainer}>
            {carregandoEndereco ? (
              <ActivityIndicator size="small" color={COLORS.verde} />
            ) : (
              <Text style={styles.enderecoTexto} numberOfLines={3}>{enderecoAtual}</Text>
            )}
          </View>
          <Text style={styles.coordenadasTexto}>
            {localizacaoSelecionada.latitude.toFixed(6)}, {localizacaoSelecionada.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.botaoMinhaLoc, { bottom: 16 + insets.bottom }]}
        onPress={handleMinhaLocalizacao}
        disabled={locationLoading}
      >
        {locationLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.botaoMinhaLocTexto}>◎ Usar minha localização</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    gap: 8,
  },
  botaoVoltar: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: '#f5f5f5',
  },
  botaoVoltarTexto: {
    color: COLORS.verde,
    fontSize: 13,
    fontWeight: '600',
  },
  headerCentro: {
    flex: 1,
    alignItems: 'center',
  },
  titulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  subtituloHeader: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
  },
  botaoConfirmar: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.verde,
    borderRadius: RADIUS.sm,
  },
  botaoDesabilitado: {
    backgroundColor: '#ccc',
  },
  botaoConfirmarTexto: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  mapa: {
    flex: 1,
  },
  infoContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: RADIUS.md,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.verde,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: '#EAF3DE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  badgeTexto: {
    fontSize: 10,
    color: COLORS.verde,
    fontWeight: '600',
  },
  enderecoContainer: {
    minHeight: 40,
  },
  enderecoTexto: {
    fontSize: 13,
    color: '#222',
    lineHeight: 18,
  },
  coordenadasTexto: {
    fontSize: 11,
    color: '#888',
    marginTop: 8,
    fontFamily: 'monospace',
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  dicaContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: 'rgba(34,34,34,0.9)',
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  dicaTexto: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  botaoMinhaLoc: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: COLORS.verde,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  botaoMinhaLocTexto: {
    color: COLORS.verde,
    fontSize: 13,
    fontWeight: '700',
  },
});