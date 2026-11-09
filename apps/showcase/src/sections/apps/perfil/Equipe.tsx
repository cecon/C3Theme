import { FormEvent, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { Send2, Trash } from 'iconsax-reactjs';

import { notify, Panel, ScrollX, SoftAvatar, StatusChip } from '@c3theme/ui';
import ConfirmDialog from '../faturas/ConfirmDialog';
import { Member, MEMBERS, Role, ROLES } from './data';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Equipe: convite por e-mail e papel de cada membro. */
export default function TeamTab() {
  const [members, setMembers] = useState<Member[]>(MEMBERS);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('Colaborador');
  const [error, setError] = useState<string>();
  const [removing, setRemoving] = useState<Member | null>(null);

  const invite = (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL.test(value)) return setError('Informe um e-mail válido.');
    if (members.some((m) => m.email === value)) return setError('Essa pessoa já está na equipe.');
    setMembers((list) => [...list, { id: `m${Date.now()}`, name: '', email: value, role, status: 'convidado', since: 'agora' }]);
    setEmail('');
    setError(undefined);
    notify(`Convite enviado para ${value}.`);
  };

  const owners = members.filter((m) => m.role === 'Proprietário').length;

  return (
    <Stack spacing={3}>
      <Panel title="Convidar para a equipe" subtitle="A pessoa recebe um e-mail com o link de acesso, válido por 7 dias.">
        <Stack
          component="form"
          onSubmit={invite}
          noValidate
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ gap: 1.5, alignItems: { sm: 'flex-start' } }}
        >
          <TextField
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(undefined);
            }}
            error={!!error}
            helperText={error}
            sx={{ flex: 1 }}
          />
          <TextField select label="Papel" value={role} onChange={(e) => setRole(e.target.value as Role)} sx={{ minWidth: { sm: 200 } }}>
            {ROLES.map((r) => (
              <MenuItem key={r.value} value={r.value}>
                <Box>
                  <Typography variant="body2">{r.value}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {r.hint}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </TextField>
          <Button type="submit" variant="contained" size="large" startIcon={<Send2 size={18} />} sx={{ height: 52, flexShrink: 0 }}>
            Convidar
          </Button>
        </Stack>
      </Panel>

      <Panel
        title="Membros"
        subtitle={`${members.length} pessoas · ${members.filter((m) => m.status === 'convidado').length} convites pendentes`}
        flush
      >
        <ScrollX>
          <Table sx={{ minWidth: 680 }} aria-label="Membros da equipe">
            <TableHead>
              <TableRow>
                <TableCell>Membro</TableCell>
                <TableCell>Papel</TableCell>
                <TableCell>Situação</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((m) => {
                const owner = m.role === 'Proprietário';
                return (
                  <TableRow key={m.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <SoftAvatar size="sm" tone={m.status === 'convidado' ? 'neutral' : 'primary'}>
                          {(m.name || m.email)[0]!.toUpperCase()}
                        </SoftAvatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" noWrap>
                            {m.name || 'Convite pendente'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap component="p">
                            {m.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {owner ? (
                        <StatusChip label="Proprietário" tone="primary" />
                      ) : (
                        <Select
                          size="small"
                          value={m.role}
                          onChange={(e) => {
                            const next = e.target.value as Role;
                            setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, role: next } : x)));
                            notify(`${m.name || m.email} agora é ${next}.`);
                          }}
                          SelectDisplayProps={{ 'aria-label': `Papel de ${m.name || m.email}` }}
                          sx={{ minWidth: 160 }}
                        >
                          {ROLES.map((r) => (
                            <MenuItem key={r.value} value={r.value}>
                              {r.value}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25} sx={{ alignItems: 'flex-start' }}>
                        <StatusChip
                          label={m.status === 'ativo' ? 'Ativo' : 'Convidado'}
                          tone={m.status === 'ativo' ? 'success' : 'warning'}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {m.status === 'ativo' ? `desde ${m.since}` : `enviado ${m.since}`}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {m.status === 'convidado' && (
                        <Tooltip title="Reenviar convite">
                          <IconButton
                            aria-label={`Reenviar convite para ${m.email}`}
                            onClick={() => notify(`Convite reenviado para ${m.email}.`, 'info')}
                          >
                            <Send2 size={18} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title={owner && owners === 1 ? 'A conta precisa de um proprietário' : 'Remover da equipe'}>
                        <span>
                          <IconButton
                            aria-label={`Remover ${m.name || m.email}`}
                            color="error"
                            disabled={owner && owners === 1}
                            onClick={() => setRemoving(m)}
                          >
                            <Trash size={18} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollX>
      </Panel>

      <ConfirmDialog
        open={removing !== null}
        title={removing?.status === 'convidado' ? 'Cancelar convite?' : 'Remover da equipe?'}
        description={removing ? `${removing.name || removing.email} perderá o acesso à conta.` : undefined}
        confirmLabel="Remover"
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (!removing) return;
          setMembers((list) => list.filter((x) => x.id !== removing.id));
          notify('Membro removido.');
        }}
      />
    </Stack>
  );
}
