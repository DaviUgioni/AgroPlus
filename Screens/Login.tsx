import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function Login() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = () => {
    navigation.navigate('Home' as never);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.texto}>Bem Vindo</Text>

      <TextInput
        placeholder="Digite seu usuario"
        value={email}
        onChangeText={setEmail}
        style={styles.caixa}
      />

      <TextInput
        placeholder="Digite sua senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        style={styles.caixa}
      />

      <TouchableOpacity 
        style={styles.botao} 
        onPress={() => {
        console.log('CLICOU');
        navigation.navigate('Home' as never);
  }}
> 
  <Text>Entrar</Text>
</TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  caixa: { borderWidth: 1.5, borderColor: 'black', borderRadius: 8, padding: 10, marginVertical: 3, width: 230 },
  texto: { fontSize: 24, fontWeight: 'bold', color: 'black', marginBottom: 20, textAlign: 'center' },
  botao: { borderWidth: 1.5, borderColor: 'black', borderRadius: 8, padding: 10, marginVertical: 3, width: 80, justifyContent: 'center', alignItems: 'center' },
});