// Popula a conta da apresentação com um ano de uso (01/01/2026 até hoje):
// propriedades, talhões, plantios em rotação e despesas do dia a dia.
// Os dados entram como dados normais (sem a marca `exemplo` do botão de testes).
//
// Uso:  node scripts/popular-apresentacao.mjs
// Pede e-mail e senha da conta no terminal; nada é salvo.

import { readFileSync } from 'node:fs';
import readline from 'node:readline';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, getDocs, query, where, writeBatch, Timestamp, serverTimestamp } from 'firebase/firestore';

// Lê a config do FirebaseConfig.ts (que importa coisas do React Native e não roda no Node)
function lerConfig() {
  const fonte = readFileSync(new URL('../FirebaseConfig.ts', import.meta.url), 'utf8');
  const bloco = fonte.match(/firebaseConfig\s*=\s*\{([\s\S]*?)\}/)?.[1];
  if (!bloco) throw new Error('Não achei firebaseConfig em FirebaseConfig.ts');
  const config = {};
  for (const [, chave, valor] of bloco.matchAll(/(\w+)\s*:\s*['"]([^'"]+)['"]/g)) config[chave] = valor;
  return config;
}

function perguntar(texto, oculto = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (oculto) rl._writeToOutput = (s) => { if (s.includes(texto)) rl.output.write(s); };
    rl.question(texto, (resposta) => {
      rl.close();
      if (oculto) process.stdout.write('\n');
      resolve(resposta.trim());
    });
  });
}

// Aleatório com semente fixa: rodar de novo gera os mesmos números
let semente = 2026;
function aleatorio() {
  semente = (semente * 1664525 + 1013904223) % 4294967296;
  return semente / 4294967296;
}
const variar = (valor, pct = 0.15) => Math.round(valor * (1 + (aleatorio() * 2 - 1) * pct) * 100) / 100;
const entre = (min, max) => Math.floor(min + aleatorio() * (max - min + 1));

const INICIO = new Date(2026, 0, 1);
const HOJE = new Date();
const somarDias = (data, dias) => { const d = new Date(data); d.setDate(d.getDate() + dias); return d; };

const CULTURAS = {
  milho: { nome: 'Milho', dias: 120, semente: 950, adubo: 1300, defensivo: 420 },
  soja: { nome: 'Soja', dias: 100, semente: 560, adubo: 900, defensivo: 520 },
  feijao: { nome: 'Feijão', dias: 90, semente: 420, adubo: 700, defensivo: 380 },
  arroz: { nome: 'Arroz', dias: 120, semente: 480, adubo: 1100, defensivo: 460 },
  trigo: { nome: 'Trigo', dias: 110, semente: 380, adubo: 850, defensivo: 340 },
  cana: { nome: 'Cana-de-açúcar', dias: 365, semente: 1600, adubo: 1200, defensivo: 300 },
  mandioca: { nome: 'Mandioca', dias: 300, semente: 320, adubo: 500, defensivo: 150 },
  tomate: { nome: 'Tomate', dias: 80, semente: 3200, adubo: 2400, defensivo: 1800 },
  batata: { nome: 'Batata', dias: 90, semente: 4100, adubo: 2200, defensivo: 1500 },
  alface: { nome: 'Alface', dias: 45, semente: 1400, adubo: 700, defensivo: 250 },
  cenoura: { nome: 'Cenoura', dias: 75, semente: 1250, adubo: 900, defensivo: 400 },
};

