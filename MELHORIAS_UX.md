# Revisão de usabilidade do AgroPlus

Objetivo: o app deve ser fácil de entender na primeira vez que alguém abre, sem precisar de explicação.

Status: ⬜ pendente · ✅ feito

## Problemas encontrados

### Gerais (todas as telas)
1. **Letras pequenas demais.** Vários textos secundários têm 11–12 px, o que é difícil de ler no campo, sob sol.
2. **Áreas de toque pequenas.** O botão de voltar tem 40 px, os chips têm cerca de 34 px e as ações dos talhões também são pequenas. O recomendado é 44 px ou mais.
3. **Listas vazias não dizem o que fazer.** Elas mostram "Nenhuma propriedade cadastrada ainda." sem um botão ou uma explicação do próximo passo.
4. **Botões genéricos.** Todo formulário termina em "Salvar", sem dizer o que vai ser salvo.
5. **Termos técnicos sem explicação.** "Talhão", "limite mensal" e "recorrente" aparecem sem nenhuma ajuda.
6. **Erros só em pop-up.** O usuário fecha o alerta e não vê qual campo está errado.

### Por tela
| Tela | Problema | Melhoria |
|---|---|---|
| Home | Quem acabou de criar a conta não sabe por onde começar | Cartão de "Primeiros passos" (1. propriedade → 2. talhões → 3. plantios e despesas) enquanto não houver propriedade; saudação com o nome |
| Propriedades / Despesas / Plantios | Lista vazia sem ação | Estado vazio com explicação e botão "Cadastrar propriedade" |
| Despesas / Plantios | Não fica claro por que é preciso escolher uma propriedade | Subtítulo explicativo; se houver só uma propriedade, ela já aparece em destaque |
| PropriedadeDetalhe | "Talhão" sem explicação; ações "Gastos" e "Despesa" confusas e com letra de 11 px | Texto de ajuda sobre talhões; ações "Despesas" e "Nova despesa" maiores; área usada vs. área total |
| PropriedadeForm | Não explica o mapa nem a unidade da área | Dicas abaixo dos campos; botão "Cadastrar propriedade" ou "Salvar alterações" |
| TalhaoForm | O usuário só descobre que a área passou do limite ao salvar | Mostrar "Área disponível: X ha de Y ha" antes de digitar e validar na hora |
| PlantioForm | Não mostra quando será a colheita | Prévia "Colheita prevista para dd/mm/aaaa"; explicar que a data de plantio é hoje |
| PlantiosLista | Só texto "Colheita em ~3 meses" | Barra de progresso do ciclo e data prevista |
| DespesaForm | Não diz que a data é hoje; "Repetir todo mês" pouco claro; erros só em alerta | Dica da data; exemplo de recorrência; erro abaixo do campo; botão "Salvar despesa" |
| DespesasLista | Topo carregado demais (total, filtros e limite antes da lista) | Limite mensal com barra de progresso (gasto do mês vs. limite), explicado e recolhível; "Exportar planilha" |
| Resumo | Não diz que os cartões são clicáveis | Seta nos cartões e dica no topo |
| Login / CriarConta | Requisitos de senha só no placeholder | Dica de requisitos abaixo do campo |

