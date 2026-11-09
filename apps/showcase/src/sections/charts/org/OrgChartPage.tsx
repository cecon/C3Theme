import { useEffect, useMemo, useRef, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';

// third-party
import { ArrowDown2, ArrowUp2, SearchZoomIn, SearchZoomOut } from 'iconsax-reactjs';

import { Panel, SoftAvatar, StatusChip } from '@c3theme/ui';
import type { StatusTone } from '@c3theme/ui';
import { ORGANOGRAMA, Pessoa } from '../data';

const TONS: Record<string, StatusTone> = { Diretoria: 'primary', Operações: 'info', Financeiro: 'success', Tecnologia: 'warning' };

const iniciais = (nome: string) =>
  nome
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');

/** Total de pessoas abaixo de alguém, em todos os níveis. */
function contar(p: Pessoa): number {
  return (p.equipe ?? []).reduce((s, x) => s + 1 + contar(x), 0);
}

function idsComEquipe(p: Pessoa): string[] {
  return p.equipe ? [p.id, ...p.equipe.flatMap(idsComEquipe)] : [];
}

const GAP = 24;

/** Linhas que ligam chefe e equipe, desenhadas com bordas (propriedades lógicas para funcionar em RTL). */
const treeSx = (theme: Theme) => {
  const line = `1.5px solid ${theme.vars.palette.divider}`;
  return {
    '& ul': { display: 'flex', justifyContent: 'center', position: 'relative', m: 0, p: 0, pt: `${GAP}px`, listStyle: 'none' },
    '& > ul': { pt: 0 },
    '& li': { position: 'relative', px: 0.75, pt: `${GAP}px`, display: 'flex', flexDirection: 'column', alignItems: 'center' },
    '& li::before, & li::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      insetInlineEnd: '50%',
      width: '50%',
      height: GAP,
      borderTop: line
    },
    '& li::after': { insetInlineEnd: 'auto', insetInlineStart: '50%', borderInlineStart: line },
    '& li:only-of-type': { pt: 0 },
    '& li:only-of-type::before, & li:only-of-type::after': { display: 'none' },
    '& li:first-of-type::before, & li:last-of-type::after': { border: 'none' },
    '& li:last-of-type::before': { borderInlineEnd: line, borderStartEndRadius: 8 },
    '& li:first-of-type::after': { borderStartStartRadius: 8 },
    '& ul ul::before': { content: '""', position: 'absolute', top: 0, insetInlineStart: '50%', height: GAP, borderInlineStart: line },
    '& > ul > li': { pt: 0 },
    '& > ul > li::before, & > ul > li::after': { display: 'none' }
  };
};

interface NodeProps {
  pessoa: Pessoa;
  fechados: Set<string>;
  onToggle: (id: string) => void;
}

function PersonCard({ pessoa, fechados, onToggle }: NodeProps) {
  const total = contar(pessoa);
  const aberto = !fechados.has(pessoa.id);
  const tone = TONS[pessoa.area] ?? 'neutral';
  return (
    <Paper variant="outlined" sx={{ width: 172, p: 1.5, borderRadius: 3, textAlign: 'center', position: 'relative' }}>
      <SoftAvatar tone={tone === 'neutral' ? 'neutral' : tone} sx={{ mx: 'auto', mb: 1 }}>
        {iniciais(pessoa.nome)}
      </SoftAvatar>
      <Typography variant="subtitle2" noWrap>
        {pessoa.nome}
      </Typography>
      <Typography variant="caption" color="text.secondary" noWrap component="div" sx={{ mb: 1 }}>
        {pessoa.cargo}
      </Typography>
      <StatusChip label={pessoa.area} tone={tone} />
      {pessoa.equipe && (
        <ButtonBase
          onClick={() => onToggle(pessoa.id)}
          aria-expanded={aberto}
          aria-label={`${aberto ? 'Recolher' : 'Expandir'} equipe de ${pessoa.nome}`}
          sx={{
            position: 'absolute',
            bottom: -12,
            insetInlineStart: '50%',
            transform: 'translateX(-50%)',
            '[dir="rtl"] &': { transform: 'translateX(50%)' },
            gap: 0.25,
            px: 1,
            height: 24,
            borderRadius: 12,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            fontSize: 12,
            fontWeight: 600,
            color: 'text.secondary',
            zIndex: 1,
            '&:hover': { color: 'primary.main', borderColor: 'primary.main' }
          }}
        >
          {total}
          {aberto ? <ArrowUp2 size={12} /> : <ArrowDown2 size={12} />}
        </ButtonBase>
      )}
    </Paper>
  );
}

function Node(props: NodeProps) {
  const { pessoa, fechados } = props;
  const mostrarEquipe = pessoa.equipe && !fechados.has(pessoa.id);
  return (
    <li>
      <PersonCard {...props} />
      {mostrarEquipe && (
        <Box component="ul" sx={{ mt: '12px' }}>
          {pessoa.equipe!.map((p) => (
            <Node key={p.id} {...props} pessoa={p} />
          ))}
        </Box>
      )}
    </li>
  );
}

const ZOOMS = [0.6, 0.75, 0.9, 1];

export default function OrgChartPage() {
  const todos = useMemo(() => idsComEquipe(ORGANOGRAMA), []);
  // começa com os gerentes recolhidos para caber melhor na tela
  const [fechados, setFechados] = useState<Set<string>>(() => new Set(['p6', 'p9', 'p10']));
  const [zoom, setZoom] = useState(1);
  const scroller = useRef<HTMLDivElement>(null);

  // começa com a raiz no meio da área visível
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, []);

  const toggle = (id: string) =>
    setFechados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Panel
      title="Organograma"
      subtitle={`${contar(ORGANOGRAMA) + 1} pessoas · clique no contador de um cartão para abrir ou fechar a equipe`}
    >
      <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
        <Button size="small" onClick={() => setFechados(new Set())}>
          Expandir tudo
        </Button>
        <Button size="small" color="secondary" onClick={() => setFechados(new Set(todos.filter((id) => id !== ORGANOGRAMA.id)))}>
          Recolher
        </Button>
        <Tooltip title="Diminuir">
          <span>
            <IconButton size="small" aria-label="Diminuir zoom" disabled={zoom === 0} onClick={() => setZoom((z) => z - 1)}>
              <SearchZoomOut size={18} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Aumentar">
          <span>
            <IconButton size="small" aria-label="Aumentar zoom" disabled={zoom === ZOOMS.length - 1} onClick={() => setZoom((z) => z + 1)}>
              <SearchZoomIn size={18} />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      <Box ref={scroller} sx={{ overflowX: 'auto', pb: 3 }}>
        <Box sx={[treeSx, { width: 'max-content', minWidth: '100%', zoom: ZOOMS[zoom] }]}>
          <ul>
            <Node pessoa={ORGANOGRAMA} fechados={fechados} onToggle={toggle} />
          </ul>
        </Box>
      </Box>
    </Panel>
  );
}
