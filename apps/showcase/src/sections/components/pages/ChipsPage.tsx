import { useState } from 'react';

// material-ui
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

// third-party
import { CloseCircle, Location, Star1, TickCircle } from 'iconsax-reactjs';

import { notify, SoftAvatar, StatusChip, type StatusTone } from '@c3theme/ui';
import { portrait, SKILLS } from '../data';
import Example, { ExamplePage, Row } from '../Example';

const COLORS = ['default', 'primary', 'secondary', 'success', 'warning', 'error', 'info'] as const;
const LABEL: Record<(typeof COLORS)[number], string> = {
  default: 'Padrão',
  primary: 'Primária',
  secondary: 'Secundária',
  success: 'Sucesso',
  warning: 'Atenção',
  error: 'Erro',
  info: 'Informação'
};

const STATUSES: { label: string; tone: StatusTone }[] = [
  { label: 'Rascunho', tone: 'neutral' },
  { label: 'Em andamento', tone: 'info' },
  { label: 'Ativo', tone: 'success' },
  { label: 'Pendente', tone: 'warning' },
  { label: 'Cancelado', tone: 'danger' },
  { label: 'Destaque', tone: 'primary' }
];

function ArrayDemo() {
  const [tags, setTags] = useState(SKILLS.slice(0, 6));
  return (
    <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
      <Row gap={1}>
        {tags.map((t) => (
          <Chip key={t} label={t} onDelete={() => setTags(tags.filter((x) => x !== t))} />
        ))}
        {tags.length === 0 && <Chip label="Nenhuma etiqueta" variant="outlined" />}
      </Row>
      <Button size="small" onClick={() => setTags(SKILLS.slice(0, 6))} disabled={tags.length === 6}>
        Restaurar
      </Button>
    </Stack>
  );
}

function FilterDemo() {
  const [selected, setSelected] = useState<string[]>(['Abertos']);
  const options = ['Abertos', 'Atrasados', 'Meus', 'Com anexo'];
  return (
    <Row gap={1}>
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <Chip
            key={o}
            label={o}
            color={on ? 'primary' : 'default'}
            variant={on ? 'filled' : 'outlined'}
            icon={on ? <TickCircle size={16} /> : undefined}
            onClick={() => setSelected(on ? selected.filter((x) => x !== o) : [...selected, o])}
            aria-pressed={on}
          />
        );
      })}
    </Row>
  );
}

export default function ChipsPage() {
  return (
    <ExamplePage intro="Chips são elementos compactos para etiquetas, filtros, situações e seleções. Para situação de registros, use o StatusChip do @c3theme/ui.">
      <Example
        title="Básico"
        code={`<Chip label="Preenchido" />
<Chip label="Contornado" variant="outlined" />
<Chip label="Clicável" onClick={...} />
<Chip label="Removível" onDelete={...} />`}
      >
        <Row gap={1}>
          <Chip label="Preenchido" />
          <Chip label="Contornado" variant="outlined" />
          <Chip label="Clicável" onClick={() => notify('Chip clicado.', 'info')} />
          <Chip label="Removível" onDelete={() => notify('Remover etiqueta.', 'info')} />
          <Chip label="Desabilitado" disabled />
        </Row>
      </Example>

      <Example
        title="Cores"
        code={`<Chip label="Sucesso" color="success" />
<Chip label="Sucesso" color="success" variant="outlined" />`}
      >
        <Stack spacing={1.5}>
          <Row gap={1}>
            {COLORS.map((c) => (
              <Chip key={c} label={LABEL[c]} color={c} />
            ))}
          </Row>
          <Row gap={1}>
            {COLORS.map((c) => (
              <Chip key={c} label={LABEL[c]} color={c} variant="outlined" />
            ))}
          </Row>
        </Stack>
      </Example>

      <Example
        title="Situação (StatusChip)"
        description="Fundo suave legível no claro e no escuro."
        code={`<StatusChip label="Ativo" tone="success" />
<StatusChip label="Cancelado" tone="danger" size="medium" />`}
      >
        <Stack spacing={1.5}>
          <Row gap={1}>
            {STATUSES.map((s) => (
              <StatusChip key={s.label} label={s.label} tone={s.tone} />
            ))}
          </Row>
          <Row gap={1}>
            {STATUSES.map((s) => (
              <StatusChip key={s.label} label={s.label} tone={s.tone} size="medium" />
            ))}
          </Row>
        </Stack>
      </Example>

      <Example title="Tamanhos" code={`<Chip size="small" label="Pequeno" />`}>
        <Row gap={1}>
          <Chip size="small" label="Pequeno" color="primary" />
          <Chip label="Médio" color="primary" />
          <Chip size="small" label="Pequeno" variant="outlined" onDelete={() => undefined} />
          <Chip label="Médio" variant="outlined" onDelete={() => undefined} />
        </Row>
      </Example>

      <Example
        title="Com avatar e ícone"
        code={`<Chip avatar={<Avatar src={foto} />} label="Ana" />
<Chip icon={<Location />} label="Curitiba" />`}
      >
        <Row gap={1}>
          <Chip avatar={<Avatar alt="Ana" src={portrait(210)} />} label="Ana Beatriz" />
          <Chip avatar={<SoftAvatar tone="success">CL</SoftAvatar>} label="Carlos Lima" variant="outlined" />
          <Chip icon={<Location size={16} />} label="Curitiba – PR" />
          <Chip icon={<Star1 size={16} variant="Bold" />} label="Favorito" color="warning" />
        </Row>
      </Example>

      <Example title="Ícone de remover personalizado" code={`<Chip label="Filtro" onDelete={...} deleteIcon={<CloseCircle />} />`}>
        <Row gap={1}>
          <Chip label="Região: Sul" color="primary" onDelete={() => undefined} deleteIcon={<CloseCircle size={16} />} />
          <Chip label="Valor > R$ 1.000" variant="outlined" onDelete={() => undefined} deleteIcon={<CloseCircle size={16} />} />
          <Chip label="Concluído" color="success" onDelete={() => undefined} deleteIcon={<TickCircle size={16} />} />
        </Row>
      </Example>

      <Example
        title="Lista removível"
        description="Remova as etiquetas e restaure."
        code={`{etiquetas.map((t) => <Chip key={t} label={t} onDelete={() => remover(t)} />)}`}
      >
        <ArrayDemo />
      </Example>

      <Example
        title="Filtros"
        description="Clique para ligar e desligar."
        code={`<Chip label="Abertos" color={ativo ? 'primary' : 'default'} variant={ativo ? 'filled' : 'outlined'} onClick={alternar} />`}
      >
        <FilterDemo />
      </Example>
    </ExamplePage>
  );
}
