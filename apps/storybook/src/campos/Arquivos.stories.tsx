import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { UploadField, type Uploader } from '@c3theme/ui';
import MotorField from '../motor/MotorField';
import { jsonSource } from '../motor/source';
import { withMotor } from '../motor/withMotor';
import { stateful } from '../support/stateful';

const Upload = stateful(UploadField);

/** Envio de mentira: progresso em 2 s e falha quando o nome tem "erro", para ver as duas pontas. */
const fakeUpload: Uploader = (file, { onProgress, signal }) =>
  new Promise((resolve, reject) => {
    let done = 0;
    const timer = setInterval(() => {
      done += 0.1;
      onProgress(Math.min(done, 1));
      if (done < 1) return;
      clearInterval(timer);
      if (file.name.includes('erro')) reject(new Error('O servidor recusou o arquivo.'));
      else resolve({ id: crypto.randomUUID(), name: file.name, size: file.size, contentType: file.type });
    }, 200);
    signal.addEventListener('abort', () => {
      clearInterval(timer);
      reject(signal.reason);
    });
  });

/** Pelo motor: `file` com `accept` e `maxSize`; o arquivo pequeno vai inteiro no valor (base64). */
const meta = {
  title: 'Campos/Arquivos',
  component: MotorField,
  decorators: [withMotor],
  parameters: { docs: { source: jsonSource } },
  args: { entity: 'loja', field: 'certificado', value: null, onChange: fn() }
} satisfies Meta<typeof MotorField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ArquivoNoValor: Story = { name: 'Arquivo no valor' };

export const JaGravado: Story = {
  name: 'Já gravado',
  args: { value: { name: 'certificado-2026.pfx', contentType: 'application/x-pkcs12', size: 4210 } }
};

/** Uso direto: a spec não tem envio com progresso (vários arquivos, cada um sobe na hora e o valor guarda a referência). */
export const EnvioComProgresso: Story = {
  name: 'Envio com progresso (uso direto)',
  tags: ['uso-direto'],
  render: () => (
    <Upload label="Anexos da nota" value={[]} upload={fakeUpload} maxFiles={5} helperText='Nome com "erro" simula falha' onChange={fn()} />
  )
};
