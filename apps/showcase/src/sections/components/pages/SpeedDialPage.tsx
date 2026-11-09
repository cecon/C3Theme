import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import SpeedDial, { SpeedDialProps } from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Backdrop from '@mui/material/Backdrop';

// third-party
import { Add, Copy, Edit, Printer, Save2, Share } from 'iconsax-reactjs';

import { notify } from '@c3theme/ui';
import Example, { ExamplePage } from '../Example';

const ACTIONS = [
  { icon: Copy, name: 'Copiar' },
  { icon: Save2, name: 'Salvar' },
  { icon: Printer, name: 'Imprimir' },
  { icon: Share, name: 'Compartilhar' }
];

const stage = {
  position: 'relative',
  height: 300,
  border: 1,
  borderColor: 'divider',
  borderRadius: 2,
  bgcolor: 'background.default',
  overflow: 'hidden'
} as const;

function Actions({ onPick, tooltipOpen }: { onPick: (name: string) => void; tooltipOpen?: boolean }) {
  return ACTIONS.map(({ icon: Icon, name }) => (
    <SpeedDialAction
      key={name}
      icon={<Icon size={20} />}
      onClick={() => onPick(name)}
      slotProps={{ tooltip: { title: name, open: tooltipOpen ? true : undefined } }}
    />
  ));
}

function DirectionDemo() {
  const [direction, setDirection] = useState<SpeedDialProps['direction']>('up');
  const [hidden, setHidden] = useState(false);
  const corner = {
    up: { bottom: 16, right: 16 },
    down: { top: 16, left: 16 },
    left: { bottom: 16, right: 16 },
    right: { top: 16, left: 16 }
  }[direction ?? 'up'];
  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
        <FormControlLabel control={<Switch checked={hidden} onChange={(e) => setHidden(e.target.checked)} />} label="Esconder" />
        <RadioGroup
          row
          value={direction}
          onChange={(e) => setDirection(e.target.value as SpeedDialProps['direction'])}
          aria-label="Direção"
        >
          <FormControlLabel value="up" control={<Radio />} label="Cima" />
          <FormControlLabel value="right" control={<Radio />} label="Direita" />
          <FormControlLabel value="down" control={<Radio />} label="Baixo" />
          <FormControlLabel value="left" control={<Radio />} label="Esquerda" />
        </RadioGroup>
      </Stack>
      <Box sx={stage}>
        <SpeedDial
          ariaLabel="Ações do documento"
          hidden={hidden}
          direction={direction}
          icon={<SpeedDialIcon />}
          sx={{ position: 'absolute', ...corner }}
        >
          {Actions({ onPick: (n) => notify(`${n} acionado.`, 'info') })}
        </SpeedDial>
      </Box>
    </Stack>
  );
}

function OpenIconDemo() {
  return (
    <Box sx={stage}>
      <SpeedDial
        ariaLabel="Editar ou adicionar"
        icon={<SpeedDialIcon icon={<Add size={22} />} openIcon={<Edit size={22} />} />}
        sx={{ position: 'absolute', bottom: 16, right: 16 }}
        FabProps={{ color: 'secondary' }}
      >
        {Actions({ onPick: (n) => notify(`${n} acionado.`, 'info') })}
      </SpeedDial>
    </Box>
  );
}

function TooltipOpenDemo() {
  const [open, setOpen] = useState(false);
  const pick = (name: string) => {
    setOpen(false);
    notify(`${name} acionado.`, 'info');
  };
  return (
    <Box sx={stage}>
      <Backdrop open={open} sx={{ position: 'absolute', zIndex: 1 }} />
      <SpeedDial
        ariaLabel="Ações com rótulos"
        icon={<SpeedDialIcon />}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          zIndex: 2,
          '& .MuiSpeedDialAction-staticTooltipLabel': { whiteSpace: 'nowrap' }
        }}
      >
        {ACTIONS.map(({ icon: Icon, name }) => (
          <SpeedDialAction
            key={name}
            icon={<Icon size={20} />}
            onClick={() => pick(name)}
            slotProps={{ tooltip: { title: name, open: true } }}
          />
        ))}
      </SpeedDial>
    </Box>
  );
}

export default function SpeedDialPage() {
  return (
    <ExamplePage intro="O botão de ações é um botão flutuante que abre de 3 a 6 ações relacionadas. Bom para telas de celular com espaço curto.">
      <Example
        title="Direção e visibilidade"
        code={`<SpeedDial ariaLabel="Ações" direction="up" hidden={oculto} icon={<SpeedDialIcon />}>
  <SpeedDialAction icon={<Copy />} slotProps={{ tooltip: { title: 'Copiar' } }} onClick={copiar} />
</SpeedDial>`}
        wide
      >
        <DirectionDemo />
      </Example>

      <Example
        title="Ícone ao abrir"
        description="Troca o ícone principal quando abre."
        code={`<SpeedDialIcon icon={<Add />} openIcon={<Edit />} />`}
      >
        <OpenIconDemo />
      </Example>

      <Example
        title="Rótulos sempre visíveis"
        description="Com fundo escurecido; melhor no celular."
        code={`<SpeedDialAction slotProps={{ tooltip: { title: 'Copiar', open: true } }} />`}
      >
        <TooltipOpenDemo />
      </Example>
    </ExamplePage>
  );
}
