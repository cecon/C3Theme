// Textos e leitura de erro da entrada por código (sem senha). Puro para testar sem React: a página só escolhe a
// mensagem e o estado a partir do que a porta rejeitou.

/** Códigos de erro que a porta pode devolver em `enviarCodigo`/`entrarComCodigo`. */
export type CodigoDeErro = 'codigo-invalido' | 'codigo-expirado' | 'muitas-tentativas' | 'sem-rede';

export const MENSAGENS_DO_CODIGO: Readonly<Record<CodigoDeErro, string>> = {
  'codigo-invalido': 'Código inválido. Confira os dígitos e tente de novo.',
  'codigo-expirado': 'O código expirou. Peça um novo código.',
  'muitas-tentativas': 'Muitas tentativas. Peça um novo código e tente mais tarde.',
  'sem-rede': 'Sem conexão com o servidor. Verifique a rede e tente de novo.'
};

/** Segundos de espera antes de poder pedir outro código. */
export const ESPERA_PARA_REENVIAR = 30;

/** Código estável do erro: o `code` do ApiError, ou um `codigo`/`code` no objeto lançado. */
export function codigoDoErro(erro: unknown): CodigoDeErro | undefined {
  if (typeof erro !== 'object' || erro === null) return undefined;
  const codigo = (erro as { code?: unknown }).code ?? (erro as { codigo?: unknown }).codigo;
  return typeof codigo === 'string' && codigo in MENSAGENS_DO_CODIGO ? (codigo as CodigoDeErro) : undefined;
}

/** Mensagem PT-BR do estado; erro sem código conhecido mostra a mensagem que a porta deu. */
export function mensagemDoCodigo(erro: unknown): string {
  const codigo = codigoDoErro(erro);
  if (codigo) return MENSAGENS_DO_CODIGO[codigo];
  return erro instanceof Error && erro.message.trim() ? erro.message : 'Algo deu errado. Tente de novo.';
}

/** O erro pede um código novo? (expirado ou tentativas demais) */
export const pedeNovoCodigo = (erro: unknown): boolean => {
  const codigo = codigoDoErro(erro);
  return codigo === 'codigo-expirado' || codigo === 'muitas-tentativas';
};

/** Texto do botão de reenviar enquanto a espera corre. */
export const textoDaEspera = (segundos: number): string => `Reenviar em ${segundos}s`;

/** O código digitado está completo? (6 dígitos) */
export const codigoCompleto = (codigo: string): boolean => /^\d{6}$/.test(codigo);
