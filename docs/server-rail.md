# Rail de servidores (#116)

`layout.rails.servers: { shortcuts?: boolean, localServerId?: string }` habilita a zona.
Passe `rails.servers` ao `C3Shell` com a API de `ServerRailProps` exportada por `@c3theme/ui`:
`servers`, `activeId`, `state` (`loading`, `ready`, `error`), callbacks e uma `storageKey`
específica da conta. Alterações da porta são refletidas sem remontar rotas ou perder rascunhos.
Sem a declaração, o layout anterior permanece.

Cada servidor tem ID estável, nome, marca opcional (`icon` ou `imageUrl`), estado
`online|connecting|offline|error|incompatible|sleeping|waking` e detalhe opcional.
O texto do estado está no nome acessível e no tooltip. O servidor ativo não provoca troca repetida.
O motor não conecta ou remove servidores: `onSelect`, `onAction` e `onAdd` delegam ao app.
Opção única de adicionar passa seu ID diretamente; múltiplas abrem menu. O servidor local
oculto é derivado da própria lista e pode ser reexibido no menu de adicionar.

Ordem dos remotos e ocultação do local ficam em armazenamento local. O local não é arrastável
e conserva sua posição ao ordenar os remotos. Arraste tem prévia nativa, destino realçado
e rolagem automática nas bordas; mover para cima/baixo oferece alternativa de teclado e anúncio.
JSON inválido ou armazenamento indisponível não impede o uso.

Ctrl+1–9 (Windows/Linux) ou Cmd+1–9 (macOS) seguem a ordem visível. Eventos tratados,
repetição, composição, Alt/Shift e campos de texto não trocam servidor.
Shift+F10 e a tecla Menu abrem ações; Escape fecha e o foco retorna ao controle do item.

`ShellRailsFrame` reserva a largura medida das zonas, desloca drawers em portal e limita
os drawers da conversa à área restante. Respeita `--c3-shell-height` quando há outro espaço
reservado na casca. Vitrine: **Telas/Rail de servidores**, com lista curta, longa, carregando,
vazia e erro; e2e cobre navegação e a geometria do drawer fixo.
