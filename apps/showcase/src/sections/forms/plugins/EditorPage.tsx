import { useMemo, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';

// third-party
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

import { notify, Panel } from '@c3theme/ui';

const INICIAL = `<h2>Ata da reunião de planejamento</h2><p>Participantes: <strong>Ana</strong>, <strong>Bruno</strong> e <strong>Carla</strong>.</p><ol><li>Revisar as metas do trimestre</li><li>Definir o calendário de entregas</li><li>Escolher o fornecedor de logística</li></ol><blockquote>Próxima reunião na segunda-feira, às 9h.</blockquote><p>Mais detalhes no <a href="https://cecon.github.io/C3Theme/" target="_blank">portal interno</a>.</p>`;

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
  [{ align: [] }],
  ['blockquote', 'code-block', 'link'],
  ['clean']
];

/** Cores do Quill trocadas pelas do tema, para ficar legível no claro e no escuro. */
const quillSx = (theme: Theme) => {
  const p = theme.vars.palette;
  return {
    '& .ql-toolbar.ql-snow': {
      border: 1,
      borderColor: 'divider',
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      bgcolor: 'action.hover',
      fontFamily: 'inherit'
    },
    '& .ql-container.ql-snow': {
      border: 1,
      borderTop: 0,
      borderColor: 'divider',
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      fontFamily: 'inherit',
      fontSize: theme.typography.body1.fontSize
    },
    '& .ql-editor': { minHeight: 280, color: p.text.primary },
    '& .ql-editor.ql-blank::before': { color: p.text.disabled, fontStyle: 'normal' },
    '& .ql-snow .ql-stroke': { stroke: p.text.secondary },
    '& .ql-snow .ql-fill': { fill: p.text.secondary },
    '& .ql-snow .ql-picker': { color: p.text.secondary },
    '& .ql-snow button:hover .ql-stroke, & .ql-snow .ql-active .ql-stroke, & .ql-snow .ql-picker-label:hover .ql-stroke': {
      stroke: p.primary.main
    },
    '& .ql-snow button:hover .ql-fill, & .ql-snow .ql-active .ql-fill': { fill: p.primary.main },
    '& .ql-snow .ql-picker-label:hover, & .ql-snow .ql-picker-item:hover, & .ql-snow .ql-picker-item.ql-selected': {
      color: p.primary.main
    },
    '& .ql-snow .ql-picker-options': { bgcolor: 'background.paper', borderColor: 'divider', boxShadow: theme.shadows[4] },
    '& .ql-snow .ql-tooltip': {
      bgcolor: 'background.paper',
      color: p.text.primary,
      borderColor: 'divider',
      boxShadow: theme.shadows[4],
      zIndex: 2
    },
    '& .ql-snow .ql-tooltip input[type=text]': { bgcolor: 'background.default', color: p.text.primary, borderColor: 'divider' },
    '& .ql-snow a, & .ql-snow .ql-tooltip a': { color: p.primary.main },
    '& .ql-snow .ql-editor blockquote': { borderInlineStartColor: p.divider, color: p.text.secondary },
    '& .ql-snow .ql-editor pre.ql-syntax, & .ql-snow .ql-editor .ql-code-block-container': {
      bgcolor: p.grey[900],
      color: p.grey[100],
      borderRadius: 1
    }
  };
};

/** Conta as palavras do texto, ignorando as tags. */
function contar(html: string) {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim();
  return text ? text.split(/\s+/).length : 0;
}

export default function EditorPage() {
  const [html, setHtml] = useState(INICIAL);
  const [tab, setTab] = useState(0);
  const modules = useMemo(() => ({ toolbar: TOOLBAR }), []);
  const palavras = contar(html);

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 7 }}>
        <Panel
          title="Editor de texto rico"
          action={
            <Button size="small" variant="contained" onClick={() => notify('Documento salvo.')}>
              Salvar
            </Button>
          }
        >
          <Box sx={quillSx}>
            <ReactQuill theme="snow" value={html} onChange={setHtml} modules={modules} placeholder="Comece a escrever..." />
          </Box>
          <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {palavras} palavra{palavras === 1 ? '' : 's'}
            </Typography>
            <Button size="small" color="secondary" onClick={() => setHtml('')}>
              Limpar
            </Button>
          </Stack>
        </Panel>
      </Grid>
      <Grid size={{ xs: 12, lg: 5 }}>
        <Panel title="Resultado" flush>
          <Tabs value={tab} onChange={(_, v: number) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Visualização" />
            <Tab label="HTML" />
          </Tabs>
          {tab === 0 ? (
            <Box
              className="ql-snow"
              sx={(theme) => ({
                ...quillSx(theme),
                '& .ql-editor': { minHeight: 0, p: 2.5, color: theme.vars.palette.text.primary },
                // o HTML gerado usa listas comuns (ol/ul), sem os marcadores internos do editor
                '& .ql-editor li': { listStyleType: 'revert', pl: 0.5 },
                '& .ql-editor li > .ql-ui': { display: 'none' }
              })}
            >
              <div className="ql-editor" dangerouslySetInnerHTML={{ __html: html }} />
            </Box>
          ) : (
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 2.5,
                fontSize: 12,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 420,
                overflow: 'auto'
              }}
            >
              {html.replace(/></g, '>\n<')}
            </Box>
          )}
        </Panel>
      </Grid>
    </Grid>
  );
}
