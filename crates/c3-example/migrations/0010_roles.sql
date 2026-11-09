-- Perfil de acesso com as permissões marcadas (related with_parent com display checklist): role_permission
-- é a filha que só liga o perfil à permissão, mais a coluna da matriz (pode alterar).
CREATE TABLE permission (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  module TEXT NOT NULL,
  name   TEXT NOT NULL
);

CREATE TABLE role (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE role_permission (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id       INTEGER NOT NULL REFERENCES role (id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permission (id) ON DELETE RESTRICT,
  can_write     INTEGER NOT NULL DEFAULT 0 CHECK (can_write IN (0, 1)),
  UNIQUE (role_id, permission_id)
);

INSERT INTO permission (id, module, name) VALUES
  (1, 'Cadastros', 'Clientes'),
  (2, 'Cadastros', 'Empresas'),
  (3, 'Cadastros', 'Vendedores'),
  (4, 'Vendas', 'Pedidos'),
  (5, 'Vendas', 'Cancelar pedido'),
  (6, 'Vendas', 'Descontos'),
  (7, 'Financeiro', 'Contas a receber'),
  (8, 'Financeiro', 'Fechamento de caixa');
