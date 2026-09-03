import { Paths, Directory, File } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

const IMAGES_DIR = new Directory(Paths.document, 'propriedades');
const NOTAS_DIR = new Directory(Paths.document, 'notas');

function arquivoImagem(propriedadeId: string): File {
  return new File(IMAGES_DIR, `${propriedadeId}.jpg`);
}

function arquivoNota(despesaId: string): File {
  return new File(NOTAS_DIR, `${despesaId}.jpg`);
}

export async function enviarImagemPropriedade(uri: string, propriedadeId: string): Promise<string> {
  try {
    if (!IMAGES_DIR.exists) {
      IMAGES_DIR.create({ intermediates: true, idempotent: true } as any);
    }
  } catch {}

  const resultado = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 800 } }], {
    compress: 0.7,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  const destino = arquivoImagem(propriedadeId);
  try {
    if (destino.exists) destino.delete();
  } catch {}
  const origem = new File(resultado.uri);
  await origem.copy(destino);

  return destino.uri;
}

export function excluirImagemPropriedade(propriedadeId: string) {
  const arquivo = arquivoImagem(propriedadeId);
  if (arquivo.exists) {
    arquivo.delete();
  }
}

export function getImagemLocalUri(propriedadeId: string): string {
  return arquivoImagem(propriedadeId).uri;
}

export async function enviarNotaFiscal(uri: string, despesaId: string): Promise<string> {
  try {
    if (!NOTAS_DIR.exists) NOTAS_DIR.create({ intermediates: true, idempotent: true } as any);
  } catch {}
  const resultado = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1000 } }], {
    compress: 0.6,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  const destino = arquivoNota(despesaId);
  try {
    if (destino.exists) destino.delete();
  } catch {}
  const origem = new File(resultado.uri);
  await origem.copy(destino);
  return destino.uri;
}

export function excluirNotaFiscal(despesaId: string) {
  try {
    const f = arquivoNota(despesaId);
    if (f.exists) f.delete();
  } catch {}
}

export function getNotaLocalUri(despesaId: string): string {
  return arquivoNota(despesaId).uri;
}
