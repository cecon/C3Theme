import qrcode from 'qrcode-generator';

// Adaptador do gerador de QR (qrcode-generator, MIT): o resto do pacote só conhece a matriz de módulos e o caminho
// SVG, então trocar a biblioteca mexe só aqui. Tudo roda no cliente, sem rede.

/** Matriz quadrada do QR: `true` é módulo escuro. Vazia para texto vazio. */
export type QrModules = boolean[][];

/** UTF-8 como "string binária": o modo Byte do gerador só guarda o byte baixo de cada caractere. */
const utf8Binary = (text: string) => String.fromCharCode(...new TextEncoder().encode(text));

/** Módulos do QR para `text`, com correção de erro M (aguenta ~15% de dano: reflexo na tela, câmera ruim). */
export function qrModules(text: string): QrModules {
  if (!text) return [];
  const code = qrcode(0, 'M');
  code.addData(utf8Binary(text), 'Byte');
  code.make();
  const size = code.getModuleCount();
  return Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, col) => code.isDark(row, col)));
}

/**
 * Caminho SVG com os módulos escuros, deslocado por `quiet` módulos de margem. Junta os módulos vizinhos da mesma
 * linha num retângulo só: o caminho fica menor e não aparecem frestas entre módulos no antialiasing.
 */
export function qrPath(modules: QrModules, quiet = 0): string {
  const parts: string[] = [];
  modules.forEach((line, row) => {
    let col = 0;
    while (col < line.length) {
      if (!line[col]) {
        col += 1;
        continue;
      }
      const start = col;
      while (col < line.length && line[col]) col += 1;
      parts.push(`M${start + quiet} ${row + quiet}h${col - start}v1h${start - col}z`);
    }
  });
  return parts.join('');
}
