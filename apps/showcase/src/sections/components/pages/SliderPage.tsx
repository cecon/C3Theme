import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { VolumeHigh, VolumeLow } from 'iconsax-reactjs';

import { brl } from '../data';
import Example, { ExamplePage } from '../Example';

const COLORS = ['primary', 'secondary', 'success', 'warning', 'error', 'info'] as const;

const MARKS = [
  { value: 0, label: '0 °C' },
  { value: 20, label: '20 °C' },
  { value: 37, label: '37 °C' },
  { value: 100, label: '100 °C' }
];

function VolumeDemo() {
  const [volume, setVolume] = useState(40);
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
      <VolumeLow size={20} />
      <Slider aria-label="Volume" value={volume} onChange={(_, v) => setVolume(v)} />
      <VolumeHigh size={20} />
      <Typography variant="body2" sx={{ minWidth: 32 }}>
        {volume}
      </Typography>
    </Stack>
  );
}

function PriceRangeDemo() {
  const [range, setRange] = useState<number[]>([150, 600]);
  return (
    <Box>
      <Slider
        getAriaLabel={(i) => (i === 0 ? 'Preço mínimo' : 'Preço máximo')}
        value={range}
        min={0}
        max={1000}
        step={10}
        onChange={(_, v) => setRange(v)}
        valueLabelDisplay="auto"
        valueLabelFormat={(v) => brl.format(v)}
      />
      <Typography variant="body2" color="text.secondary">
        De {brl.format(range[0]!)} a {brl.format(range[1]!)}
      </Typography>
    </Box>
  );
}

const MIN_DISTANCE = 10;

function MinDistanceDemo() {
  const [value, setValue] = useState<number[]>([20, 45]);
  return (
    <Slider
      getAriaLabel={() => 'Faixa de idade'}
      value={value}
      onChange={(_, v, active) => {
        if (active === 0) setValue([Math.min(v[0]!, value[1]! - MIN_DISTANCE), value[1]!]);
        else setValue([value[0]!, Math.max(v[1]!, value[0]! + MIN_DISTANCE)]);
      }}
      valueLabelDisplay="on"
      disableSwap
    />
  );
}

export default function SliderPage() {
  return (
    <ExamplePage intro="O controle deslizante escolhe um valor ou uma faixa dentro de um intervalo.">
      <Example title="Básico" code={`<Slider aria-label="Volume" value={volume} onChange={(_, v) => setVolume(v)} />`}>
        <Stack spacing={3}>
          <VolumeDemo />
          <Slider aria-label="Desabilitado" defaultValue={30} disabled />
        </Stack>
      </Example>

      <Example
        title="Com rótulo do valor"
        code={`<Slider defaultValue={30} valueLabelDisplay="auto" />
<Slider defaultValue={70} valueLabelDisplay="on" />`}
      >
        <Stack spacing={4} sx={{ pt: 3 }}>
          <Slider aria-label="Rótulo automático" defaultValue={30} valueLabelDisplay="auto" />
          <Slider aria-label="Rótulo sempre visível" defaultValue={70} valueLabelDisplay="on" />
        </Stack>
      </Example>

      <Example title="Passos discretos" code={`<Slider defaultValue={30} step={10} marks min={10} max={110} valueLabelDisplay="auto" />`}>
        <Slider aria-label="Passos" defaultValue={30} step={10} marks min={10} max={110} valueLabelDisplay="auto" />
      </Example>

      <Example
        title="Valores restritos"
        description="Só aceita as marcas definidas."
        code={`<Slider step={null} marks={[{ value: 0, label: '0 °C' }, ...]} />`}
      >
        <Box sx={{ px: 1 }}>
          <Slider
            aria-label="Temperatura"
            defaultValue={20}
            step={null}
            marks={MARKS}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${v} °C`}
          />
        </Box>
      </Example>

      <Example
        title="Faixa"
        description="Dois marcadores para mínimo e máximo."
        code={`<Slider value={[150, 600]} min={0} max={1000} valueLabelFormat={(v) => brl.format(v)} />`}
      >
        <PriceRangeDemo />
      </Example>

      <Example
        title="Distância mínima"
        description="Os marcadores ficam a pelo menos 10 de distância."
        code={`onChange={(_, v, ativo) => ativo === 0 ? ... : ...} disableSwap`}
      >
        <Box sx={{ pt: 4 }}>
          <MinDistanceDemo />
        </Box>
      </Example>

      <Example title="Cores" code={`<Slider color="success" defaultValue={50} />`}>
        <Stack spacing={1}>
          {COLORS.map((c, i) => (
            <Slider key={c} aria-label={`Cor ${c}`} color={c} defaultValue={30 + i * 10} />
          ))}
        </Stack>
      </Example>

      <Example
        title="Tamanhos e vertical"
        code={`<Slider size="small" />
<Slider orientation="vertical" sx={{ height: 160 }} />`}
      >
        <Stack spacing={3}>
          <Slider aria-label="Pequeno" size="small" defaultValue={40} valueLabelDisplay="auto" />
          <Slider aria-label="Médio" defaultValue={60} valueLabelDisplay="auto" />
          <Stack direction="row" spacing={4} sx={{ height: 160, justifyContent: 'center' }}>
            <Slider aria-label="Vertical" orientation="vertical" defaultValue={30} valueLabelDisplay="auto" />
            <Slider aria-label="Vertical com marcas" orientation="vertical" defaultValue={50} step={25} marks color="success" />
            <Slider getAriaLabel={() => 'Faixa vertical'} orientation="vertical" defaultValue={[20, 70]} color="warning" />
          </Stack>
        </Stack>
      </Example>
    </ExamplePage>
  );
}
