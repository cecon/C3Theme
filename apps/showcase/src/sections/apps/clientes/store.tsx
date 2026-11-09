import { createContext, ReactNode, useContext, useMemo, useReducer } from 'react';
import { Outlet } from 'react-router';

import { Customer, SEED_CUSTOMERS } from './data';

type Action = { type: 'salvar'; customer: Customer } | { type: 'excluir'; ids: number[] };

function reducer(state: Customer[], action: Action): Customer[] {
  switch (action.type) {
    case 'salvar': {
      const exists = state.some((c) => c.id === action.customer.id);
      return exists ? state.map((c) => (c.id === action.customer.id ? action.customer : c)) : [action.customer, ...state];
    }
    case 'excluir':
      return state.filter((c) => !action.ids.includes(c.id));
  }
}

interface CustomersApi {
  customers: Customer[];
  save: (customer: Customer) => void;
  remove: (ids: number[]) => void;
  nextId: () => number;
}

const CustomersContext = createContext<CustomersApi | null>(null);

function CustomersProvider({ children }: { children: ReactNode }) {
  const [customers, dispatch] = useReducer(reducer, SEED_CUSTOMERS);
  const api = useMemo<CustomersApi>(
    () => ({
      customers,
      save: (customer) => dispatch({ type: 'salvar', customer }),
      remove: (ids) => dispatch({ type: 'excluir', ids }),
      nextId: () => customers.reduce((max, c) => Math.max(max, c.id), 0) + 1
    }),
    [customers]
  );
  return <CustomersContext value={api}>{children}</CustomersContext>;
}

export function useCustomers() {
  const ctx = useContext(CustomersContext);
  if (!ctx) throw new Error('useCustomers fora do CustomersProvider');
  return ctx;
}

/** Rota-mãe das telas de clientes: a lista e os cartões compartilham os mesmos dados em memória. */
export default function ClientesLayout() {
  return (
    <CustomersProvider>
      <Outlet />
    </CustomersProvider>
  );
}
