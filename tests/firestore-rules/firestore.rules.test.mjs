// Testes das regras do Firestore (../../firestore.rules).
// Rodar com: cd tests/firestore-rules && npm install && npm test
// Requer Java instalado (o emulador do Firestore roda em Java).
import { before, after, beforeEach, describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDocs,
  collection,
  query,
  where,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';

const rules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-agroplus',
    firestore: { rules },
  });
});

after(async () => {
  await env.cleanup();
});

// Dados iniciais: alice e bob têm uma propriedade cada, e a alice tem
// talhão, despesa e plantio dentro da propriedade dela.
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'propriedades', 'p-alice'), { nome: 'Sítio da Alice', userId: 'alice', areaTotal: 10 });
    await setDoc(doc(db, 'propriedades', 'p-bob'), { nome: 'Fazenda do Bob', userId: 'bob', areaTotal: 20 });
    await setDoc(doc(db, 'talhoes', 't-alice'), { nome: 'Talhão 1', area: 5, propriedadeId: 'p-alice' });
    await setDoc(doc(db, 'despesas', 'd-alice'), {
      propriedadeId: 'p-alice',
      talhaoId: 't-alice',
      categoria: 'insumo',
      descricao: 'Adubo',
      valor: 100,
      data: Timestamp.now(),
    });
    await setDoc(doc(db, 'plantios', 'pl-alice'), {
      propriedadeId: 'p-alice',
      talhaoId: 't-alice',
      tipoChave: 'milho',
      tipoNome: 'Milho',
      diasParaColheita: 120,
      dataPlantio: Timestamp.now(),
    });
  });
});

const comoAlice = () => env.authenticatedContext('alice').firestore();
const comoBob = () => env.authenticatedContext('bob').firestore();
const anonimo = () => env.unauthenticatedContext().firestore();

describe('sem login', () => {
  it('não lê nem escreve em nenhuma coleção', async () => {
    const db = anonimo();
    await assertFails(getDoc(doc(db, 'propriedades', 'p-alice')));
    await assertFails(getDoc(doc(db, 'talhoes', 't-alice')));
    await assertFails(getDoc(doc(db, 'despesas', 'd-alice')));
    await assertFails(getDoc(doc(db, 'plantios', 'pl-alice')));
    await assertFails(setDoc(doc(db, 'propriedades', 'x'), { userId: 'alice' }));
  });
});

describe('propriedades', () => {
  it('dono lê a própria propriedade', async () => {
    await assertSucceeds(getDoc(doc(comoAlice(), 'propriedades', 'p-alice')));
  });

  it('outro usuário não lê a propriedade alheia', async () => {
    await assertFails(getDoc(doc(comoBob(), 'propriedades', 'p-alice')));
  });

  it('getDoc de propriedade inexistente devolve "não existe" (buscarPropriedade)', async () => {
    const snap = await assertSucceeds(getDoc(doc(comoAlice(), 'propriedades', 'nao-existe')));
    if (snap.exists()) throw new Error('documento não deveria existir');
  });

  it('lista só as próprias (where userId == uid), como listarPropriedades', async () => {
    const col = collection(comoAlice(), 'propriedades');
    await assertSucceeds(getDocs(query(col, where('userId', '==', 'alice'))));
  });

  it('não lista as de outro usuário nem a coleção inteira', async () => {
    const col = collection(comoAlice(), 'propriedades');
    await assertFails(getDocs(query(col, where('userId', '==', 'bob'))));
    await assertFails(getDocs(col));
  });

  it('cria propriedade em nome próprio', async () => {
    await assertSucceeds(
      addDoc(collection(comoAlice(), 'propriedades'), { nome: 'Nova', userId: 'alice', areaTotal: 3 }),
    );
  });

  it('NÃO cria propriedade com userId de outra pessoa (falha corrigida)', async () => {
    await assertFails(
      addDoc(collection(comoAlice(), 'propriedades'), { nome: 'Falsa', userId: 'bob', areaTotal: 3 }),
    );
  });

  it('NÃO cria propriedade sem userId', async () => {
    await assertFails(addDoc(collection(comoAlice(), 'propriedades'), { nome: 'Sem dono', areaTotal: 3 }));
  });

  it('dono atualiza campos (ex.: limiteMensal)', async () => {
    await assertSucceeds(updateDoc(doc(comoAlice(), 'propriedades', 'p-alice'), { limiteMensal: 500 }));
  });

  it('dono não consegue trocar o userId', async () => {
    await assertFails(updateDoc(doc(comoAlice(), 'propriedades', 'p-alice'), { userId: 'bob' }));
  });

  it('outro usuário não atualiza nem apaga a propriedade alheia', async () => {
    await assertFails(updateDoc(doc(comoBob(), 'propriedades', 'p-alice'), { nome: 'Invadida' }));
    await assertFails(deleteDoc(doc(comoBob(), 'propriedades', 'p-alice')));
  });

  it('dono apaga a própria propriedade', async () => {
    await assertSucceeds(deleteDoc(doc(comoAlice(), 'propriedades', 'p-alice')));
  });
});

