// Screens/Ajuda.tsx
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text, XStack, YStack } from 'tamagui';
import { cores } from '../tamagui.config';
import { Cabecalho, Cartao, Tela } from '../Components/ui';

const PERGUNTAS = [
  {
    pergunta: 'Por onde eu começo?',
    resposta:
      '1. Cadastre sua propriedade em Propriedades → "Nova propriedade".\n2. Abra a propriedade e crie os talhões (as partes dela).\n3. Registre os plantios e lance as despesas. O app faz as contas para você.',
  },
  {
    pergunta: 'O que é um talhão?',
    resposta:
      'É uma parte da propriedade, como uma lavoura ou um pasto. Dividir em talhões ajuda a saber o que foi plantado e quanto foi gasto em cada área. A soma dos talhões não pode passar do tamanho da propriedade.',
  },
  {
    pergunta: 'Como registro um plantio?',
    resposta:
      'Vá em Plantios, escolha a propriedade e toque em "Novo plantio". Escolha o que foi plantado e onde. O plantio fica com a data de hoje.',
  },
  {
    pergunta: 'Como o app calcula a colheita?',
    resposta:
      'Cada cultura tem um tempo médio até a colheita (por exemplo, milho ~120 dias). O app soma esse tempo à data do plantio. É uma estimativa e pode variar com o clima e o manejo.',
  },
  {
    pergunta: 'Como lanço uma despesa?',
    resposta:
      'Vá em Despesas, escolha a propriedade e toque em "Nova despesa". Informe o valor, com o que foi gasto e a categoria. Se quiser, anexe a foto da nota fiscal.',
  },
  {
    pergunta: 'O que é uma despesa "Mensal" ou "Agendada"?',
    resposta:
      'Ao marcar "Repetir todo mês", o app lança a mesma despesa nos próximos meses (bom para salário ou aluguel). As dos meses que ainda não chegaram aparecem como "Agendada" e só entram no total quando o mês chegar.',
  },
  {
    pergunta: 'Para que serve o limite de gastos?',
    resposta:
      'Na lista de despesas de uma propriedade você pode definir quanto quer gastar por mês. Uma barra mostra quanto já foi usado e fica vermelha se você passar do limite.',
  },
  {
    pergunta: 'Como levo meus dados para o Excel?',
    resposta:
      'Vá em Configurações → "Baixar planilha" para salvar no celular um relatório com todas as propriedades, ou em "Compartilhar planilha" para enviar por WhatsApp, e-mail ou Drive. Para uma propriedade só, toque em "Planilha" na lista de despesas dela. O arquivo tem abas com o resumo, todas as despesas, gastos por mês, plantios e talhões.\n\nNo Android, na primeira vez o app pede para escolher a pasta: crie a pasta AgroPlus dentro de Download e toque em "Usar esta pasta". Depois disso, as planilhas são salvas direto lá.',
  },
  {
    pergunta: 'Esqueci minha senha. E agora?',
    resposta:
      'Na tela de login, digite seu e-mail e toque em "Esqueci minha senha". Você recebe um link para criar uma nova. Se já estiver dentro do app, use Configurações → "Alterar senha".',
  },
  {
    pergunta: 'Meus dados ficam salvos se eu trocar de celular?',
    resposta:
      'Sim. Propriedades, talhões, plantios e despesas ficam guardados na sua conta. Basta entrar com o mesmo e-mail e senha. As fotos (da propriedade e das notas) ficam só no aparelho em que foram tiradas.',
  },
];

export default function Ajuda() {
  const insets = useSafeAreaInsets();
  const [aberta, setAberta] = useState<number | null>(0);

  return (
    <Tela edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <Cabecalho titulo="Como usar" subtitulo="Toque em uma pergunta para ver a resposta" />

        <Cartao padding={0} overflow="hidden">
          {PERGUNTAS.map((p, i) => {
            const estaAberta = aberta === i;
            return (
              <YStack key={p.pergunta} borderTopWidth={i === 0 ? 0 : 1} borderTopColor="borda">
                <XStack
                  alignItems="center"
                  gap={12}
                  paddingVertical={16}
                  paddingHorizontal={16}
                  minHeight={56}
                  backgroundColor="transparent press:begeClaro"
                  onPress={() => setAberta(estaAberta ? null : i)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: estaAberta }}
                >
                  <Text flex={1} fontSize={15} fontWeight="600" color={estaAberta ? 'verde' : 'texto'}>
                    {p.pergunta}
                  </Text>
                  <Feather name={estaAberta ? 'chevron-up' : 'chevron-down'} size={20} color={cores.textoSec} />
                </XStack>
                {estaAberta && (
                  <Text fontSize={15} lineHeight="23px" color="texto" paddingHorizontal={16} paddingBottom={16}>
                    {p.resposta}
                  </Text>
                )}
              </YStack>
            );
          })}
        </Cartao>
      </ScrollView>
    </Tela>
  );
}
