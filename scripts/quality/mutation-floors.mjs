// Pisos do placar de mutação por pacote, medidos em 09/11/2026 na main (Stryker 10, perTest, ignoreStatic). A meta
// é 90% (MUTATION_TARGET); quem está abaixo fica travado no nível medido e só sobe: teste novo que mata mutante
// permite subir o piso, nunca baixar. `null` = ainda sem medida: a rodada semanal mostra o placar sem reprovar.
// O PR não usa estes pisos: nas linhas que ele escreveu a régua é sempre 90%.
export const MUTATION_FLOORS = {
  ts: {
    chat: 41,
    electron: 74,
    engine: 28,
    'engine-node': 24,
    flow: 44,
    ui: null
  },
  rust: null
};
