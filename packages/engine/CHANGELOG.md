# Mudanças do motor

## Não publicado — configurações em modal (#119)

- `app.settings` no app.json declara o modal de configurações: abas pessoais, seções do servidor, busca, subpáginas,
  política de fechamento e condicionais por plataforma e permissão. O motor desenha e recebe valores e gravação pela
  porta `settings` do `<C3Shell>` (`load`, `change` e `action`); sem a porta, valem os valores da spec.
- A moldura nova do `@c3theme/ui` (`SettingsDialog`) traz fundo inerte, foco preso, Escape (que limpa a busca antes de
  fechar), retorno do foco a quem abriu, clique no fundo conforme a política e confirmação de fechamento com alterações
  pendentes. `SettingsPage` monta a trilha e o Voltar das subpáginas; `SettingsSearchBox` e `rankSettings` fazem a busca
  por linha com título exato na frente, contagem anunciada e vazio.
- O cabeçalho passa a abrir o modal da spec no lugar do painel de aparência quando o app declara `settings`; a porta
  `settingsSection` do `<C3Shell>` abre direto numa seção. Sem `app.settings`, o painel de aparência continua igual.
- A shell pede o `pages` de `GET /_meta/app` também quando uma seção de configuração declara `permission`.
