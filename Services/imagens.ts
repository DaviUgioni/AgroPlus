import { Paths, Directory, File } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

const IMAGES_DIR = new Directory(Paths.document, 'propriedades');

function arquivoImagem(propriedadeId: string): File {
  return new File(IMAGES_DIR, `${propriedadeId}.jpg`);
}

export async function enviarImagemPropriedade(uri: string, propriedadeId: string): Promise<string> {
  if (!IMAGES_DIR.exists) {
    IMAGES_DIR.create({ intermediates: true });
  }

  const resultado = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 800 } }], {
    compress: 0.7,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  const destino = arquivoImagem(propriedadeId);
  const origem = new File(resultado.uri);
  origem.copy(destino);

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
