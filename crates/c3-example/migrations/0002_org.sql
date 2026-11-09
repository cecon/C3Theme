-- Empresa e filial (app.organization) e duas entidades por filial, para a suíte de conformidade
-- testar o escopo. O grupo econômico é este banco inteiro.

CREATE TABLE org_company (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL,
  cnpj_root TEXT NOT NULL UNIQUE
);

-- scope company: a empresa dona é a coluna reservada org_company_id
CREATE TABLE branch (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  org_company_id INTEGER NOT NULL REFERENCES org_company (id) ON DELETE RESTRICT,
  name           TEXT NOT NULL,
  cnpj           TEXT NOT NULL,
  UNIQUE (org_company_id, cnpj),
  UNIQUE (org_company_id, id)                  -- alvo da FK composta abaixo
);

-- scope branch: org_company_id + org_branch_id; a FK composta impede filial de outra empresa
CREATE TABLE seller (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  org_company_id INTEGER NOT NULL,
  org_branch_id  INTEGER NOT NULL,
  name           TEXT NOT NULL,
  FOREIGN KEY (org_company_id, org_branch_id) REFERENCES branch (org_company_id, id) ON DELETE RESTRICT
);
CREATE INDEX seller_branch ON seller (org_branch_id);

CREATE TABLE sales_order (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  org_company_id INTEGER NOT NULL,
  org_branch_id  INTEGER NOT NULL,
  number         INTEGER NOT NULL,
  description    TEXT NOT NULL,
  customer_id    INTEGER REFERENCES customer (id) ON DELETE RESTRICT,
  seller_id      INTEGER REFERENCES seller (id) ON DELETE RESTRICT,
  total          INTEGER,                      -- decimal com scale 2: centavos
  UNIQUE (org_branch_id, number),              -- número único por filial, não no grupo
  FOREIGN KEY (org_company_id, org_branch_id) REFERENCES branch (org_company_id, id) ON DELETE RESTRICT
);

-- Dados fixos da suíte (spec/v0/conformance/README.md): duas empresas, três filiais.
INSERT INTO org_company (id, name, cnpj_root) VALUES
  (1, 'Alfa Combustíveis', '11111111'),
  (2, 'Beta Conveniência', '22222222');
INSERT INTO branch (id, org_company_id, name, cnpj) VALUES
  (1, 1, 'Alfa Matriz', '11111111000191'),
  (2, 1, 'Alfa Centro', '11111111000272'),
  (3, 2, 'Beta Loja 1', '22222222000101');
