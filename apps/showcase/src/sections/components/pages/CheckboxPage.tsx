import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Stack from '@mui/material/Stack';

// third-party
import { Heart, Star1 } from 'iconsax-reactjs';

import Example, { ExamplePage, Row } from '../Example';

const COLORS = [
  { color: 'primary', label: 'Primária' },
  { color: 'secondary', label: 'Secundária' },
  { color: 'success', label: 'Sucesso' },
  { color: 'warning', label: 'Atenção' },
  { color: 'error', label: 'Erro' },
  { color: 'info', label: 'Informação' }
] as const;

const PERMISSIONS = ['Ver pedidos', 'Editar pedidos', 'Emitir notas fiscais'];

function IndeterminateDemo() {
  const [checked, setChecked] = useState([true, false, false]);
  const all = checked.every(Boolean);
  const some = checked.some(Boolean);
  return (
    <Box>
      <FormControlLabel
        label="Todas as permissões"
        control={<Checkbox checked={all} indeterminate={some && !all} onChange={(e) => setChecked(checked.map(() => e.target.checked))} />}
      />
      <Stack sx={{ ml: 3 }}>
        {PERMISSIONS.map((p, i) => (
          <FormControlLabel
            key={p}
            label={p}
            control={
              <Checkbox checked={checked[i]} onChange={(e) => setChecked(checked.map((c, j) => (j === i ? e.target.checked : c)))} />
            }
          />
        ))}
      </Stack>
    </Box>
  );
}

function ValidationDemo() {
  const [state, setState] = useState({ email: true, sms: false, whatsapp: false, push: false });
  const count = Object.values(state).filter(Boolean).length;
  const error = count > 2;
  const toggle = (k: keyof typeof state) => setState((s) => ({ ...s, [k]: !s[k] }));
  return (
    <FormControl error={error} component="fieldset" variant="standard">
      <FormLabel component="legend">Canais de aviso (escolha até 2)</FormLabel>
      <FormGroup>
        <FormControlLabel control={<Checkbox checked={state.email} onChange={() => toggle('email')} />} label="E-mail" />
        <FormControlLabel control={<Checkbox checked={state.sms} onChange={() => toggle('sms')} />} label="SMS" />
        <FormControlLabel control={<Checkbox checked={state.whatsapp} onChange={() => toggle('whatsapp')} />} label="WhatsApp" />
        <FormControlLabel control={<Checkbox checked={state.push} onChange={() => toggle('push')} />} label="Notificação no app" />
      </FormGroup>
      <FormHelperText>{error ? 'Você marcou mais de 2 canais.' : `${count} de 2 selecionados.`}</FormHelperText>
    </FormControl>
  );
}

export default function CheckboxPage() {
  return (
    <ExamplePage intro="Caixas de seleção marcam um ou mais itens de uma lista, ou ligam uma opção que só vale depois de salvar.">
      <Example
        title="Básico"
        code={`<Checkbox defaultChecked slotProps={{ input: { 'aria-label': 'Marcar' } }} />
<FormControlLabel control={<Checkbox />} label="Lembrar de mim" />`}
      >
        <Row>
          <Checkbox defaultChecked slotProps={{ input: { 'aria-label': 'Marcado' } }} />
          <Checkbox slotProps={{ input: { 'aria-label': 'Desmarcado' } }} />
          <Checkbox disabled slotProps={{ input: { 'aria-label': 'Desabilitado' } }} />
          <Checkbox disabled checked slotProps={{ input: { 'aria-label': 'Desabilitado e marcado' } }} />
          <FormControlLabel control={<Checkbox defaultChecked />} label="Lembrar de mim" />
        </Row>
      </Example>

      <Example title="Cores" code={`<Checkbox color="success" defaultChecked />`}>
        <Row>
          {COLORS.map(({ color, label }) => (
            <FormControlLabel key={color} control={<Checkbox color={color} defaultChecked />} label={label} />
          ))}
        </Row>
      </Example>

      <Example
        title="Tamanhos"
        code={`<Checkbox size="small" />
<Checkbox />
<Checkbox sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }} />`}
      >
        <Row>
          <FormControlLabel control={<Checkbox size="small" defaultChecked />} label="Pequeno" />
          <FormControlLabel control={<Checkbox defaultChecked />} label="Médio" />
          <FormControlLabel control={<Checkbox defaultChecked sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }} />} label="Grande" />
        </Row>
      </Example>

      <Example title="Posição do rótulo" code={`<FormControlLabel labelPlacement="top" control={<Checkbox />} label="Em cima" />`}>
        <Row gap={2}>
          {(['top', 'start', 'bottom', 'end'] as const).map((placement) => (
            <FormControlLabel
              key={placement}
              value={placement}
              control={<Checkbox defaultChecked={placement === 'end'} />}
              label={{ top: 'Em cima', start: 'Antes', bottom: 'Embaixo', end: 'Depois' }[placement]}
              labelPlacement={placement}
            />
          ))}
        </Row>
      </Example>

      <Example
        title="Indeterminado"
        description="O item pai fica parcial quando só parte dos filhos está marcada."
        code={`<Checkbox checked={todos} indeterminate={algum && !todos} onChange={marcarTodos} />`}
      >
        <IndeterminateDemo />
      </Example>

      <Example
        title="Grupo com validação"
        code={`<FormControl error={marcados > 2}>
  <FormLabel>Canais de aviso</FormLabel>
  <FormGroup>...</FormGroup>
  <FormHelperText>Escolha até 2.</FormHelperText>
</FormControl>`}
      >
        <ValidationDemo />
      </Example>

      <Example title="Ícones personalizados" code={`<Checkbox icon={<Heart />} checkedIcon={<Heart variant="Bold" />} color="error" />`}>
        <Row>
          <Checkbox
            icon={<Heart size={22} />}
            checkedIcon={<Heart size={22} variant="Bold" />}
            color="error"
            defaultChecked
            slotProps={{ input: { 'aria-label': 'Favoritar' } }}
          />
          <Checkbox
            icon={<Star1 size={22} />}
            checkedIcon={<Star1 size={22} variant="Bold" />}
            color="warning"
            slotProps={{ input: { 'aria-label': 'Destacar' } }}
          />
        </Row>
      </Example>
    </ExamplePage>
  );
}
