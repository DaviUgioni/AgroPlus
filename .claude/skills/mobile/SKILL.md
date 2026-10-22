---
name: mobile
description: Design e ajuste de interface do AgroPlus (React Native + Tamagui 3). Use ao criar, alterar ou revisar telas e componentes visuais: tokens, hierarquia visual, modo escuro, acessibilidade, responsividade, formulários, animações, textos da interface, padrões iOS/Android e checklist de PR de UI.
---

# /mobile: design e interface do AgroPlus (React Native + Tamagui)

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

## Auditoria de tokens

Ao revisar uma tela, procure e troque pelos tokens:

```
grep -nE "#[0-9a-fA-F]{3,8}\b|rgba?\(" Screens Components --include=*.tsx   # cores fixas
grep -nE "fontSize: ?[0-9]+|padding: ?[0-9]+|margin: ?[0-9]+" Screens --include=*.tsx   # valores soltos
grep -rn "<Text\b" Screens --include=*.tsx   # texto solto, usar Textos.tsx
```

Exceções legítimas: `estiloMapaEscuro.ts` e cores de marcadores do mapa.

## Hierarquia visual

- Uma ação principal por tela (`Botao` primário). As demais são `secundario`, `contorno` ou `texto`.
- Ordem de peso: `Titulo` > valor em destaque > `Corpo` > `Legenda`. Se tudo está em negrito, nada se destaca.
- Agrupe por proximidade: dentro de um `Cartao` o espaçamento é menor que entre cartões. Seções levam `TituloSecao`.
- Cor de destaque (`verde`, `verdeDestaque`) só no que importa. Erro e alerta só para erro e alerta.
- Alinhe à margem lateral de 20 que `Tela` já aplica; não crie margens próprias.

## Modo escuro

- Toda tela é testada nos dois modos (alternar em Configurações, via `useModo`).
- Sem cor fixa: use tokens, ou `cores.*` em JS. Sombras e bordas também mudam de contraste no escuro.
- Texto sobre fundo verde usa `sobreVerde`/`sobreVerdeSuave`.
- Mapa: use `estiloMapaEscuro` quando `escuro` for verdadeiro.
- Imagens e ícones claros sobre `branco` escuro precisam de contraste: confira.

## Acessibilidade

- Alvo de toque ≥ 44 px no iOS / 48 dp no Android é o ideal; o mínimo do projeto é 40 px. Se o elemento for menor, use `hitSlop`.
- Contraste WCAG AA: 4.5:1 para texto normal, 3:1 para texto grande e ícones. Cuidado com `textoTerc` sobre `bege` e com cores de estado sobre fundos suaves.
- Todo tocável tem `accessibilityRole`; ícone sem texto tem `accessibilityLabel`; estado (`selected`, `disabled`, `busy`) vai em `accessibilityState`.
- Informação nunca só pela cor: erro leva ícone ou texto, não apenas vermelho.
- Fonte do sistema ampliada: `Components/escalaFonte.ts` limita a 1.3x. Teste a tela em 1.3x sem cortar texto (use `flexWrap`, `flexShrink`, `numberOfLines` só quando o corte for aceitável).

## Responsividade

- Teste em tela pequena (~360 dp de largura), tela grande e tablet. Evite largura fixa; use `flex`, `flexShrink`, `maxWidth`.
- `Tela` já cuida da área segura (notch, barra de gestos). Elementos fixos no rodapé usam `BotaoFlutuante`.
- Telas com campos precisam de `KeyboardAvoidingView` (`behavior="padding"` no iOS) e `ScrollView` com `keyboardShouldPersistTaps="handled"`; o campo focado não pode ficar atrás do teclado.
- Listas longas: `FlatList`, não `map` dentro de `ScrollView`.
- Orientação: o app é pensado em retrato; não deixe layout quebrar se girar.

## Padrões iOS e Android

