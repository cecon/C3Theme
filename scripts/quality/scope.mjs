// O que conta como código de produção para mutação e cobertura do diff: o fonte dos pacotes publicados, sem
// testes, utilitários de teste e declarações de tipo. Apps (vitrine, seed, storybook, exemplos) e a suíte de
// conformidade ficam fora, como na cobertura por pacote.

const TS_SOURCE = /^packages\/(?!conformance\/)[^/]+\/src\/.+\.(ts|tsx|mts)$/;
const RUST_SOURCE = /^crates\/(?!c3-example\/)[^/]+\/src\/.+\.rs$/;
const NOT_PRODUCTION = /(\.test\.|\.test-utils?\.|\.d\.m?ts$|\/tests?\/|(^|\/|_)tests\.rs$)/;

/** @param {string} file caminho relativo à raiz do repositório */
export const isTsSource = (file) => TS_SOURCE.test(file) && !NOT_PRODUCTION.test(file);

/** @param {string} file caminho relativo à raiz do repositório */
export const isRustSource = (file) => RUST_SOURCE.test(file) && !NOT_PRODUCTION.test(file);

/** Pacote TS de um arquivo de fonte (packages/ui/src/x.ts → ui). */
export const packageOf = (file) => file.split('/')[1];
