-- Operador com senha (campo writeOnly): gravado pelo escritor do sistema (src/operators.rs), que faz o
-- hash. A coluna guarda o hash, nunca a senha; o motor não lê esta coluna.
CREATE TABLE operator (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  name     TEXT NOT NULL,
  login    TEXT NOT NULL,
  password TEXT NOT NULL
);