- Navegação: voltar pelo `Cabecalho`/`BotaoVoltar`; respeitar o gesto de voltar do iOS e o botão voltar do Android.
- Feedback ao toque: `press:` do Tamagui em ambos; vibração leve (`expo-haptics`) só em ações importantes (salvar, excluir), nunca em todo toque.
- Teclado: `keyboardType` correto (`numeric`/`decimal-pad` para valores, `email-address`), `returnKeyType` e `autoCapitalize` coerentes.
- Seletores e confirmações usam os componentes do projeto (`Seletor`); só use diálogo nativo (`Alert`) para confirmar ação destrutiva.
- Não imite um sistema só: mantenha a identidade do AgroPlus, mudando só o que a plataforma exige.

## Formulários

- Um `Campo` por dado, com `rotulo` sempre visível (placeholder não substitui rótulo).
- Validação em linha: `erro` aparece sob o campo, depois que ele perde o foco ou ao enviar, com texto que diz como corrigir.
- `ajuda` para formato esperado (ex.: "Use ponto ou vírgula para decimais").
- Ordem dos campos segue a ordem natural da tarefa; "próximo" no teclado leva ao campo seguinte e o último envia.
- Botão de enviar em `BotaoFlutuante`, com `carregando` enquanto salva e `disabled` só quando faltar dado obrigatório.
- Salvar com sucesso dá retorno claro (voltar à lista ou mensagem curta); falha mantém os dados digitados.

## Animações

O projeto usa o driver `animations-rn` (API `Animated` do React Native). **Não use Reanimated**: está excluído do autolinking em `package.json`.

- Use os presets `quick` (feedback de toque) e `medium` (entrada e saída de blocos).
- Anime só `opacity` e `scale`/`translate`; evite animar largura, altura e margem.
- Entrada: `opacity="enter:0"`; pressionado: `scale="press:0.97"`.
- Duração curta, sem animação decorativa em listas longas. Respeite "reduzir movimento" do sistema quando houver animação grande.

## Textos da interface (microcopy)

- Português, com acentuação, tom direto e respeitoso. Verbos no infinitivo nos botões ("Salvar plantio", "Excluir despesa").
- **Erro**: diga o que houve e o que fazer ("Sem conexão. Verifique a internet e tente de novo.").
- **Estado vazio**: `EstadoVazio` com título curto, uma frase explicando e uma `acao` para o primeiro passo ("Nenhum plantio ainda. Cadastre o primeiro.").
- **Carregando**: `Carregando`/`TelaCarregando`; texto só se demorar.
- **Confirmação destrutiva**: nomeie o que será perdido e use botão `perigo`.
- Unidades e moeda no formato brasileiro (R$ 1.234,56; ha; kg; sacas).

## Conferência visual (antes e depois)

Para validar uma mudança de UI: rode o app (`npm run web` ou `npm start`), capture a tela nos modos claro e escuro e em duas larguras, e compare com o estado anterior. Anexe as capturas na descrição do PR.

## Figma para código

- Mapeie cada cor do Figma ao token mais próximo (não copie hex) e cada tamanho de texto ao componente de `Textos.tsx`.
- Espaçamentos do desenho viram `padding`/`gap` em múltiplos de 4; raios viram `lg`/`xl`/`full`.
- Prefira compor com `Cartao`, `ItemLista`, `Campo`, `Botao`. Só crie componente novo se o padrão se repetir em 2+ telas.
- Se o desenho exigir cor ou estilo inexistente, proponha o novo token (claro e escuro) em vez de usar valor solto.

## Antes de entregar (checklist de PR de UI)

- [ ] Nenhum hex ou cor solta no código novo
- [ ] Funciona nos dois modos
- [ ] Lista vazia tem `EstadoVazio`; carregamento tem `Carregando`
- [ ] Alvos de toque ≥ 40 px, texto ≥ 13 px, contraste AA
- [ ] Rótulos de acessibilidade e `accessibilityRole` nos tocáveis
- [ ] Testado em tela pequena e com fonte 1.3x; teclado não cobre campos
- [ ] Um único botão primário por tela; hierarquia clara
- [ ] Textos em português, acentuados, com mensagens de erro acionáveis
- [ ] Animações só com `quick`/`medium`; sem Reanimated
- [ ] Capturas (claro e escuro) anexadas ao PR
