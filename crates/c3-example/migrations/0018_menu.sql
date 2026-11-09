-- Cardápio (lote 3): produto, pergunta da venda com as opções, perguntas do produto e promoção.
-- Os filhos (opções, perguntas do produto, produtos da promoção) são gravados pelo motor junto com o pai
-- (related com save with_parent); as regras entre as linhas ficam em src/menu.rs.

CREATE TABLE product (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  product_group TEXT NOT NULL CHECK (product_group IN ('dishes', 'sides', 'drinks', 'desserts')),
  price         INTEGER NOT NULL CHECK (price >= 0),  -- decimal com scale 2: centavos
  active        INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

CREATE TABLE question (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  internal_name TEXT NOT NULL UNIQUE,
  prompt        TEXT NOT NULL,
  choice        TEXT NOT NULL CHECK (choice IN ('single', 'multiple')),
  min_choices   INTEGER NOT NULL CHECK (min_choices >= 0),
  max_choices   INTEGER NOT NULL CHECK (max_choices >= 1),
  allow_repeat  INTEGER CHECK (allow_repeat IN (0, 1)),
  active        INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

-- Excluir o produto vinculado não apaga a opção: ela vira só texto.
CREATE TABLE question_option (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES question (id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  name        TEXT NOT NULL,
  product_id  INTEGER REFERENCES product (id) ON DELETE SET NULL,
  extra_price INTEGER CHECK (extra_price >= 0),       -- centavos
  active      INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  UNIQUE (question_id, name)
);
CREATE INDEX question_option_question ON question_option (question_id);

-- A pergunta em uso por um produto não pode ser excluída (RESTRICT vira 409).
CREATE TABLE product_question (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id    INTEGER NOT NULL REFERENCES product (id) ON DELETE CASCADE,
  position      INTEGER NOT NULL,
  question_id   INTEGER NOT NULL REFERENCES question (id) ON DELETE RESTRICT,
  min_choices   INTEGER CHECK (min_choices >= 0),
  max_choices   INTEGER CHECK (max_choices >= 1),
  depends_on_id INTEGER REFERENCES question (id) ON DELETE SET NULL,
  UNIQUE (product_id, question_id)
);
CREATE INDEX product_question_product ON product_question (product_id);

CREATE TABLE promotion (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL,
  kind             TEXT NOT NULL CHECK (kind IN ('buy_x_pay_y', 'percent', 'fixed_price')),
  buy              INTEGER,
  pay              INTEGER,
  discount_percent INTEGER,                           -- decimal com scale 2: 12.50% = 1250
  fixed_price      INTEGER,                           -- centavos
  limit_per_order  INTEGER,
  mix_products     INTEGER NOT NULL DEFAULT 1 CHECK (mix_products IN (0, 1)),
  cheapest_free    INTEGER CHECK (cheapest_free IN (0, 1)),
  stacks           INTEGER NOT NULL DEFAULT 0 CHECK (stacks IN (0, 1)),
  starts_on        TEXT NOT NULL,
  ends_on          TEXT,
  from_time        TEXT,
  to_time          TEXT,
  week_days        INTEGER NOT NULL CHECK (week_days BETWEEN 1 AND 127),
  channels         INTEGER NOT NULL CHECK (channels BETWEEN 1 AND 7),
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended'))
);

CREATE TABLE promotion_product (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  promotion_id INTEGER NOT NULL REFERENCES promotion (id) ON DELETE CASCADE,
  product_id   INTEGER NOT NULL REFERENCES product (id) ON DELETE CASCADE,
  UNIQUE (promotion_id, product_id)
);
CREATE INDEX promotion_product_promotion ON promotion_product (promotion_id);
