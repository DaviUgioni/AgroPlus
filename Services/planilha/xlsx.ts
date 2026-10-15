// Services/planilha/xlsx.ts
// Gerador mínimo de arquivos .xlsx (Office Open XML) com estilos, sem depender de
// React Native: é só montar os XMLs e compactar com o fflate. Assim dá para ter
// cabeçalho colorido, valores em R$, datas de verdade, filtros e totais com fórmula.
import { strToU8, zipSync } from 'fflate';

export type Estilo =
  | 'padrao'
  | 'titulo'
  | 'subtitulo'
  | 'secao'
  | 'rotulo'
  | 'cabecalho'
  | 'texto'
  | 'textoNegrito'
  | 'moeda'
  | 'moedaNegrito'
  | 'data'
  | 'mesAno'
  | 'numero'
  | 'inteiro'
  | 'pct'
  | 'pctAlerta'
  | 'pctErro'
  | 'alerta'
  | 'sucesso'
  | 'apagado'
  | 'totalRotulo'
  | 'totalMoeda'
  | 'totalNumero'
  | 'totalInteiro'
  | 'totalVazio';

export type Formula = { formula: string; resultado?: number | string };
export type Valor = string | number | Date | Formula | null | undefined;

export interface Celula {
  v: Valor;
  s?: Estilo;
}

export interface Linha {
  celulas: Celula[];
  altura?: number;
}

export interface Aba {
  nome: string;
  /** Largura de cada coluna, em "caracteres" do Excel */
  larguras: number[];
  linhas: Linha[];
  /** Quantas linhas do topo ficam fixas ao rolar */
  congelarLinhas?: number;
  /** Filtro automático: linha do cabeçalho e última linha de dados (índices a partir de 0) */
  filtro?: { linhaCabecalho: number; ultimaLinha: number; colunas: number };
  /** Células mescladas, ex.: "A1:F1" */
  mesclas?: string[];
  /** Esconde as linhas de grade (bom para a aba de resumo) */
  semGrade?: boolean;
}

export const celula = (v: Valor, s?: Estilo): Celula => ({ v, s });

// ---------- estilos ----------
// Cada estilo vira um <xf> em styles.xml; a ordem define o índice usado nas células.
const VERDE = 'FF1A9E4A';
const VERDE_ESCURO = 'FF147A3A';
const VERDE_SUAVE = 'FFEAF3DE';
const TEXTO = 'FF1C1C1A';
const TEXTO_SEC = 'FF66655F';
const BORDA = 'FFD3D1C7';
const ALERTA = 'FFB7791F';
const ERRO = 'FFC0392B';

const FONTES = [
  `<font><sz val="11"/><color rgb="${TEXTO}"/><name val="Calibri"/><family val="2"/></font>`, // 0 normal
  `<font><b/><sz val="11"/><color rgb="${TEXTO}"/><name val="Calibri"/><family val="2"/></font>`, // 1 negrito
  `<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>`, // 2 cabeçalho
  `<font><b/><sz val="18"/><color rgb="${VERDE}"/><name val="Calibri"/><family val="2"/></font>`, // 3 título
  `<font><i/><sz val="10"/><color rgb="${TEXTO_SEC}"/><name val="Calibri"/><family val="2"/></font>`, // 4 subtítulo
  `<font><b/><sz val="13"/><color rgb="${VERDE_ESCURO}"/><name val="Calibri"/><family val="2"/></font>`, // 5 seção
  `<font><sz val="11"/><color rgb="${TEXTO_SEC}"/><name val="Calibri"/><family val="2"/></font>`, // 6 rótulo
  `<font><b/><sz val="11"/><color rgb="${ALERTA}"/><name val="Calibri"/><family val="2"/></font>`, // 7 alerta
  `<font><b/><sz val="11"/><color rgb="${ERRO}"/><name val="Calibri"/><family val="2"/></font>`, // 8 erro
  `<font><b/><sz val="11"/><color rgb="${VERDE_ESCURO}"/><name val="Calibri"/><family val="2"/></font>`, // 9 sucesso
  `<font><sz val="11"/><color rgb="FF8A8880"/><name val="Calibri"/><family val="2"/></font>`, // 10 apagado
];

