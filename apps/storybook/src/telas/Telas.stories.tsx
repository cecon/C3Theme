import type { Meta, StoryObj } from '@storybook/react-vite';

import MotorView from '../motor/MotorView';
import { jsonSource } from '../motor/source';
import { withMotor } from '../motor/withMotor';

/**
 * Telas inteiras que o motor monta da spec, além da lista e do formulário: quadro (`views.board`), agenda
 * (`views.calendar`), relatório (`views.report`), planta (`views.map`), cartões (`views.gallery`) e painel (`pages[].dashboard`). Os registros
 * vêm do adaptador em memória; arrastar o cartão ou o evento grava nele.
 */
const meta = {
  title: 'Telas/Pelo motor',
  component: MotorView,
  decorators: [withMotor],
  argTypes: { view: { control: false }, entity: { control: false }, page: { control: false } },
  parameters: { docs: { source: jsonSource, story: { inline: false, iframeHeight: 720 } } }
} satisfies Meta<typeof MotorView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Colunas pelo `enum` da etapa, código, prazo colorido, responsável, contador e coluna de concluídos. */
export const Quadro: Story = { args: { entity: 'tarefa', view: 'board' } };

/** Mês pelo `start`/`end`, dia inteiro pelo boolean e cor pelo `enum` do tipo. */
export const Agenda: Story = { args: { entity: 'evento', view: 'calendar' } };

/** Agrupado por situação e cliente, com subtotal por grupo e total geral. */
export const Relatorio: Story = { name: 'Relatório', args: { entity: 'fatura', view: 'report' } };

/** O balancete no relatório: as mesmas `rowStyles` da lista (sem `views.report.rowStyles`) e o saldo negativo em vermelho. */
export const Balancete: Story = { name: 'Relatório, balancete com destaque', args: { entity: 'conta_contabil', view: 'report' } };

/** Blocos coloridos pela situação, agrupados pela área. */
export const Planta: Story = { args: { entity: 'mesa', view: 'map' } };

/** A lista de clientes em cartões (`views.gallery`): iniciais sem imagem, e-mail, cidade e chip da situação. */
export const Cartoes: Story = { name: 'Cartões', args: { entity: 'cliente', view: 'gallery' } };

/** Indicadores, gráficos e ranking por agregação da entidade (`kpi`, `chart`, `ranking`). */
export const Painel: Story = { args: { page: '/painel' } };

/** Filtro de período para a frente (`next7`, `next30`, `nextMonth`) com `options`: o seletor só oferece os de vencimento. */
export const Vencimentos: Story = { args: { page: '/vencimentos' } };

/**
 * `pages[].apiDocs`: o openapi.json do app por tag, com busca e "Experimentar" em cada rota. Aqui o documento e as
 * respostas vêm do adaptador em memória (GET roda; POST responde 501, como servidor sem a rota).
 */
export const DocumentacaoDaApi: Story = { name: 'Documentação da API', args: { page: '/apis' } };

/**
 * `pages[].wizard`: a primeira configuração da loja em passos sobre o registro único, com Pular no passo opcional e
 * o resumo no fim. No app, a guarda (`pending`) leva toda rota para cá até a loja e o caixa estarem gravados.
 */
export const PrimeiraConfiguracao: Story = { name: 'Primeira configuração (assistente)', args: { page: '/primeira-configuracao' } };
