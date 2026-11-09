// Monta o motor dentro da vitrine: o adaptador em memória faz o papel do backend (o Pages não tem servidor) e as
// telas abaixo desta rota leem /_meta e os registros por ele, como num sistema de verdade.

import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';

// material-ui
import Alert from '@mui/material/Alert';

// third-party
import {
  Add,
  Call,
  Clock,
  CloseCircle,
  Location,
  MessageText1,
  Notification,
  Personalcard,
  ReceiptText,
  Send2,
  Sms,
  TickCircle,
  Warning2
} from 'iconsax-reactjs';

import { createMemoryClient, EngineProvider, loadEntities } from '@c3theme/engine';
import type { EngineState } from '@c3theme/engine';
import { PanelSkeleton } from '@c3theme/ui';
import { SEED } from './seed';

// um cliente só para a sessão: o que se grava numa tela aparece nas outras até recarregar a página
const client = createMemoryClient(SEED);

// só os ícones que a spec cita (a prévia da lista de clientes)
const icons = {
  Add,
  Call,
  Clock,
  CloseCircle,
  Location,
  MessageText1,
  Notification,
  Personalcard,
  ReceiptText,
  Send2,
  Sms,
  TickCircle,
  Warning2
};

let ready: Promise<EngineState> | undefined;
const load = () =>
  (ready ??= loadEntities(client, SEED.app.entities).then((entities) => ({ client, app: SEED.app, entities, components: {}, icons })));

export default function MotorLayout() {
  const [state, setState] = useState<EngineState>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    load().then(setState, (e: Error) => setError(e.message));
  }, []);
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!state) return <PanelSkeleton />;
  return (
    <EngineProvider value={state}>
      <Outlet />
    </EngineProvider>
  );
}
