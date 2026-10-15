// Screens/Home.tsx
import { ComponentProps, useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, XStack, YStack } from 'tamagui';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../FirebaseConfig';
import { nomeDoUsuario } from '../Services/conta';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import { Botao, Cartao, Subtitulo, Tela, Titulo } from '../Components/ui';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

type Atalho = {
  rota: 'Propriedades' | 'Plantios' | 'Despesas' | 'Resumo';
  titulo: string;
  descricao: string;
  icone: ComponentProps<typeof Ionicons>['name'];
};

const ATALHOS: Atalho[] = [
  { rota: 'Propriedades', titulo: 'Propriedades', descricao: 'Suas áreas e talhões', icone: 'map-outline' },
  { rota: 'Plantios', titulo: 'Plantios', descricao: 'O que foi plantado e quando colher', icone: 'leaf-outline' },
  { rota: 'Despesas', titulo: 'Despesas', descricao: 'Gastos e notas fiscais', icone: 'cash-outline' },
  { rota: 'Resumo', titulo: 'Resumo', descricao: 'Números gerais da produção', icone: 'bar-chart-outline' },
];

const PASSOS = [
  { titulo: 'Cadastre sua propriedade', texto: 'Nome, localização e tamanho em hectares.' },
  { titulo: 'Divida em talhões', texto: 'Talhões são as partes da propriedade, como "Área do milho".' },
  { titulo: 'Registre plantios e despesas', texto: 'O app calcula a colheita e soma seus gastos.' },
];

export default function Home() {
  const navigation = useNavigation<HomeNavigationProp>();
  const [totalPropriedades, setTotalPropriedades] = useState<number | null>(null);
  const [nome, setNome] = useState(nomeDoUsuario());

  // Conta as propriedades para decidir se mostra os "primeiros passos".
  // Sem internet o Firestore responde só com o cache (que pode estar vazio);
  // nesse caso não dá para afirmar que a conta não tem propriedades.
  useFocusEffect(
    useCallback(() => {
      setNome(nomeDoUsuario()); // pode ter mudado nas Configurações
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      getDocs(query(collection(db, 'propriedades'), where('userId', '==', userId)))
        .then((snap) => setTotalPropriedades(snap.empty && snap.metadata.fromCache ? null : snap.size))
        .catch(() => setTotalPropriedades(null));
    }, [])
  );

  const semPropriedades = totalPropriedades === 0;

  return (
    <Tela>
      <XStack alignItems="center" justifyContent="space-between" marginTop={12}>
        <XStack alignItems="center" gap={8}>
          <Image source={require('../assets/logo.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
          <Text fontSize={18} fontWeight="700" color="verde">
            AgroPlus
          </Text>
        </XStack>
        <Botao
          variante="contorno"
          tamanho="sm"
          icone="settings"
          titulo="Configurações"
          onPress={() => navigation.navigate('Configuracoes')}
        />
      </XStack>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 24 }}
      >
        <Titulo fontSize={28}>{nome ? `Olá, ${nome}!` : 'Bem-vindo!'}</Titulo>
        <Subtitulo marginTop={4} marginBottom={24}>
          {semPropriedades ? 'Vamos configurar sua produção em 3 passos.' : 'O que você quer fazer hoje?'}
        </Subtitulo>

        {semPropriedades && (
          <Cartao marginBottom={20} gap={14}>
            {PASSOS.map((p, i) => (
              <XStack key={p.titulo} gap={12} alignItems="flex-start">
                <YStack
                  width={30}
                  height={30}
                  borderRadius="full"
                  backgroundColor={i === 0 ? 'verde' : 'verdeSuave'}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize={14} fontWeight="700" color={i === 0 ? 'sobreVerde' : 'verde'}>
                    {i + 1}
                  </Text>
                </YStack>
                <YStack flex={1}>
                  <Text fontSize={15} fontWeight="600" color="texto">
                    {p.titulo}
                  </Text>
                  <Text fontSize={13} color="textoSec" marginTop={2}>
                    {p.texto}
                  </Text>
                </YStack>
              </XStack>
            ))}
            <Botao
              icone="plus"
              titulo="Cadastrar minha propriedade"
              marginTop={4}
              onPress={() => navigation.navigate('PropriedadeForm')}
            />
          </Cartao>
        )}

        <YStack gap={14}>
          {ATALHOS.map((a) => (
            <Cartao
              key={a.rota}
              interativo
              flexDirection="row"
              alignItems="center"
              minHeight={110}
              gap={16}
              onPress={() => navigation.navigate(a.rota)}
              accessibilityRole="button"
              accessibilityLabel={`${a.titulo}: ${a.descricao}`}
            >
              <YStack
                width={60}
                height={60}
                borderRadius="2xl"
                backgroundColor="verde"
                alignItems="center"
                justifyContent="center"
              >
                <Ionicons name={a.icone} size={30} color={cores.sobreVerde} />
              </YStack>
              <YStack flex={1}>
                <Text fontSize={19} fontWeight="600" color="texto">
                  {a.titulo}
                </Text>
                <Text fontSize={14} color="textoSec" marginTop={2}>
                  {a.descricao}
                </Text>
              </YStack>
              <Ionicons name="chevron-forward" size={22} color={cores.textoSec} />
            </Cartao>
          ))}
        </YStack>
      </ScrollView>
    </Tela>
  );
}
