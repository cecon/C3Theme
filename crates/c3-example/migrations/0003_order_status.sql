-- Situação do pedido: só muda pela ação "cancel" (readOnly no JSON), nunca pelo CRUD.
ALTER TABLE sales_order ADD COLUMN status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'canceled'));
ALTER TABLE sales_order ADD COLUMN cancel_reason TEXT;
