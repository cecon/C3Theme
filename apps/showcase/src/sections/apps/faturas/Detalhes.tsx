import { useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';

// material-ui
import Button from '@mui/material/Button';
import GlobalStyles from '@mui/material/GlobalStyles';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';

// third-party
import { DocumentDownload, Edit2, Printer, TickCircle, Trash } from 'iconsax-reactjs';

import { Breadcrumbs, MessagePage, notify } from '@c3theme/ui';
import ConfirmDialog from './ConfirmDialog';
import { downloadInvoice } from './download';
import InvoiceDocument from './InvoiceDocument';
import { invoiceStore, useInvoice } from './store';

const PRINT_ID = 'fatura-impressao';

/**
 * Na impressão some tudo (menu, header, rodapé, botões) e fica só o documento,
 * em preto no branco mesmo que a tela esteja no modo escuro.
 */
const printStyles = (
  <GlobalStyles
    styles={{
      '@media print': {
        'header.MuiAppBar-root, aside, footer, .no-print': { display: 'none !important' },
        'body *': { visibility: 'hidden' },
        [`#${PRINT_ID}, #${PRINT_ID} *`]: { visibility: 'visible', color: 'black !important', boxShadow: 'none !important' },
        [`#${PRINT_ID}`]: { position: 'absolute', insetInlineStart: 0, top: 0, width: '100%', border: 'none !important' },
        [`#${PRINT_ID}, #${PRINT_ID} .MuiPaper-root, #${PRINT_ID} .MuiTableCell-head`]: { backgroundColor: 'white !important' },
        body: { backgroundColor: 'white !important' }
      }
    }}
  />
);

export default function InvoiceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoice = useInvoice(id);
  const [confirm, setConfirm] = useState(false);

  if (!invoice) {
    return (
      <MessagePage
        title="Fatura não encontrada"
        description="Ela pode ter sido excluída. Os dados de exemplo voltam ao estado inicial quando a página é recarregada."
        action={
          <Button component={RouterLink} to="/apps/faturas/lista" variant="contained">
            Ver faturas
          </Button>
        }
      />
    );
  }

  return (
    <>
      {printStyles}
      <div className="no-print">
        <Breadcrumbs
          links={[{ title: 'Aplicativos' }, { title: 'Faturas', to: '/apps/faturas/lista' }, { title: `Fatura ${invoice.number}` }]}
          action={
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
              {(invoice.status === 'pendente' || invoice.status === 'vencida') && (
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<TickCircle size={18} />}
                  onClick={() => {
                    invoiceStore.markPaid(invoice.id);
                    notify('Fatura marcada como paga.');
                  }}
                >
                  Marcar como paga
                </Button>
              )}
              <Button variant="outlined" startIcon={<Edit2 size={18} />} component={RouterLink} to={`/apps/faturas/${invoice.id}/editar`}>
                Editar
              </Button>
              <Button variant="outlined" startIcon={<Printer size={18} />} onClick={() => window.print()}>
                Imprimir
              </Button>
              <Button
                variant="contained"
                startIcon={<DocumentDownload size={18} />}
                onClick={() => {
                  downloadInvoice(invoice);
                  notify('Arquivo da fatura baixado (HTML).', 'info');
                }}
              >
                Baixar
              </Button>
              <Button color="error" startIcon={<Trash size={18} />} onClick={() => setConfirm(true)}>
                Excluir
              </Button>
            </Stack>
          }
        />
      </div>
      <Paper id={PRINT_ID} variant="outlined" sx={{ borderRadius: 3, maxWidth: 960, mx: 'auto' }}>
        <InvoiceDocument invoice={invoice} />
      </Paper>
      <ConfirmDialog
        open={confirm}
        title="Excluir fatura?"
        description={`A fatura ${invoice.number} será excluída. Essa ação não pode ser desfeita.`}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          invoiceStore.remove([invoice.id]);
          notify('Fatura excluída.');
          navigate('/apps/faturas/lista');
        }}
      />
    </>
  );
}
