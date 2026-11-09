// O JSON que monta a tela, no lugar do código React: é o que quem usa o motor escreve.

import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { Code1, Copy } from 'iconsax-reactjs';
import { Link as RouterLink } from 'react-router';

import { notify } from '@c3theme/ui';
import { SPECS } from './spec';

/** Sem o `$schema` (caminho do repositório), o resto do arquivo como está. */
const pretty = (name: string) => {
  const { $schema: _s, ...rest } = SPECS[name] as Record<string, unknown>;
  return JSON.stringify(rest, null, 2);
};

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    notify('JSON copiado.', 'info');
  } catch {
    notify('Não foi possível copiar o JSON.', 'error');
  }
}

export interface JsonSpecProps {
  /** Arquivos da spec que montam a tela (`app` é o app.json). */
  files: string[];
  /** Rota da mesma tela feita em código, para comparar. */
  codePath?: string;
}

/** Barra acima da tela do motor: de onde ela vem, o botão que mostra o JSON e o link para a versão em código. */
export default function JsonSpec({ files, codePath }: JsonSpecProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const text = pretty(files[tab]);
  return (
    <Box sx={{ mb: 2.5 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 200 }}>
          Tela montada pelo motor a partir do JSON, com os dados num adaptador em memória.
        </Typography>
        {codePath && (
          <Button size="small" color="secondary" component={RouterLink} to={codePath}>
            Ver a versão em código
          </Button>
        )}
        <Tooltip title={open ? 'Esconder JSON' : 'Mostrar JSON'}>
          <IconButton
            aria-label={open ? 'Esconder JSON' : 'Mostrar JSON'}
            aria-expanded={open}
            color={open ? 'primary' : 'default'}
            onClick={() => setOpen((v) => !v)}
          >
            <Code1 size={20} />
          </IconButton>
        </Tooltip>
      </Stack>
      <Collapse in={open} unmountOnExit>
        {files.length > 1 && (
          <Tabs value={tab} onChange={(_, v: number) => setTab(v)} variant="scrollable" sx={{ mt: 1 }}>
            {files.map((f) => (
              <Tab key={f} label={`${f}.json`} />
            ))}
          </Tabs>
        )}
        <Box sx={{ position: 'relative', mt: 1.5 }}>
          <Box
            component="pre"
            dir="ltr"
            sx={{
              m: 0,
              p: 2,
              pr: 6,
              maxHeight: 480,
              overflow: 'auto',
              borderRadius: 2,
              bgcolor: 'background.default',
              border: 1,
              borderColor: 'divider',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              fontSize: '0.8125rem',
              lineHeight: 1.6
            }}
          >
            <code>{text}</code>
          </Box>
          <Tooltip title="Copiar">
            <IconButton size="small" aria-label="Copiar JSON" onClick={() => copy(text)} sx={{ position: 'absolute', top: 8, right: 8 }}>
              <Copy size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      </Collapse>
    </Box>
  );
}
