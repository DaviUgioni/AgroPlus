// App.tsx
import { ComponentProps, ComponentType, useCallback, useEffect, useRef, useState } from 'react';
import { Appearance } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { TamaguiProvider, Spinner, YStack } from 'tamagui';
import { NavigationContainer, DefaultTheme, DarkTheme, NavigationState, NavigatorScreenParams } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { ProvedorConfirmar, ProvedorToast } from './Components/ui';
import ErroApp from './Components/ErroApp';
import './Components/escalaFonte';
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

// Telas da barra inferior
export type AbasParamList = {
  Home: undefined;
  Propriedades: undefined;
  Plantios: undefined;
  Despesas: undefined;
  Resumo: undefined;
};

type PilhaParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<AbasParamList> | undefined;
  PropriedadeForm: { propriedadeId?: string; latitude?: number; longitude?: number; endereco?: string } | undefined;
  PropriedadeDetalhe: { propriedadeId: string };
  TalhaoForm: { propriedadeId: string; talhaoId?: string };
  CriarConta: undefined;
  DespesaForm: { propriedadeId: string; talhaoId?: string; despesaId?: string };
  DespesasLista: { propriedadeId: string; talhaoId?: string; talhaoNome?: string };
  MapaSelecao: { latitude?: number; longitude?: number; propriedadeId?: string } | undefined;
  PlantiosLista: { propriedadeId: string; propriedadeNome?: string };
  PlantioForm: { propriedadeId: string };
  ResumoDespesas: { periodo?: 'mes' | 'ano' } | undefined;
  ResumoColheitas: undefined;
  Configuracoes: undefined;
  Ajuda: undefined;
};

// Quem navega enxerga as abas e a pilha como um conjunto só (o React Navigation repassa a ação).
export type RootStackParamList = PilhaParamList & AbasParamList;

const Stack = createNativeStackNavigator<PilhaParamList>();
const Abas = createBottomTabNavigator<AbasParamList>();

const ABAS: { nome: keyof AbasParamList; titulo: string; icone: ComponentProps<typeof Feather>['name']; tela: ComponentType<any> }[] = [
  { nome: 'Home', titulo: 'Início', icone: 'home', tela: Home },
  { nome: 'Propriedades', titulo: 'Áreas', icone: 'map', tela: Propriedades },
  { nome: 'Plantios', titulo: 'Plantios', icone: 'feather', tela: Plantios },
  { nome: 'Despesas', titulo: 'Despesas', icone: 'dollar-sign', tela: Despesas },
  { nome: 'Resumo', titulo: 'Resumo', icone: 'bar-chart-2', tela: Resumo },
];

function BarraAbas() {
  const insets = useSafeAreaInsets();
  return (
    <Abas.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor: cores.verde,
        tabBarInactiveTintColor: cores.textoTerc,
        tabBarLabelStyle: { fontSize: 13, fontFamily: 'Nunito_700Bold' },
        tabBarStyle: {
          backgroundColor: cores.branco,
          borderTopColor: cores.borda,
          height: 62 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      }}
    >
      {ABAS.map((a) => (
        <Abas.Screen
          key={a.nome}
          name={a.nome}
          component={a.tela}
          options={{
            tabBarLabel: a.titulo,
            tabBarAccessibilityLabel: a.titulo,
            tabBarIcon: ({ color, size, focused }) => (
              <YStack width={58} height={30} borderRadius="full" alignItems="center" justifyContent="center" backgroundColor={focused ? 'verdeSuave' : 'transparent'}>
                <Feather name={a.icone} size={size} color={color} />
              </YStack>
            ),
          }}
        />
      ))}
    </Abas.Navigator>
  );
}

const temaNavegacao = (escuro: boolean) => {
  const base = escuro ? DarkTheme : DefaultTheme;
  return { ...base, colors: { ...base.colors, background: cores.begeClaro, card: cores.branco, primary: cores.verde } };
};

// Além das cores do app, avisa o sistema: alertas, teclado, seletor de fotos e mapa
// seguem o modo escolhido, e o fundo da janela não pisca branco nas transições.
function mudarModo(escuro: boolean) {
  aplicarModo(escuro);
  // Não existe no react-native-web
  Appearance.setColorScheme?.(escuro ? 'dark' : 'light');
  SystemUI.setBackgroundColorAsync(cores.begeClaro).catch(() => {});
}

export default function App() {
  const [escuro, setEscuro] = useState<boolean | null>(null);
  const [fontesCarregadas, erroFontes] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

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

  // Se a fonte falhar ao carregar, segue com a fonte do sistema em vez de ficar em branco
  if (escuro === null || !(fontesCarregadas || erroFontes)) return null;

  return (
    <SafeAreaProvider>
      <ModoContext.Provider value={{ escuro, alternar }}>
        <TamaguiProvider config={config} defaultTheme={escuro ? 'dark' : 'light'}>
          <StatusBar style={escuro ? 'light' : 'dark'} />
          <ProvedorToast>
            <ProvedorConfirmar>
              <ErroApp>
                <Rotas escuro={escuro} />
              </ErroApp>
            </ProvedorConfirmar>
          </ProvedorToast>
        </TamaguiProvider>
      </ModoContext.Provider>
    </SafeAreaProvider>
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
      <Stack.Navigator initialRouteName={user ? 'Main' : 'Login'} screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 250,
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}>
        <Stack.Screen name="Login" component={Login} options={{ animation: 'fade' }} />
        <Stack.Screen name="Main" component={BarraAbas} options={{ animation: 'fade' }} />
        <Stack.Screen name="PropriedadeForm" component={PropriedadeForm} />
        <Stack.Screen name="PropriedadeDetalhe" component={PropriedadeDetalhe} />
        <Stack.Screen name="TalhaoForm" component={TalhaoForm} />
        <Stack.Screen name="CriarConta" component={CriarConta} />
        <Stack.Screen name="DespesaForm" component={DespesaForm} />
        <Stack.Screen name="DespesasLista" component={DespesasLista} />
        <Stack.Screen name="MapaSelecao" component={MapaSelecao} />
        <Stack.Screen name="PlantiosLista" component={PlantiosLista} />
        <Stack.Screen name="PlantioForm" component={PlantioForm} />
        <Stack.Screen name="ResumoDespesas" component={ResumoDespesas} />
        <Stack.Screen name="ResumoColheitas" component={ResumoColheitas} />
        <Stack.Screen name="Configuracoes" component={Configuracoes} />
        <Stack.Screen name="Ajuda" component={Ajuda} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
