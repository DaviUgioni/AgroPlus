export function mensagemErro(error: any, fallback: string): string {
  const code = error?.code as string | undefined;
  const msg = String(error?.message ?? '');
  const semConexao =
    code === 'unavailable' ||
    code === 'auth/network-request-failed' ||
    code === 'failed-precondition' ||
    /network|offline|conex/i.test(msg);
  if (semConexao) {
    return 'Sem conexão com a internet. Verifique sua conexão e tente novamente.';
  }
  return fallback;
}
