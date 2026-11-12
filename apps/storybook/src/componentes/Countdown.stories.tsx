import type { Meta, StoryObj } from '@storybook/react-vite';

import { Countdown } from '@c3theme/ui';

/** Hoje + N dias, ao meio-dia: a contagem fica sempre no futuro. */
const inDays = (days: number) => {
  const d = new Date(Date.now() + days * 86_400_000);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
};

/**
 * Primitiva do vocabulário do motor (não é tela, ADR 0003). No motor ela é a contagem de `status.mode: "comingSoon"` e de
 * `pages[].comingSoon` com `until`: veja "Telas/Fora do ar e erros".
 */
const meta = {
  title: 'Componentes/Countdown',
  component: Countdown,
  args: { until: inDays(12) },
  argTypes: { until: { control: 'text' }, onDone: { action: 'onDone' } }
} satisfies Meta<typeof Countdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DozeDias: Story = { name: 'Doze dias' };

/** A data já passou: tudo zero, e o `onDone` não dispara (só na passagem para zero). */
export const Passou: Story = { args: { until: '2020-01-01T00:00:00Z' } };
