-- Certificado A1 do emitente: o motor nunca grava o arquivo; a ação "Trocar certificado" entrega o .pfx e a
-- senha ao sistema, que confere e guarda. Aqui o exemplo guarda só a descrição (nome e tamanho).
ALTER TABLE company ADD COLUMN certificate TEXT;
