# Campos

Resumo para escrever certo de primeira. Quem decide é o `spec/v0/entity.schema.json` do commit instalado. O porquê de cada regra está em `spec/README.md`, nas seções "Tipos de campo e formato trafegado" e "Condições".

## Tipos e formato trafegado

| Tipo              | JSON no fio                                                         | Coluna SQLite (c3-engine)          |
| ----------------- | ------------------------------------------------------------------- | ---------------------------------- |
| `string`, `email` | string                                                              | `TEXT`                             |
| `text`            | string multilinha                                                   | `TEXT`                             |
| `integer`         | number inteiro (faixa i53)                                          | `INTEGER`                          |
| `decimal`         | **string** `"1234.50"` com `scale` casas                            | `INTEGER` (valor × 10^scale)       |
| `boolean`         | `true` / `false`                                                    | `INTEGER` 0/1                      |
| `date`            | `"2026-10-17"`                                                      | `TEXT`                             |
| `datetime`        | `"2026-10-17T02:55:17Z"` (UTC, segundos, `Z`)                       | `TEXT`                             |
| `enum`            | string ou number: um dos `options[].value`                          | `TEXT` ou `INTEGER`                |
| `flags`           | number: soma dos bits marcados (`62` = seg a sex)                   | `INTEGER`                          |
| `reference`       | escrita: id string; leitura: `{ "id": "7", "title": "Acme" }`       | `INTEGER REFERENCES alvo (id)`     |
| `file`            | escrita: `{ name, contentType, data: base64 }`; leitura: metadados | `TEXT` com JSON (o sistema grava)  |

- `id` é implícito, nunca se declara, e é sempre string.
- Campo sem valor é `null`, nunca ausente.
- Chaves que começam com `_` (`_version`, `_company`, `_branch`, `_can`) são do motor. Mandá-las no corpo é 400.

## Enum e flags

```json
{ "name": "kind", "type": "enum", "label": "Tipo", "required": true, "default": "goods",
  "options": [
    { "value": "goods", "label": "Mercadoria", "color": "info" },
    { "value": "service", "label": "Serviço", "color": "warning" }
  ] }
```

- `value` é o valor **exatamente como o banco grava**, com maiúsculas, acentos e espaços. Num sistema que já existe, copie do banco; não invente chave. Cuidado com `CHAR(n)`, que completa com espaço.
- As opções de um campo são todas string ou todas inteiras, sem repetir. Enum inteiro trafega como número: `"5102"` é `invalid_type`.
- `color` (`neutral`, `info`, `success`, `warning`, `danger`) pinta o selo na lista e o evento no calendário.
- `flags`: cada `value` é uma potência de 2 até 2^30. `0` quer dizer "nenhum" e não conta como vazio. Ainda não entra em `views.list.filters`.

## Reference

```json
{ "name": "conta_id", "type": "reference", "entity": "conta", "label": "Conta",
  "filter": { "and": [
    { "field": "analitica", "op": "eq", "value": true },
    { "field": "cliente_id", "op": "eq", "value": { "$field": "cliente_id" } } ] } }
```

- Na tela vira busca com digitação (`SearchSelectField`), com cadastro rápido quando o usuário pode criar na entidade apontada. Não troque por `<select>` custom.
- `filter` é uma condição sobre a entidade **apontada**. `{ "$field": "x" }` é o valor do campo `x` no formulário de quem aponta (`id` é o próprio registro). Variável vazia não restringe nada. A variável só vale com `eq`, `ne`, `lt`, `lte`, `gt` e `gte`, e não entra em `not`.
- Opção fora do filtro é recusada ao gravar (`422 not_allowed`).
- O `title` da leitura vem do `titleField` da entidade apontada. Escolha um campo que identifique o registro para uma pessoa.
- `onDelete` é só informativo: quem manda é a FK da migration.

## Regras por campo

