# Abas das threads da conversa (#134)

`chat.tabs` (em `pages[].chat` ou `layout.header.assistant`) põe uma faixa de abas no alto do painel central da
conversa. Sem a declaração não há faixa. As threads são as conversas à parte que já existem (`aside` e `branch`,
`spec/v0/chat-lanes.yaml`); esta declaração só muda a apresentação: com abas, a thread abre no painel central em vez do
painel ao lado. ADR [0016](adr/0016-abas-das-threads.md).

```json
{
  "lanes": {},
  "tabs": {
    "label": "Threads da conversa",
    "main": "Principal",
    "new": true,
    "shortcuts": { "next": "Ctrl+Alt+Right", "previous": "Ctrl+Alt+Left", "new": "Alt+T", "close": "Alt+W" }
  }
}
```

- **Principal**: sempre a primeira aba, não fecha nem sai da ponta. Fica montada o tempo todo: trocar de aba não perde
  rascunho nem histórico. As laterais também ficam montadas depois da primeira visita.
- **Abrir**: "Ramificar daqui", "À parte" e o menu "Todas as abas" (que lista as threads fechadas em "Reabrir") abrem a
  thread como aba ativa.
- **"+"** (`new`, padrão ligado): abre uma thread em rascunho. Nada vai ao servidor até a primeira mensagem; então a
  shell cria a conversa à parte (`POST /_lanes` com `kind: "aside"` e o texto) e a aba vira a thread criada. Rascunho
  sem mensagem não sobrevive a reiniciar.
- **Fechar** (×, clique do meio, Delete ou menu): a vizinha da esquerda fica ativa e um aviso oferece Desfazer.
  "Fechar as outras" também desfaz. Fechar não apaga a thread no servidor: ela continua em "Reabrir".
- **Renomear** (F2 ou menu): o nome fica só neste aparelho, por cima do `title` do sistema.
- **Ordem**: arrastar (rola nas bordas) ou "Mover para a esquerda/direita" no menu, com anúncio da posição.
- **Guardado** no `localStorage` por servidor e agente (`c3.chat.tabs/{app}/{conversa}`): abas abertas, ordem e nomes.
  As outras janelas do mesmo app acompanham. Thread que sumiu do `GET /_lanes` (arquivada ou apagada em outro lugar)
  sai da faixa: não fica aba fantasma.
- **Indicadores** vêm da thread: `failed` (falhou), `attention` (`approval` ou `question`: aguardando você), `working`
  (executando) e `unread > 0` (resposta nova), nessa prioridade. Cada um tem forma própria e entra no nome acessível.
  `unavailable: "motivo"` deixa a aba desabilitada com o motivo na dica e no nome.
- **Teclado**: setas, Home e End trocam (pulando a indisponível); Shift+F10 ou a tecla de menu abrem o menu; o foco
  volta à aba ao fechar menu ou diálogo. Atalhos de `shortcuts` usam a forma canônica do `format: "shortcut"` e não
  disparam em campo de texto nem durante composição (acento, IME).
- **Estados**: carregando (espaço reservado com a altura da faixa), só a principal, erro ao listar (mensagem e Tentar
  de novo) e backend sem o recurso (`404`: só a principal, sem "+").
- **Celular**: abaixo do breakpoint `sm` a faixa vira o botão de lista com o nome da aba ativa.

O componente `ThreadTabs` do `@c3theme/ui` também pode ser usado sozinho, com dados e ações do app.

Vitrine: **Telas / Abas das threads** (completa, muitas abas, só a principal, erro) e **Componentes / Abas de
threads** (inclui carregando). O e2e abre uma thread pela lista, troca pelas setas, fecha, desfaz e cria uma thread
nova pelo "+".
