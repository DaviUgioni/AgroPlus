// App.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { Appearance } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { TamaguiProvider, Spinner, YStack } from 'tamagui';
import { NavigationContainer, DefaultTheme, DarkTheme, NavigationState } from '@react-navigation/native';
import config, { aplicarModo, cores } from './tamagui.config';
import { ModoContext } from './Components/ModoContext';
import { lerPreferencias, salvarPreferencia } from './Services/preferencias';
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
import PlantiosLista from './Screens/PlantiosLista';
import PlantioForm from './Screens/PlantioForm';
import Resumo from './Screens/Resumo';
import ResumoDespesas from './Screens/ResumoDespesas';
import ResumoColheitas from './Screens/ResumoColheitas';
import Configuracoes from './Screens/Configuracoes';
import Ajuda from './Screens/Ajuda';

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
  DespesasLista: { propriedadeId: string; talhaoId?: string; talhaoNome?: string };
  MapaSelecao: { latitude?: number; longitude?: number; propriedadeId?: string } | undefined;
  Plantios: undefined;
  PlantiosLista: { propriedadeId: string; propriedadeNome?: string };
  PlantioForm: { propriedadeId: string };
  Resumo: undefined;
  ResumoDespesas: { periodo?: 'mes' | 'ano' } | undefined;
  ResumoColheitas: undefined;
  Configuracoes: undefined;
  Ajuda: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const temaNavegacao = (escuro: boolean) => {
  const base = escuro ? DarkTheme : DefaultTheme;
  return { ...base, colors: { ...base.colors, background: cores.begeClaro, card: cores.branco, primary: cores.verde } };
};

// Além das cores do app, avisa o sistema: alertas, teclado, seletor de fotos e mapa
// seguem o modo escolhido, e o fundo da janela não pisca branco nas transições.
function mudarModo(escuro: boolean) {
  aplicarModo(escuro);
  Appearance.setColorScheme(escuro ? 'dark' : 'light');
  SystemUI.setBackgroundColorAsync(cores.begeClaro).catch(() => {});
}

export default function App() {
  const [escuro, setEscuro] = useState<boolean | null>(null);

  useEffect(() => {
    lerPreferencias().then((p) => {
      mudarModo(p.modoEscuro);
      setEscuro(p.modoEscuro);
    });
  }, []);

  const alternar = useCallback((valor: boolean) => {
    mudarModo(valor);
    setEscuro(valor);
    salvarPreferencia('modoEscuro', valor);
  }, []);

  if (escuro === null) return null;

  return (
    <ModoContext.Provider value={{ escuro, alternar }}>
      <TamaguiProvider config={config} defaultTheme={escuro ? 'dark' : 'light'}>
        <StatusBar style={escuro ? 'light' : 'dark'} />
        <Rotas escuro={escuro} />
      </TamaguiProvider>
    </ModoContext.Provider>
  );
}

function Rotas({ escuro }: { escuro: boolean }) {
  // As cores em JS (ícones etc.) são lidas na renderização; ao trocar o modo o container é
  // remontado com a pilha de telas salva, para o usuário continuar onde estava.
  const estadoNavegacao = useRef<NavigationState | undefined>(undefined);
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
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="background">
        <Spinner size="large" color="verde" />
      </YStack>
    );
  }

  return (
    <NavigationContainer
      key={escuro ? 'escuro' : 'claro'}
      theme={temaNavegacao(escuro)}
      initialState={estadoNavegacao.current}
      onStateChange={(estado) => {
        estadoNavegacao.current = estado;
      }}
    >
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
        <Stack.Screen name="PlantiosLista" component={PlantiosLista} />
        <Stack.Screen name="PlantioForm" component={PlantioForm} />
        <Stack.Screen name="Resumo" component={Resumo} />
        <Stack.Screen name="ResumoDespesas" component={ResumoDespesas} />
        <Stack.Screen name="ResumoColheitas" component={ResumoColheitas} />
        <Stack.Screen name="Configuracoes" component={Configuracoes} />
        <Stack.Screen name="Ajuda" component={Ajuda} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
