# Changelog do motor

## Não publicado

- #121: catálogo completo de ícones passa a ser opt-in por `@c3theme/engine/icones-completos`. A shell usa apenas
  `icons` recebido; sem mapa, omite ícones da spec e mantém os rótulos. Quem dependia do catálogo automático precisa
  passar o mapa (ver README). Ícones internos continuam disponíveis.
- A rota de quadro carrega `@hello-pangea/dnd` sob demanda. O `QrCode` da UI carrega o gerador somente ao renderizar,
  reservando seu tamanho; props públicas e renovação sem remontar o SVG preservadas.
- Build de regressão `scripts/check-entry-bundle.mjs` mede a entrada pelo source map, cobre imports estáticos
  transitivos e verifica os chunks do quadro/QR e o opt-in do catálogo completo.
