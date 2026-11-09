import { Link as RouterLink } from 'react-router';

// material-ui
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';

// third-party
import { Calendar, DocumentText, Kanban, Map1, RowVertical } from 'iconsax-reactjs';

import { useText } from '../../context';
import type { EntityDef, EntityViewKind } from '../../types';
import { availableViews, viewPath } from '../../views';

const VIEWS: Record<EntityViewKind, { label: string; Icon: typeof Kanban }> = {
  list: { label: 'Lista', Icon: RowVertical },
  board: { label: 'Quadro', Icon: Kanban },
  calendar: { label: 'Calendário', Icon: Calendar },
  report: { label: 'Relatório', Icon: DocumentText },
  map: { label: 'Planta', Icon: Map1 }
};

/** Troca entre lista, quadro, calendário, relatório e planta levando o preset. Some quando a entidade só tem a lista. */
export function ViewSwitcher({ def, current, preset }: { def: EntityDef; current: EntityViewKind; preset?: string }) {
  const views = availableViews(def);
  if (views.length < 2) return null;
  return (
    <ToggleButtonGroup size="small" value={current} exclusive aria-label="Visão">
      {views.map((v) => {
        const { label, Icon } = VIEWS[v];
        return (
          <Tooltip key={v} title={label}>
            <ToggleButton
              value={v}
              aria-label={label}
              component={RouterLink}
              to={viewPath(def.name, v, preset)}
              // é link, não botão de alternar: a visão atual é a página atual (aria-pressed não vale em link)
              aria-pressed={undefined}
              aria-current={v === current ? 'page' : undefined}
              sx={{ px: 1.25 }}
            >
              <Icon size={18} />
            </ToggleButton>
          </Tooltip>
        );
      })}
    </ToggleButtonGroup>
  );
}

/** Atalhos de filtro da lista (presets), também no quadro e no calendário. */
export function PresetChips({ def, presetId, onChange }: { def: EntityDef; presetId?: string; onChange: (id?: string) => void }) {
  const text = useText();
  const presets = def.views?.list?.presets ?? [];
  if (presets.length === 0) return null;
  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ px: 2, pb: 2, flexWrap: 'wrap' }}>
      {presets.map((p) => (
        <Chip
          key={p.id}
          label={text(p.label)}
          color={p.id === presetId ? 'primary' : 'default'}
          variant={p.id === presetId ? 'filled' : 'outlined'}
          onClick={() => onChange(p.id === presetId ? undefined : p.id)}
        />
      ))}
    </Stack>
  );
}
