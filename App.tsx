// App.tsx
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './FirebaseConfig';
import Login from './Screens/Login';
import Home from './Screens/Home';
import Propriedades from './Screens/Propriedades';
import PropriedadeForm from './Screens/PropriedadeForm';
import PropriedadeDetalhe from './Screens/PropriedadeDetalhe';
import TalhaoForm from './Screens/TalhaoForm';
import CriarConta from './Screens/CriarConta';
import DespesaForm from './Screens/DespesaForm';
import Despesas from './Screens/Despesas';
import DespesasLista from './Screens/DespesasLista';
import MapaSelecao from './Screens/MapaSelecao';
import Plantios from './Screens/Plantios';
import Resumo from './Screens/Resumo';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Propriedades: undefined;
  PropriedadeForm: { propriedadeId?: string; latitude?: number; longitude?: number; endereco?: string } | undefined;
  PropriedadeDetalhe: { propriedadeId: string };
  TalhaoForm: { propriedadeId: string; talhaoId?: string };
  CriarConta: undefined;
  DespesaForm: { propriedadeId: string; talhaoId?: string; despesaId?: string };
  Despesas: undefined;
  DespesasLista: { propriedadeId: string };
  MapaSelecao: { latitude?: number; longitude?: number } | undefined;
  Plantios: undefined;
  Resumo: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setCarregandoAuth(false);
    });
    return unsub;
  }, []);

  if (carregandoAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#3B6D11" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? 'Home' : 'Login'} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Propriedades" component={Propriedades} />
        <Stack.Screen name="PropriedadeForm" component={PropriedadeForm} />
        <Stack.Screen name="PropriedadeDetalhe" component={PropriedadeDetalhe} />
        <Stack.Screen name="TalhaoForm" component={TalhaoForm} />
        <Stack.Screen name="CriarConta" component={CriarConta} />
        <Stack.Screen name="DespesaForm" component={DespesaForm} />
        <Stack.Screen name="Despesas" component={Despesas} />
        <Stack.Screen name="DespesasLista" component={DespesasLista} />
        <Stack.Screen name="MapaSelecao" component={MapaSelecao} />
        <Stack.Screen name="Plantios" component={Plantios} />
        <Stack.Screen name="Resumo" component={Resumo} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
