-- Auditoria do pedido, gravada pelo escritor do próprio sistema (src/orders.rs) na transação da escrita:
-- o pedido mostra a escrita delegada (Hooks::delegates_writes), o padrão de quem tem escritor único.
CREATE TABLE audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  entity     TEXT NOT NULL,
  record_id  INTEGER NOT NULL,
  op         TEXT NOT NULL CHECK (op IN ('create', 'update', 'delete')),
  before     TEXT,
  after      TEXT,
  user_name  TEXT,
  at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
