# Plano de reformulação visual: migração para Tamagui

Branch: `feat/tamagui`

Status: ⬜ pendente · 🔄 em andamento · ✅ concluído · ⏭️ não se aplica

## Diagnóstico inicial

- Stack: Expo 57, React Native 0.86 (New Architecture), React 19.2, React Navigation 7, Firebase.
- 17 telas em `Screens/` e 1 componente em `Components/`, com cerca de 4.900 linhas.
- Todo o estilo é feito com `StyleSheet.create`.
- `constants/theme.ts` centraliza `COLORS`, `RADIUS`, `FONT` e `SHADOW`. Esses valores viram os tokens do tema do Tamagui.
- `@react-native-picker/picker` aparece nos formulários e fica fora do tema.
- `MapaSelecao` usa `react-native-maps`. O mapa não muda, só a UI em volta dele.

## Fase 0: Preparação
- ✅ Criar a branch `feat/tamagui`
- ✅ Verificar a compatibilidade: Tamagui 3.x exige React 19+, RN 0.81+ e New Architecture. O projeto atende.

## Fase 1: Instalação e configuração
- ✅ Instalar `tamagui@3.0.3` e `@tamagui/config@3.0.3` (versões fixas)
- ✅ Adicionar `react-dom@19.2.3`: o núcleo do Tamagui pede `react-dom` como peer e, sem ele, o npm baixava a 19.3.0 (incompatível com `react` 19.2.3) e duplicava o núcleo em 37 cópias. Depois disso rodei `npm dedupe`.
- ✅ Criar `tamagui.config.ts` a partir do preset v6, com a paleta do AgroPlus como tokens (`verde`, `bege`, `texto`...) e o tema claro ajustado
- ✅ Envolver o `App.tsx` com `TamaguiProvider` e aplicar o tema na navegação
- ✅ `npx tsc --noEmit` sem erros
- ✅ `npx expo export --platform android` gera o bundle normalmente
- ⏭️ Compilador/Babel: opcional no Tamagui 3, fica para depois se o desempenho pedir

## Fase 2: Componentes base (`Components/ui/`)
- ✅ `Tela`, `TelaCarregando` e `Carregando`: container com área segura, fundo e margem
- ✅ `Textos`: `Titulo`, `Subtitulo`, `Rotulo`, `Corpo`, `Legenda`, `TituloSecao`, `TextoErro`
- ✅ `Botao`: variantes `primario`, `secundario`, `contorno`, `perigo`, `texto`; tamanhos `sm`/`md`; ícone e estado de carregamento
- ✅ `BotaoFlutuante`: botão fixo no rodapé, acima da área segura
- ✅ `Campo`: rótulo, ícone, erro, foco destacado e olho para senha
- ✅ `Seletor`: substituto do `Picker`, com folha inferior (Tamagui + `Modal`)
- ✅ `Cartao`: tons `branco`, `bege`, `verde` e variante `interativo`
- ✅ `ItemLista`: linha padrão das listas
- ✅ `Cabecalho`: botão de voltar, título, subtítulo e ações à direita
- ✅ `Chip`: opção selecionável (filtros e categorias)
- ✅ `EstadoVazio`: ícone e mensagem para listas vazias
- ✅ `BotaoVoltar` migrado para o Tamagui

## Fase 3: Tela piloto
- ✅ `Login`: validado no emulador (render, foco, validação de e-mail)

## Fase 4: Migração por grupos
1. Autenticação
   - ✅ `CriarConta` (barra de força da senha validada)
2. Navegação
   - ✅ `Home`: grade 2x2 de atalhos
   - ✅ `Propriedades`
   - ✅ `Despesas`
   - ✅ `Plantios`
   - ✅ `Resumo`
3. Formulários simples
   - ✅ `PlantioForm`
   - ✅ `TalhaoForm`
4. Formulários grandes
   - ✅ `PropriedadeForm`
   - ✅ `DespesaForm`: categoria e meses viraram chips
5. Listas e detalhes
   - ✅ `PropriedadeDetalhe`: a tela inteira rola junto e cada talhão tem uma barra de ações
   - ✅ `PlantiosLista`
   - ✅ `DespesasLista`
