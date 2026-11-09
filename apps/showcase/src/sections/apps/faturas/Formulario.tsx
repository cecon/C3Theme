import { useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye } from 'iconsax-reactjs';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { Breadcrumbs, MessagePage, notify } from '@c3theme/ui';
import { Customer, Invoice } from './data';
import DateProvider from './DateProvider';
import { AddressDialog, CustomerDialog } from './dialogs';
import InvoiceDocument, { InvoiceDraft } from './InvoiceDocument';
import { invoiceStore, useInvoice } from './store';
import { EMPTY_ADDRESS, iso, schema, toDraft, toForm } from './formulario/schema';
import type { FormInput, FormOutput } from './formulario/schema';
import { PartiesPanel } from './formulario/PartiesPanel';
import { HeaderPanel } from './formulario/HeaderPanel';
import { LinesPanel } from './formulario/LinesPanel';
import { SummaryPanels } from './formulario/SummaryPanels';

function InvoiceForm({ invoice }: { invoice?: Invoice }) {
  const navigate = useNavigate();
  const editing = !!invoice;
  const id = invoice?.id ?? invoiceStore.nextId();
  const [customerOpen, setCustomerOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState<'billing' | 'shipping' | null>(null);
  const [preview, setPreview] = useState<InvoiceDraft | null>(null);
  const fullScreen = useMediaQuery((t: Theme) => t.breakpoints.down('md'));

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: toForm(invoice, `FAT-${new Date().getFullYear()}-${id}`),
    mode: 'onTouched'
  });
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { isSubmitting }
  } = form;
  const [customer, billing, shipping] = useWatch({ control, name: ['customer', 'billing', 'shipping'] });

  const selectCustomer = (c: Customer) => {
    setValue('customer', c, { shouldValidate: true, shouldDirty: true });
    setValue('billing', c.address, { shouldDirty: true });
    setValue('shipping', c.address, { shouldDirty: true });
  };

  const onSubmit = async (v: FormOutput) => {
    await new Promise((r) => setTimeout(r, 400)); // simula a gravação
    const saved: Invoice = { ...v, id, issueDate: iso(v.issueDate), dueDate: iso(v.dueDate), notes: v.notes.trim() };
    invoiceStore.save(saved);
    notify(editing ? 'Fatura atualizada.' : 'Fatura criada.');
    navigate(`/apps/faturas/${id}`);
  };

  const onInvalid = () => notify('Confira os campos destacados.', 'error');

  return (
    <DateProvider>
      <FormProvider {...form}>
        <Stack component="form" spacing={3} onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
          <HeaderPanel />

          <PartiesPanel onPickCustomer={() => setCustomerOpen(true)} onEditAddress={setAddressOpen} />

          <LinesPanel />

          <SummaryPanels />

          <Stack direction={{ xs: 'column-reverse', sm: 'row' }} sx={{ justifyContent: 'flex-end', gap: 1.5 }}>
            <Button component={RouterLink} to={editing ? `/apps/faturas/${id}` : '/apps/faturas/lista'} color="inherit">
              Cancelar
            </Button>
            <Button variant="outlined" startIcon={<Eye size={18} />} onClick={() => setPreview(toDraft(getValues()))}>
              Pré-visualizar
            </Button>
            <Button type="submit" variant="contained" loading={isSubmitting}>
              {editing ? 'Salvar alterações' : 'Criar fatura'}
            </Button>
          </Stack>
        </Stack>
      </FormProvider>

      <CustomerDialog open={customerOpen} selectedId={customer?.id} onClose={() => setCustomerOpen(false)} onSelect={selectCustomer} />
      <AddressDialog
        open={addressOpen !== null}
        title={addressOpen === 'shipping' ? 'Endereço de entrega' : 'Endereço de cobrança'}
        value={(addressOpen === 'shipping' ? shipping : billing) ?? EMPTY_ADDRESS}
        onClose={() => setAddressOpen(null)}
        onSave={(a) => addressOpen && setValue(addressOpen, a, { shouldDirty: true })}
      />
      <Dialog open={preview !== null} onClose={() => setPreview(null)} fullWidth maxWidth="md" fullScreen={fullScreen} scroll="paper">
        <DialogTitle>Pré-visualização</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {preview && <InvoiceDocument invoice={preview} />}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setPreview(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </DateProvider>
  );
}

/** Rota de criação (`nova`) e de edição (`:id/editar`). */
export default function InvoiceFormPage() {
  const { id } = useParams();
  const invoice = useInvoice(id);
  if (id && !invoice) {
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
      {invoice && (
        <Breadcrumbs
          links={[
            { title: 'Aplicativos' },
            { title: 'Faturas', to: '/apps/faturas/lista' },
            { title: invoice.number, to: `/apps/faturas/${invoice.id}` },
            { title: 'Editar fatura' }
          ]}
        />
      )}
      <InvoiceForm key={id ?? 'nova'} invoice={invoice} />
    </>
  );
}
