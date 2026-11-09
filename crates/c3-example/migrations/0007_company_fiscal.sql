-- Filha de uma linha só (related with_parent com maxItems 1): dados fiscais da empresa, mostrados como
-- campos na aba Fiscal. O UNIQUE garante no banco o que o maxItems garante no motor.
CREATE TABLE company_fiscal (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id         INTEGER NOT NULL UNIQUE REFERENCES company (id) ON DELETE CASCADE,
  tax_regime         TEXT NOT NULL CHECK (tax_regime IN ('simples', 'presumido', 'real')),
  state_registration TEXT,
  municipal_registration TEXT
);
