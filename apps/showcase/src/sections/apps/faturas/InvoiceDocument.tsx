import { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { LogoMark, ScrollX, StatusChip } from '@c3theme/ui';
import { Address, Customer, Invoice, ISSUER, money, shortDate, STATUS, totals } from './data';

export type InvoiceDraft = Omit<Invoice, 'id' | 'customer'> & { customer?: Customer | null };

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 2 }}>
        {title}
      </Typography>
      <Stack spacing={0.25}>{children}</Stack>
    </Box>
  );
}

function AddressLines({ address }: { address: Address }) {
  return (
    <>
      <Typography variant="body2" color="text.secondary">
        {address.street} – {address.district}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {address.city}/{address.state} · CEP {address.zip}
      </Typography>
    </>
  );
}

function TotalRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 4 }}>
      <Typography variant={strong ? 'subtitle1' : 'body2'} color={strong ? 'text.primary' : 'text.secondary'}>
        {label}
      </Typography>
      <Typography variant={strong ? 'subtitle1' : 'body2'} sx={{ fontWeight: strong ? 700 : 500 }}>
        {value}
      </Typography>
    </Stack>
  );
}

/** A fatura em formato de documento: usada nos detalhes, na pré-visualização e na impressão. */
export default function InvoiceDocument({ invoice }: { invoice: InvoiceDraft }) {
  const t = totals(invoice.lines, invoice.discount, invoice.tax);
  const status = STATUS[invoice.status];
  return (
    <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <LogoMark size={44} text="C3 Soluções" />
          <Box>
            <Typography variant="h5">{ISSUER.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              CNPJ {ISSUER.document}
            </Typography>
          </Box>
        </Stack>
        <Box sx={{ textAlign: { sm: 'end' } }}>
          <Typography variant="h3" component="p" sx={{ letterSpacing: '0.04em' }}>
            FATURA
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: { sm: 'flex-end' }, mt: 0.5 }}>
            <Typography variant="subtitle1">{invoice.number || 'Sem número'}</Typography>
            <StatusChip label={status.label} tone={status.tone} />
          </Stack>
        </Box>
      </Stack>

      <Grid container spacing={2} sx={{ my: 3 }}>
        {[
          ['Emissão', invoice.issueDate ? shortDate(invoice.issueDate) : '—'],
          ['Vencimento', invoice.dueDate ? shortDate(invoice.dueDate) : '—'],
          ['Valor total', money(t.total)]
        ].map(([label, value]) => (
          <Grid key={label} size={{ xs: 12, sm: 4 }}>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, px: 2, py: 1.25 }}>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="subtitle1">{value}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Block title="De">
            <Typography variant="subtitle2">{ISSUER.name}</Typography>
            <AddressLines address={ISSUER.address} />
            <Typography variant="body2" color="text.secondary">
              {ISSUER.email} · {ISSUER.phone}
            </Typography>
          </Block>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Block title="Cobrar de">
            {invoice.customer ? (
              <>
                <Typography variant="subtitle2">{invoice.customer.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {invoice.customer.document.length > 14 ? 'CNPJ' : 'CPF'} {invoice.customer.document}
                </Typography>
                <AddressLines address={invoice.billing} />
                <Typography variant="body2" color="text.secondary">
                  {invoice.customer.email}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Cliente não selecionado
              </Typography>
            )}
          </Block>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Block title="Entregar em">
            {invoice.customer ? (
              <>
                <Typography variant="subtitle2">{invoice.customer.name}</Typography>
                <AddressLines address={invoice.shipping} />
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                —
              </Typography>
            )}
          </Block>
        </Grid>
      </Grid>

      <ScrollX>
        <Table size="small" sx={{ mt: 3, minWidth: 520 }} aria-label="Itens da fatura">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 40 }}>#</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell align="right">Qtd.</TableCell>
              <TableCell align="right">Preço unit.</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoice.lines.map((l, i) => (
              <TableRow key={l.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{l.description || '—'}</TableCell>
                <TableCell align="right">{l.quantity}</TableCell>
                <TableCell align="right">{money(Number(l.price) || 0)}</TableCell>
                <TableCell align="right">{money((Number(l.quantity) || 0) * (Number(l.price) || 0))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollX>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          {invoice.notes && (
            <Block title="Observações">
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {invoice.notes}
              </Typography>
            </Block>
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={1} sx={{ pt: 1 }}>
            <TotalRow label="Subtotal" value={money(t.subtotal)} />
            <TotalRow label={`Desconto (${invoice.discount || 0}%)`} value={`− ${money(t.discountValue)}`} />
            <TotalRow label={`Impostos (${invoice.tax || 0}%)`} value={money(t.taxValue)} />
            <Divider />
            <TotalRow label="Total" value={money(t.total)} strong />
          </Stack>
        </Grid>
      </Grid>

      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 4, textAlign: 'center' }}>
        Dúvidas sobre esta fatura: {ISSUER.email} · {ISSUER.phone}
      </Typography>
    </Box>
  );
}
