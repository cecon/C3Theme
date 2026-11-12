import type { Meta, StoryObj } from '@storybook/react-vite';

import MotorScreen from '../motor/MotorScreen';
import { jsonSource } from '../motor/source';
import { withMotor } from '../motor/withMotor';

/**
 * Configurações pelo motor (#110): entidade `singleton` com `views.form.autosave`. Cada ajuste grava na hora; as seções
 * com `tab` viram abas (a aberta fica em `?tab=`), a busca (`search`) acha pelo rótulo, help e `keywords` e leva ao
 * ajuste. "Cópia de segurança" pergunta antes de desligar (`confirmChange` com `when`), "Pasta dos dados" pergunta e,
 * depois de gravar, avisa que precisa reiniciar (`restart`). Os atalhos (`format: "shortcut"`) capturam a combinação e
 * recusam a que outro campo já usa. Desempenho e Atalhos têm `platforms: ["desktop", "web"]`: no celular não aparecem.
 */
const meta = {
  title: 'Telas/Configurações pelo motor',
  component: MotorScreen,
  decorators: [withMotor],
  args: { entity: 'preferencias', screen: 'singleton' },
  argTypes: { entity: { control: false }, screen: { control: false } },
  parameters: { docs: { source: jsonSource, story: { inline: false, iframeHeight: 720 } } }
} satisfies Meta<typeof MotorScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Geral: Story = {};

/** A aba aberta vem da URL: `?tab=Atalhos`. */
export const Atalhos: Story = { parameters: { route: '/?tab=Atalhos' } };
