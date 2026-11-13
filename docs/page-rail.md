# Rail de páginas

Declare `layout.rails.pages: {}` para habilitar a zona. As páginas vêm do menu interno já filtrado pelas permissões
da filial/servidor. Links externos não viram páginas. `items: ["/agentes", "/uso"]` limita as rotas elegíveis;
sem `items`, entram os links internos do menu, sem URLs repetidas. A ordem é a do menu declarado.

`defaultPinned` contém URLs internas estáveis, por exemplo `['/uso']`; não são os identificadores posicionais gerados
pelo menu. A primeira página elegível fica sempre no rail e não oferece desafixar. A página atual continua marcada
nas subrotas e filtros. Se não estiver fixada, o botão de mais a identifica com `aria-current`.

`hidden: true` omite o rail sem reservar largura. `brandHref` transforma a marca num link externo. Quando os controles
da janela ocupam o topo esquerdo, o motor reserva essa faixa e omite a marca; os ícones começam abaixo dos controles.
O estado recolhido usa 48 px (em vez de 64); os ícones continuam inteiros e navegáveis. A transição de largura devolve
espaço ao conteúdo e a moldura acompanha a reserva dos drawers.

O menu de mais tem duas ações por página opcional: abrir e fixar/desafixar. São itens independentes, sem botão dentro
de link. As setas percorrem os itens; Enter/Espaço na fixação alteram a escolha e mantêm o menu aberto. Escape volta
ao botão de mais. Os nomes e o foco permanecem visíveis.

`C3Shell.rails.pages` recebe os dados auxiliares e as ações do app: `help` (versão, `loadingNotes`, `releaseNotes` e
links), `usage`, `blocks`, marketplace e configurações. Os dados são reativos pelo contexto, sem recriar o roteador
nem perder o rascunho. O menu de ajuda abre imediatamente; as notas podem chegar depois. Falha nas notas deixa os
links disponíveis; o app usa `loadingNotes: false` sem `releaseNotes`. Links da ajuda e da marca abrem fora do app.
O app fornece somente blocos disponíveis; não deixe callbacks fictícios em blocos indisponíveis.

A shell usa `railStorageKey(app.name)` por padrão; o app pode passar `storageKey` nas portas de ambos os rails para
separar conta/servidor. Quem monta o componente de UI diretamente deve escolher sua chave. Os patches releem o
armazenamento antes de gravar, evitando que uma mudança nos servidores apague fixação/recolhimento das páginas.
Mudanças de chave recarregam as preferências. Sem armazenamento, as escolhas valem na sessão. `pinned` é um valor
controlado opcional: quando informado, o app atualiza o valor em resposta a `onTogglePin`.

Histórias: `Telas/Rail de páginas` (padrão, recolhido, sem página opcional, controles do Mac). Os e2e verificam fixação
por teclado, conteúdo preservado durante a chegada das notas, elegibilidade por permissão e persistência ao reabrir.