| Chave                         | Para quê                                                    | Cuidado                                                                                   |
| ----------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `required`, `requiredWhen`    | obrigatório sempre ou conforme condição                     | obrigatório fora do formulário precisa de `default`                                       |
| `visibleWhen`                 | mostra o campo conforme condição                            | escondido grava `null` e não é validado                                                   |
| `readOnly`                    | preenchido pelo sistema (`created_at`, situação)            | PATCH com outro valor é 422 `read_only`; o mesmo valor passa                              |
| `createOnly`                  | só na criação (código, login)                               | não combina com `readOnly`                                                                |
| `readOnlyWhen`                | trava conforme o registro **gravado**                       | olhar o formulário travaria enquanto o usuário digita; por isso olha o gravado             |
| `unique`                      | sem repetição                                               | o índice é da migration; com `scope`, o índice inclui a coluna do escopo                  |
| `default`                     | valor inicial no formato trafegado                          | `decimal` em string: `"1.000"`                                                            |
| `minLength`, `maxLength`, `pattern` | texto                                                 | `pattern` é regex aplicada no front e no back                                             |
| `min`, `max`, `scale`         | número                                                      | `scale` é obrigatório no `decimal`                                                        |
| `currency` (`decimal`)        | dinheiro: `"BRL"` (ISO 4217)                                | só exibição: símbolo na lista, registro, painel e total; o fio não muda; CSV sai só número |
| `format: cpf/cnpj/cpf_cnpj`   | documento com dígito verificador                            | trafega sem máscara; CNPJ aceita letras (alfanumérico); dado com máscara precisa migrar   |
| `format: phone`               | telefone com DDD                                            | trafega só 10 ou 11 dígitos; a shell mostra `(11) 98123-4567`                             |
| `writeOnly`                   | senha, PIN (só `string`)                                    | leitura sempre `null`; vazio no PATCH mantém; exige escrita delegada; fora de lista e filtro |
| `accept`, `maxSize` (`file`)  | anexo                                                       | teto de 1 MB; exige escrita delegada; não vale em filha `with_parent`                     |
| `help`                        | frase curta sempre visível                                  |                                                                                           |
| `hint`                        | ajuda longa atrás do "?" no rótulo                          |                                                                                           |
| `aiReview`                    | valor crítico (preço, CFOP): o rascunho do assistente pede conferência | fora do chat não muda nada                                                     |
| `access: { view, edit }`      | permissão por campo                                         | ver [regras](regras.md#permissões)                                                        |

Texto exibido (`label`, `help`, `title`) aceita literal ou chave de tradução: `{ "id": "produto.preco", "defaultMessage": "Preço" }`.

## Condições

Filtro, preset, `visibleWhen`, `requiredWhen`, `readOnlyWhen`, `filter` do reference e `rowAccess` usam a mesma linguagem: um JSON, nunca string de código.

```json
{ "and": [
  { "field": "vip", "op": "eq", "value": true },
  { "or": [ { "field": "company_id", "op": "null", "value": true },
            { "not": { "field": "status", "op": "in", "value": ["lead"] } } ] } ] }
```

| Operador                 | texto | número e data | boolean | enum, flags, reference |
| ------------------------ | ----- | ------------- | ------- | ---------------------- |
| `eq`, `ne`               | sim   | sim           | sim     | sim                    |
| `lt`, `lte`, `gt`, `gte` | não   | sim           | não     | não                    |
| `in` (array)             | sim   | sim           | não     | sim                    |
| `contains`               | sim   | não           | não     | não                    |
| `null` (`true`/`false`)  | sim   | sim           | sim     | sim                    |

- Vazio (`null`, ausente, `""`): `null` responde, `ne` dá **verdadeiro** e o resto dá falso.
- `eq` em texto diferencia maiúsculas; `contains` não diferencia maiúsculas, mas diferencia acento.
- `decimal` compara como número exato (`"10.5"` = `"10.50"`). O valor vai no formato trafegado: string para `decimal`.
- `field: "id"` compara o id implícito.
- Valor de enum fora de `options`, operador inválido para o tipo ou campo inexistente: o spec:check recusa e a API responde 400.
