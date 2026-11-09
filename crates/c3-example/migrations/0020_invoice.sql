-- Fatura de vários pedidos: a ação em conjunto (bulk "together") grava uma fatura só com a soma dos pedidos
-- marcados e liga cada um a ela, na mesma transação.
CREATE TABLE invoice (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  org_company_id INTEGER NOT NULL REFERENCES org_company (id),
  total          INTEGER NOT NULL,             -- centavos
  due_date       TEXT NOT NULL,
  orders         INTEGER NOT NULL
);
ALTER TABLE sales_order ADD COLUMN invoice INTEGER REFERENCES invoice (id);
