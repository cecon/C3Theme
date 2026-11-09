-- Atividades de follow-up: exemplo de views.board (por etapa) e views.calendar (pelo prazo).
CREATE TABLE activity (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  subject     TEXT NOT NULL,
  customer_id INTEGER REFERENCES customer (id) ON DELETE RESTRICT,
  stage       TEXT NOT NULL CHECK (stage IN ('todo', 'doing', 'done', 'dropped')),
  due_date    TEXT NOT NULL,
  notes       TEXT
);

CREATE INDEX activity_due_date ON activity (due_date);
