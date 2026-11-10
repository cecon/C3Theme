import type { Meta, StoryObj } from '@storybook/react-vite';

import MotorScreen from '../motor/MotorScreen';
import { jsonSource } from '../motor/source';
import { withMotor } from '../motor/withMotor';

/**
 * A lista que o motor monta de `views.list`: colunas (avatar, segunda linha, cidade com UF), busca, filtros, ordem,
 * paginação, chip colorido do `enum`, ações da linha e, com ação `bulk`, seleção e lote. É a tabela que um sistema C3
 * usa; o `DataTable` do `@c3theme/ui` fica para tela feita em código.
 */
const meta = {
  title: 'Tabela/Lista pelo motor',
  component: MotorScreen,
  decorators: [withMotor],
  parameters: { docs: { source: jsonSource } },
  args: { entity: 'cliente', screen: 'list' },
  argTypes: { screen: { control: false }, id: { control: false } }
} satisfies Meta<typeof MotorScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Avatar com as iniciais, e-mail embaixo do nome, situação em chip e ver/editar/excluir na linha. */
export const Clientes: Story = {};

/** `actions[].bulk`: marque linhas e o lote aparece; `totals` soma o valor; `rowActionsStyle: quiet`. */
export const Faturas: Story = { name: 'Faturas, com seleção e lote', args: { entity: 'fatura' } };

/**
 * `columns[].edit`: preço e estoque em `batch` (edite várias linhas e clique em Salvar alterações) e o ativo em
 * `instant` (grava ao clicar). O erro de cada linha aparece na célula.
 */
export const EditarNaLinha: Story = { name: 'Produtos, editando na linha', args: { entity: 'produto' } };

/**
 * `views.list.opening`: com o período a partir de março e um produto no filtro, a primeira linha é o saldo anterior
 * (o saldo da última linha antes de 01/03). Tire o produto ou a data inicial e a linha some.
 */
export const SaldoAnterior: Story = {
  name: 'Kardex, com saldo anterior',
  args: { entity: 'movimento' },
  parameters: { route: '/?f.produto=1&f.data.de=2026-03-01' }
};

/**
 * Seção `related` com `editable`, `search` e `presets`: a contagem do inventário na própria linha. Digite e tecle
 * Enter: grava e desce para o item de baixo. A aba "Só não contados" e a busca vêm da lista da filha.
 */
export const Inventario: Story = { name: 'Inventário, contando na seção', args: { entity: 'inventario', screen: 'form', id: '1' } };

/** O mesmo registro aberto: o formulário vem dos campos, sem `views.form`. */
export const Registro: Story = { name: 'Registro aberto', args: { screen: 'form', id: '3' } };

/**
 * Ação com `opensForm`: "Cadastrar produto" abre o formulário completo do produto com a descrição e o valor do item
 * da nota; ao salvar, o produto criado fica no campo Produto do item (`assignTo`) e a ação some.
 */
export const ItemDaNota: Story = { name: 'Item da nota, cadastrar o produto', args: { entity: 'nota_item', screen: 'form', id: '1' } };

/**
 * `views.list.rowStyles`: títulos e totais em negrito com fundo de destaque, conta sintética em negrito; `negativeTone`
 * deixa o saldo negativo em vermelho. "Revisar classificação" é a ação da lista em etapas (`steps`): 300 NCMs em
 * lotes de 15, com a barra, os contadores parciais e o Parar, que mantém o que já rodou.
 */
export const Balancete: Story = { name: 'Balancete, linhas em destaque e ação em etapas', args: { entity: 'conta_contabil' } };

/**
 * `columns[].tone`: cada mês fica com o fundo da situação dele (amarelo no alerta, vermelho acima do orçado), vinda de
 * outro campo da linha. No rodapé, o "% realizado" é `measure: "ratio"`: realizado ÷ orçado do trimestre × 100, e não a
 * soma dos percentuais.
 */
export const OrcadoRealizado: Story = {
  name: 'Orçado × realizado, célula pela situação e total em %',
  args: { entity: 'orcado_realizado' }
};

/**
 * Consulta com origem `reference` e `with`: "Sugerir pela média" manda a conta e o ano do formulário, ainda sem salvar,
 * e `overwrite` troca até o mês já digitado (o aviso tem Desfazer).
 */
export const Orcamento: Story = {
  name: 'Orçamento, sugerir pela média antes de salvar',
  args: { entity: 'orcamento', screen: 'form', id: '1' }
};

/**
 * Consulta do sistema com um mês por coluna (`meta.columns`): pelo período (out/26 a mar/27), a resposta diz quais
 * meses aparecem, na ordem do período e com o ano no cabeçalho; os de fora somem. Mude "De" e "Até" e aplique.
 */
export const DreGerencial: Story = { name: 'DRE gerencial, colunas pelo período', args: { entity: 'demonstrativo' } };
