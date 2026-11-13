# @c3theme/engine

Cada entrada diz o que muda para quem usa; **Quebra** marca o que exige mudar o app.

## 0.1.0 (2026-11-12)

- Zonas da casca (cecon/C3Theme#116 e #117): `layout.rails` declara o rail de servidores e o rail de páginas no app.json, e `spec/v0/app.schema.json` documenta a declaração.
- `<C3Shell>` ganhou a porta `rails` com os dados e as ações dos dois railes; `<C3Layout>` desenha as zonas nas bordas e mantém o restante da moldura igual. Sem `layout.rails`, a casca continua como antes (sem espaço reservado).
- Páginas do rail de páginas saem do menu da spec, com a primeira página fixa; páginas sem permissão continuam fora.
