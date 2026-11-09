import type { Meta, StoryObj } from '@storybook/react-vite';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { notify, type NotifySeverity } from '@c3theme/ui';
import MotorScreen from '../motor/MotorScreen';
import { clickAction } from '../motor/play';
import { jsonSource } from '../motor/source';
import { withMotor } from '../motor/withMotor';

/**
 * Pelo motor: depois de gravar ou de rodar uma ação o motor avisa pelo `notify`, com o `successMessage` da ação. A
 * história marca a fatura como paga. Com `inverse`, o aviso ganharia o Desfazer, mas ele depende da `_version` que o
 * servidor devolve, e o adaptador em memória ainda não versiona os registros (lacuna anotada no motor).
 */
const meta = {
  title: 'Componentes/Avisos',
  component: MotorScreen,
  decorators: [withMotor],
  args: { entity: 'fatura', screen: 'form', id: '5' },
  argTypes: { screen: { control: false }, id: { control: false } },
  parameters: { docs: { source: jsonSource, story: { inline: false, iframeHeight: 560 } } }
} satisfies Meta<typeof MotorScreen>;

export default meta;

export const DepoisDaAcao: StoryObj<typeof meta> = { name: 'Depois da ação', play: clickAction('Marcar como paga') };

const SEVERIDADES: [NotifySeverity, string][] = [
  ['info', 'Exportação começou; avisamos quando terminar.'],
  ['warning', 'Duas faturas ficaram de fora do lote.'],
  ['error', 'Não foi possível salvar. Tente de novo.']
];

/** Uso direto: aviso de tela própria do sistema, nos tons que o motor não usa sozinho. */
export const Tons: StoryObj<typeof meta> = {
  name: 'Tons (uso direto)',
  tags: ['uso-direto'],
  render: () => (
    <Stack direction="row" spacing={1}>
      {SEVERIDADES.map(([severity, message]) => (
        <Button key={severity} variant="outlined" color={severity} onClick={() => notify(message, severity)}>
          {severity}
        </Button>
      ))}
    </Stack>
  )
};
