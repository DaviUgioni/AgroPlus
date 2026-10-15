// Services/planilha/relatorio.ts
// Monta as abas do relatório a partir de dados já carregados. Não acessa o Firebase,
// o que permite testar a planilha fora do app.
import { Aba, Celula, Estilo, Linha, celula as c, ref } from './xlsx';

export type CategoriaRel = 'insumo' | 'mao_de_obra' | 'maquinario' | 'outros';

export const CATEGORIAS_REL: { chave: CategoriaRel; nome: string }[] = [
  { chave: 'insumo', nome: 'Insumo' },
  { chave: 'mao_de_obra', nome: 'Mão de obra' },
  { chave: 'maquinario', nome: 'Maquinário' },
  { chave: 'outros', nome: 'Outros' },
];

const NOME_CATEGORIA = Object.fromEntries(CATEGORIAS_REL.map((x) => [x.chave, x.nome])) as Record<CategoriaRel, string>;

export interface DadosRelatorio {
  geradoEm: Date;
  usuario: string;
  /** Ex.: "Todas as propriedades" ou o nome de uma propriedade */
  escopo: string;
  propriedades: {
    id: string;
    nome: string;
    localizacao: string;
    areaTotal: number;
    limiteMensal?: number;
    latitude?: number;
    longitude?: number;
  }[];
  talhoes: { id: string; nome: string; area: number; propriedadeId: string }[];
  plantios: {
    propriedadeId: string;
    talhaoId?: string | null;
    talhaoNome?: string | null;
    tipoNome: string;
    dataPlantio: Date;
    diasParaColheita: number;
  }[];
  despesas: {
    propriedadeId: string;
    talhaoId?: string | null;
    categoria: CategoriaRel;
    descricao: string;
    valor: number;
    data: Date;
    recorrenciaMeses?: number;
    notaFiscal: boolean;
  }[];
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DIA = 86400000;

function inicioDoDia(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function soma(valores: number[]): number {
  // Arredonda em centavos para não aparecer 0,30000000000000004
  return Math.round(valores.reduce((s, v) => s + v, 0) * 100) / 100;
}

// Cabeçalho padrão de cada aba: título, subtítulo e uma linha em branco
function topo(titulo: string, dados: DadosRelatorio, colunas: number): { linhas: Linha[]; mesclas: string[] } {
  const quando = dados.geradoEm.toLocaleDateString('pt-BR') + ' às ' +
    dados.geradoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return {
    linhas: [
      { celulas: [c(titulo, 'titulo')], altura: 30 },
      { celulas: [c(`${dados.escopo} · Gerado pelo AgroPlus em ${quando} · ${dados.usuario}`, 'subtitulo')] },
      { celulas: [] },
    ],
    mesclas: [`A1:${ref(0, colunas - 1)}`, `A2:${ref(1, colunas - 1)}`],
  };
}

function cabecalho(titulos: string[]): Linha {
  return { celulas: titulos.map((t) => c(t, 'cabecalho')), altura: 30 };
}

// Linha de total com SUM nas colunas indicadas (o resultado já vai calculado)
function linhaTotal(
  rotulo: string,
  colunas: number,
  linhaInicio: number,
  linhaFim: number,
  somas: { coluna: number; valor: number; estilo: Estilo }[]
): Linha {
  const celulas: Celula[] = Array.from({ length: colunas }, (_, i) => c(i === 0 ? rotulo : null, i === 0 ? 'totalRotulo' : 'totalVazio'));
  for (const s of somas) {
    celulas[s.coluna] = c(
      linhaFim >= linhaInicio
        ? { formula: `SUM(${ref(linhaInicio, s.coluna)}:${ref(linhaFim, s.coluna)})`, resultado: s.valor }
        : 0,
      s.estilo
    );
  }
  return { celulas, altura: 22 };
}

export function montarRelatorio(dados: DadosRelatorio): Aba[] {
  const hoje = inicioDoDia(dados.geradoEm);
  const fimDeHoje = hoje + DIA - 1;
  const anoAtual = dados.geradoEm.getFullYear();
  const mesAtual = dados.geradoEm.getMonth();

  const nomeProp = new Map(dados.propriedades.map((p) => [p.id, p.nome]));
  const talhaoPorId = new Map(dados.talhoes.map((t) => [t.id, t]));

  // Despesas "lançadas" já aconteceram; "agendadas" são parcelas de meses futuros
  const lancadas = dados.despesas.filter((d) => d.data.getTime() <= fimDeHoje);
  const agendadas = dados.despesas.filter((d) => d.data.getTime() > fimDeHoje);
  const doMes = (d: { data: Date }) => d.data.getFullYear() === anoAtual && d.data.getMonth() === mesAtual;
  const doAno = (d: { data: Date }) => d.data.getFullYear() === anoAtual;

  const plantios = dados.plantios.map((p) => {
    const prevista = new Date(p.dataPlantio);
    prevista.setDate(prevista.getDate() + p.diasParaColheita);
    const diasRestantes = Math.ceil((inicioDoDia(prevista) - hoje) / DIA);
    const progresso = Math.min(1, Math.max(0, 1 - diasRestantes / (p.diasParaColheita || 1)));
    return { ...p, prevista, diasRestantes, progresso };
  });

  const abas: Aba[] = [];

  // ===================== Resumo =====================
  {
    const COLS = 10;
    const t = topo('Relatório da produção', dados, COLS);
    const linhas = t.linhas;
    const mesclas = [...t.mesclas];
    const nomeMes = `${MESES[mesAtual]}/${anoAtual}`;

    linhas.push({ celulas: [c('Visão geral', 'secao')], altura: 24 });
    const indicadores: [string, number, Estilo][] = [
      ['Propriedades', dados.propriedades.length, 'inteiro'],
      ['Área total (ha)', soma(dados.propriedades.map((p) => p.areaTotal || 0)), 'numero'],
      ['Talhões', dados.talhoes.length, 'inteiro'],
      ['Plantios cadastrados', plantios.length, 'inteiro'],
      ['Plantios prontos para colher', plantios.filter((p) => p.diasRestantes <= 0).length, 'inteiro'],
      ['Total gasto até hoje', soma(lancadas.map((d) => d.valor)), 'moedaNegrito'],
      [`Gasto no mês (${nomeMes})`, soma(lancadas.filter(doMes).map((d) => d.valor)), 'moeda'],
      [`Gasto no ano (${anoAtual})`, soma(lancadas.filter(doAno).map((d) => d.valor)), 'moeda'],
      ['Despesas agendadas (meses futuros)', soma(agendadas.map((d) => d.valor)), 'moeda'],
    ];
    for (const [rotulo, valor, estilo] of indicadores) {
      linhas.push({ celulas: [c(rotulo, 'rotulo'), c(valor, estilo)] });
    }

    // --- por propriedade ---
    linhas.push({ celulas: [] });
    linhas.push({ celulas: [c('Por propriedade', 'secao')], altura: 24 });
    linhas.push(
      cabecalho([
        'Propriedade', 'Localização', 'Área (ha)', 'Talhões', 'Plantios',
        `Gasto no mês`, `Gasto no ano`, 'Total gasto', 'Limite mensal', 'Uso do limite',
      ])
    );
    const inicioProp = linhas.length;
    const totaisProp = { area: 0, talhoes: 0, plantios: 0, mes: 0, ano: 0, total: 0 };
    for (const p of dados.propriedades) {
      const desp = lancadas.filter((d) => d.propriedadeId === p.id);
      const mes = soma(desp.filter(doMes).map((d) => d.valor));
      const ano = soma(desp.filter(doAno).map((d) => d.valor));
      const total = soma(desp.map((d) => d.valor));
      const nTalhoes = dados.talhoes.filter((x) => x.propriedadeId === p.id).length;
      const nPlantios = plantios.filter((x) => x.propriedadeId === p.id).length;
      const uso = p.limiteMensal ? mes / p.limiteMensal : null;
      totaisProp.area += p.areaTotal || 0;
      totaisProp.talhoes += nTalhoes;
      totaisProp.plantios += nPlantios;
      totaisProp.mes += mes;
      totaisProp.ano += ano;
      totaisProp.total += total;
      linhas.push({
        celulas: [
          c(p.nome, 'textoNegrito'),
          c(p.localizacao, 'texto'),
          c(p.areaTotal, 'numero'),
          c(nTalhoes, 'inteiro'),
          c(nPlantios, 'inteiro'),
          c(mes, 'moeda'),
          c(ano, 'moeda'),
          c(total, 'moeda'),
          c(p.limiteMensal ?? 'Sem limite', p.limiteMensal ? 'moeda' : 'apagado'),
          uso === null ? c('—', 'apagado') : c(uso, uso > 1 ? 'pctErro' : uso >= 0.8 ? 'pctAlerta' : 'pct'),
        ],
      });
    }
    const fimProp = linhas.length - 1;
    linhas.push(
      linhaTotal('Total', COLS, inicioProp, fimProp, [
        { coluna: 2, valor: soma([totaisProp.area]), estilo: 'totalNumero' },
        { coluna: 3, valor: totaisProp.talhoes, estilo: 'totalInteiro' },
        { coluna: 4, valor: totaisProp.plantios, estilo: 'totalInteiro' },
        { coluna: 5, valor: soma([totaisProp.mes]), estilo: 'totalMoeda' },
        { coluna: 6, valor: soma([totaisProp.ano]), estilo: 'totalMoeda' },
        { coluna: 7, valor: soma([totaisProp.total]), estilo: 'totalMoeda' },
      ])
    );

    // --- por categoria ---
    linhas.push({ celulas: [] });
    linhas.push({ celulas: [c('Gastos por categoria (até hoje)', 'secao')], altura: 24 });
    linhas.push(cabecalho(['Categoria', 'Total gasto', '% do total', 'Lançamentos']));
    const totalGeral = soma(lancadas.map((d) => d.valor));
    const inicioCat = linhas.length;
    for (const cat of CATEGORIAS_REL) {
      const daCat = lancadas.filter((d) => d.categoria === cat.chave);
      const total = soma(daCat.map((d) => d.valor));
      const linhaAtual = linhas.length;
      const linhaTotalCat = inicioCat + CATEGORIAS_REL.length; // linha do total, logo abaixo
      linhas.push({
        celulas: [
          c(cat.nome, 'textoNegrito'),
          c(total, 'moeda'),
          c(
            {
              formula: `IF(${ref(linhaTotalCat, 1)}=0,0,${ref(linhaAtual, 1)}/${ref(linhaTotalCat, 1)})`,
              resultado: totalGeral ? total / totalGeral : 0,
            },
            'pct'
          ),
          c(daCat.length, 'inteiro'),
        ],
      });
    }
    linhas.push(
      linhaTotal('Total', 4, inicioCat, linhas.length - 1, [
        { coluna: 1, valor: totalGeral, estilo: 'totalMoeda' },
        { coluna: 3, valor: lancadas.length, estilo: 'totalInteiro' },
      ])
    );

    abas.push({
      nome: 'Resumo',
      larguras: [36, 34, 12, 10, 10, 16, 16, 16, 16, 14],
      linhas,
      mesclas,
      semGrade: true,
    });
  }

  // ===================== Despesas =====================
  {
    const COLS = 9;
    const t = topo('Despesas', dados, COLS);
    const linhas = t.linhas;
    const ordenadas = [...dados.despesas].sort((a, b) => b.data.getTime() - a.data.getTime());
    linhas.push(
      cabecalho(['Data', 'Propriedade', 'Talhão', 'Categoria', 'Descrição', 'Valor', 'Situação', 'Repetição', 'Nota fiscal'])
    );
    const linhaCab = linhas.length - 1;
    for (const d of ordenadas) {
      const agendada = d.data.getTime() > fimDeHoje;
      linhas.push({
        celulas: [
          c(d.data, 'data'),
          c(nomeProp.get(d.propriedadeId) ?? '', 'texto'),
          c(d.talhaoId ? talhaoPorId.get(d.talhaoId)?.nome ?? '' : 'Propriedade toda', d.talhaoId ? 'texto' : 'apagado'),
          c(NOME_CATEGORIA[d.categoria] ?? d.categoria, 'texto'),
          c(d.descricao, 'texto'),
          c(d.valor, 'moeda'),
          c(agendada ? 'Agendada' : 'Lançada', agendada ? 'alerta' : 'sucesso'),
          c(d.recorrenciaMeses ? `Mensal (${d.recorrenciaMeses} meses)` : 'Única', 'texto'),
          c(d.notaFiscal ? 'Sim' : 'Não', d.notaFiscal ? 'texto' : 'apagado'),
        ],
      });
    }
    const ultima = linhas.length - 1;
    const faixa = (col: number) => `${ref(linhaCab + 1, col)}:${ref(Math.max(ultima, linhaCab + 1), col)}`;
    const totalLancado = soma(ordenadas.filter((d) => d.data.getTime() <= fimDeHoje).map((d) => d.valor));
    const totalAgendado = soma(ordenadas.filter((d) => d.data.getTime() > fimDeHoje).map((d) => d.valor));
    linhas.push({ celulas: [] });
    const total = (rotulo: string, criterio: string, valor: number): Linha => ({
      celulas: [
        c(rotulo, 'totalRotulo'), c(null, 'totalVazio'), c(null, 'totalVazio'), c(null, 'totalVazio'), c(null, 'totalVazio'),
        c({ formula: `SUMIF(${faixa(6)},"${criterio}",${faixa(5)})`, resultado: valor }, 'totalMoeda'),
        c(null, 'totalVazio'), c(null, 'totalVazio'), c(null, 'totalVazio'),
      ],
      altura: 22,
    });
    linhas.push(total('Total lançado (até hoje)', 'Lançada', totalLancado));
    linhas.push(total('Total agendado (meses futuros)', 'Agendada', totalAgendado));

    abas.push({
      nome: 'Despesas',
      larguras: [12, 24, 20, 14, 40, 15, 12, 18, 11],
      linhas,
      mesclas: t.mesclas,
      congelarLinhas: linhaCab + 1,
      filtro: { linhaCabecalho: linhaCab, ultimaLinha: ultima, colunas: COLS },
    });
  }

  // ===================== Gastos por mês =====================
  {
    const COLS = 2 + CATEGORIAS_REL.length;
    const t = topo('Gastos por mês', dados, COLS);
    const linhas = t.linhas;
    linhas.push(cabecalho(['Mês', ...CATEGORIAS_REL.map((x) => x.nome), 'Total do mês']));
    const linhaCab = linhas.length - 1;

    // Todos os meses entre a primeira despesa lançada e o mês atual (meses sem gasto aparecem zerados)
    const meses: { ano: number; mes: number }[] = [];
    if (lancadas.length) {
      const primeira = new Date(Math.min(...lancadas.map((d) => d.data.getTime())));
      let a = primeira.getFullYear();
      let m = primeira.getMonth();
      while (a < anoAtual || (a === anoAtual && m <= mesAtual)) {
        meses.push({ ano: a, mes: m });
        m++;
        if (m > 11) {
          m = 0;
          a++;
        }
      }
    }
    const inicio = linhas.length;
    const totaisCat = CATEGORIAS_REL.map(() => 0);
    for (const { ano, mes } of meses.reverse()) {
      const doMesAtual = lancadas.filter((d) => d.data.getFullYear() === ano && d.data.getMonth() === mes);
      const valores = CATEGORIAS_REL.map((cat) => soma(doMesAtual.filter((d) => d.categoria === cat.chave).map((d) => d.valor)));
      valores.forEach((v, i) => (totaisCat[i] += v));
      const linhaAtual = linhas.length;
      linhas.push({
        celulas: [
          c(new Date(ano, mes, 1), 'mesAno'),
          ...valores.map((v) => c(v, 'moeda')),
          c(
            { formula: `SUM(${ref(linhaAtual, 1)}:${ref(linhaAtual, CATEGORIAS_REL.length)})`, resultado: soma(valores) },
            'moedaNegrito'
          ),
        ],
      });
    }
    const fim = linhas.length - 1;
    linhas.push(
      linhaTotal('Total', COLS, inicio, fim, [
        ...totaisCat.map((v, i) => ({ coluna: i + 1, valor: soma([v]), estilo: 'totalMoeda' as Estilo })),
        { coluna: COLS - 1, valor: soma(totaisCat), estilo: 'totalMoeda' },
      ])
    );

    abas.push({
      nome: 'Gastos por mês',
      larguras: [16, 16, 16, 16, 16, 18],
      linhas,
      mesclas: t.mesclas,
      congelarLinhas: linhaCab + 1,
    });
  }

  // ===================== Plantios =====================
  {
    const COLS = 9;
    const t = topo('Plantios e previsão de colheita', dados, COLS);
    const linhas = t.linhas;
    linhas.push(
      cabecalho([
        'Propriedade', 'Talhão', 'Cultura', 'Data do plantio', 'Ciclo (dias)',
        'Colheita prevista', 'Dias restantes', 'Progresso', 'Situação',
      ])
    );
    const linhaCab = linhas.length - 1;
    for (const p of [...plantios].sort((a, b) => a.prevista.getTime() - b.prevista.getTime())) {
      const pronto = p.diasRestantes <= 0;
      const proximo = !pronto && p.diasRestantes <= 15;
      linhas.push({
        celulas: [
          c(nomeProp.get(p.propriedadeId) ?? '', 'textoNegrito'),
          c(p.talhaoNome ?? 'Propriedade toda', p.talhaoNome ? 'texto' : 'apagado'),
          c(p.tipoNome, 'texto'),
          c(p.dataPlantio, 'data'),
          c(p.diasParaColheita, 'inteiro'),
          c(p.prevista, 'data'),
          c(Math.max(0, p.diasRestantes), 'inteiro'),
          c(p.progresso, 'pct'),
          c(
            pronto ? 'Pronto para colher' : proximo ? 'Colheita próxima' : 'Em crescimento',
            pronto ? 'alerta' : proximo ? 'sucesso' : 'texto'
          ),
        ],
      });
    }
    abas.push({
      nome: 'Plantios',
      larguras: [24, 22, 16, 15, 12, 17, 14, 12, 20],
      linhas,
      mesclas: t.mesclas,
      congelarLinhas: linhaCab + 1,
      filtro: { linhaCabecalho: linhaCab, ultimaLinha: linhas.length - 1, colunas: COLS },
    });
  }

  // ===================== Propriedades e talhões =====================
  {
    const COLS = 7;
    const t = topo('Propriedades e talhões', dados, COLS);
    const linhas = t.linhas;
    const mesclas = [...t.mesclas];

    linhas.push({ celulas: [c('Propriedades', 'secao')], altura: 24 });
    linhas.push(
      cabecalho(['Propriedade', 'Localização', 'Área total (ha)', 'Área em talhões (ha)', 'Área livre (ha)', 'Latitude', 'Longitude'])
    );
    for (const p of dados.propriedades) {
      const emTalhoes = soma(dados.talhoes.filter((x) => x.propriedadeId === p.id).map((x) => x.area));
      const linhaAtual = linhas.length;
      linhas.push({
        celulas: [
          c(p.nome, 'textoNegrito'),
          c(p.localizacao, 'texto'),
          c(p.areaTotal, 'numero'),
          c(emTalhoes, 'numero'),
          c({ formula: `${ref(linhaAtual, 2)}-${ref(linhaAtual, 3)}`, resultado: soma([p.areaTotal - emTalhoes]) }, 'numero'),
          c(p.latitude ?? '—', p.latitude !== undefined ? 'texto' : 'apagado'),
          c(p.longitude ?? '—', p.longitude !== undefined ? 'texto' : 'apagado'),
        ],
      });
    }

    linhas.push({ celulas: [] });
    linhas.push({ celulas: [c('Talhões', 'secao')], altura: 24 });
    linhas.push(cabecalho(['Propriedade', 'Talhão', 'Área (ha)', '% da propriedade', 'Plantio mais recente', 'Total gasto', 'Gasto no ano']));
    const talhoesOrdenados = [...dados.talhoes].sort(
      (a, b) =>
        (nomeProp.get(a.propriedadeId) ?? '').localeCompare(nomeProp.get(b.propriedadeId) ?? '', 'pt-BR') ||
        a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true })
    );
    for (const tl of talhoesOrdenados) {
      const prop = dados.propriedades.find((p) => p.id === tl.propriedadeId);
      const desp = lancadas.filter((d) => d.talhaoId === tl.id);
      const plantio = plantios
        .filter((p) => p.talhaoId === tl.id)
        .sort((a, b) => b.dataPlantio.getTime() - a.dataPlantio.getTime())[0];
      linhas.push({
        celulas: [
          c(prop?.nome ?? '', 'textoNegrito'),
          c(tl.nome, 'texto'),
          c(tl.area, 'numero'),
          c(prop?.areaTotal ? tl.area / prop.areaTotal : 0, 'pct'),
          c(plantio ? plantio.tipoNome : 'Nenhum', plantio ? 'texto' : 'apagado'),
          c(soma(desp.map((d) => d.valor)), 'moeda'),
          c(soma(desp.filter(doAno).map((d) => d.valor)), 'moeda'),
        ],
      });
    }

    abas.push({
      nome: 'Propriedades e talhões',
      larguras: [26, 36, 15, 18, 22, 15, 15],
      linhas,
      mesclas,
    });
  }

  return abas;
}