// Cada talhão segue uma rotação de culturas a partir de uma data de início
const PROPRIEDADES = [
  {
    nome: 'Fazenda São José', localizacao: 'Meleiro, SC', latitude: -28.829, longitude: -49.637, limiteMensal: 80000,
    funcionarios: 3, talhoes: [
      { nome: 'Várzea 1', area: 32, inicio: '2026-01-08', rotacao: ['arroz', 'trigo', 'soja'] },
      { nome: 'Várzea 2', area: 28, inicio: '2026-01-15', rotacao: ['arroz', 'feijao', 'milho'] },
      { nome: 'Coxilha', area: 25, inicio: '2026-01-20', rotacao: ['soja', 'trigo', 'milho'] },
    ],
  },
  {
    nome: 'Fazenda Campo Alegre', localizacao: 'Ermo, SC', latitude: -28.987, longitude: -49.643, limiteMensal: 120000,
    funcionarios: 5, talhoes: [
      { nome: 'Talhão A', area: 45, inicio: '2026-01-05', rotacao: ['soja', 'milho', 'soja'] },
      { nome: 'Talhão B', area: 40, inicio: '2026-01-12', rotacao: ['arroz', 'trigo', 'arroz'] },
      { nome: 'Talhão C', area: 35, inicio: '2026-02-02', rotacao: ['milho', 'feijao', 'soja'] },
      { nome: 'Talhão D', area: 20, inicio: '2026-03-10', rotacao: ['feijao', 'trigo', 'milho'] },
    ],
  },
  {
    nome: 'Sítio Pedra Branca', localizacao: 'Forquilhinha, SC', latitude: -28.747, longitude: -49.472, limiteMensal: 15000,
    funcionarios: 1, talhoes: [
      { nome: 'Lavoura de cima', area: 8, inicio: '2026-01-18', rotacao: ['feijao', 'milho', 'feijao'] },
      { nome: 'Lavoura de baixo', area: 6, inicio: '2026-02-10', rotacao: ['mandioca'] },
      { nome: 'Encosta', area: 4, inicio: '2026-01-25', rotacao: ['milho', 'feijao'] },
    ],
  },
  {
    nome: 'Chácara Bela Vista', localizacao: 'Nova Veneza, SC', latitude: -28.637, longitude: -49.498, limiteMensal: 20000,
    funcionarios: 2, talhoes: [
      { nome: 'Estufa 1', area: 0.8, inicio: '2026-01-06', rotacao: ['tomate', 'alface', 'tomate'] },
      { nome: 'Estufa 2', area: 0.6, inicio: '2026-01-10', rotacao: ['alface', 'alface', 'cenoura'] },
      { nome: 'Canteiros', area: 2.1, inicio: '2026-02-03', rotacao: ['cenoura', 'batata', 'alface'] },
      { nome: 'Horta nova', area: 3, inicio: '2026-04-14', rotacao: ['batata', 'cenoura', 'tomate'] },
    ],
  },
  {
    nome: 'Sítio Morro Azul', localizacao: 'Timbé do Sul, SC', latitude: -28.829, longitude: -49.842, limiteMensal: 18000,
    funcionarios: 1, talhoes: [
      { nome: 'Canavial', area: 12, inicio: '2026-02-20', rotacao: ['cana'] },
      { nome: 'Roça velha', area: 7, inicio: '2026-03-05', rotacao: ['mandioca'] },
      { nome: 'Baixada', area: 5, inicio: '2026-01-28', rotacao: ['milho', 'batata', 'feijao'] },
    ],
  },
];

function gerarPlantiosEDespesas(prop, propriedadeId, talhaoIds) {
  const plantios = [];
  const despesas = [];
  const despesa = (data, categoria, descricao, valor, talhaoId = null) => {
    if (data > HOJE) return;
    despesas.push({ propriedadeId, talhaoId, categoria, descricao, valor: variar(valor, 0.05), data: Timestamp.fromDate(data), recorrente: false });
  };

  prop.talhoes.forEach((t, i) => {
    const talhaoId = talhaoIds[i];
    let data = new Date(`${t.inicio}T08:00:00`);
    let n = 0;
    while (data <= HOJE) {
      const chave = t.rotacao[n % t.rotacao.length];
      const c = CULTURAS[chave];
      plantios.push({
        propriedadeId, talhaoId, talhaoNome: t.nome, tipoChave: chave, tipoNome: c.nome,
        diasParaColheita: c.dias, dataPlantio: Timestamp.fromDate(data),
      });

      const area = t.area;
      despesa(somarDias(data, -entre(3, 8)), 'maquinario', `Preparo do solo - ${t.nome}`, variar(180 * area + 250));
      despesa(somarDias(data, -entre(1, 4)), 'insumo', `Sementes de ${c.nome.toLowerCase()}`, variar(c.semente * area), talhaoId);
      despesa(somarDias(data, entre(0, 3)), 'insumo', `Adubo de plantio - ${c.nome}`, variar(c.adubo * area * 0.6), talhaoId);
      despesa(somarDias(data, Math.round(c.dias * 0.3)), 'insumo', `Adubação de cobertura - ${c.nome}`, variar(c.adubo * area * 0.4), talhaoId);
      despesa(somarDias(data, Math.round(c.dias * 0.45)), 'insumo', `Defensivos - ${c.nome}`, variar(c.defensivo * area), talhaoId);
      if (c.dias >= 90) despesa(somarDias(data, Math.round(c.dias * 0.45) + 1), 'mao_de_obra', `Aplicação de defensivos - ${t.nome}`, variar(60 * area + 300), talhaoId);

      const colheita = somarDias(data, c.dias);
      despesa(colheita, 'maquinario', `Colheita de ${c.nome.toLowerCase()}`, variar(c.dias > 200 ? 420 * area : 260 * area + 400), talhaoId);
      despesa(somarDias(colheita, 1), 'mao_de_obra', `Diárias da colheita - ${c.nome}`, variar(Math.max(4, Math.round(area / 3)) * 150), talhaoId);
      despesa(somarDias(colheita, 2), 'outros', `Frete da produção - ${c.nome}`, variar(90 * area + 200), talhaoId);

      data = somarDias(colheita, entre(10, 25));
      n++;
    }
  });

  // Custos fixos de todo mês
  const areaTotal = prop.talhoes.reduce((s, t) => s + t.area, 0);
  for (let mes = 0; mes <= HOJE.getMonth(); mes++) {
    const dia = (d) => new Date(2026, mes, d, 9);
    despesa(dia(5), 'mao_de_obra', prop.funcionarios > 1 ? `Salários (${prop.funcionarios} funcionários)` : 'Salário do funcionário', prop.funcionarios * 2300);
    despesa(dia(10), 'maquinario', 'Diesel', variar(14 * areaTotal + 300, 0.25));
    despesa(dia(15), 'outros', 'Energia elétrica', variar(areaTotal > 50 ? 1450 : 420, 0.2));
    if (mes % 3 === 1) despesa(dia(entre(18, 26)), 'maquinario', 'Manutenção do trator', variar(areaTotal > 50 ? 3800 : 1200, 0.3));
    if (mes % 4 === 2) despesa(dia(entre(20, 27)), 'outros', 'Manutenção de cercas e estradas', variar(650, 0.3));
  }
  despesa(new Date(2026, 1, 20, 9), 'outros', 'ITR / taxas anuais', variar(areaTotal * 18 + 150));
  despesa(new Date(2026, 6, 8, 9), 'outros', 'Seguro rural', variar(areaTotal * 42 + 500));

  return { plantios, despesas };
}

