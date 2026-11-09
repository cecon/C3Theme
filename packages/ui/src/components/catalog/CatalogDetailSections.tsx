import type { ReactNode } from 'react';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { isInstalled, type CatalogItem } from './catalog';
import { useCatalogText } from './catalogText';

const mono = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack component="section" spacing={1} aria-label={title}>
      <Typography variant="subtitle2" component="h3">
        {title}
      </Typography>
      {children}
    </Stack>
  );
}

function PathList({ paths }: { paths: string[] }) {
  return (
    <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5, fontFamily: mono, fontSize: '0.8125rem', wordBreak: 'break-all' }}>
      {paths.map((p) => (
        <li key={p}>{p}</li>
      ))}
    </Box>
  );
}

/** Avisos do estado: erro, saiu do catálogo e arquivos editados que vão ganhar um ".nova" ao lado. */
export function CatalogNotices({ item }: { item: CatalogItem }) {
  const t = useCatalogText();
  const { status, editedFiles = [] } = item;
  return (
    <>
      {status.state === 'error' && (
        <Alert severity="error">
          {t('c3.catalog.errorHint')}
          {status.message && ` ${status.message}`}
        </Alert>
      )}
      {status.state === 'removed-from-catalog' && <Alert severity="warning">{t('c3.catalog.removedHint')}</Alert>}
      {status.state === 'update-available' && editedFiles.length > 0 && (
        <Alert severity="warning">
          {t('c3.catalog.edited', { count: editedFiles.length })}
          <PathList paths={editedFiles} />
        </Alert>
      )}
    </>
  );
}

/** Descrição em "Sobre": Markdown pelo `renderMarkdown` do app; sem ele, parágrafos de texto simples. */
export function CatalogDescription({ text, renderMarkdown }: { text?: string; renderMarkdown?: (markdown: string) => ReactNode }) {
  const t = useCatalogText();
  if (!text) return null;
  return (
    <Section title={t('c3.catalog.about')}>
      {renderMarkdown ? (
        <Box sx={{ typography: 'body2' }}>{renderMarkdown(text)}</Box>
      ) : (
        text.split(/\n{2,}/).map((p, i) => (
          <Typography key={i} variant="body2" sx={{ whiteSpace: 'pre-line' }}>
            {p}
          </Typography>
        ))
      )}
    </Section>
  );
}

/** Arquivos e permissões que o item instala. */
export function CatalogInstalls({ item }: { item: CatalogItem }) {
  const t = useCatalogText();
  const { files = [], permissions = [] } = item;
  if (!files.length && !permissions.length) return null;
  return (
    <Section title={t('c3.catalog.installs')}>
      {permissions.length > 0 && (
        <>
          <Typography variant="caption" color="text.secondary" component="h4">
            {t('c3.catalog.permissions')}
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5, typography: 'body2' }}>
            {permissions.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </Box>
        </>
      )}
      {files.length > 0 && (
        <>
          <Typography variant="caption" color="text.secondary" component="h4">
            {t('c3.catalog.files')}
          </Typography>
          <PathList paths={files} />
        </>
      )}
    </Section>
  );
}

/** Histórico de versões, da mais nova para a mais velha; marca a instalada. */
export function CatalogVersions({ item }: { item: CatalogItem }) {
  const t = useCatalogText();
  const { versions = [] } = item;
  if (!versions.length) return null;
  const installed = isInstalled(item.status);
  return (
    <Section title={t('c3.catalog.versions')}>
      <Stack component="ol" spacing={1.5} sx={{ m: 0, p: 0, listStyle: 'none' }}>
        {versions.map((v) => (
          <li key={v.version}>
            <Typography variant="body2" component="p" sx={{ fontWeight: 600 }}>
              {t('c3.catalog.version', { version: v.version })}
              {installed && v.version === item.version && (
                <Box component="span" sx={{ fontWeight: 400, color: 'text.secondary' }}>
                  {` · ${t('c3.catalog.current')}`}
                </Box>
              )}
              {v.date && (
                <Box component="span" sx={{ fontWeight: 400, color: 'text.secondary' }}>
                  {` · ${v.date}`}
                </Box>
              )}
            </Typography>
            {v.notes && (
              <Typography variant="body2" color="text.secondary">
                {v.notes}
              </Typography>
            )}
          </li>
        ))}
      </Stack>
    </Section>
  );
}
