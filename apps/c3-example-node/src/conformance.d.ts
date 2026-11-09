// Tipos da suíte de conformidade (JavaScript puro) para o teste em processo.
declare module '@c3theme/conformance/src/suite.mjs' {
  export function buildSuite(baseUrl: string): { tag: string; tests: { group: string; name: string; fn: () => Promise<void> }[] };
}
