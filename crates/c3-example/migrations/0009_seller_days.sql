-- Dias de trabalho do vendedor (type flags): um bit por dia, Dom = 1 ... Sáb = 64.
ALTER TABLE seller ADD COLUMN work_days INTEGER CHECK (work_days BETWEEN 0 AND 127);
