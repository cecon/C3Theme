import { lazy, Suspense } from 'react';
import Box from '@mui/material/Box';

export interface QrCodeProps {
  value: string;
  /** Lado em pixels. */
  size?: number;
  /** Nome para o leitor de tela. */
  label: string;
}

// O barril da UI pode ser importado sem baixar o gerador. Só renderizar um QR carrega a biblioteca.
const QrCodeSvg = lazy(() => import('./QrCodeSvg'));

/** QR sob demanda, com espaço reservado enquanto o módulo carrega; o SVG pronto não remonta nas renovações. */
export default function QrCode(props: QrCodeProps) {
  return (
    <Suspense
      fallback={<Box aria-busy="true" aria-label={props.label} sx={{ width: props.size ?? 232, aspectRatio: '1', maxWidth: '100%' }} />}
    >
      <QrCodeSvg {...props} />
    </Suspense>
  );
}