## Implementação
- ✅ Tipografia: textos de leitura com no mínimo 13 px (antes havia 10–12 px); rótulos de campo em 14 px e negrito
- ✅ Toque: voltar com 44 px, botões pequenos com 42 px ou mais, chips com 40 px, ações de talhão com 56 px
- ✅ `EstadoVazio` com título, explicação e botão de próximo passo
- ✅ `Campo` e `Seletor` com texto de ajuda (`ajuda`) abaixo do campo
- ✅ Novos componentes `Dica` (caixa de explicação) e `BarraProgresso`
- ✅ Nova cor `alerta` (âmbar) para "Pronto para colher" e despesas agendadas, que não são erros
- ✅ Home: saudação com o nome e guia de 3 passos enquanto a conta não tiver propriedade. Sem internet o guia não aparece por engano (resultado vindo só do cache não conta)
- ✅ Listas (Propriedades, Despesas, Plantios, Lista de plantios, Lista de despesas, Resumo): estados vazios com explicação e botão de ação. O botão flutuante some quando a lista está vazia, para não haver dois botões iguais
- ✅ PropriedadeDetalhe: barra "Área dividida em talhões", explicação do que é talhão, ações "Despesas / Nova despesa / Editar / Excluir" maiores
- ✅ PropriedadeForm: ordem por importância (nome → localização → tamanho → foto opcional), botão "Marcar no mapa" com texto, dicas em todos os campos, explicação de hectare, botão "Cadastrar propriedade"/"Salvar alterações", mensagens de erro específicas por campo
- ✅ TalhaoForm: explicação de talhão, "Disponível: X ha de Y ha" e erro na hora se passar do disponível
- ✅ PlantioForm: perguntas simples ("O que foi plantado?", "Onde foi plantado?") e cartão com a data de hoje e a colheita prevista
- ✅ PlantiosLista: barra de progresso do ciclo e data prevista de colheita
- ✅ DespesaForm: perguntas simples ("Quanto custou?", "Com o que foi gasto?", "Onde foi usado?"), aviso de que a data é hoje, validação do valor na hora, explicação e resumo da recorrência ("Serão lançadas 3 despesas de R$ X")
- ✅ DespesasLista: a tela inteira rola junto; limite mensal virou barra "R$ X de R$ Y (Z%)" (verde → âmbar a partir de 80% → vermelho), com editor que só abre quando necessário; selo "Agendada" nas despesas futuras; estado vazio diferente para "sem despesas" e "sem resultado no filtro" (com "Limpar filtros")
- ✅ Resumo: setas nos cartões e dica "Toque em um cartão para ver os detalhes"
- ✅ CriarConta: requisitos da senha visíveis e aviso imediato quando a confirmação não bate
- ✅ Validação: `tsc` sem erros, bundle Android gerado, telas conferidas no emulador (sem salvar dados)

## Não verificado no emulador
- CriarConta e Login (a sessão estava logada; mudanças são só de texto e validação)
- Barra de progresso dos plantios e cores de "pronto para colher" (a conta de teste não tem plantios)
- Cartão do limite já definido (a propriedade de teste não tem limite)

## Tela de Configurações
Acesso pelo botão "Configurações" no topo da tela inicial. O "Sair", que ficava solto na Home, passou para cá.

- ✅ **Perfil:** iniciais, nome, e-mail e "Usa o AgroPlus desde...". "Editar meu nome" grava o nome na conta (Firebase `displayName`) e ele aparece na saudação da Home.
- ✅ **Conta e segurança:**
  - "Alterar senha" envia o link de redefinição para o e-mail;
  - um interruptor liga ou desliga o botão de impressão digital no login (fica guardado no aparelho, em `Services/preferencias.ts`). Fica desabilitado, com explicação, quando o aparelho não tem biometria.
- ✅ **Seus dados:** "Exportar todas as despesas" gera uma planilha única com a coluna "Propriedade".
- ✅ **Ajuda:** tela "Como usar" com 10 perguntas frequentes que abrem e fecham; versão do app (lida do `app.json`).
- ✅ **Sair da conta**, com confirmação.
- ✅ **Excluir minha conta:** pede a senha (o Firebase exige login recente), avisa que não dá para desfazer e sugere exportar antes. Apaga propriedades, talhões, plantios, despesas, notas guardadas no aparelho e, por último, o usuário. A Google Play exige essa opção em apps com cadastro.

### Correções feitas junto
- `excluirPropriedade` não apagava os **plantios**, que ficavam órfãos no banco. Agora apaga.
- `excluirPropriedade` apagava a propriedade no primeiro lote. Com mais de 400 documentos, as regras do Firestore (que conferem o dono pela propriedade) bloqueavam os lotes seguintes. Agora a propriedade é apagada por último.
- A exportação CSV usava vírgula para separar as colunas e também nos valores (`1500,00`), e o Excel quebrava as colunas. Agora usa `;` (padrão do Excel em português) e inclui o BOM para os acentos. A lógica ficou em `Services/exportar.ts`, compartilhada pelas duas exportações.
- `LABELS_CATEGORIA` estava repetido em várias telas e agora fica em `Services/despesas.ts`.

### Não testado
- Salvar o nome, enviar o link de senha e a exclusão de conta de ponta a ponta. Não executei nada disso para não alterar a conta real logada no emulador. Testei apenas a interface e a validação de senha vazia.
- O conteúdo da planilha aberta no Excel. Testei só até o menu de compartilhar.
