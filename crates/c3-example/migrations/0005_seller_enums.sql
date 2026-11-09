-- Enums com o valor como um sistema legado grava: texto em maiúsculas com espaço e código inteiro.
ALTER TABLE seller ADD COLUMN channel TEXT CHECK (channel IN ('LOJA', 'PISTA', 'TELE VENDAS'));
ALTER TABLE seller ADD COLUMN commission_rule INTEGER CHECK (commission_rule IN (0, 1, 2));
