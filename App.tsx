// App.tsx
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './FirebaseConfig';
import { biometriaDisponivel, lerPreferenciaBiometria } from './Services/biometria';
import BloqueioBiometria from './Components/BloqueioBiometria';
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
import EstatisticasPropriedade from './Screens/EstatisticasPropriedade';
import ConfiguracoesConta from './Screens/ConfiguracoesConta';

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
  EstatisticasPropriedade: { propriedadeId: string };
  ConfiguracoesConta: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Tempo em segundo plano antes de pedir a digital de novo (evita bloquear ao abrir câmera/galeria)
const TEMPO_BLOQUEIO_MS = 60 * 1000;

async function deveBloquear(userId: string) {
  const ativa = await lerPreferenciaBiometria(userId);
  return ativa === true && (await biometriaDisponivel());
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);
  const [bloqueado, setBloqueado] = useState(false);
  const primeiraVerificacao = useRef(true);
  const foiParaSegundoPlanoEm = useRef<number | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      // Só bloqueia quando o app abre com sessão salva; login feito agora já é a autenticação
      if (primeiraVerificacao.current) {
        primeiraVerificacao.current = false;
        if (u && (await deveBloquear(u.uid))) setBloqueado(true);
      }
      if (!u) setBloqueado(false);
      setUser(u);
      setCarregandoAuth(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (estado) => {
      if (estado === 'background') {
        foiParaSegundoPlanoEm.current = Date.now();
        return;
      }
      if (estado !== 'active' || foiParaSegundoPlanoEm.current === null) return;
      const tempoFora = Date.now() - foiParaSegundoPlanoEm.current;
      foiParaSegundoPlanoEm.current = null;
      const atual = auth.currentUser;
      if (atual && tempoFora >= TEMPO_BLOQUEIO_MS && (await deveBloquear(atual.uid))) {
        setBloqueado(true);
      }
    });
    return () => sub.remove();
  }, []);

  async function handleSairDoBloqueio() {
    try {
      await signOut(auth);
    } catch {}
    setBloqueado(false);
    if (navigationRef.isReady()) {
      navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  }

  if (carregandoAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#3B6D11" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
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
          <Stack.Screen name="EstatisticasPropriedade" component={EstatisticasPropriedade} />
          <Stack.Screen name="ConfiguracoesConta" component={ConfiguracoesConta} />
        </Stack.Navigator>
      </NavigationContainer>
      {bloqueado && user ? (
        <BloqueioBiometria onDesbloquear={() => setBloqueado(false)} onSair={handleSairDoBloqueio} />
      ) : null}
    </View>
  );
}
