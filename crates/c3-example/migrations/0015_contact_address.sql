-- Endereço do contato: filha with_parent com várias linhas e consulta de CEP no diálogo da linha (como os
-- endereços da pessoa no Nati).
ALTER TABLE company_contact ADD COLUMN zip_code TEXT;
ALTER TABLE company_contact ADD COLUMN street TEXT;
ALTER TABLE company_contact ADD COLUMN city TEXT;
ALTER TABLE company_contact ADD COLUMN state TEXT;
