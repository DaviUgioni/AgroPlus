# Testes das regras do Firestore

Testam o `firestore.rules` da raiz do projeto no emulador local, sem tocar no projeto Firebase real.

## Rodar

Precisa de Node 20+ e Java instalado (o emulador do Firestore roda em Java).

```bash
cd tests/firestore-rules
npm install
npm test
```

O script usa o `firebase.json` da raiz e o projeto fictício `demo-agroplus` (não precisa de login nem de chave).

## O que é coberto

- Sem login: tudo negado.
- `propriedades`: só o dono lê, lista (`where userId == uid`), atualiza e apaga; não dá para criar propriedade com `userId` de outra pessoa nem trocar o `userId`.
- `talhoes`, `despesas` e `plantios`: só o dono da propriedade pai lê, lista (com `propriedadeId`), cria, move e apaga.
- Operações do app: consulta de despesas por talhão (com `propriedadeId`), exclusão em cascata em lote e coleções desconhecidas negadas.

O teste marcado como **INFORMATIVO** documenta por que `listarDespesasPorTalhao` recebe o `propriedadeId`: sem ele a consulta é barrada pelas regras.
