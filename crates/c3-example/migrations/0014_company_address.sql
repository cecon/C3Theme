-- Endereço da empresa, preenchido pela consulta de CEP (lookups). A consulta só sugere: o usuário edita e salva.
ALTER TABLE company ADD COLUMN zip_code TEXT;
ALTER TABLE company ADD COLUMN street TEXT;
ALTER TABLE company ADD COLUMN city TEXT;
ALTER TABLE company ADD COLUMN state TEXT;
