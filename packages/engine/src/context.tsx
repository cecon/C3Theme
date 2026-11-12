import { ComponentType, createContext, ReactNode, useContext } from 'react';
import { useIntl } from 'react-intl';

import type { C3Client } from './api';
import type { DesktopFrame } from './desktop/frame';
import type { ConnectivityPort } from './states/connectivity';
import type { TelemetryPort } from './telemetry';
import type { AppDef, Capabilities, EntityDef, FieldDef, OrgContext, Text, WireRecord } from './types';

/** Componente custom registrado na shell e citado na spec por nome (`component`). */
export type C3Components = Record<string, ComponentType<any>>;

/** Catálogo de ícones da shell: nome da spec (`icon`) → componente. Só os que o sistema usa entram no bundle. */
export type C3Icons = Record<string, ComponentType<any>>;

/** Empresa e filial (só quando o app declara `organization`). */
export interface OrgState {
  context: OrgContext;
  /** Filial ativa: onde se grava. Vai em toda requisição no cabeçalho C3-Branch. */
  active: string;
  setActive: (id: string) => void;
}

export interface EngineState {
  client: C3Client;
  app: AppDef;
  entities: Record<string, { def: EntityDef; capabilities: Capabilities }>;
  components: C3Components;
  /** Ícones citados na spec por nome. Sem o catálogo, menu e ações ficam sem ícone. */
  icons?: C3Icons;
  org?: OrgState;
  /** Página com `permission` → o usuário pode abrir na filial ativa (GET /_meta/app). Recarregado ao trocar de filial. */
  pageAccess?: Record<string, boolean>;
  /** Porta de telemetria do sistema (`task.start`, `task.done`, `task.abandon`). Sem ela, nada é emitido. */
  telemetry?: TelemetryPort;
  /** Lê o GET /_meta/app de novo sem remontar a shell (menu que muda com os dados). Ver `appVersion` no C3Shell. */
  reloadApp?: () => Promise<void>;
  /** Moldura do desktop (`layout.desktop` com a porta `desktopHost`). Sem ela, o app roda como site. */
  desktop?: DesktopFrame;
  /** Se o app está on-line (`connectivity` do <C3Shell>). Sem ela, o navegador. */
  connectivity?: ConnectivityPort;
}

const EngineContext = createContext<EngineState | null>(null);

export function EngineProvider({ value, children }: { value: EngineState; children: ReactNode }) {
  return <EngineContext.Provider value={value}>{children}</EngineContext.Provider>;
}

export function useEngine(): EngineState {
  const ctx = useContext(EngineContext);
  if (!ctx) throw new Error('useEngine fora do <C3Shell>');
  return ctx;
}

export function useOrg(): OrgState | undefined {
  return useEngine().org;
}

/** Nome da filial (e da empresa) para mostrar ao usuário. */
export function branchLabel(org: OrgState, id: string): { branch: string; company: string } {
  const b = org.context.branches.find((x) => x.id === id);
  const c = org.context.companies.find((x) => x.id === b?.company);
  return { branch: b?.title ?? `Filial ${id}`, company: c?.title ?? '' };
}

/** Dono do registro no formulário: no novo, onde vai ser gravado (a filial ativa); no existente, de quem é. */
export function ownerLabel(org: OrgState, scope: EntityDef['scope'], record: WireRecord | undefined): string {
  if (!record) {
    const { branch, company } = branchLabel(org, org.active);
    return scope === 'branch' ? `Será gravado em ${branch} · ${company}` : `Será gravado em ${company}`;
  }
  return [record._branch?.title, record._company?.title].filter(Boolean).join(' · ');
}

export function useEntity(name: string) {
  const { entities } = useEngine();
  return entities[name];
}

/** Texto da spec: literal ou chave de tradução. */
export function useText() {
  const intl = useIntl();
  return (t: Text | undefined, fallback = ''): string => {
    if (t === undefined) return fallback;
    if (typeof t === 'string') return t;
    return intl.formatMessage({ id: t.id, defaultMessage: t.defaultMessage ?? t.id });
  };
}

export function fieldLabel(f: FieldDef, text: ReturnType<typeof useText>) {
  return text(f.label, f.name);
}

/** Ícone do catálogo da shell (hoje, nomes do iconsax). Nome desconhecido não quebra a tela. */
export function iconByName(name: string | undefined, icons: C3Icons | undefined): ComponentType<any> | undefined {
  if (!name || !icons) return undefined;
  return Object.hasOwn(icons, name) ? icons[name] : undefined;
}