6. Resumos
   - ✅ `ResumoDespesas`
   - ✅ `ResumoColheitas`: compila, mas não foi vista no emulador (sem plantios cadastrados)
7. Mapa (só a UI ao redor)
   - ✅ `MapaSelecao`

Regra em cada tela: trocar `View`, `Text` e `TouchableOpacity` por primitivas e componentes do Tamagui, usar tokens no lugar de cores fixas e remover os estilos que não forem mais usados. Lógica, serviços e navegação não mudam.

## Fase 5: Limpeza e validação
- ✅ Usar o tema no carregamento inicial do `App.tsx` (`Spinner` + token `verde`)
- ✅ Remover `constants/theme.ts`: tudo passou para `tamagui.config.ts` (`cores`)
- ✅ Remover a dependência `@react-native-picker/picker`
- ✅ `npx tsc --noEmit` sem erros
- ✅ `npx expo export --platform android` sem erros (bundle de 5,8 MB)
- ✅ Teste no emulador Android (Expo Go 57) de: Login, Criar conta, Home, Propriedades, Detalhe, Editar propriedade, Mapa, Novo talhão, Despesas, Nova despesa, Plantios, Lista de plantios, Novo plantio, Resumo e Gastos por propriedade. Nenhum dado foi salvo ou apagado durante os testes.
- ⬜ Teste em aparelho físico e no iOS: fica com o desenvolvedor
- ⬜ Testar os fluxos que gravam dados (salvar, excluir, exportar CSV, anexar foto): fica com o desenvolvedor

## Como o Tamagui 3 funciona neste projeto (guia rápido)
- **Tokens sem `$`**: `backgroundColor="verde"`, `color="textoSec"`, `borderRadius="xl"`. As cores ficam em `tamagui.config.ts` (`cores`).
- **Estados por cláusula**: `backgroundColor="branco press:verdeSuave"` = branco normal, verde-claro ao tocar. Vale também `opacity="press:0.8"`. Não existem mais `pressStyle` e `hoverStyle`.
- **Espaçamento em números** (pixels): `padding={16}`, `gap={8}`. Evite strings numéricas como `"4"`, que viram token.
- **`lineHeight` numérico é multiplicador**, como no CSS. Para pixels use `lineHeight="18px"`.
- **Ícones** (`@expo/vector-icons`) não entendem tokens: use `cores.verde`.
- Componentes prontos em `Components/ui` (importe de `'../Components/ui'`).

## Registro de decisões
- O Tamagui 3 roda sem plugin de Babel. Nesta migração o compilador fica desligado para reduzir o risco.
- O preset v6 vem em "modo Tailwind", que só aceita atalhos (`p`, `bg`, `rounded`). Desliguei isso (`onlyAllowShorthands: false`) para o código usar nomes completos como `padding` e `backgroundColor`.
- `styleCompat: 'react-native'` mantém o comportamento de layout do React Native, para as telas não mudarem de forma inesperada.
- Animações usam o driver `animations-rn` (Animated do próprio React Native), que não precisa de módulo nativo. O `@tamagui/config` traz o `react-native-reanimated` como dependência interna, mas ele fica aninhado em `node_modules/@tamagui/config/node_modules`, e nem o Babel nem o autolinking o enxergam.
- Raios do preset v6: `lg`=8, `xl`=12, `2xl`=16, `3xl`=24, `full`.
- O `Picker` nativo foi trocado por um `Seletor` próprio (Tamagui + `Modal` do RN). Ele fica igual no Android e no iOS e não depende de portal.
- Listas continuam com `FlatList` do React Native por desempenho. Só os itens usam componentes Tamagui.
- O Tamagui é só JavaScript, então o app continua rodando no Expo Go. Um dev build já instalado não precisa ser refeito por causa dele.
- Avisos de "exports" do Metro sobre arquivos `@tamagui/*` vêm do próprio pacote e são inofensivos (o Metro faz fallback).
- No emulador, as tiles do mapa não carregaram (o `MapView` monta e o logo do Google aparece). O código do mapa não mudou na migração. Provavelmente é chave do Google Maps ou rede do emulador.
