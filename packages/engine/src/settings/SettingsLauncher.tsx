// Botão de configurações do cabeçalho e os dois modais (#119): o pessoal, com a entrada das configurações do servidor
// no rodapé, e o do servidor. A declaração vem do `settings` do app.json; os dados, da porta opcional do <C3Shell>.

import { useState } from 'react';

import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { Setting2 } from 'iconsax-reactjs';

import { useText } from '../context';
import SettingsModal from './SettingsModal';
import type { SettingsPort } from './port';
import type { AppSettingsDef } from '../settingsTypes';

export interface SettingsLauncherProps {
  def: AppSettingsDef;
  port?: SettingsPort;
  /** abre o modal pessoal já nesta seção (a política passa a seção inicial) */
  initialSection?: string;
}

/** O botão do cabeçalho e os modais de configuração; sem `settings` no app.json, o layout usa o painel de aparência. */
export default function SettingsLauncher({ def, port, initialSection }: SettingsLauncherProps) {
  const text = useText();
  const [pessoal, setPessoal] = useState(initialSection !== undefined);
  const [servidor, setServidor] = useState(false);
  const titulo = text(def.title);
  const server = def.server;
  return (
    <>
      <Tooltip title={titulo}>
        <IconButton aria-label={titulo} onClick={() => setPessoal(true)}>
          <Setting2 size={20} />
        </IconButton>
      </Tooltip>
      <SettingsModal
        key={`${port?.serverId ?? 'default'}:personal`}
        def={def}
        port={port}
        open={pessoal}
        onClose={() => setPessoal(false)}
        restoreKey={`${port?.serverId ?? 'default'}:pessoal`}
        {...(initialSection === undefined ? {} : { section: initialSection })}
        footer={
          server === undefined ? undefined : (
            <Button size="small" variant="outlined" color="secondary" onClick={() => setServidor(true)}>
              {text(server.title)}
            </Button>
          )
        }
      />
      {server !== undefined && (
        <SettingsModal
          key={`${port?.serverId ?? 'default'}:server`}
          def={server}
          port={port}
          open={servidor}
          onClose={() => setServidor(false)}
          scope="server"
          restoreKey={`${port?.serverId ?? 'default'}:servidor`}
        />
      )}
    </>
  );
}
