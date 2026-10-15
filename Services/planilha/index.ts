// Services/planilha/index.ts
// Busca os dados no Firebase e monta o relatório em Excel (.xlsx). O arquivo pode ser
// baixado para uma pasta do celular (ex.: Downloads) ou compartilhado (WhatsApp, e-mail...).
import { Alert, Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { auth } from '../../FirebaseConfig';
import { listarPropriedades } from '../propriedades';
import { listarTalhoes } from '../talhoes';
import { listarPlantiosPorPropriedade } from '../plantios';
import { listarDespesasPorPropriedade } from '../despesas';
import { lerPreferencias, salvarPreferencia } from '../preferencias';
import { DadosRelatorio, montarRelatorio } from './relatorio';
import { gerarXlsx } from './xlsx';

const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Pasta Download do Android, usada para o seletor já abrir nela
const URI_DOWNLOADS_ANDROID = 'content://com.android.externalstorage.documents/document/primary%3ADownload';

/**
 * No Android 11+ o sistema não deixa escolher a própria pasta Download, só uma pasta dentro
 * dela. Antes do primeiro download, explica o passo a passo. Retorna false se o usuário desistir.
 */
export async function confirmarPrimeiroDownload(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const { pastaPlanilha } = await lerPreferencias();
  if (pastaPlanilha) return true;
  return new Promise((resolve) => {
    Alert.alert(
      'Escolha onde salvar',
      'Só na primeira vez. A próxima tela abre na pasta Download:\n\n1. Toque em "Criar nova pasta" e chame de AgroPlus (se ela já existir, é só abrir).\n2. Toque em "Usar esta pasta" e depois em "Permitir".\n\nDepois disso, as planilhas são salvas direto lá.',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Continuar', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

export class SemPropriedadesError extends Error {}
export class CanceladoError extends Error {}

function nomeArquivo(texto: string): string {
  return texto.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
}

/**
 * Gera a planilha completa (resumo, despesas, gastos por mês, plantios, propriedades e talhões).
 * Com `propriedadeId`, o relatório fica só com aquela propriedade.
 */
async function gerarPlanilha(propriedadeId?: string): Promise<{ nome: string; bytes: Uint8Array }> {
  const usuario = auth.currentUser;
  if (!usuario) throw new Error('Usuário não autenticado.');

  let propriedades = await listarPropriedades(usuario.uid);
  if (propriedadeId) propriedades = propriedades.filter((p) => p.id === propriedadeId);
  if (propriedades.length === 0) throw new SemPropriedadesError();

  const porPropriedade = await Promise.all(
    propriedades.map(async (p) => {
      const [talhoes, plantios, despesas] = await Promise.all([
        listarTalhoes(p.id!),
        listarPlantiosPorPropriedade(p.id!),
        listarDespesasPorPropriedade(p.id!),
      ]);
      return { talhoes, plantios, despesas };
    })
  );

  const agora = new Date();
  const dados: DadosRelatorio = {
    geradoEm: agora,
    usuario: usuario.displayName ? `${usuario.displayName} (${usuario.email})` : usuario.email ?? '',
    escopo: propriedadeId ? propriedades[0].nome : 'Todas as propriedades',
    propriedades: propriedades.map((p) => ({
      id: p.id!,
      nome: p.nome,
      localizacao: p.localizacao,
      areaTotal: p.areaTotal,
      limiteMensal: p.limiteMensal,
      latitude: p.latitude,
      longitude: p.longitude,
    })),
    talhoes: porPropriedade.flatMap((x) => x.talhoes.map((t) => ({ id: t.id!, nome: t.nome, area: t.area, propriedadeId: t.propriedadeId }))),
    plantios: porPropriedade.flatMap((x) =>
      x.plantios.map((p) => ({
        propriedadeId: p.propriedadeId,
        talhaoId: p.talhaoId,
        talhaoNome: p.talhaoNome,
        tipoNome: p.tipoNome,
        dataPlantio: p.dataPlantio.toDate(),
        diasParaColheita: p.diasParaColheita,
      }))
    ),
    despesas: porPropriedade.flatMap((x) =>
      x.despesas
        .filter((d) => d.data?.toDate)
        .map((d) => ({
          propriedadeId: d.propriedadeId,
          talhaoId: d.talhaoId,
          categoria: d.categoria,
          descricao: d.descricao,
          valor: d.valor,
          data: d.data.toDate(),
          recorrenciaMeses: d.recorrenciaMeses,
          notaFiscal: !!d.notaFiscalUri,
        }))
    ),
  };

  const bytes = gerarXlsx(montarRelatorio(dados), {
    titulo: `AgroPlus - ${dados.escopo}`,
    autor: usuario.email ?? 'AgroPlus',
    data: agora,
  });

  // Data e hora no nome, para cada download ter um nome único (ex.: 13-10-2026 14h05)
  const hora = `${String(agora.getHours()).padStart(2, '0')}h${String(agora.getMinutes()).padStart(2, '0')}`;
  const dataArquivo = `${agora.toLocaleDateString('pt-BR').replace(/\//g, '-')} ${hora}`;
  const nome = nomeArquivo(`AgroPlus - ${propriedadeId ? dados.escopo : 'Relatório completo'} - ${dataArquivo}.xlsx`);
  return { nome, bytes };
}

function salvarNoCache(nome: string, bytes: Uint8Array): File {
  const arquivo = new File(Paths.cache, nome);
  try {
    if (arquivo.exists) arquivo.delete();
  } catch {}
  arquivo.create();
  arquivo.write(bytes);
  return arquivo;
}

async function abrirMenuCompartilhar(arquivo: File, titulo: string) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Compartilhamento indisponível neste aparelho.');
  await Sharing.shareAsync(arquivo.uri, {
    mimeType: MIME_XLSX,
    UTI: 'org.openxmlformats.spreadsheetml.sheet',
    dialogTitle: titulo,
  });
}

/** Gera a planilha e abre o menu de compartilhar (WhatsApp, e-mail, Drive...) */
export async function compartilharPlanilha(propriedadeId?: string) {
  const { nome, bytes } = await gerarPlanilha(propriedadeId);
  await abrirMenuCompartilhar(salvarNoCache(nome, bytes), 'Compartilhar planilha');
}

/** Pasta escolhida para os downloads, se houver (nome para mostrar na tela) */
export async function pastaDeDownload(): Promise<string | null> {
  const { pastaPlanilha } = await lerPreferencias();
  if (!pastaPlanilha) return null;
  try {
    return new Directory(pastaPlanilha).name || 'pasta escolhida';
  } catch {
    return null;
  }
}

/** Esquece a pasta salva; no próximo download o app pergunta de novo */
export async function esquecerPastaDeDownload() {
  await salvarPreferencia('pastaPlanilha', undefined);
}

/**
 * Gera a planilha e salva no celular.
 * - Android: grava na pasta escolhida pelo usuário (na primeira vez o seletor abre em Downloads;
 *   depois o app lembra a pasta e salva direto).
 * - iOS: abre o menu do sistema, onde há a opção "Salvar em Arquivos".
 * Retorna o nome do arquivo e da pasta onde foi salvo.
 */
export async function baixarPlanilha(propriedadeId?: string): Promise<{ arquivo: string; pasta: string } | null> {
  if (!(await confirmarPrimeiroDownload())) throw new CanceladoError();
  const { nome, bytes } = await gerarPlanilha(propriedadeId);

  if (Platform.OS !== 'android') {
    await abrirMenuCompartilhar(salvarNoCache(nome, bytes), 'Salvar planilha');
    return null;
  }

  // Tenta a pasta já escolhida antes; se a permissão tiver sido perdida, pergunta de novo
  const { pastaPlanilha } = await lerPreferencias();
  if (pastaPlanilha) {
    try {
      const pasta = new Directory(pastaPlanilha);
      const arquivo = pasta.createFile(nome, MIME_XLSX);
      arquivo.write(bytes);
      return { arquivo: arquivo.name || nome, pasta: pasta.name || 'pasta escolhida' };
    } catch {
      await esquecerPastaDeDownload();
    }
  }

  let pasta: Directory;
  try {
    pasta = await Directory.pickDirectoryAsync(URI_DOWNLOADS_ANDROID);
  } catch {
    throw new CanceladoError();
  }
  if (!pasta) throw new CanceladoError();

  const arquivo = pasta.createFile(nome, MIME_XLSX);
  arquivo.write(bytes);
  await salvarPreferencia('pastaPlanilha', pasta.uri);
  return { arquivo: arquivo.name || nome, pasta: pasta.name || 'pasta escolhida' };
}
