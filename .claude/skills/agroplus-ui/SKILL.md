---
name: agroplus-ui
description: Convenções de UI do AgroPlus (React Native + Tamagui 3). Use ao criar ou alterar telas e componentes visuais, escolher cores, tipografia, espaçamento, botões, cartões, campos ou suportar modo escuro.
---

# UI do AgroPlus (React Native + Tamagui)

Os componentes ficam em `Components/ui/` e são exportados por `Components/ui/index.ts`.
O tema e a paleta ficam em `tamagui.config.ts`. **Antes de criar um componente novo, procure um existente.**

## Regras

1. **Importe sempre de `Components/ui`**, nunca de arquivos individuais.
2. **Cores são tokens sem `$`** (Tamagui 3): `color="textoSec"`, `backgroundColor="begeClaro"`. Nunca use hex fixo.
3. **Ícones e estilos em JS** (que não aceitam token) usam `cores.verde` importado de `tamagui.config`. `cores` lê a paleta ativa, então acompanha o modo escuro.
4. **Modo escuro**: toda cor nova entra em `paletaClara` **e** `paletaEscura`. Cor que nunca muda (texto sobre verde) vai em `fixas`.
5. **Nomes completos nas props** (`padding`, `backgroundColor`, `borderRadius`), não os atalhos estilo Tailwind. Isso está liberado em `settings.onlyAllowShorthands: false`.
6. **Estado pressionado** é cláusula no valor: `backgroundColor="verde press:verdeEscuro"`, `scale="press:0.97"`. Entrada de tela: `opacity="enter:0"`.
7. **Animações** usam os presets `quick` e `medium` (definidos em `animacoes`).
8. **Texto de leitura nunca abaixo de 13 px** (uso ao ar livre, sob sol). Alvos de toque com pelo menos 40 px de altura.
9. **Acessibilidade**: elemento tocável leva `accessibilityRole` e `accessibilityState`, como em `Botao` e `Chip`.
10. **Textos da interface em português**, com acentuação correta. Nomes de componentes e props também em português.

## Paleta (tokens)

| Uso | Tokens |
|---|---|
| Marca | `verde`, `verdeEscuro` (pressionado), `verdeSuave` (fundo de selos), `verdeDestaque` (cartão de totais) |
| Fundos | `begeClaro` (tela), `branco` (superfície: cartão, campo, barra), `bege` |
| Texto | `texto`, `textoSec`, `textoTerc` |
| Bordas | `borda`, `bordaForte` |
| Estados | `erro`/`erroSuave`, `alerta`/`alertaSuave` |
| Fixas | `sobreVerde`, `sobreVerdeSuave` (texto e ícone sobre verde) |

Raios: `lg` para campos e botões pequenos, `xl` para botões, cartões e blocos, `full` para chips.

## Componentes disponíveis

- **`Tela`**: container de toda tela (área segura, fundo `begeClaro`, margem lateral 20, animação de entrada). `fundo="branco"` troca o fundo. Também `TelaCarregando` e `Carregando`.
- **`Cabecalho`**: `titulo`, `subtitulo?`, `voltar?` (padrão `true`), `direita?`.
- **`Botao`**: `variante` = `primario | secundario | contorno | perigo | texto`; `tamanho` = `sm | md`; `titulo`, `icone` (nome do Feather), `carregando`, `disabled`, `cor`. `BotaoFlutuante` fixa no rodapé respeitando a área segura.
- **`Cartao`**: `tom` = `branco | bege | verde`; `interativo` em cartões com `onPress`.
- **`ItemLista`**: linha em cartão com `titulo`, `subtitulo?`, `esquerda?`, `direita?`, `children?`.
- **`Campo`**: input com `rotulo`, `erro`, `ajuda`, `icone`, `senha`, `direita`. `CaixaCampo` é a moldura crua.
- **`Seletor<T>`**: `rotulo`, `valor`, `opcoes: {label, valor}[]`, `aoMudar`, `placeholder`, `ajuda`, `compacto`.
- **`Chip`**: filtro/seleção rápida, `texto`, `ativo`, `onPress`.
- **`Dica`**: aviso em linha, `tom` = `info | alerta`, `icone`.
- **`EstadoVazio`**: `texto`, `titulo?`, `icone?`, `acao?: {titulo, icone?, onPress}`. Use em toda lista que pode ficar vazia.
- **`BarraProgresso`**: `valor`, `cor`, `fundo`.
- **Textos** (`Textos.tsx`): `Titulo` (22), `Subtitulo` (15), `Rotulo` (14), `Corpo` (15), `Legenda` (13), `TituloSecao` (13, caixa alta), `TextoAjuda`, `TextoErro`. Prefira estes a `<Text>` solto.

## Ícones

Só `Feather` de `@expo/vector-icons`. O tipo do nome é `IconeFeather`, exportado por `Components/ui`.

## Criando um componente novo

- Use `styled(YStack | XStack | Text, { ..., variants: {...} as const, defaultVariants })` como `Cartao` e `Botao`.
- Variantes em português e com valores literais (`tom`, `variante`, `tamanho`).
- Exporte no `index.ts`.
- Teste em claro **e** escuro.

## Antes de entregar

- [ ] Nenhum hex ou cor solta no código novo
- [ ] Funciona nos dois modos
- [ ] Lista vazia tem `EstadoVazio`; carregamento tem `Carregando`
- [ ] Alvos de toque ≥ 40 px, texto ≥ 13 px
