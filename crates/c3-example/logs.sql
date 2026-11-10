-- Banco à parte do exemplo (`store: "logs"` em request_log.json): o registro das requisições, separado do banco do
-- app por volume e retenção. O motor só lê daqui. Os dois exemplos (Rust e Node) carregam este arquivo na memória.
CREATE TABLE request_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  at          TEXT NOT NULL,
  method      TEXT NOT NULL,
  path        TEXT NOT NULL,
  status      INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  user_name   TEXT
);

INSERT INTO request_log (at, method, path, status, duration_ms, user_name) VALUES
  ('2026-11-01T12:00:00Z', 'GET', '/api/product', 200, 12, 'admin'),
  ('2026-11-01T12:00:05Z', 'POST', '/api/sales_order', 201, 48, 'ana'),
  ('2026-11-01T12:01:10Z', 'PATCH', '/api/customer/7', 422, 9, 'ana'),
  ('2026-11-01T12:02:30Z', 'GET', '/api/_search', 200, 31, 'caio'),
  ('2026-11-01T12:03:00Z', 'DELETE', '/api/product/3', 500, 120, 'admin');
