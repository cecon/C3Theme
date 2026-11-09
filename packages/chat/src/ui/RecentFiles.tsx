import type { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

// third-party
import { DocumentText } from 'iconsax-reactjs';

import type { AgentFile } from '../core/agentPanel';
import AgentPanelSection, { type PanelHeading } from './AgentPanelSection';
import { useBytesFormat } from './format';
import { useChatText } from './text';

export interface RecentFilesProps {
  files: AgentFile[];
  /** Abrir o arquivo (baixar, mostrar na aba Arquivos). Sem ele, a lista só mostra. */
  onOpen?: (fileId: string) => void;
  /** Rótulo da seção. Padrão: "Arquivos recentes". */
  title?: ReactNode;
  /** Nível do título da seção. Padrão: `h3`. */
  headingComponent?: PanelHeading;
}

/** Arquivos recentes do agente: nome, tamanho e abrir com um clique. */
export default function RecentFiles({ files, onOpen, title, headingComponent }: RecentFilesProps) {
  const t = useChatText();
  const bytes = useBytesFormat();
  return (
    <AgentPanelSection headingComponent={headingComponent} title={title ?? t('c3.chat.recentFiles')}>
      {files.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', py: 0.75 }}>
          {t('c3.chat.filesEmpty')}
        </Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {files.map((f) => {
            const row = (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', py: 0.75, minWidth: 0 }}>
                <Box aria-hidden sx={{ display: 'flex', color: 'text.secondary', flexShrink: 0 }}>
                  <DocumentText size={16} color="currentColor" />
                </Box>
                <Typography variant="body2" noWrap title={f.name} sx={{ flex: 1, minWidth: 0, textAlign: 'start' }}>
                  {f.name}
                </Typography>
                {f.size !== undefined && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {bytes(f.size)}
                  </Typography>
                )}
              </Box>
            );
            return (
              <Box component="li" key={f.id} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                {onOpen ? (
                  <ButtonBase
                    onClick={() => onOpen(f.id)}
                    sx={{ width: '100%', borderRadius: 1, px: 0.5, mx: -0.5, '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    {row}
                  </ButtonBase>
                ) : (
                  row
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </AgentPanelSection>
  );
}
