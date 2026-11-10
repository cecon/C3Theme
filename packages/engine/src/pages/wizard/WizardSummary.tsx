// Resumo no fim do assistente (#34): cada item com feito ou falta, pelo campo boolean do registro, e o link da tela.
import { Link as RouterLink } from 'react-router';

// material-ui
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

// third-party
import { InfoCircle, TickCircle } from 'iconsax-reactjs';

import { useText } from '../../context';
import type { WireRecord } from '../../types';
import type { WizardSummaryItem } from '../../wizard';

export default function WizardSummary({ items, record, pending }: { items: WizardSummaryItem[]; record?: WireRecord; pending: boolean }) {
  const text = useText();
  return (
    <>
      {pending && <Alert severity="warning">Ainda falta configurar o que o sistema exige para liberar as telas.</Alert>}
      <List>
        {items.map((item) => {
          const ok = item.done ? record?.[item.done] === true : undefined;
          return (
            <ListItem key={item.path} disableGutters>
              <ListItemIcon sx={{ minWidth: 36, color: ok ? 'success.main' : 'warning.main' }}>
                {ok ? <TickCircle size={20} /> : <InfoCircle size={20} />}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Link component={RouterLink} to={item.path}>
                    {text(item.label)}
                  </Link>
                }
                secondary={ok === undefined ? undefined : ok ? 'Feito' : 'Falta'}
              />
            </ListItem>
          );
        })}
      </List>
    </>
  );
}
