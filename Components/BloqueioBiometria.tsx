// Components/BloqueioBiometria.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { autenticarBiometria } from '../Services/biometria';
import { COLORS, RADIUS } from '../constants/theme';

interface Props {
  onDesbloquear: () => void;
  onSair: () => void;
}

export default function BloqueioBiometria({ onDesbloquear, onSair }: Props) {
  const [autenticando, setAutenticando] = useState(false);

  async function handleDesbloquear() {
    if (autenticando) return;
    setAutenticando(true);
    const ok = await autenticarBiometria('Desbloquear o AgroPlus');
    setAutenticando(false);
    if (ok) onDesbloquear();
  }

  // Pede a digital assim que a tela aparece
  useEffect(() => {
    handleDesbloquear();
  }, []);

  return (
    <SafeAreaView style={[StyleSheet.absoluteFill, styles.container]} accessibilityViewIsModal>
      <View style={styles.conteudo}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.titulo}>AgroPlus bloqueado</Text>
        <Text style={styles.subtitulo}>Use sua impressão digital para continuar</Text>

        <TouchableOpacity style={styles.botao} onPress={handleDesbloquear} disabled={autenticando}>
          {autenticando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="unlock" size={18} color="#fff" />
              <Text style={styles.botaoTexto}>Desbloquear</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onSair} style={styles.sairBtn}>
          <Text style={styles.sairTexto}>Entrar com outra conta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  conteudo: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: 16,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '500',
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 14,
    color: COLORS.textoSec,
    textAlign: 'center',
    marginBottom: 32,
  },
  botao: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.verde,
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    marginBottom: 16,
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  sairBtn: {
    padding: 8,
  },
  sairTexto: {
    color: COLORS.verde,
    fontSize: 14,
  },
});
