-- Migration do CRM de exemplo (spec/v0/examples). No motor, migrations são do sistema:
-- o c3-engine só confere no boot que as tabelas e colunas existem.

CREATE TABLE company (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_name TEXT NOT NULL,
  cnpj       TEXT UNIQUE
);

CREATE TABLE customer (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  email        TEXT UNIQUE,
  company_id   INTEGER REFERENCES company (id) ON DELETE RESTRICT,
  status       TEXT NOT NULL CHECK (status IN ('lead', 'active', 'churned')),
  churn_reason TEXT,
  credit_limit INTEGER,                        -- decimal com scale 2: centavos
  birth_date   TEXT,
  vip          INTEGER CHECK (vip IN (0, 1)),
  notes        TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX customer_company_id ON customer (company_id);
