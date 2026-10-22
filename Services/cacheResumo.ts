// Services/cacheResumo.ts
// Home e Resumo ficam em abas e recarregam a cada foco. O cache evita baixar tudo de novo
// ao alternar entre elas; guardamos a promessa para que chamadas simultâneas façam uma só busca.
// Fica fora de resumo.ts para que os serviços de escrita possam invalidá-lo sem import circular.
const VALIDADE_MS = 30_000;
let cache: { userId: string; quando: number; promessa: Promise<any> } | null = null;

/** Descarta o resumo em cache. Chamado após criar, editar ou excluir propriedade, despesa ou plantio. */
export function invalidarResumo() {
  cache = null;
}

export function comCacheResumo<T>(userId: string, forcar: boolean | undefined, buscar: () => Promise<T>): Promise<T> {
  if (!forcar && cache && cache.userId === userId && Date.now() - cache.quando < VALIDADE_MS) return cache.promessa;
  const promessa = buscar();
  const atual = { userId, quando: Date.now(), promessa };
  cache = atual;
  // Falha não fica guardada: a próxima chamada tenta de novo
  promessa.catch(() => {
    if (cache === atual) cache = null;
  });
  return promessa;
}
