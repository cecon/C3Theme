-- Anexo do pedido (`type: file`): a coluna guarda os metadados que a leitura devolve ({ name, size, contentType }
-- em JSON) e os bytes ficam numa tabela à parte, lida só no download (Hooks::read_file).
ALTER TABLE sales_order ADD COLUMN attachment TEXT;
CREATE TABLE sales_order_file (
    order_id INTEGER PRIMARY KEY REFERENCES sales_order (id) ON DELETE CASCADE,
    data BLOB NOT NULL
);
