-- Mesas do salão: exemplo de views.map com coordenadas (x, y) e de live (a planta acompanha quem abre e fecha mesa).
CREATE TABLE dining_table (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  name   TEXT NOT NULL UNIQUE,
  area   TEXT NOT NULL CHECK (area IN ('hall', 'porch')),
  seats  INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'busy', 'bill', 'blocked')),
  x      INTEGER,
  y      INTEGER,
  w      INTEGER
);

INSERT INTO dining_table (name, area, seats, status, x, y, w) VALUES
  ('Mesa 1', 'hall', 4, 'free', 1, 1, NULL),
  ('Mesa 2', 'hall', 4, 'busy', 2, 1, NULL),
  ('Mesa 3', 'hall', 2, 'bill', 3, 1, NULL),
  ('Mesa 4', 'hall', 8, 'busy', 1, 2, 2),
  ('Mesa 5', 'hall', 2, 'free', 3, 2, NULL),
  ('Mesa 6', 'porch', 4, 'free', 5, 1, NULL),
  ('Mesa 7', 'porch', 4, 'blocked', 5, 2, NULL),
  ('Mesa 8', 'porch', 6, 'free', NULL, NULL, NULL);