const PREENCHIMENTOS = [
  '<fill><patternFill patternType="none"/></fill>', // 0 (obrigatório)
  '<fill><patternFill patternType="gray125"/></fill>', // 1 (obrigatório)
  `<fill><patternFill patternType="solid"><fgColor rgb="${VERDE}"/><bgColor indexed="64"/></patternFill></fill>`, // 2 cabeçalho
  `<fill><patternFill patternType="solid"><fgColor rgb="${VERDE_SUAVE}"/><bgColor indexed="64"/></patternFill></fill>`, // 3 total
];

const BORDAS = [
  '<border><left/><right/><top/><bottom/><diagonal/></border>', // 0 nenhuma
  `<border><left/><right/><top/><bottom style="thin"><color rgb="${BORDA}"/></bottom><diagonal/></border>`, // 1 linha fina embaixo
  `<border><left/><right/><top style="medium"><color rgb="${VERDE}"/></top><bottom/><diagonal/></border>`, // 2 linha de total
];

// Formatos numéricos próprios (a partir do id 164, como pede o padrão)
const FORMATOS: Record<number, string> = {
  164: '"R$" #,##0.00;[Red]-"R$" #,##0.00',
  165: 'dd/mm/yyyy',
  166: '0%',
  167: '#,##0.00',
  168: 'mmm/yyyy',
};

type DefEstilo = { fonte: number; fundo?: number; borda?: number; formato?: number; alinhamento?: string };

const ESTILOS: Record<Estilo, DefEstilo> = {
  padrao: { fonte: 0 },
  titulo: { fonte: 3, alinhamento: '<alignment vertical="center"/>' },
  subtitulo: { fonte: 4 },
  secao: { fonte: 5, alinhamento: '<alignment vertical="bottom"/>' },
  rotulo: { fonte: 6, borda: 1 },
  cabecalho: { fonte: 2, fundo: 2, alinhamento: '<alignment vertical="center" wrapText="1"/>' },
  texto: { fonte: 0, borda: 1, alinhamento: '<alignment vertical="center"/>' },
  textoNegrito: { fonte: 1, borda: 1, alinhamento: '<alignment vertical="center"/>' },
  moeda: { fonte: 0, borda: 1, formato: 164 },
  moedaNegrito: { fonte: 1, borda: 1, formato: 164 },
  data: { fonte: 0, borda: 1, formato: 165, alinhamento: '<alignment horizontal="center"/>' },
  mesAno: { fonte: 1, borda: 1, formato: 168, alinhamento: '<alignment horizontal="left"/>' },
  numero: { fonte: 0, borda: 1, formato: 167 },
  inteiro: { fonte: 0, borda: 1, formato: 3, alinhamento: '<alignment horizontal="center"/>' },
  pct: { fonte: 0, borda: 1, formato: 166, alinhamento: '<alignment horizontal="center"/>' },
  pctAlerta: { fonte: 7, borda: 1, formato: 166, alinhamento: '<alignment horizontal="center"/>' },
  pctErro: { fonte: 8, borda: 1, formato: 166, alinhamento: '<alignment horizontal="center"/>' },
  alerta: { fonte: 7, borda: 1 },
  sucesso: { fonte: 9, borda: 1 },
  apagado: { fonte: 10, borda: 1 },
  totalRotulo: { fonte: 1, fundo: 3, borda: 2 },
  totalMoeda: { fonte: 1, fundo: 3, borda: 2, formato: 164 },
  totalNumero: { fonte: 1, fundo: 3, borda: 2, formato: 167 },
  totalInteiro: { fonte: 1, fundo: 3, borda: 2, formato: 3, alinhamento: '<alignment horizontal="center"/>' },
  totalVazio: { fonte: 1, fundo: 3, borda: 2 },
};

