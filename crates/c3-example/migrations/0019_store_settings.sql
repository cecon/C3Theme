-- Configuração da loja: entidade singleton (um registro por filial). O UNIQUE garante a regra também entre duas
-- gravações simultâneas; o motor já responde 409 antes de chegar nele.
CREATE TABLE store_settings (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  org_company_id        INTEGER NOT NULL,
  org_branch_id         INTEGER NOT NULL UNIQUE,
  receipt_footer        TEXT,
  fine_percent          INTEGER,               -- decimal com scale 2
  interest_month_percent INTEGER,              -- decimal com scale 2
  reply_email           TEXT,
  FOREIGN KEY (org_company_id, org_branch_id) REFERENCES branch (org_company_id, id) ON DELETE RESTRICT
);
