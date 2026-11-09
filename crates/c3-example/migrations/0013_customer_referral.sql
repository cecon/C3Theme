-- Filtro no reference: "indicado por" só oferece outro cliente da mesma empresa (filter com $field).
ALTER TABLE customer ADD COLUMN referred_by INTEGER REFERENCES customer (id) ON DELETE SET NULL;
