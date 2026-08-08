// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './Screens/Login';
import Home from './Screens/Home';
import Propriedades from './Screens/Propriedades';
import PropriedadeForm from './Screens/PropriedadeForm';
import PropriedadeDetalhe from './Screens/PropriedadeDetalhe';
import TalhaoForm from './Screens/TalhaoForm';
import CriarConta from './Screens/CriarConta';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Propriedades: undefined;
  PropriedadeForm: { propriedadeId?: string } | undefined;
  PropriedadeDetalhe: { propriedadeId: string };
  TalhaoForm: { propriedadeId: string; talhaoId?: string };
  CriarConta: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Propriedades" component={Propriedades} />
        <Stack.Screen name="PropriedadeForm" component={PropriedadeForm} />
        <Stack.Screen name="PropriedadeDetalhe" component={PropriedadeDetalhe} />
        <Stack.Screen name="TalhaoForm" component={TalhaoForm} />
        <Stack.Screen name="CriarConta" component={CriarConta} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}