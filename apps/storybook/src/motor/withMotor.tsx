// Monta o motor em volta da história: o adaptador em memória faz o papel do backend e a tela lê /_meta e os registros
// por ele, como num sistema de verdade. Um cliente só para o Storybook inteiro, como na vitrine.

import { useEffect, useState, type ReactNode } from 'react';
import type { Decorator } from '@storybook/react-vite';
import {
  Box,
  Calendar,
  CloseCircle,
  DocumentText,
  Element3,
  Flash,
  Home2,
  MessageText1,
  People,
  Profile2User,
  ReceiptText,
  Routing2,
  Shop,
  TaskSquare,
  TickCircle,
  Timer1,
  Truck,
  Warning2
} from 'iconsax-reactjs';

import Alert from '@mui/material/Alert';

import { createMemoryClient, EngineProvider, loadEntities, type EngineState } from '@c3theme/engine';
import { PanelSkeleton } from '@c3theme/ui';

import { SEED } from './seed';

const client = createMemoryClient(SEED);
// "Carregando": a tela já tem o /_meta, mas os registros não chegam nunca (maior atraso que o setTimeout aceita)
const stalled = createMemoryClient({ ...SEED, latency: 2 ** 31 - 1 });

// só os ícones que a spec cita
const icons = {
  Box,
  Calendar,
  CloseCircle,
  DocumentText,
  Element3,
  Flash,
  Home2,
  MessageText1,
  People,
  Profile2User,
  ReceiptText,
  Routing2,
  Shop,
  TaskSquare,
  TickCircle,
  Timer1,
  Truck,
  Warning2
};

let ready: Promise<EngineState> | undefined;
const load = () =>
  (ready ??= loadEntities(client, SEED.app.entities).then((entities) => ({ client, app: SEED.app, entities, components: {}, icons })));

function Motor({ loading, children }: { loading: boolean; children: ReactNode }) {
  const [state, setState] = useState<EngineState>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    load().then(setState, (e: Error) => setError(e.message));
  }, []);
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!state) return <PanelSkeleton />;
  return <EngineProvider value={loading ? { ...state, client: stalled } : state}>{children}</EngineProvider>;
}

/**
 * Decorator das histórias montadas pelo motor (o tema e o roteador vêm do decorator global). `parameters.motor.loading`
 * segura as respostas para mostrar o carregando que o motor desenha.
 */
export const withMotor: Decorator = (Story, { parameters }) => (
  <Motor loading={parameters.motor?.loading === true}>
    <Story />
  </Motor>
);
