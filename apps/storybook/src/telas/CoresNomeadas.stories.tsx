import type { Meta, StoryObj } from '@storybook/react-vite';
import { EntityList } from '@c3theme/engine';
import type { C3Tokens } from '@c3theme/ui';
import { jsonSource } from '../motor/source';
import { withMotor } from '../motor/withMotor';

const tokens: C3Tokens = {
  accents: { forge: { start: '#e04815', end: '#9f2db9' }, sage: { start: '#006a62', end: '#2169af' } },
  dark: { accents: { forge: { start: '#f29b59', end: '#f7c5e9' }, sage: { start: '#61d6b9', end: '#add5ff' } } }
};

/** Avatar e selo da mesma linha usam o cargo do registro. Troque claro/escuro na barra para ver os tokens por modo. */
const meta = {
  title: 'Telas/Cores nomeadas pelo motor',
  component: EntityList,
  args: { entity: 'agente' },
  decorators: [withMotor],
  parameters: { tokens, motor: { entity: 'agente' }, docs: { source: jsonSource } }
} satisfies Meta<typeof EntityList>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Cargos: Story = {};
