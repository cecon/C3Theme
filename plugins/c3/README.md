# Plugin `c3`: skills para agentes usarem o C3

Quatro skills que ensinam um agente de código (Claude Code e outros que leem `SKILL.md`) a usar o C3 num sistema, como o Nati ou o WAAMCP:

| Skill                                      | O agente usa quando vai                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| [`c3-spec`](skills/c3-spec/SKILL.md)       | escrever ou corrigir o app.json e as entidades (campos, telas, filhos, ações, permissões) |
| [`c3-backend`](skills/c3-backend/SKILL.md) | ligar o `c3-engine` no Axum: Store, migrations, Hooks, escrita delegada, só leitura       |
| [`c3-front`](skills/c3-front/SKILL.md)     | montar o front: `C3Shell`, `EngineProvider`, componentes custom, `@c3theme/ui`            |
| [`c3-chat`](skills/c3-chat/SKILL.md)       | integrar o `@c3theme/chat` e pôr telas do motor na resposta do assistente                 |

As quatro partem da mesma regra ([ADR 0001](../../docs/adr/0001-motor-dsl-caminho-padrao.md)): toda tela de negócio é JSON no motor, e o que o motor não alcança vira lacuna registrada, não tela em TS.

O agente só carrega a descrição de cada skill; o corpo e as referências entram quando a tarefa pede.

## Instalar no sistema

No Claude Code, dentro do repositório do sistema:

```
/plugin install c3 --marketplace cecon/C3Theme
```

Ou, nas versões mais antigas, `/plugin marketplace add cecon/C3Theme` e depois `/plugin install c3@c3theme`. O repositório é privado: a máquina precisa ter acesso git a ele (o mesmo acesso que já instala os pacotes).

Para o time inteiro receber o plugin, ponha no `.claude/settings.json` do sistema:

```json
{
  "extraKnownMarketplaces": { "c3theme": { "source": { "source": "github", "repo": "cecon/C3Theme" } } },
  "enabledPlugins": { "c3@c3theme": true }
}
```

O marketplace segue a `main`. Se o sistema está preso a um commit antigo do C3, o agente pode recomendar um recurso que ainda não existe ali. As skills mandam conferir o commit instalado antes, mas a forma segura é outra: copie `plugins/c3/skills/*` daquele commit para o `.claude/skills/` do sistema e atualize a cópia junto com os pacotes. A cópia também serve para agentes que não leem plugins do Claude Code.

## Manter

- **Não copie a spec para cá.** A skill diz quando usar cada recurso e quais são as armadilhas, e manda ler `spec/README.md` e os schemas para o resto. Uma cópia da spec desatualiza em semanas.
- **Recurso novo na spec**: acrescente uma linha na tabela "Preciso de... → use" do `c3-spec` e, se tiver armadilha, uma linha em "Armadilhas". Recurso que deixou de estar "Fora do v0" sai da lista dele.
- **Armadilha vista num sistema de verdade** vale mais que regra teórica: registre o caso e o porquê.
- Os exemplos em `skills/c3-spec/examples/` passam pelo `pnpm spec:check`. Se a spec mudar e o exemplo ficar velho, o CI fica vermelho.
- `pnpm skills:check` confere o frontmatter (o `name` igual ao da pasta, a descrição com até 1024 caracteres), os links relativos e as âncoras, e o limite de 300 linhas por arquivo.
- Ao mudar uma skill, suba o `version` do `.claude-plugin/plugin.json`.
- `claude plugin validate .` valida o marketplace e `claude plugin validate plugins/c3`, o plugin.
