// Listas com estado: aninhada, seleção e checkbox.
import { useState } from 'react';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import { ArrowDown2, ArrowUp2, DocumentText, Folder2, Message, Setting2, Sms, Star1, Trash } from 'iconsax-reactjs';

export const bordered = { border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' } as const;

export function NestedDemo() {
  const [open, setOpen] = useState(true);
  return (
    <List sx={bordered} subheader={<ListSubheader sx={{ bgcolor: 'transparent' }}>Cadastros</ListSubheader>}>
      <ListItemButton>
        <ListItemIcon>
          <Sms size={20} />
        </ListItemIcon>
        <ListItemText primary="Mensagens" />
      </ListItemButton>
      <ListItemButton onClick={() => setOpen(!open)} aria-expanded={open}>
        <ListItemIcon>
          <Folder2 size={20} />
        </ListItemIcon>
        <ListItemText primary="Documentos" />
        {open ? <ArrowUp2 size={16} /> : <ArrowDown2 size={16} />}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {['Contratos', 'Notas fiscais', 'Comprovantes'].map((t) => (
            <ListItemButton key={t} sx={{ pl: 7 }}>
              <ListItemText primary={t} />
            </ListItemButton>
          ))}
        </List>
      </Collapse>
      <ListItemButton>
        <ListItemIcon>
          <Setting2 size={20} />
        </ListItemIcon>
        <ListItemText primary="Configurações" />
      </ListItemButton>
    </List>
  );
}

export function SelectedDemo() {
  const [selected, setSelected] = useState(1);
  const items = [
    { icon: Message, label: 'Caixa de entrada' },
    { icon: Star1, label: 'Com estrela' },
    { icon: DocumentText, label: 'Rascunhos' },
    { icon: Trash, label: 'Lixeira' }
  ];
  return (
    <List sx={bordered}>
      {items.map(({ icon: Icon, label }, i) => (
        <ListItemButton key={label} selected={selected === i} onClick={() => setSelected(i)}>
          <ListItemIcon>
            <Icon size={20} />
          </ListItemIcon>
          <ListItemText primary={label} />
        </ListItemButton>
      ))}
    </List>
  );
}

export function CheckboxListDemo() {
  const [checked, setChecked] = useState<number[]>([1]);
  const toggle = (id: number) => setChecked(checked.includes(id) ? checked.filter((x) => x !== id) : [...checked, id]);
  return (
    <List sx={bordered}>
      {['Conferir estoque', 'Emitir boletos', 'Responder clientes', 'Fechar caixa'].map((t, id) => (
        <ListItem
          key={t}
          disablePadding
          secondaryAction={
            <IconButton edge="end" aria-label={`Comentários de ${t}`}>
              <Message size={18} />
            </IconButton>
          }
        >
          <ListItemButton onClick={() => toggle(id)} dense>
            <ListItemIcon>
              <Checkbox
                edge="start"
                checked={checked.includes(id)}
                tabIndex={-1}
                disableRipple
                slotProps={{ input: { 'aria-labelledby': `tarefa-${id}` } }}
              />
            </ListItemIcon>
            <ListItemText
              id={`tarefa-${id}`}
              primary={t}
              sx={{
                textDecoration: checked.includes(id) ? 'line-through' : 'none',
                color: checked.includes(id) ? 'text.secondary' : 'text.primary'
              }}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}
