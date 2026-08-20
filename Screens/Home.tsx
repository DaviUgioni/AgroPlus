// Screens/Home.tsx
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function Home() {
  const navigation = useNavigation<HomeNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titulo}>Bem-vindo ao AgroPlus</Text>
      <Text style={styles.subtitulo}>Gerencie sua produção com facilidade</Text>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Propriedades')}>
          <Ionicons name="map-outline" size={28} color="#fff" />
          <Text style={styles.cardText}>Propriedades</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Propriedades')}>
          <Ionicons name="leaf-outline" size={28} color="#fff" />
          <Text style={styles.cardText}>Plantios</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Despesas')}>
          <Ionicons name="cash-outline" size={28} color="#fff" />
          <Text style={styles.cardText}>Despesas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Propriedades')}>
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
    backgroundColor: '#3B6D11',
    borderRadius: 16,
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
});