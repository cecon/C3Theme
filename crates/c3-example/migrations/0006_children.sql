-- Filhos gravados junto com o pai (related com save with_parent). O motor apaga os filhos antes do pai;
-- o CASCADE é só a garantia do banco.

-- Gravado pelo motor, na transação da empresa. E-mail não repete dentro da mesma empresa.
CREATE TABLE company_contact (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES company (id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT,
  main       INTEGER NOT NULL DEFAULT 0 CHECK (main IN (0, 1)),
  UNIQUE (company_id, email)
);

-- Gravado pelo escritor do pedido (src/items.rs), com auditoria. Mesma filial do pedido.
CREATE TABLE sales_order_item (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  org_company_id INTEGER NOT NULL,
  org_branch_id  INTEGER NOT NULL,
  order_id       INTEGER NOT NULL REFERENCES sales_order (id) ON DELETE CASCADE,
  product        TEXT NOT NULL,
  quantity       INTEGER NOT NULL CHECK (quantity >= 1),
  unit_price     INTEGER,                      -- decimal com scale 2: centavos
  FOREIGN KEY (org_company_id, org_branch_id) REFERENCES branch (org_company_id, id) ON DELETE RESTRICT
);
CREATE INDEX sales_order_item_order ON sales_order_item (order_id);
