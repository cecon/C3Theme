import type { Meta, StoryObj } from '@storybook/react-vite';

import MotorView from '../motor/MotorView';
import { jsonSource } from '../motor/source';
import { withMotor } from '../motor/withMotor';

/**
 * Telas inteiras que o motor monta da spec, além da lista e do formulário: quadro (`views.board`), agenda
 * (`views.calendar`), relatório (`views.report`), planta (`views.map`) e painel (`pages[].dashboard`). Os registros
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

/** Blocos coloridos pela situação, agrupados pela área. */
export const Planta: Story = { args: { entity: 'mesa', view: 'map' } };

/** Indicadores, gráficos e ranking por agregação da entidade (`kpi`, `chart`, `ranking`). */
export const Painel: Story = { args: { page: '/painel' } };
