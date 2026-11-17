# @c3theme/ui

Cada entrada diz o que muda para quem usa; **Quebra** marca o que exige mudar o app.

## Não publicado — faixa de abas de threads (#134)

- `ThreadTabs`: tablist com setas/Home/End, Delete fecha, F2 renomeia, menu (Shift+F10, botão direito), arrastar com
  rolagem nas bordas, sombra e lista de todas quando não cabem, "Reabrir" das fechadas, estados carregando e erro, aba
  indisponível e botão de lista no celular. Estado da aba (`running`, `waiting`, `unread`, `failed`) tem forma própria
  e vai no nome acessível. Textos em `c3.tabs.*` (pt e en).

## Não publicado — busca e avatar na lista lateral (#135)

- `SectionSidebar` ganhou `search` (`{ label, placeholder?, empty? }`): filtra por `label` e `status` sem acento e sem
  caixa, esconde seções sem achado, anuncia o resultado e limpa com Escape, sem mexer nas preferências.
- `SidebarItem.avatar` (`{ label, color? }`): iniciais sobre a cor em hex, texto pelo contraste; sem ele, o `mark`.

## Não publicado — QR sob demanda (#121)

- `QrCode` (e o `DeviceLink`) carrega o gerador de QR na primeira vez que desenha: o `qrcode-generator` sai do pedaço
  de entrada de quem nunca mostra um QR. Até o gerador chegar, o quadro branco já ocupa o lugar.

## 0.2.0 (2026-11-12)

- Revisão dos rails: recolhimento mantém ícones inteiros; menu de fixação tem itens de checkbox acessíveis pelo
  teclado. Preferências fazem patches parciais, acompanham mudanças da chave e não apagam escolhas do outro rail.

- Rails da casca (cecon/C3Theme#116 e #117): `ServerRail` e `PageRail`, dirigidos pela spec do app e com dados e ações por porta. **Novo**; nada do que já existia muda.
- `ServerRail`: lista com estado de conexão no nome acessível, troca por clique/teclado, menu de ações por servidor (abre com a tecla de menu ou Shift+F10 e devolve o foco), adicionar com opções e reexibir o servidor local oculto, arrastar e soltar, mover pelo menu com anúncio em região viva, atalhos de 1 a 9 por plataforma e estados de carregando, vazio e erro.
- `PageRail`: marca no topo, páginas fixadas, menu de mais com fixar/desafixar sem fechar o menu, página atual marcada (`aria-current`), recolher/expandir que persiste, ajuda com versão, notas de lançamento e links, blocos opcionais e rail oculto sem reservar espaço.
- `readRailPreferences`/`writeRailPreferences`: ordem dos servidores, servidor local oculto, páginas fixadas e recolhimento no armazenamento local, com JSON inválido voltando ao padrão.
