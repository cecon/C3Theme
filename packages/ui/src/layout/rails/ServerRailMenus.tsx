import type { Dispatch, SetStateAction } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import AcoesDoServidor from './ServerRailActions';
import type { RailPreferences } from './preferences';
import type { ServerRailProps, ServerRailItem, ServerRailLabels } from './types';
interface Props {
  menuAdicionar: HTMLElement | null;
  setMenuAdicionar: Dispatch<SetStateAction<HTMLElement | null>>;
  local?: ServerRailItem;
  prefs: RailPreferences;
  salvar: (change: Partial<RailPreferences>) => void;
  onShowLocal?: () => void;
  labels: ServerRailLabels;
  addOptions: NonNullable<ServerRailProps['addOptions']>;
  onAdd: ServerRailProps['onAdd'];
  menuDeAcoes: HTMLElement | null;
  menuDe: string | null;
  setMenuDe: Dispatch<SetStateAction<string | null>>;
  setMenuDeAcoes: Dispatch<SetStateAction<HTMLElement | null>>;
  visiveis: readonly ServerRailItem[];
  actions: ServerRailProps['actions'];
  localServerId?: string;
  mover: (id: string, direction: -1 | 1) => void;
  anunciar: (message: string) => void;
  onAction: ServerRailProps['onAction'];
}
export default function ServerRailMenus({
  menuAdicionar,
  setMenuAdicionar,
  local,
  prefs,
  onShowLocal,
  salvar,
  labels,
  addOptions,
  onAdd,
  menuDeAcoes,
  menuDe,
  setMenuDe,
  setMenuDeAcoes,
  visiveis,
  actions,
  localServerId,
  mover,
  anunciar,
  onAction
}: Props) {
  return (
    <>
      <Menu anchorEl={menuAdicionar} open={menuAdicionar !== null} onClose={() => setMenuAdicionar(null)}>
        {prefs.localHidden && local !== undefined && (
          <MenuItem
            onClick={() => {
              setMenuAdicionar(null);
              onShowLocal?.();
              salvar({ localHidden: false });
            }}
          >
            {labels.showLocal(local.name)}
          </MenuItem>
        )}
        {addOptions.map((opcao) => (
          <MenuItem
            key={opcao.id}
            onClick={() => {
              setMenuAdicionar(null);
              onAdd?.(opcao.id);
            }}
          >
            {opcao.label}
          </MenuItem>
        ))}
      </Menu>
      <Menu
        anchorEl={menuDeAcoes}
        open={menuDe !== null && menuDeAcoes !== null}
        onClose={() => {
          setMenuDe(null);
          setMenuDeAcoes(null);
        }}
        transitionDuration={0}
      >
        <AcoesDoServidor
          server={visiveis.find((s) => s.id === menuDe)}
          actions={actions}
          labels={labels}
          local={menuDe === localServerId}
          onMover={(direcao) => {
            if (menuDe !== null) {
              mover(menuDe, direcao);
            }
            setMenuDe(null);
            setMenuDeAcoes(null);
          }}
          onOcultar={() => {
            salvar({ localHidden: true });
            anunciar(`Servidor ${local?.name ?? ''} oculto.`);
            setMenuDe(null);
            setMenuDeAcoes(null);
          }}
          onAction={(id) => {
            if (menuDe !== null) {
              onAction?.(menuDe, id);
            }
            setMenuDe(null);
            setMenuDeAcoes(null);
          }}
        />
      </Menu>
    </>
  );
}