const ORDEM_ESTILOS = Object.keys(ESTILOS) as Estilo[];

function stylesXml(): string {
  const numFmts = Object.entries(FORMATOS)
    .map(([id, codigo]) => `<numFmt numFmtId="${id}" formatCode="${esc(codigo)}"/>`)
    .join('');
  const xfs = ORDEM_ESTILOS.map((nome) => {
    const e = ESTILOS[nome];
    const formato = e.formato ?? 0;
    const atributos = [
      `numFmtId="${formato}"`,
      `fontId="${e.fonte}"`,
      `fillId="${e.fundo ?? 0}"`,
      `borderId="${e.borda ?? 0}"`,
      'xfId="0"',
      formato ? 'applyNumberFormat="1"' : '',
      e.fonte ? 'applyFont="1"' : '',
      e.fundo ? 'applyFill="1"' : '',
      e.borda ? 'applyBorder="1"' : '',
      e.alinhamento ? 'applyAlignment="1"' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return e.alinhamento ? `<xf ${atributos}>${e.alinhamento}</xf>` : `<xf ${atributos}/>`;
  }).join('');

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<numFmts count="${Object.keys(FORMATOS).length}">${numFmts}</numFmts>` +
    `<fonts count="${FONTES.length}">${FONTES.join('')}</fonts>` +
    `<fills count="${PREENCHIMENTOS.length}">${PREENCHIMENTOS.join('')}</fills>` +
    `<borders count="${BORDAS.length}">${BORDAS.join('')}</borders>` +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    `<cellXfs count="${ORDEM_ESTILOS.length}">${xfs}</cellXfs>` +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>'
  );
}

// ---------- utilitários ----------
function esc(texto: string): string {
  return texto
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Índice de coluna (0 = A) para letra(s) do Excel */
export function letraColuna(indice: number): string {
  let n = indice + 1;
  let letras = '';
  while (n > 0) {
    const resto = (n - 1) % 26;
    letras = String.fromCharCode(65 + resto) + letras;
    n = Math.floor((n - 1) / 26);
  }
  return letras;
}

/** Endereço no formato do Excel, ex.: (0, 0) → "A1" */
export function ref(linha: number, coluna: number): string {
  return `${letraColuna(coluna)}${linha + 1}`;
}

/** Data → número de série do Excel (dias desde 30/12/1899), usando a data local */
function serialExcel(data: Date): number {
  const utc = Date.UTC(data.getFullYear(), data.getMonth(), data.getDate());
  return (utc - Date.UTC(1899, 11, 30)) / 86400000;
}

function celulaXml(c: Celula, endereco: string): string {
  const s = ` s="${ORDEM_ESTILOS.indexOf(c.s ?? 'padrao')}"`;
  const v = c.v;
  if (v === null || v === undefined || v === '') return c.s ? `<c r="${endereco}"${s}/>` : '';
  if (typeof v === 'number') {
    return Number.isFinite(v) ? `<c r="${endereco}"${s}><v>${v}</v></c>` : `<c r="${endereco}"${s}/>`;
  }
  if (v instanceof Date) return `<c r="${endereco}"${s}><v>${serialExcel(v)}</v></c>`;
  if (typeof v === 'object') {
    // Fórmula com o resultado já calculado, para quem abre a planilha em visualizadores
    // que não recalculam (prévia do WhatsApp, Google Drive...)
    const r = v.resultado;
    if (typeof r === 'string') {
      return `<c r="${endereco}"${s} t="str"><f>${esc(v.formula)}</f><v>${esc(r)}</v></c>`;
    }
    return `<c r="${endereco}"${s}><f>${esc(v.formula)}</f>${r !== undefined ? `<v>${r}</v>` : ''}</c>`;
  }
  return `<c r="${endereco}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(String(v))}</t></is></c>`;
}

function abaXml(aba: Aba, primeira: boolean): string {
  const congelar = aba.congelarLinhas ?? 0;
  const pane = congelar
    ? `<pane ySplit="${congelar}" topLeftCell="A${congelar + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A${congelar + 1}" sqref="A${congelar + 1}"/>`
    : '';
  const view = `<sheetViews><sheetView workbookViewId="0"${primeira ? ' tabSelected="1"' : ''}${aba.semGrade ? ' showGridLines="0"' : ''}>${pane}</sheetView></sheetViews>`;

  const cols = aba.larguras.length
    ? `<cols>${aba.larguras.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
    : '';

  const linhas = aba.linhas
    .map((linha, i) => {
      const celulas = linha.celulas.map((c, j) => celulaXml(c, ref(i, j))).join('');
      const altura = linha.altura ? ` ht="${linha.altura}" customHeight="1"` : '';
      return `<row r="${i + 1}"${altura}>${celulas}</row>`;
    })
    .join('');

  const filtro = aba.filtro
    ? `<autoFilter ref="${ref(aba.filtro.linhaCabecalho, 0)}:${ref(Math.max(aba.filtro.ultimaLinha, aba.filtro.linhaCabecalho), aba.filtro.colunas - 1)}"/>`
    : '';
  const mesclas = aba.mesclas?.length
    ? `<mergeCells count="${aba.mesclas.length}">${aba.mesclas.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>`
    : '';

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' +
    view +
    '<sheetFormatPr defaultRowHeight="18" customHeight="1"/>' +
    cols +
    `<sheetData>${linhas}</sheetData>` +
    filtro +
    mesclas +
    '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>' +
    '<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>' +
    '</worksheet>'
  );
}

/** Nome de aba aceito pelo Excel: até 31 caracteres, sem []:*?/\ */
function nomeAbaSeguro(nome: string): string {
  return nome.replace(/[\[\]:*?/\\]/g, ' ').slice(0, 31);
}

export function gerarXlsx(abas: Aba[], info: { titulo: string; autor: string; data: Date }): Uint8Array {
  const nomes = abas.map((a) => nomeAbaSeguro(a.nome));
  const arquivos: Record<string, Uint8Array> = {};

  arquivos['[Content_Types].xml'] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      abas
        .map(
          (_, i) =>
            `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
        )
        .join('') +
      '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
      '</Types>'
  );

  arquivos['_rels/.rels'] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
      '</Relationships>'
  );

  const iso = info.data.toISOString().replace(/\.\d{3}Z$/, 'Z');
  arquivos['docProps/core.xml'] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
      `<dc:title>${esc(info.titulo)}</dc:title><dc:creator>${esc(info.autor)}</dc:creator>` +
      `<dcterms:created xsi:type="dcterms:W3CDTF">${iso}</dcterms:created>` +
      '</cp:coreProperties>'
  );

  // Intervalo do filtro automático precisa estar declarado como nome oculto
  const nomesDefinidos = abas
    .map((a, i) =>
      a.filtro
        ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${esc(nomes[i].replace(/'/g, "''"))}'!$A$${a.filtro.linhaCabecalho + 1}:$${letraColuna(a.filtro.colunas - 1)}$${Math.max(a.filtro.ultimaLinha, a.filtro.linhaCabecalho) + 1}</definedName>`
        : ''
    )
    .join('');

  arquivos['xl/workbook.xml'] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<bookViews><workbookView activeTab="0"/></bookViews>' +
      `<sheets>${nomes.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>` +
      (nomesDefinidos ? `<definedNames>${nomesDefinidos}</definedNames>` : '') +
      '<calcPr calcId="191029" fullCalcOnLoad="1"/>' +
      '</workbook>'
  );

  arquivos['xl/_rels/workbook.xml.rels'] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      abas
        .map(
          (_, i) =>
            `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
        )
        .join('') +
      `<Relationship Id="rId${abas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      '</Relationships>'
  );

  arquivos['xl/styles.xml'] = strToU8(stylesXml());
  abas.forEach((aba, i) => {
    arquivos[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(abaXml(aba, i === 0));
  });

  return zipSync(arquivos, { level: 6 });
}
