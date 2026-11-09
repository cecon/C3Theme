-- Banco do sistema: as migrations são suas, não do motor. No boot, o motor só confere que as tabelas e as colunas
-- das entidades em spec/ existem. Entidade nova = migration nova (0002_..., nunca editar uma que já rodou).

CREATE TABLE contact (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT UNIQUE,
  phone      TEXT,
  status     TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  notes      TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