// talhões, despesas e plantios seguem a mesma regra: só o dono da propriedade pai
for (const [colecao, idExistente, novo] of [
  ['talhoes', 't-alice', (propriedadeId) => ({ nome: 'T2', area: 2, propriedadeId })],
  [
    'despesas',
    'd-alice',
    (propriedadeId) => ({
      propriedadeId,
      talhaoId: null,
      categoria: 'outros',
      descricao: 'Teste',
      valor: 10,
      data: Timestamp.now(),
    }),
  ],
  [
    'plantios',
    'pl-alice',
    (propriedadeId) => ({
      propriedadeId,
      talhaoId: null,
      tipoChave: 'soja',
      tipoNome: 'Soja',
      diasParaColheita: 100,
      dataPlantio: Timestamp.now(),
    }),
  ],
]) {
  describe(colecao, () => {
    it('dono lê um documento da própria propriedade', async () => {
      await assertSucceeds(getDoc(doc(comoAlice(), colecao, idExistente)));
    });

    it('outro usuário não lê documento da propriedade alheia', async () => {
      await assertFails(getDoc(doc(comoBob(), colecao, idExistente)));
    });

    it('lista por propriedadeId da própria propriedade', async () => {
      const col = collection(comoAlice(), colecao);
      await assertSucceeds(getDocs(query(col, where('propriedadeId', '==', 'p-alice'))));
    });

    it('não lista por propriedadeId de outra pessoa', async () => {
      const col = collection(comoBob(), colecao);
      await assertFails(getDocs(query(col, where('propriedadeId', '==', 'p-alice'))));
    });

    it('cria na própria propriedade', async () => {
      await assertSucceeds(addDoc(collection(comoAlice(), colecao), novo('p-alice')));
    });

    it('não cria na propriedade de outra pessoa', async () => {
      await assertFails(addDoc(collection(comoAlice(), colecao), novo('p-bob')));
    });

    it('não move o documento para a propriedade de outra pessoa', async () => {
      await assertFails(updateDoc(doc(comoAlice(), colecao, idExistente), { propriedadeId: 'p-bob' }));
    });

    it('outro usuário não atualiza nem apaga', async () => {
      await assertFails(updateDoc(doc(comoBob(), colecao, idExistente), { descricao: 'x' }));
      await assertFails(deleteDoc(doc(comoBob(), colecao, idExistente)));
    });

    it('dono apaga o próprio documento', async () => {
      await assertSucceeds(deleteDoc(doc(comoAlice(), colecao, idExistente)));
    });
  });
}

describe('consultas e operações usadas pelo app', () => {
  it('despesas de um talhão com propriedadeId + talhaoId (listarDespesasPorTalhao)', async () => {
    const col = collection(comoAlice(), 'despesas');
    await assertSucceeds(
      getDocs(query(col, where('propriedadeId', '==', 'p-alice'), where('talhaoId', '==', 't-alice'))),
    );
  });

  it('INFORMATIVO: consulta só por talhaoId (forma antiga) é barrada pelas regras', async () => {
    // O app foi ajustado para sempre enviar propriedadeId junto. Este teste documenta
    // por que: sem o filtro, as regras não conseguem provar que o documento é do usuário.
    const col = collection(comoAlice(), 'despesas');
    await assertFails(getDocs(query(col, where('talhaoId', '==', 't-alice'))));
  });

  it('exclusão em cascata em um único lote (excluirPropriedade)', async () => {
    const db = comoAlice();
    const batch = writeBatch(db);
    batch.delete(doc(db, 'propriedades', 'p-alice'));
    batch.delete(doc(db, 'talhoes', 't-alice'));
    batch.delete(doc(db, 'despesas', 'd-alice'));
    await assertSucceeds(batch.commit());
  });

  it('coleções desconhecidas ficam negadas', async () => {
    await assertFails(getDoc(doc(comoAlice(), 'usuarios', 'alice')));
    await assertFails(setDoc(doc(comoAlice(), 'usuarios', 'alice'), { x: 1 }));
  });
});
