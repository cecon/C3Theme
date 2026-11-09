import { memo, useMemo, type ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { parseMarkdown, type MdBlock, type MdInline } from '../core/markdown';

const HEADING_VARIANT = { 1: 'h5', 2: 'h6', 3: 'subtitle1', 4: 'subtitle2', 5: 'subtitle2', 6: 'subtitle2' } as const;
const mono = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

function Inline({ nodes }: { nodes: MdInline[] }) {
  return nodes.map((n, i): ReactNode => {
    switch (n.t) {
      case 'text':
        return n.v;
      case 'br':
        return <br key={i} />;
      case 'code':
        return (
          <Box
            key={i}
            component="code"
            sx={{ fontFamily: mono, fontSize: '0.875em', px: 0.5, py: 0.125, borderRadius: 1, bgcolor: 'action.selected' }}
          >
            {n.v}
          </Box>
        );
      case 'strong':
        return (
          <Box key={i} component="strong" sx={{ fontWeight: 600 }}>
            <Inline nodes={n.c} />
          </Box>
        );
      case 'em':
        return (
          <em key={i}>
            <Inline nodes={n.c} />
          </em>
        );
      case 'del':
        return (
          <del key={i}>
            <Inline nodes={n.c} />
          </del>
        );
      case 'link':
        return (
          <Link key={i} href={n.href} target="_blank" rel="noopener noreferrer" color="inherit" sx={{ fontWeight: 500 }}>
            <Inline nodes={n.c} />
          </Link>
        );
    }
  });
}

const cellSx = { px: 1, py: 0.5, borderBottom: 1, borderColor: 'divider', verticalAlign: 'top', overflowWrap: 'normal' } as const;

function Block({ b }: { b: MdBlock }): ReactNode {
  switch (b.t) {
    case 'p':
      return (
        <Typography variant="body2" component="p" sx={{ color: 'inherit' }}>
          <Inline nodes={b.c} />
        </Typography>
      );
    case 'h':
      return (
        <Typography variant={HEADING_VARIANT[b.level]} component={`h${Math.min(b.level + 2, 6)}` as 'h3'} sx={{ color: 'inherit' }}>
          <Inline nodes={b.c} />
        </Typography>
      );
    case 'hr':
      return <Divider />;
    case 'code':
      return (
        <Box
          component="pre"
          data-lang={b.lang || undefined}
          sx={{
            m: 0,
            p: 1.5,
            borderRadius: 2,
            overflowX: 'auto',
            bgcolor: 'action.hover',
            fontFamily: mono,
            fontSize: 13,
            lineHeight: 1.5
          }}
        >
          <code>{b.v}</code>
        </Box>
      );
    case 'quote':
      return (
        <Box component="blockquote" sx={{ m: 0, pl: 1.5, borderInlineStart: 3, borderColor: 'divider', color: 'text.secondary' }}>
          <Blocks blocks={b.c} />
        </Box>
      );
    case 'list':
      return (
        <Box
          component={b.ordered ? 'ol' : 'ul'}
          start={b.ordered && b.start !== 1 ? b.start : undefined}
          sx={{ m: 0, pl: 2.5, '& > li + li': { mt: 0.25 } }}
        >
          {b.items.map((item, i) => (
            <Typography key={i} component="li" variant="body2" sx={{ color: 'inherit' }}>
              <Blocks blocks={item} tight />
            </Typography>
          ))}
        </Box>
      );
    case 'table':
      return (
        <Box sx={{ overflowX: 'auto', maxWidth: '100%' }}>
          <Box component="table" sx={{ borderCollapse: 'collapse', fontSize: 14, minWidth: '60%' }}>
            <thead>
              <tr>
                {b.head.map((h, c) => (
                  <Box key={c} component="th" sx={{ ...cellSx, fontWeight: 600, whiteSpace: 'nowrap', textAlign: b.align[c] ?? 'start' }}>
                    <Inline nodes={h} />
                  </Box>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <Box key={c} component="td" sx={{ ...cellSx, textAlign: b.align[c] ?? 'start' }}>
                      <Inline nodes={cell} />
                    </Box>
                  ))}
                </tr>
              ))}
            </tbody>
          </Box>
        </Box>
      );
  }
}

function Blocks({ blocks, tight }: { blocks: MdBlock[]; tight?: boolean }) {
  // item de lista com um parágrafo só: sem margem (lista compacta)
  if (tight && blocks.length === 1 && blocks[0].t === 'p') return <Inline nodes={blocks[0].c} />;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
      {blocks.map((b, i) => (
        <Block key={i} b={b} />
      ))}
    </Box>
  );
}

export interface MarkdownProps {
  text: string;
}

/**
 * Markdown seguro: vira elementos React a partir de uma árvore pura (sem `innerHTML`), então HTML na resposta
 * aparece como texto e link só abre `http`, `https`, `mailto`, `tel` ou caminho do próprio sistema.
 */
function Markdown({ text }: MarkdownProps) {
  const blocks = useMemo(() => parseMarkdown(text), [text]);
  return <Blocks blocks={blocks} />;
}

export default memo(Markdown);
