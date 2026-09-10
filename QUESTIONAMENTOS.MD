# Questionamentos — Uso de imagens no AgroPlus

Este documento explica, de forma direta, como o app lida com as imagens hoje: onde elas
ficam salvas de fato, o que vai para o Firebase e o que fica só no aparelho.

## Resumo rápido

| Tipo de imagem | Onde fica salva | Vai para o Firebase? |
|---|---|---|
| Foto da propriedade (`PropriedadeForm`) | Armazenamento local do celular | Não — só o **caminho do arquivo local** vai para o Firestore |
| Foto da nota fiscal (`DespesaForm`) | Armazenamento local do celular | Não — mesma lógica acima |
| Logo do app / ícones (`assets/logo.png`, `icon.png`, etc.) | Dentro do próprio instalador do app (build) | Não se aplica — não é conteúdo de usuário |

Ou seja: **hoje o app não usa o Firebase Storage em nenhum momento**, mesmo o projeto
tendo Firebase configurado para autenticação (`firebase/auth`) e banco de dados
(`firebase/firestore`). Isso é uma escolha de arquitetura já existente no projeto, não algo
alterado nesta tarefa.

## As fotos de propriedade e nota fiscal ficam salvas no app local ou no Firebase?

**Ficam salvas só no celular do usuário (armazenamento local do app).** O Firebase entra
apenas para guardar o *caminho* desse arquivo local como texto, dentro do documento da
propriedade ou da despesa no Firestore.

O fluxo completo, hoje, é este:

1. O usuário escolhe uma foto na galeria com `expo-image-picker`
   (`ImagePicker.launchImageLibraryAsync`), em `Screens/PropriedadeForm.tsx` ou
   `Screens/DespesaForm.tsx`.
2. Essa foto é comprimida e redimensionada com `expo-image-manipulator`.
3. O arquivo comprimido é copiado para uma pasta própria do app no armazenamento do
   aparelho, usando `expo-file-system` — isso acontece em `Services/imagens.ts`:
   - Fotos de propriedade vão para `Paths.document/propriedades/<propriedadeId>.jpg`
   - Fotos de nota fiscal vão para `Paths.document/notas/<despesaId>.jpg`
4. A função retorna a **URI local** desse arquivo (algo como
   `file:///data/user/0/.../propriedades/abc123.jpg`).
5. Essa URI (uma string) é salva no Firestore, no campo `imagemUrl` (propriedade) ou
   `notaFiscalUri` (despesa) — **não é o arquivo de imagem em si, é só o texto do caminho**.

```ts
// Services/imagens.ts
export async function enviarImagemPropriedade(uri: string, propriedadeId: string): Promise<string> {
  // ...compacta e copia a imagem para a pasta local do app (expo-file-system)
  return destino.uri; // ex: file:///.../propriedades/abc123.jpg
}
```

```ts
// Screens/PropriedadeForm.tsx
if (imagemLocal) {
  const url = await enviarImagemPropriedade(imagemLocal, id!);
  await atualizarPropriedade(id!, { imagemUrl: url }); // salva só a URI local no Firestore
}
```

O nome da função (`enviarImagemPropriedade`, "enviar") pode passar a impressão de que a
imagem é enviada para um servidor — mas na prática ela só é copiada dentro do próprio
aparelho. Não existe upload para nenhum servidor/nuvem no código atual.

## O que isso significa na prática?

- **As imagens não são sincronizadas entre dispositivos.** Se o usuário instalar o app em
  outro celular ou trocar de aparelho, as fotos não aparecem — só o Firestore (texto,
  números, datas) é compartilhado entre dispositivos, porque isso sim está na nuvem.
- **As imagens não têm backup automático.** Se o app for desinstalado, ou os dados do app
  forem limpos, os arquivos em `propriedades/` e `notas/` são apagados e não podem ser
  recuperados.
- **O link pode "quebrar".** Como o Firestore guarda o caminho local (`file://...`), se o
  arquivo local for apagado (manualmente, ou reinstalando o app) mas o documento no
  Firestore continuar existindo com aquele campo `imagemUrl`/`notaFiscalUri` preenchido, o
  app vai tentar carregar uma imagem que não existe mais — não há um Firebase Storage por
  trás para servir esse arquivo de outro lugar.
- **Ocupa espaço no armazenamento do próprio celular**, já que os arquivos ficam na pasta
  de documentos do app (não é cache, então o sistema operacional não limpa sozinho).

## E a logo do app (Login, Home, ícone do app)?

Isso é um tipo de imagem completamente diferente das fotos acima — é um **asset estático**,
não conteúdo de usuário:

- Fica dentro da pasta `assets/` do projeto (`logo.png`, `icon.png`, `adaptive-icon.png`,
  `splash-icon.png`, `favicon.png`).
- É referenciada direto no código com `require('../assets/logo.png')` (em `Screens/Login.tsx`
  e `Screens/Home.tsx`) ou apontada no `app.json` (ícone do app, ícone adaptativo do
  Android, splash screen, favicon web).
- Esses arquivos são **empacotados dentro do próprio instalador do app** quando ele é
  compilado (build do Expo/EAS). Não passam pelo Firebase, pelo Firestore, nem são
  baixados em tempo de execução — já vêm dentro do app instalado no celular.
- Por isso, para trocar a logo é preciso editar o arquivo em `assets/` e gerar um novo
  build do app; não é algo que um usuário final consiga alterar pelo app.

## Isso está "errado"? Precisa mudar?

Não necessariamente — muitos apps pequenos/MVP funcionam assim de propósito, para evitar a
complexidade e o custo de um serviço de armazenamento em nuvem. Mas vale ter clareza do
trade-off:

- **Hoje**: mais simples, sem custo de armazenamento em nuvem, mas sem sincronização entre
  aparelhos e sem backup das fotos.
- **Alternativa** (não implementada): usar o **Firebase Storage** (ou outro serviço, tipo
  Cloudinary/S3) para de fato enviar a imagem para a nuvem e salvar no Firestore uma URL
  pública/assinada daquele arquivo remoto. Isso resolveria a sincronização entre
  dispositivos e o backup, mas exige configurar o Storage no projeto Firebase, ajustar as
  regras de acesso e trocar a lógica de `Services/imagens.ts` para fazer upload em vez de
  copiar localmente.

Este documento é só um retrato do que existe hoje no código — nenhuma mudança de
comportamento foi feita a partir dele.
