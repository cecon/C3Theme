import { Link as RouterLink, Outlet, useLocation } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR as pickersPtBR } from '@mui/x-date-pickers/locales';

// third-party
import { ptBR } from 'date-fns/locale';
import { Kanban, TaskSquare } from 'iconsax-reactjs';

import CardDrawer from './CardDrawer';
import { KanbanProvider } from './KanbanContext';

const pickerText = pickersPtBR.components.MuiLocalizationProvider.defaultProps.localeText;

/** Envolve quadro e backlog: o estado do kanban vive aqui e sobrevive à troca de aba. */
export default function KanbanLayout() {
  const { pathname } = useLocation();
  const tab = pathname.endsWith('/backlog') ? 'backlog' : 'quadro';

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR} localeText={pickerText}>
      <KanbanProvider>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2.5 }}>
          <Tabs value={tab} aria-label="Visões do kanban">
            <Tab
              value="quadro"
              label="Quadro"
              icon={<Kanban size={18} />}
              iconPosition="start"
              component={RouterLink}
              to="/apps/kanban/quadro"
              sx={{ minHeight: 48 }}
            />
            <Tab
              value="backlog"
              label="Backlog"
              icon={<TaskSquare size={18} />}
              iconPosition="start"
              component={RouterLink}
              to="/apps/kanban/backlog"
              sx={{ minHeight: 48 }}
            />
          </Tabs>
        </Box>
        <Outlet />
        <CardDrawer />
      </KanbanProvider>
    </LocalizationProvider>
  );
}
