import { useState } from 'react';

// material-ui
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';

// third-party
import { Bluetooth, Moon, Wifi } from 'iconsax-reactjs';

import { notify } from '@c3theme/ui';
import Example, { ExamplePage, Row } from '../Example';

const COLORS = [
  { color: 'primary', label: 'Primária' },
  { color: 'secondary', label: 'Secundária' },
  { color: 'success', label: 'Sucesso' },
  { color: 'warning', label: 'Atenção' },
  { color: 'error', label: 'Erro' },
  { color: 'info', label: 'Informação' }
] as const;

function GroupDemo() {
  const [state, setState] = useState({ pedidos: true, estoque: false, financeiro: true });
  return (
    <FormControl component="fieldset" variant="standard">
      <FormLabel component="legend">Receber resumo diário de</FormLabel>
      <FormGroup>
        {(Object.keys(state) as (keyof typeof state)[]).map((k) => (
          <FormControlLabel
            key={k}
            control={<Switch checked={state[k]} onChange={(e) => setState({ ...state, [k]: e.target.checked })} />}
            label={{ pedidos: 'Pedidos', estoque: 'Estoque', financeiro: 'Financeiro' }[k]}
          />
        ))}
      </FormGroup>
      <FormHelperText>Enviado às 8h por e-mail.</FormHelperText>
    </FormControl>
  );
}

function SettingsListDemo() {
  const [on, setOn] = useState<string[]>(['wifi']);
  const toggle = (id: string, label: string) => () => {
    const enabled = !on.includes(id);
    setOn(enabled ? [...on, id] : on.filter((x) => x !== id));
    notify(`${label} ${enabled ? 'ligado' : 'desligado'}.`, 'info');
  };
  const items = [
    { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
    { id: 'bluetooth', label: 'Bluetooth', icon: Bluetooth },
    { id: 'noturno', label: 'Modo noturno', icon: Moon }
  ];
  return (
    <List disablePadding>
      {items.map(({ id, label, icon: Icon }) => (
        <ListItem
          key={id}
          disableGutters
          secondaryAction={
            <Switch edge="end" checked={on.includes(id)} onChange={toggle(id, label)} slotProps={{ input: { 'aria-label': label } }} />
          }
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Icon size={20} />
          </ListItemIcon>
          <ListItemText primary={label} />
        </ListItem>
      ))}
    </List>
  );
}

export default function SwitchPage() {
  return (
    <ExamplePage intro="O interruptor liga ou desliga uma opção na hora, sem precisar de um botão salvar.">
      <Example
        title="Básico"
        code={`<Switch defaultChecked slotProps={{ input: { 'aria-label': 'Ativo' } }} />
<FormControlLabel control={<Switch />} label="Receber novidades" />`}
      >
        <Row>
          <Switch defaultChecked slotProps={{ input: { 'aria-label': 'Ligado' } }} />
          <Switch slotProps={{ input: { 'aria-label': 'Desligado' } }} />
          <Switch disabled defaultChecked slotProps={{ input: { 'aria-label': 'Desabilitado ligado' } }} />
          <Switch disabled slotProps={{ input: { 'aria-label': 'Desabilitado' } }} />
          <FormControlLabel control={<Switch defaultChecked />} label="Receber novidades" />
        </Row>
      </Example>

      <Example title="Cores" code={`<Switch color="success" defaultChecked />`}>
        <Row>
          {COLORS.map(({ color, label }) => (
            <FormControlLabel key={color} control={<Switch color={color} defaultChecked />} label={label} />
          ))}
        </Row>
      </Example>

      <Example title="Tamanhos" code={`<Switch size="small" />`}>
        <Row>
          <FormControlLabel control={<Switch size="small" defaultChecked />} label="Pequeno" />
          <FormControlLabel control={<Switch defaultChecked />} label="Médio" />
        </Row>
      </Example>

      <Example title="Posição do rótulo" code={`<FormControlLabel labelPlacement="start" control={<Switch />} label="Antes" />`}>
        <Row gap={2}>
          {(['top', 'start', 'bottom', 'end'] as const).map((placement) => (
            <FormControlLabel
              key={placement}
              control={<Switch defaultChecked={placement !== 'bottom'} />}
              label={{ top: 'Em cima', start: 'Antes', bottom: 'Embaixo', end: 'Depois' }[placement]}
              labelPlacement={placement}
            />
          ))}
        </Row>
      </Example>

      <Example
        title="Em grupo"
        code={`<FormControl component="fieldset">
  <FormLabel component="legend">Receber resumo de</FormLabel>
  <FormGroup>
    <FormControlLabel control={<Switch checked={...} onChange={...} />} label="Pedidos" />
  </FormGroup>
</FormControl>`}
      >
        <GroupDemo />
      </Example>

      <Example
        title="Em lista de configurações"
        description="Liga e desliga na hora, com aviso."
        code={`<ListItem secondaryAction={<Switch edge="end" checked={ligado} onChange={alternar} />}>
  <ListItemText primary="Wi-Fi" />
</ListItem>`}
      >
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Preferências do dispositivo
          </Typography>
          <SettingsListDemo />
        </Stack>
      </Example>
    </ExamplePage>
  );
}
