import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import { SERVER_RAIL_DEFAULT_LABELS, type ServerAction, type ServerRailItem, type ServerRailProps } from './types';
export default function AcoesDoServidor({
  server,
  actions,
  labels,
  local,
  onMover,
  onOcultar,
  onAction
}: {
  server: ServerRailItem | undefined;
  actions: ServerRailProps['actions'];
  labels: typeof SERVER_RAIL_DEFAULT_LABELS;
  local: boolean;
  onMover: (direcao: -1 | 1) => void;
  onOcultar: () => void;
  onAction: (id: string) => void;
}) {
  if (server === undefined) {
    return null;
  }
  const declaradas: readonly ServerAction[] = actions?.(server) ?? [];
  return (
    <>
      {declaradas.map((acao) => (
        <MenuItem
          key={acao.id}
          disabled={acao.disabled ?? false}
          title={acao.instruction}
          onClick={() => !(acao.disabled ?? false) && onAction(acao.id)}
        >
          {acao.label}
        </MenuItem>
      ))}
      {!local && (
        <>
          <Divider />
          <MenuItem onClick={() => onMover(-1)}>{labels.moveUp}</MenuItem>
          <MenuItem onClick={() => onMover(1)}>{labels.moveDown}</MenuItem>
        </>
      )}
      {local && (
        <>
          <Divider />
          <MenuItem onClick={onOcultar}>{labels.showLocal(server.name).replace('Reexibir', 'Ocultar')}</MenuItem>
        </>
      )}
    </>
  );
}
