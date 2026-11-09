import { useIntl } from 'react-intl';
import { Link, useNavigate } from 'react-router';
import useSWR from 'swr';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { fieldLabel, useEngine, useText } from '../../context';
import { ListWidget as List, widgetLink, widgetWhere } from '../../dashboard';
import { findOption, isNumeric as numeric } from '../../format';
import type { FieldDef } from '../../types';
import { Cell } from '../list/Cell';
import WidgetError from './WidgetError';

/** Lista curta: os primeiros registros do recorte, cada um leva ao registro; o rodapé leva à lista inteira. */
export default function ListWidget({ widget }: { widget: List }) {
  const { client, entities, org } = useEngine();
  const text = useText();
  const navigate = useNavigate();
  const { locale } = useIntl();
  const { def, capabilities } = entities[widget.entity];
  const limit = widget.limit ?? 5;
  const where = widgetWhere(widget, def);
  const { data, error } = useSWR(['c3-list', widget.entity, 'widget', where, widget.sort, limit, org?.active], () =>
    client.list(widget.entity, { pageSize: 10, sort: widget.sort, where })
  );
  const names = widget.columns ?? (def.titleField ? [def.titleField] : []);
  const fields = names.map((n) => def.fields.find((f) => f.name === n)).filter((f): f is FieldDef => !!f);
  const optionLabel = (f: FieldDef) => (v: string) => text(findOption(f, v)?.label, v);

  if (error)
    return (
      <Box sx={{ p: 2.5 }}>
        <WidgetError error={error} />
      </Box>
    );
  if (!data)
    return (
      <Box sx={{ p: 2.5 }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={32} />
        ))}
      </Box>
    );
  const rows = data.data.slice(0, limit);
  if (!rows.length)
    return (
      <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
        Nenhum registro.
      </Typography>
    );

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            {fields.map((f) => (
              <TableCell key={f.name} align={numeric(f) ? 'right' : 'left'}>
                {fieldLabel(f, text)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              hover={capabilities.read}
              onClick={capabilities.read ? () => navigate(`/${widget.entity}/${row.id}`) : undefined}
              sx={{ cursor: capabilities.read ? 'pointer' : undefined }}
            >
              {fields.map((f, i) => (
                <TableCell key={f.name} align={numeric(f) ? 'right' : 'left'}>
                  {i === 0 && capabilities.read ? (
                    <Link to={`/${widget.entity}/${row.id}`} style={{ color: 'inherit' }} onClick={(e) => e.stopPropagation()}>
                      <Cell field={f} row={row} locale={locale} optionLabel={optionLabel(f)} />
                    </Link>
                  ) : (
                    <Cell field={f} row={row} locale={locale} optionLabel={optionLabel(f)} />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {data.meta.total > rows.length && (
        <Box sx={{ px: 1.5, py: 1 }}>
          <Button component={Link} to={widgetLink(widget)} size="small">
            {`Ver todos (${data.meta.total.toLocaleString(locale)})`}
          </Button>
        </Box>
      )}
    </>
  );
}
