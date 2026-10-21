// Components/ui/Graficos.tsx
// Gráficos simples feitos só com blocos de cor (sem biblioteca): colunas por período e barras por categoria.
import { Text, XStack, YStack } from 'tamagui';
import BarraProgresso from './BarraProgresso';

/** Valor curto para caber em colunas estreitas: 1.250 -> "1,3 mil" */
export function moedaCurta(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
  if (v >= 10_000) return `${Math.round(v / 1000).toLocaleString('pt-BR')} mil`;
  if (v >= 1000) return `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
  return Math.round(v).toLocaleString('pt-BR');
}

export type PontoColuna = { rotulo: string; valor: number; destaque?: boolean };

type PropsColunas = {
  dados: PontoColuna[];
  altura?: number;
  /** 'nenhum': sem valores sobre as colunas (para muitas colunas estreitas; mostre o valor em outro lugar) */
  valores?: 'todos' | 'nenhum';
  /** Torna as colunas tocáveis; recebe o índice tocado */
  aoTocar?: (indice: number) => void;
};

/** Colunas lado a lado (ex.: gasto dos últimos meses). A coluna em destaque usa o verde cheio. */
export function GraficoColunas({ dados, altura = 110, valores = 'todos', aoTocar }: PropsColunas) {
  const maior = Math.max(...dados.map((d) => d.valor), 1);
  const resumo = dados.map((d) => `${d.rotulo}: ${Math.round(d.valor)} reais`).join(', ');
  return (
    <XStack
      gap={dados.length > 8 ? 4 : 8}
      alignItems="flex-end"
      accessibilityRole={aoTocar ? undefined : 'image'}
      accessibilityLabel={aoTocar ? undefined : `Gráfico de gastos. ${resumo}`}
    >
      {dados.map((d, i) => {
        const h = Math.max(4, (d.valor / maior) * altura);
        return (
          <YStack
            key={`${d.rotulo}${i}`}
            flex={1}
            alignItems="center"
            gap={4}
            onPress={aoTocar ? () => aoTocar(i) : undefined}
            accessibilityRole={aoTocar ? 'button' : undefined}
            accessibilityLabel={aoTocar ? `${d.rotulo}: ${Math.round(d.valor)} reais` : undefined}
          >
            {valores === 'todos' ? (
              <Text width="100%" textAlign="center" fontSize={13} fontWeight={d.destaque ? '800' : '600'} color={d.destaque ? 'verde' : 'textoSec'} numberOfLines={1}>
                {d.valor > 0 ? moedaCurta(d.valor) : '–'}
              </Text>
            ) : null}
            <YStack
              width="100%"
              height={h}
              borderTopLeftRadius={8}
              borderTopRightRadius={8}
              borderBottomLeftRadius={3}
              borderBottomRightRadius={3}
              backgroundColor={d.destaque ? 'verdeDestaque' : 'verdeSuave'}
              animation="medium"
              opacity="enter:0"
            />
            <Text fontSize={13} fontWeight={d.destaque ? '700' : '500'} color={d.destaque ? 'texto' : 'textoSec'}>
              {d.rotulo}
            </Text>
          </YStack>
        );
      })}
    </XStack>
  );
}

export type PontoBarra = { rotulo: string; valor: number; cor?: string };

/** Uma barra por linha, proporcional ao total (ex.: gasto por categoria). */
export function GraficoBarras({ dados, formatar }: { dados: PontoBarra[]; formatar: (v: number) => string }) {
  const total = dados.reduce((s, d) => s + d.valor, 0) || 1;
  return (
    <YStack gap={14}>
      {dados.map((d, i) => (
        <YStack key={`${d.rotulo}-${i}`} gap={6}>
          <XStack justifyContent="space-between" alignItems="baseline" gap={8}>
            <Text flex={1} fontSize={15} fontWeight="600" color="texto">
              {d.rotulo}
            </Text>
            <Text fontSize={15} fontWeight="700" color="texto">
              {formatar(d.valor)}
            </Text>
            <Text fontSize={13} color="textoSec" minWidth={38} textAlign="right">
              {Math.round((d.valor / total) * 100)}%
            </Text>
          </XStack>
          <BarraProgresso valor={d.valor / total} cor={d.cor ?? 'verdeDestaque'} />
        </YStack>
      ))}
    </YStack>
  );
}