async function salvarEmLotes(db, nomeColecao, itens) {
  for (let i = 0; i < itens.length; i += 400) {
    const lote = writeBatch(db);
    for (const item of itens.slice(i, i + 400)) {
      lote.set(doc(collection(db, nomeColecao)), { ...item, criadoEm: Timestamp.fromDate(item.data?.toDate?.() ?? item.dataPlantio.toDate()) });
    }
    await lote.commit();
  }
}

// `--simular`: só mostra o que seria criado, sem login e sem gravar nada
function simular() {
  for (const prop of PROPRIEDADES) {
    const { plantios, despesas } = gerarPlantiosEDespesas(prop, 'p', prop.talhoes.map((_, i) => `t${i}`));
    const valor = despesas.reduce((s, d) => s + d.valor, 0);
    const culturas = plantios.map((p) => `${p.tipoNome} ${p.dataPlantio.toDate().toLocaleDateString('pt-BR')}`).join(', ');
    console.log(`${prop.nome}: ${plantios.length} plantios, ${despesas.length} despesas, R$ ${valor.toFixed(2)}\n  ${culturas}`);
  }
}

async function main() {
  if (process.argv.includes('--simular')) return simular();
  const app = initializeApp(lerConfig());
  const auth = getAuth(app);
  const db = getFirestore(app);

  const email = await perguntar('E-mail da conta da apresentação: ');
  const senha = await perguntar('Senha: ', true);
  const { user } = await signInWithEmailAndPassword(auth, email, senha);
  const userId = user.uid;

  const existentes = await getDocs(query(collection(db, 'propriedades'), where('userId', '==', userId)));
  if (!existentes.empty) {
    const nomes = existentes.docs.map((d) => d.data().nome).join(', ');
    const ok = await perguntar(`A conta já tem ${existentes.size} propriedade(s): ${nomes}. Adicionar mesmo assim? (s/N) `);
    if (ok.toLowerCase() !== 's') return console.log('Cancelado.');
  }

  let totalPlantios = 0, totalDespesas = 0, totalValor = 0;
  for (const prop of PROPRIEDADES) {
    const areaTotal = Math.round(prop.talhoes.reduce((s, t) => s + t.area, 0) * 10) / 10;
    const { nome, localizacao, latitude, longitude, limiteMensal } = prop;
    const ref = await addDoc(collection(db, 'propriedades'), {
      nome, localizacao, latitude, longitude, areaTotal, limiteMensal, userId,
      criadoEm: Timestamp.fromDate(somarDias(INICIO, -entre(5, 20))),
    });

    const talhaoIds = [];
    for (const t of prop.talhoes) {
      const tRef = await addDoc(collection(db, 'talhoes'), { nome: t.nome, area: t.area, propriedadeId: ref.id, criadoEm: serverTimestamp() });
      talhaoIds.push(tRef.id);
    }

    const { plantios, despesas } = gerarPlantiosEDespesas(prop, ref.id, talhaoIds);
    await salvarEmLotes(db, 'plantios', plantios);
    await salvarEmLotes(db, 'despesas', despesas);

    const valor = despesas.reduce((s, d) => s + d.valor, 0);
    totalPlantios += plantios.length; totalDespesas += despesas.length; totalValor += valor;
    console.log(`✔ ${nome}: ${prop.talhoes.length} talhões, ${plantios.length} plantios, ${despesas.length} despesas (R$ ${valor.toFixed(2)})`);
  }
  console.log(`\nPronto: ${PROPRIEDADES.length} propriedades, ${totalPlantios} plantios, ${totalDespesas} despesas, R$ ${totalValor.toFixed(2)} em gastos.`);
  console.log('No app, puxe a tela para baixo para atualizar o resumo.');
}

main().then(() => process.exit(0)).catch((e) => { console.error('Erro:', e.message); process.exit(1); });
