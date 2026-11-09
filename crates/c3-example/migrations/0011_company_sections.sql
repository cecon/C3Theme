-- Seções condicionais (visibleWhen na seção): dados fiscais só de contribuinte, aba Fornecedor só de quem é
-- fornecedor. Seção escondida grava null nos campos dela e lista vazia na filha.
ALTER TABLE company ADD COLUMN taxpayer INTEGER NOT NULL DEFAULT 1 CHECK (taxpayer IN (0, 1));
ALTER TABLE company ADD COLUMN is_supplier INTEGER NOT NULL DEFAULT 0 CHECK (is_supplier IN (0, 1));
ALTER TABLE company ADD COLUMN supplier_terms INTEGER;
