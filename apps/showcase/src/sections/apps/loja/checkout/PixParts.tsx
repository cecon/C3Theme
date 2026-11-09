// Partes do Pix: QR de exemplo e campo para copiar.
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { Copy } from 'iconsax-reactjs';
import { notify } from '@c3theme/ui';

/** QR "de mentira", mas determinístico: blocos derivados do código Pix. */
export function FakeQr({ seed }: { seed: string }) {
  const n = 21;
  const cells: [number, number][] = [];
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const finder = (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
      h = (h * 1103515245 + 12345) >>> 0;
      if (!finder && (h >> 16) % 2) cells.push([x, y]);
    }
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x + 0.5} y={y + 0.5} width={6} height={6} fill="none" stroke="currentColor" strokeWidth={1} />
      <rect x={x + 2} y={y + 2} width={3} height={3} />
    </g>
  );
  return (
    <Box
      sx={{
        p: 1.5,
        bgcolor: 'common.white',
        color: 'common.black',
        borderRadius: 2,
        width: 180,
        height: 180,
        border: 1,
        borderColor: 'divider'
      }}
    >
      <svg
        viewBox={`0 0 ${n} ${n}`}
        width="100%"
        height="100%"
        shapeRendering="crispEdges"
        fill="currentColor"
        role="img"
        aria-label="QR Code do Pix"
      >
        {cells.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />
        ))}
        {finder(0, 0)}
        {finder(n - 7, 0)}
        {finder(0, n - 7)}
      </svg>
    </Box>
  );
}

export function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" sx={{ gap: 1, width: 1 }}>
      <TextField label={label} value={value} size="small" fullWidth slotProps={{ input: { readOnly: true } }} />
      <Button
        variant="outlined"
        startIcon={<Copy size={16} />}
        sx={{ flexShrink: 0 }}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            notify('Copiado.');
          } catch {
            notify('Não foi possível copiar. Selecione o texto e copie manualmente.', 'warning');
          }
        }}
      >
        Copiar
      </Button>
    </Stack>
  );
}
