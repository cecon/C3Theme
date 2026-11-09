import { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

import { ArtShape, COLORS, ColorId } from './data';

// detalhes por cima da cor do produto: brilho e sombra translúcidos funcionam em qualquer cor
const LIGHT = 'rgba(255,255,255,0.45)';
const SHADE = 'rgba(0,0,0,0.22)';
const LINE = 'rgba(0,0,0,0.18)';

function shape(forma: ArtShape, c: string): ReactNode {
  const common = { fill: c, stroke: LINE, strokeWidth: 2 };
  switch (forma) {
    case 'fone':
      return (
        <>
          <path d="M52 112 V96 a48 48 0 0 1 96 0 V112" fill="none" stroke={c} strokeWidth={12} strokeLinecap="round" />
          <rect x="36" y="100" width="34" height="54" rx="14" {...common} />
          <rect x="130" y="100" width="34" height="54" rx="14" {...common} />
          <rect x="44" y="110" width="10" height="34" rx="5" fill={LIGHT} />
          <rect x="146" y="110" width="10" height="34" rx="5" fill={SHADE} />
        </>
      );
    case 'relogio':
      return (
        <>
          <rect x="80" y="30" width="40" height="140" rx="12" {...common} />
          <rect x="80" y="30" width="40" height="140" rx="12" fill={SHADE} />
          <circle cx="100" cy="100" r="40" {...common} />
          <circle cx="100" cy="100" r="31" fill="rgba(20,24,30,0.85)" />
          <path d="M100 100 V78 M100 100 L114 108" stroke="rgba(255,255,255,0.9)" strokeWidth={4} strokeLinecap="round" />
        </>
      );
    case 'tenis':
      return (
        <>
          <path
            d="M34 128 C40 96 60 82 78 86 L96 100 C110 108 130 112 156 114 C170 116 172 132 166 140 H38 C32 140 32 134 34 128 Z"
            {...common}
          />
          <rect x="30" y="138" width="142" height="14" rx="7" fill="#f4f4f4" stroke={LINE} strokeWidth={2} />
          <path d="M80 96 l8 -8 M92 104 l8 -8 M104 110 l8 -8" stroke={LIGHT} strokeWidth={4} strokeLinecap="round" />
          <path d="M120 124 C134 126 148 126 160 128" stroke={SHADE} strokeWidth={4} fill="none" strokeLinecap="round" />
        </>
      );
    case 'camiseta':
      return (
        <>
          <path
            d="M70 40 L40 56 L26 92 L50 100 L56 84 V164 H144 V84 L150 100 L174 92 L160 56 L130 40 C124 52 112 58 100 58 C88 58 76 52 70 40 Z"
            {...common}
          />
          <path d="M70 40 C76 52 88 58 100 58 C112 58 124 52 130 40" fill="none" stroke={SHADE} strokeWidth={5} />
          <rect x="112" y="88" width="18" height="20" rx="3" fill={LIGHT} />
        </>
      );
    case 'mochila':
      return (
        <>
          <path d="M80 50 a20 20 0 0 1 40 0" fill="none" stroke={c} strokeWidth={8} />
          <rect x="48" y="48" width="104" height="122" rx="26" {...common} />
          <rect x="64" y="110" width="72" height="46" rx="12" fill={SHADE} />
          <rect x="70" y="70" width="60" height="8" rx="4" fill={LIGHT} />
        </>
      );
    case 'caneca':
      return (
        <>
          <path d="M84 30 c-8 10 8 14 0 24 M104 26 c-8 10 8 14 0 24" stroke={LINE} strokeWidth={4} fill="none" strokeLinecap="round" />
          <circle cx="146" cy="110" r="24" fill="none" stroke={c} strokeWidth={12} />
          <rect x="50" y="64" width="90" height="104" rx="14" {...common} />
          <rect x="60" y="74" width="12" height="84" rx="6" fill={LIGHT} />
        </>
      );
    case 'luminaria':
      return (
        <>
          <ellipse cx="70" cy="164" rx="40" ry="10" {...common} />
          <path d="M70 160 L96 96 L60 60" fill="none" stroke={c} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M60 60 L100 34 L136 72 L96 98 Z" {...common} />
          <path d="M116 85 L150 150 L60 150 Z" fill={c} opacity={0.18} />
          <circle cx="96" cy="96" r="7" fill={SHADE} />
        </>
      );
    case 'oculos':
      return (
        <>
          <path d="M28 92 L16 84 M172 92 L184 84" stroke={c} strokeWidth={6} strokeLinecap="round" />
          <rect x="26" y="78" width="66" height="50" rx="22" {...common} />
          <rect x="108" y="78" width="66" height="50" rx="22" {...common} />
          <rect x="34" y="86" width="50" height="34" rx="16" fill="rgba(20,24,30,0.8)" />
          <rect x="116" y="86" width="50" height="34" rx="16" fill="rgba(20,24,30,0.8)" />
          <path d="M92 94 C96 86 104 86 108 94" stroke={c} strokeWidth={6} fill="none" />
          <path d="M42 92 l14 -2" stroke={LIGHT} strokeWidth={4} strokeLinecap="round" />
        </>
      );
    case 'garrafa':
      return (
        <>
          <rect x="84" y="24" width="32" height="22" rx="6" fill="rgba(30,34,40,0.85)" />
          <path d="M80 46 H120 L132 72 V164 a12 12 0 0 1 -12 12 H80 a12 12 0 0 1 -12 -12 V72 Z" {...common} />
          <path d="M84 90 H96 M84 110 H96 M84 130 H96 M84 150 H96" stroke={LIGHT} strokeWidth={4} strokeLinecap="round" />
          <rect x="112" y="80" width="10" height="80" rx="5" fill={SHADE} />
        </>
      );
    case 'teclado':
      return (
        <>
          <rect x="20" y="66" width="160" height="72" rx="12" {...common} />
          {Array.from({ length: 3 }, (_, r) =>
            Array.from({ length: 9 }, (_, k) => (
              <rect
                key={`${r}-${k}`}
                x={30 + k * 16}
                y={76 + r * 16}
                width="12"
                height="12"
                rx="3"
                fill={r === 1 && k === 4 ? LIGHT : SHADE}
              />
            ))
          )}
          <rect x="62" y="124" width="76" height="8" rx="3" fill={LIGHT} />
        </>
      );
    case 'bola':
      return (
        <>
          <circle cx="100" cy="100" r="62" {...common} />
          <path d="M100 76 L122 92 L114 118 H86 L78 92 Z" fill="rgba(30,34,40,0.85)" />
          <path
            d="M100 76 V44 M122 92 L152 82 M114 118 L132 146 M86 118 L68 146 M78 92 L48 82"
            stroke="rgba(30,34,40,0.5)"
            strokeWidth={3}
          />
          <circle cx="76" cy="64" r="10" fill={LIGHT} />
        </>
      );
    case 'vaso':
      return (
        <>
          <ellipse cx="80" cy="56" rx="12" ry="28" fill="#4f9d69" transform="rotate(-25 80 56)" />
          <ellipse cx="120" cy="52" rx="12" ry="30" fill="#3f8a5a" transform="rotate(20 120 52)" />
          <ellipse cx="100" cy="46" rx="10" ry="30" fill="#5cb07a" />
          <path d="M58 84 H142 L130 164 a10 10 0 0 1 -10 8 H80 a10 10 0 0 1 -10 -8 Z" {...common} />
          <rect x="54" y="78" width="92" height="14" rx="6" fill={c} stroke={LINE} strokeWidth={2} />
          <path d="M70 110 H130" stroke={LIGHT} strokeWidth={5} strokeLinecap="round" />
        </>
      );
    case 'bone':
      return (
        <>
          <path d="M40 124 a60 60 0 0 1 120 0 Z" {...common} />
          <path d="M120 120 C150 116 176 124 182 136 C160 140 130 136 110 128 Z" fill={c} stroke={LINE} strokeWidth={2} />
          <path d="M100 66 V124 M70 76 C80 96 82 110 82 124 M130 76 C120 96 118 110 118 124" stroke={SHADE} strokeWidth={3} fill="none" />
          <circle cx="100" cy="64" r="5" fill={SHADE} />
        </>
      );
    case 'caixaSom':
      return (
        <>
          <rect x="40" y="56" width="120" height="100" rx="30" {...common} />
          <circle cx="76" cy="106" r="22" fill={SHADE} />
          <circle cx="124" cy="106" r="22" fill={SHADE} />
          <circle cx="76" cy="106" r="9" fill={LIGHT} />
          <circle cx="124" cy="106" r="9" fill={LIGHT} />
          <rect x="84" y="64" width="32" height="6" rx="3" fill={LIGHT} />
        </>
      );
    case 'tapete':
      return (
        <>
          <path d="M30 140 L150 96 L170 120 L50 164 Z" {...common} />
          <circle cx="150" cy="96" r="24" {...common} />
          <circle cx="150" cy="96" r="12" fill={SHADE} />
          <path d="M58 146 L150 112" stroke={LIGHT} strokeWidth={4} strokeLinecap="round" />
        </>
      );
  }
}

// cada "foto" da galeria é a mesma peça vista de outro jeito
const VIEWS = ['', 'rotate(-12 100 100)', 'translate(-40 -40) scale(1.4)', 'translate(15 15) scale(0.85)'];
const BACKDROPS = ['primary', 'info', 'success', 'warning'] as const;

interface Props {
  forma: ArtShape;
  cor: ColorId;
  /** Ângulo/fundo: 0 a 3. */
  view?: number;
  /** Foto real enviada no cadastro; tem prioridade sobre o desenho. */
  src?: string;
  alt: string;
  sx?: SxProps<Theme>;
}

/** Ilustração vetorial do produto (ou a foto enviada), sempre quadrada. */
export default function ProductArt({ forma, cor, view = 0, src, alt, sx }: Props) {
  const backdrop = BACKDROPS[view % BACKDROPS.length];
  return (
    <Box
      sx={[
        (theme) => ({
          position: 'relative',
          aspectRatio: '1 / 1',
          width: 1,
          overflow: 'hidden',
          borderRadius: 2,
          bgcolor: `rgb(${theme.vars.palette[backdrop].mainChannel} / 0.08)`,
          ...theme.applyStyles('dark', { bgcolor: `rgb(${theme.vars.palette[backdrop].mainChannel} / 0.14)` }),
          '& > svg, & > img': { position: 'absolute', inset: 0, width: 1, height: 1, objectFit: 'cover' }
        }),
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
    >
      {src ? (
        <img src={src} alt={alt} />
      ) : (
        <svg viewBox="0 0 200 200" role="img" aria-label={alt}>
          <ellipse cx="100" cy="176" rx="64" ry="8" fill="rgba(0,0,0,0.08)" />
          <g transform={VIEWS[view % VIEWS.length]}>{shape(forma, COLORS[cor].hex)}</g>
        </svg>
      )}
    </Box>
  );
}
