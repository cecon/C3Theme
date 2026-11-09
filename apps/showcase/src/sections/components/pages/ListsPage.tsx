import { Fragment } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Document, Folder2, Gallery, Message, MoneyRecive, MoneySend, More, Sms, Wallet } from 'iconsax-reactjs';
import { Dot, notify, SoftAvatar, StatusChip } from '@c3theme/ui';
import { brl, CITIES, initials, MOVEMENTS, PEOPLE } from '../data';
import Example, { ExamplePage } from '../Example';
import { CheckboxListDemo, NestedDemo, SelectedDemo, bordered } from './lists/demos';

export default function ListsPage() {
  return (
    <ExamplePage intro="Listas organizam itens em linhas: navegação, contatos, arquivos, notificações e movimentações.">
      <Example
        title="Básica"
        code={`<List>
  <ListItemButton><ListItemIcon><Sms /></ListItemIcon><ListItemText primary="Mensagens" /></ListItemButton>
</List>`}
      >
        <Box sx={bordered}>
          <List>
            {[
              { icon: Sms, label: 'Mensagens' },
              { icon: Calendar, label: 'Agenda' }
            ].map(({ icon: Icon, label }) => (
              <ListItemButton key={label}>
                <ListItemIcon>
                  <Icon size={20} />
                </ListItemIcon>
                <ListItemText primary={label} />
              </ListItemButton>
            ))}
          </List>
          <Divider />
          <List>
            <ListItemButton>
              <ListItemText primary="Ajuda" />
            </ListItemButton>
            <ListItemButton>
              <ListItemText primary="Sair" />
            </ListItemButton>
          </List>
        </Box>
      </Example>

      <Example
        title="Aninhada"
        description="Itens que abrem uma sublista."
        code={`<ListItemButton onClick={() => setAberto(!aberto)}>...</ListItemButton>
<Collapse in={aberto}><List disablePadding>...</List></Collapse>`}
      >
        <NestedDemo />
      </Example>

      <Example title="Com seleção" code={`<ListItemButton selected={sel === i} onClick={() => setSel(i)}>...</ListItemButton>`}>
        <SelectedDemo />
      </Example>

      <Example
        title="Com caixas de seleção e ação"
        code={`<ListItem secondaryAction={<IconButton edge="end" />}>
  <ListItemButton onClick={alternar}><Checkbox edge="start" checked={...} />...</ListItemButton>
</ListItem>`}
      >
        <CheckboxListDemo />
      </Example>

      <Example
        title="Pastas e arquivos"
        description="Avatar, texto principal e secundário."
        code={`<ListItem>
  <ListItemAvatar><SoftAvatar><Folder2 /></SoftAvatar></ListItemAvatar>
  <ListItemText primary="Contratos" secondary="12 de out. de 2026" />
</ListItem>`}
      >
        <List sx={bordered}>
          {[
            { icon: Folder2, tone: 'warning' as const, name: 'Contratos 2026', date: '2026-10-12' },
            { icon: Gallery, tone: 'info' as const, name: 'Fotos da obra', date: '2026-09-28' },
            { icon: Document, tone: 'danger' as const, name: 'Balanço trimestral.pdf', date: '2026-09-02' }
          ].map(({ icon: Icon, tone, name, date }) => (
            <ListItem
              key={name}
              secondaryAction={
                <IconButton edge="end" aria-label={`Mais ações para ${name}`}>
                  <More size={18} />
                </IconButton>
              }
            >
              <ListItemAvatar>
                <SoftAvatar tone={tone}>
                  <Icon size={20} />
                </SoftAvatar>
              </ListItemAvatar>
              <ListItemText primary={name} secondary={format(parseISO(date), "d 'de' MMM 'de' yyyy", { locale: ptBR })} />
            </ListItem>
          ))}
        </List>
      </Example>

      <Example
        title="Itens alinhados ao topo"
        description="Para textos de várias linhas."
        code={`<ListItem alignItems="flex-start">...</ListItem>`}
      >
        <List sx={bordered}>
          {PEOPLE.slice(0, 3).map((p, i) => (
            <Fragment key={p.id}>
              {i > 0 && <Divider variant="inset" component="li" />}
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <SoftAvatar tone={p.tone}>{initials(p.name)}</SoftAvatar>
                </ListItemAvatar>
                <ListItemText
                  primary={['Reunião de planejamento', 'Proposta enviada', 'Dúvida sobre o boleto'][i]}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {p.name}
                      </Typography>
                      {
                        [
                          ' — Podemos mover para quinta às 10h? Preciso fechar os números antes.',
                          ' — Segue a proposta revisada com o desconto combinado.',
                          ' — O código de barras não está sendo lido pelo app do banco.'
                        ][i]
                      }
                    </>
                  }
                />
              </ListItem>
            </Fragment>
          ))}
        </List>
      </Example>

      <Example
        title="Usuários"
        description="Com status online e situação."
        code={`<ListItemAvatar><Badge variant="dot">...</Badge></ListItemAvatar>`}
      >
        <List sx={bordered} disablePadding>
          {PEOPLE.slice(0, 5).map((p, i) => (
            <ListItem
              key={p.id}
              divider={i < 4}
              secondaryAction={<StatusChip label={p.online ? 'Online' : 'Ausente'} tone={p.online ? 'success' : 'neutral'} />}
            >
              <ListItemAvatar>
                <SoftAvatar tone={p.tone} size="sm">
                  {initials(p.name)}
                </SoftAvatar>
              </ListItemAvatar>
              <ListItemText primary={p.name} secondary={p.role} sx={{ pr: 8 }} />
            </ListItem>
          ))}
        </List>
      </Example>

      <Example
        title="Notificações"
        code={`<ListItemButton><ListItemAvatar>...</ListItemAvatar><ListItemText primary="..." secondary="há 5 min" /><Dot /></ListItemButton>`}
      >
        <List sx={bordered} disablePadding>
          {[
            { tone: 'success' as const, icon: MoneyRecive, text: 'Pagamento de R$ 1.890,50 confirmado', time: 'há 5 min', unread: true },
            { tone: 'info' as const, icon: Message, text: 'Fernanda comentou no pedido 4521', time: 'há 1 h', unread: true },
            { tone: 'warning' as const, icon: Calendar, text: 'Boleto da Papelaria Ipê vence amanhã', time: 'ontem', unread: false }
          ].map(({ tone, icon: Icon, text, time, unread }, i) => (
            <ListItemButton key={text} divider={i < 2} onClick={() => notify('Notificação aberta.', 'info')}>
              <ListItemAvatar>
                <SoftAvatar tone={tone}>
                  <Icon size={20} />
                </SoftAvatar>
              </ListItemAvatar>
              <ListItemText primary={text} secondary={time} slotProps={{ primary: { sx: { fontWeight: unread ? 600 : 400 } } }} />
              {unread && <Dot tone="primary" />}
            </ListItemButton>
          ))}
        </List>
      </Example>

      <Example
        title="Movimentações"
        description="Valores em reais, entrada e saída."
        code={`<ListItemText primary={titulo} secondary={data} />
<Typography color={valor > 0 ? 'success.main' : 'error.main'}>{brl.format(valor)}</Typography>`}
      >
        <List sx={bordered} disablePadding>
          {MOVEMENTS.map((m, i) => (
            <ListItem key={m.id} divider={i < MOVEMENTS.length - 1}>
              <ListItemAvatar>
                <SoftAvatar tone={m.amount > 0 ? 'success' : 'danger'}>
                  {m.amount > 0 ? <MoneyRecive size={20} /> : <MoneySend size={20} />}
                </SoftAvatar>
              </ListItemAvatar>
              <ListItemText primary={m.title} secondary={format(parseISO(m.date), 'dd/MM/yyyy')} sx={{ minWidth: 0 }} />
              <Typography variant="subtitle1" sx={{ color: m.amount > 0 ? 'success.main' : 'error.main', whiteSpace: 'nowrap', ml: 1 }}>
                {m.amount > 0 ? '+' : '−'} {brl.format(Math.abs(m.amount))}
              </Typography>
            </ListItem>
          ))}
          <ListItem sx={{ bgcolor: 'background.default' }}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Wallet size={20} />
            </ListItemIcon>
            <ListItemText primary="Saldo do período" />
            <Typography variant="subtitle1">{brl.format(MOVEMENTS.reduce((s, m) => s + m.amount, 0))}</Typography>
          </ListItem>
        </List>
      </Example>

      <Example
        title="Com rolagem e cabeçalhos fixos"
        description="Os títulos de região grudam no topo."
        code={`<List sx={{ maxHeight: 300, overflow: 'auto' }}>
  <li><ul><ListSubheader>Sul</ListSubheader>...</ul></li>
</List>`}
      >
        <List sx={{ ...bordered, maxHeight: 300, overflow: 'auto', position: 'relative', '& ul': { p: 0 } }} subheader={<li />}>
          {(['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'] as const).map((r) => (
            <li key={r}>
              <ul>
                <ListSubheader>{r}</ListSubheader>
                {CITIES.filter((c) => c.region === r).map((c) => (
                  <ListItem key={c.name} dense>
                    <ListItemText primary={`${c.name} – ${c.uf}`} />
                  </ListItem>
                ))}
              </ul>
            </li>
          ))}
        </List>
      </Example>

      <Example title="Densa" code={`<List dense>...</List>`}>
        <Stack sx={bordered}>
          <List dense>
            {PEOPLE.slice(0, 4).map((p) => (
              <ListItem key={p.id}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <Dot tone={p.tone} />
                </ListItemIcon>
                <ListItemText primary={p.name} secondary={p.email} />
              </ListItem>
            ))}
          </List>
        </Stack>
      </Example>
    </ExamplePage>
  );
}
