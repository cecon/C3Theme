# Configurações pessoais (#110)

Uma entidade `singleton` com `views.form.autosave: true` usa linhas editáveis,
PATCH por campo em fila e `If-Match` do último registro salvo. Texto grava ao
sair do campo; opções, switches e atalhos gravam ao mudar.

`sections[].tab` agrupa as seções em abas. Seções sem `tab` ficam acima.
O parâmetro `tab` na URL guarda a chave literal da aba (ou o `id` de um Text).
Uma chave inválida abre a primeira aba disponível, sem apagar os outros parâmetros.

`sections[].platforms` limita a seção a `desktop`, `web` e/ou `mobile`.
O cliente informa `<C3Shell platform="mobile" … />`. Sem a propriedade,
uma shell com moldura desktop assume `desktop`; as outras assumem `web`.
Não há detecção por largura da janela. A mesma aba pode conter seções de
plataformas diferentes; só aparece quando há seções visíveis nessa plataforma.

A busca compara os rótulos traduzidos e `fields[].keywords: Text[]`, ignorando
maiúsculas e acentos. Os resultados contêm apenas campos permitidos e visíveis.
Escolher um resultado abre sua aba e destaca a linha.

```json
{
  "name": "acesso_remoto",
  "type": "boolean",
  "label": "Acesso remoto",
  "keywords": ["outros aparelhos"],
  "confirmChange": {
    "question": "Permitir acesso remoto?",
    "effect": "Outros aparelhos poderão conectar."
  },
  "restartNotice": "Reinicie o aplicativo para aplicar esta mudança."
}
```

`confirmChange` vale para autosave: nenhum PATCH sai antes de Confirmar.
Cancelar ou fechar o diálogo devolve o valor salvo. `restartNotice` aparece
somente depois de um PATCH bem-sucedido; o motor não reinicia o aplicativo.
Os textos aceitam literais ou `{ "id": "chave", "defaultMessage": "…" }`.

Um campo `string` com `component: "shortcut"` captura uma combinação com
Ctrl, Alt ou Meta, com Shift opcional. O valor é texto canônico, por exemplo
`Ctrl+Shift+K`. Delete/Backspace limpa; Tab e Escape continuam navegando.
O autosave recusa outro campo `component: "shortcut"` com o mesmo valor no
registro salvo, inclusive após alterações em fila. O backend continua sendo
responsável por validar atalhos reservados do sistema e permissões.
Esse campo captura a configuração; não registra o atalho no sistema operacional.
