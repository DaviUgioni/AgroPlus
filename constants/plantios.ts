export interface TipoPlantio {
  chave: string;
  nome: string;
  diasParaColheita: number;
}

export const TIPOS_PLANTIO: TipoPlantio[] = [
  { chave: 'milho', nome: 'Milho', diasParaColheita: 120 },
  { chave: 'soja', nome: 'Soja', diasParaColheita: 100 },
  { chave: 'feijao', nome: 'Feijão', diasParaColheita: 90 },
  { chave: 'arroz', nome: 'Arroz', diasParaColheita: 120 },
  { chave: 'trigo', nome: 'Trigo', diasParaColheita: 110 },
  { chave: 'cafe', nome: 'Café', diasParaColheita: 270 },
  { chave: 'cana', nome: 'Cana-de-açúcar', diasParaColheita: 365 },
  { chave: 'mandioca', nome: 'Mandioca', diasParaColheita: 300 },
  { chave: 'tomate', nome: 'Tomate', diasParaColheita: 80 },
  { chave: 'batata', nome: 'Batata', diasParaColheita: 90 },
  { chave: 'alface', nome: 'Alface', diasParaColheita: 45 },
  { chave: 'cenoura', nome: 'Cenoura', diasParaColheita: 75 },
];

export function buscarTipoPlantio(chave: string): TipoPlantio | undefined {
  return TIPOS_PLANTIO.find((t) => t.chave === chave);
}
