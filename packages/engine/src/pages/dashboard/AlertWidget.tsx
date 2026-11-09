import { Link } from 'react-router';

// material-ui
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';

import { useEngine, useText } from '../../context';
import { AlertWidget as AlertDef, widgetLink, widgetWhere, widgetWidth } from '../../dashboard';
import { useAggregate } from './useAggregate';

/**
 * Aviso do painel ("12 vendas sem NFC-e"): conta os registros do recorte e só aparece com contagem acima de zero. Leva
 * à lista com o mesmo recorte. Ocupa a própria célula da grade, que some junto quando não há o que avisar.
 */
export default function AlertWidget({ widget }: { widget: AlertDef }) {
  const { entities } = useEngine();
  const text = useText();
  const { def } = entities[widget.entity];
  const { data } = useAggregate(widget.entity, { measure: 'count', where: widgetWhere(widget, def) });
  const count = Number(data?.[0]?.value ?? 0);
  // falha ou sem acesso também não aparece: aviso que não se confirma não ajuda
  if (!count) return null;
  return (
    <Grid size={{ xs: 12, md: Math.max(widgetWidth(widget), 6), lg: widgetWidth(widget) }}>
      <Link to={widgetLink(widget)} style={{ textDecoration: 'none', display: 'block' }}>
        <Alert severity={widget.tone ?? 'warning'} sx={{ alignItems: 'center' }}>
          {text(widget.text).replace('{count}', count.toLocaleString())}
        </Alert>
      </Link>
    </Grid>
  );
}
