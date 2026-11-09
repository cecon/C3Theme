import { useMemo, useState } from 'react';

import { ConfirmDialog, notify } from '@c3theme/ui';
import CustomerDetailsDialog from './CustomerDetails';
import CustomerFormDialog from './CustomerFormDialog';
import type { Customer } from './data';
import { useCustomers } from './store';

/** Diálogos de cadastro, detalhes e exclusão compartilhados pela tabela e pelos cartões. */
export default function useCustomerDialogs(onDeleted?: (ids: number[]) => void) {
  const { remove } = useCustomers();
  const [form, setForm] = useState<{ open: boolean; customer?: Customer }>({ open: false });
  const [viewing, setViewing] = useState<Customer>();
  const [deleting, setDeleting] = useState<Customer[]>([]);
  // separado da lista para o texto não mudar durante a animação de saída
  const [deleteOpen, setDeleteOpen] = useState(false);

  const confirmDelete = () => {
    const ids = deleting.map((c) => c.id);
    remove(ids);
    onDeleted?.(ids);
    notify(ids.length === 1 ? 'Cliente excluído.' : `${ids.length} clientes excluídos.`);
  };

  const dialogs = (
    <>
      <CustomerFormDialog open={form.open} customer={form.customer} onClose={() => setForm((f) => ({ ...f, open: false }))} />
      <CustomerDetailsDialog
        customer={viewing}
        onClose={() => setViewing(undefined)}
        onEdit={(c) => {
          setViewing(undefined);
          setForm({ open: true, customer: c });
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        title={deleting.length === 1 ? 'Excluir cliente?' : `Excluir ${deleting.length} clientes?`}
        description={
          deleting.length === 1 ? (
            <>
              <b>{deleting[0].nome}</b> e o histórico dele serão removidos. Essa ação não pode ser desfeita.
            </>
          ) : (
            'Os clientes selecionados serão removidos. Essa ação não pode ser desfeita.'
          )
        }
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </>
  );

  // ações estáveis: entram nas dependências das colunas da tabela
  const actions = useMemo(
    () => ({
      create: () => setForm({ open: true }),
      edit: (customer: Customer) => setForm({ open: true, customer }),
      view: (customer: Customer) => setViewing(customer),
      askDelete: (list: Customer[]) => {
        setDeleting(list);
        setDeleteOpen(true);
      }
    }),
    []
  );

  return { dialogs, ...actions };
}
