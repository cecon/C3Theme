-- Parâmetros do sistema: um catálogo em que cada linha tem o seu tipo. `options` guarda, em JSON, a lista de opções
-- do parâmetro (`[{"value": "...", "label": "..."}]`); vazio, o valor é texto livre. É o `optionsFrom` da spec.
CREATE TABLE system_param (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  code    TEXT NOT NULL UNIQUE,
  label   TEXT NOT NULL,
  options TEXT,
  value   TEXT
);

INSERT INTO system_param (code, label, options, value) VALUES
  ('rounding', 'Arredondamento do troco', '[{"value":"none","label":"Não arredonda"},{"value":"5c","label":"Para 5 centavos"},{"value":"10c","label":"Para 10 centavos"}]', 'none'),
  ('receipt_header', 'Cabeçalho do cupom', NULL, 'Obrigado pela preferência');
