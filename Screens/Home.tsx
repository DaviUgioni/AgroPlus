// Screens/Home.tsx
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signOut } from 'firebase/auth';
import { auth } from '../FirebaseConfig';
import { RootStackParamList } from '../App';
import { COLORS, RADIUS } from '../constants/theme';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function Home() {
  const navigation = useNavigation<HomeNavigationProp>();
  const insets = useSafeAreaInsets();

  function handleSair() {
    Alert.alert('Sair', 'Deseja realmente sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            navigation.navigate('Login' as never);
          } catch {
            Alert.alert('Erro', 'Não foi possível sair.');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <TouchableOpacity onPress={handleSair} style={[styles.sairBtn, { top: insets.top + 8 }]}>
        <Ionicons name="log-out-outline" size={18} color={COLORS.verde} />
        <Text style={styles.sairTexto}>Sair</Text>
      </TouchableOpacity>
      <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.titulo}>Bem-vindo ao AgroPlus</Text>
      <Text style={styles.subtitulo}>Gerencie sua produção com facilidade</Text>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Propriedades')}>
          <Ionicons name="map-outline" size={28} color="#fff" />
          <Text style={styles.cardText}>Propriedades</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Plantios')}>
          <Ionicons name="leaf-outline" size={28} color="#fff" />
          <Text style={styles.cardText}>Plantios</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Despesas')}>
          <Ionicons name="cash-outline" size={28} color="#fff" />
          <Text style={styles.cardText}>Despesas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Resumo')}>
          <Ionicons name="bar-chart-outline" size={28} color="#fff" />
          <Text style={styles.cardText}>Resumo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logo: {
    width: 64,
    height: 64,
    alignSelf: 'center',
    marginBottom: 12,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  grid: {
    gap: 16,
    width: '100%',
  },
  card: {
    backgroundColor: COLORS.verde,
    borderRadius: RADIUS.lg,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  sairBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  sairTexto: {
    color: COLORS.verde,
    fontSize: 14,
    fontWeight: '500',
  },
});