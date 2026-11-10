import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { RouterProvider } from 'react-router/dom';
import { mutate } from 'swr';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { AppSkeleton, C3ThemeProvider, C3ThemeProviderProps, DesktopOptions, LocaleMessages, Notifier } from '@c3theme/ui';
import { C3Client, createClient } from './api';
import { authorizingFetch } from './authorization/fetch';
import { useAuthorization } from './authorization/useAuthorization';
import { createShellRouter, type RouterMode } from './router';
import { browserFetch, type C3Fetch } from './transport';
import { C3Components, C3Icons, EngineProvider, EngineState } from './context';
import C3Layout from './C3Layout';
import useIconCatalog from './hooks/useIconCatalog';
import { readStoredBranch, storeBranch } from './branchStorage';
import { loadEntities } from './access';
import { buildRoutes, homePath, routesKey } from './routes';
import useAppReload from './hooks/useAppReload';
import AuthGate from './auth/AuthGate';
import type { AuthPort } from './auth/port';
import { useAuthSession } from './auth/session';
import { sessionRoutes } from './auth/sessionUser';
import type { AppDef } from './types';
import type { TelemetryPort } from './telemetry';

export interface C3ShellProps {
  /** Base da API do sistema, ex.: '/api'. */
  apiUrl: string;
  /** Componentes custom citados na spec por nome (`component` em página, campo, coluna, seção, header). */
  components?: C3Components;
  /**
   * Ícones citados na spec por nome (`icon`), ex.: `{ Profile2User, Box }` do iconsax-reactjs. Sem ele, a shell
   * carrega o catálogo inteiro do iconsax num pedaço à parte (vários MB): passe só os que a spec usa.
   */
  icons?: C3Icons;
  /** Cabeçalhos por requisição, ex.: () => ({ Authorization: `Bearer ${token}` }). */
  headers?: () => HeadersInit;
  /** Mensagens de tradução por idioma. Padrão: nenhuma (textos literais da spec e defaultMessage). */
  loadMessages?: (locale: string) => Promise<LocaleMessages>;
  /** Repassados ao C3ThemeProvider. */
  theme?: Omit<C3ThemeProviderProps, 'children' | 'loadMessages'>;
  /** Base do roteador, se o app não roda na raiz do domínio. */
  basename?: string;
  /** `hash` para a página aberta de arquivo (Electron, `file://`): a rota vai depois do `#`. Padrão: `browser`. */
  router?: RouterMode;
  /**
   * Transporte dos pedidos (cliente, login e GET /_meta/login). Padrão: `fetch`. No Electron, `ipcFetch` de
   * @c3theme/electron leva o pedido ao processo main, que repassa ao backend (sem CORS e sem servidor no renderer).
   */
  transport?: C3Fetch;
  /** Rodapé do drawer (ex.: usuário logado e sair), que é do sistema e não da spec. */
  drawerFooter?: ReactNode;
  /**
   * App de desktop sem barra de título (Electron, Tauri): repassado ao `AppLayout` (espaço para os botões da janela,
   * arrastar pelo cabeçalho, menu translúcido, menu fixo em janela estreita). Fica na prop e não na spec porque a
   * plataforma é de quem roda. Fonte e densidade vão em `theme.tokens` (`desktopTokens('mac')`).
   */
  desktop?: DesktopOptions;
  /**
   * Mude o valor (número ou texto) para a shell ler o GET /_meta/app de novo sem remontar: o menu que vem dos dados
   * (um item por agente, por canal) se atualiza e as páginas abertas continuam. Também por `useEngine().reloadApp()`.
   */
  appVersion?: string | number;
  /**
   * Porta de autenticação do sistema (ex.: `httpAuth('/api')`). Com ela, a shell monta as telas de entrada pelo
   * `auth` do app.json (lido em GET /_meta/login), manda `Authorization: Bearer` em todo pedido e volta ao login num 401.
   */
  auth?: AuthPort;
  /**
   * Recebe os eventos de tarefa das telas (`task.start` ao abrir o formulário ou a ação, `task.done` ao gravar,
   * `task.abandon` ao sair sem gravar), sem dado pessoal. O C3 só emite: guardar ou enviar é do sistema.
   */
  onTelemetry?: TelemetryPort;
}

/**
 * Shell completa: lê `/_meta` do backend e monta tema, layout (header, menu, footer), rotas,
 * listas e formulários. O sistema só registra os componentes custom.
 */
export default function C3Shell(props: C3ShellProps) {
  const { auth, apiUrl, basename, router, transport, theme, loadMessages } = props;
  if (!auth) return <Shell {...props} />;
  return <AuthGate {...{ port: auth, apiUrl, basename, router, transport, theme, loadMessages }}>{() => <Shell {...props} />}</AuthGate>;
}

function Shell(props: C3ShellProps) {
  const { apiUrl, components = {}, icons, headers, loadMessages, theme, basename, drawerFooter, onTelemetry, transport, desktop } = props;
  const session = useAuthSession();
  const token = session?.token;
  const logout = session?.logout;
  // filial ativa: vai em toda requisição; guardada na sessão do navegador, não na URL
  const branch = useRef<string | null>(readStoredBranch());
  const allHeaders = useCallback(
    (): HeadersInit => ({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...Object.fromEntries(new Headers(headers?.() ?? {})),
      ...(branch.current ? { 'C3-Branch': branch.current } : {})
    }),
    [headers, token]
  );
  const [state, setState] = useState<EngineState>();
  // recusa com código de `app.authorization`: pede quem libera e reenvia o mesmo pedido (#48)
  const authz = useAuthorization(state?.app.authorization);
  const client = useMemo(
    () => createClient(apiUrl, allHeaders, logout, authorizingFetch(transport ?? browserFetch, authz.codes, authz.ask)),
    [apiUrl, allHeaders, logout, transport, authz.codes, authz.ask]
  );
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const catalog = useIconCatalog(icons);
  // função nova a cada render do app não recria o contexto: a shell chama sempre a última recebida
  const sink = useRef(onTelemetry);
  useEffect(() => {
    sink.current = onTelemetry;
  }, [onTelemetry]);
  const hasSink = onTelemetry !== undefined;
  const telemetry = useMemo<TelemetryPort | undefined>(() => (hasSink ? (event) => sink.current?.(event) : undefined), [hasSink]);

  // trocar de filial recarrega as capabilities e todas as listas, sem remontar as rotas
  const setActive = useCallback(
    async (id: string) => {
      branch.current = id;
      storeBranch(id);
      try {
        const [entities, pageAccess] = await Promise.all([loadEntities(client, state!.app.entities), loadPageAccess(client, state!.app)]);
        setState((s) => s && { ...s, entities, pageAccess, org: s.org && { ...s.org, active: id } });
        mutate(() => true);
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [client, state]
  );

  useEffect(() => {
    let active = true;
    setError(undefined);
    (async () => {
      // a primeira resposta já traz a permissão das páginas, na filial que foi no cabeçalho
      const sent = branch.current;
      const { app, pageAccess: first } = await client.meta();
      let org: EngineState['org'];
      if (app.organization) {
        // a filial guardada pode ter deixado de valer: pergunta sem cabeçalho e escolhe de novo
        branch.current = null;
        const context = await client.context();
        const ids = context.branches.map((b) => b.id);
        const stored = readStoredBranch();
        const chosen = (stored && ids.includes(stored) ? stored : null) ?? context.defaultBranch ?? ids[0] ?? null;
        branch.current = chosen;
        if (chosen) {
          storeBranch(chosen);
          org = { context, active: chosen, setActive: () => {} };
        }
      }
      // permissão de página depende da filial: só pergunta de novo se a escolhida não foi a do cabeçalho
      const [entities, pageAccess] = await Promise.all([
        loadEntities(client, app.entities),
        branch.current === sent ? first : loadPageAccess(client, app)
      ]);
      if (active) setState({ client, app, entities, components, org, pageAccess });
    })().catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
    // components é um objeto literal do sistema; mudá-lo em runtime não recarrega a spec
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, attempt]);

  const reloadApp = useAppReload(client, setState, props.appVersion);
  const engine = useMemo(
    () => state && { ...state, icons: catalog, telemetry, reloadApp, org: state.org && { ...state.org, setActive } },
    [state, catalog, telemetry, reloadApp, setActive]
  );
  const app = state?.app;
  const routes = app && routesKey(app);
  const router = useMemo(
    () =>
      app &&
      createShellRouter(
        props.router ?? 'browser',
        buildRoutes(app, <ShellLayout drawerFooter={drawerFooter} />, sessionRoutes(session)),
        basename
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a sessão só muda ao sair, e aí a shell desmonta
    [routes, basename, drawerFooter, props.router]
  );

  return (
    <C3ThemeProvider
      {...theme}
      loadMessages={loadMessages}
      defaultConfig={{
        ...(state?.app.layout.orientation && { menuOrientation: state.app.layout.orientation }),
        ...theme?.defaultConfig
      }}
      branding={{ name: state?.app.name ?? '', homePath: state?.app.homePath ?? homePath(state?.app), ...theme?.branding }}
    >
      {error ? (
        <Box sx={{ p: 4, maxWidth: 560, mx: 'auto', mt: 8 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => setAttempt((n) => n + 1)}>
                Tentar de novo
              </Button>
            }
          >
            Não foi possível carregar o sistema: {error}
          </Alert>
        </Box>
      ) : router ? (
        <EngineProvider value={engine!}>
          {/* por contexto e não pela rota: um objeto novo a cada render recriaria o roteador */}
          <DesktopContext.Provider value={desktop}>
            <RouterProvider router={router} />
          </DesktopContext.Provider>
          {authz.dialog}
        </EngineProvider>
      ) : (
        <AppSkeleton />
      )}
      <Notifier />
    </C3ThemeProvider>
  );
}

const DesktopContext = createContext<DesktopOptions | undefined>(undefined);

/** A moldura nas rotas da shell, com o desktop da prop (por contexto, para não recriar o roteador). */
function ShellLayout({ drawerFooter }: { drawerFooter?: ReactNode }) {
  return <C3Layout drawerFooter={drawerFooter} desktop={useContext(DesktopContext)} />;
}

/** Só pergunta quando alguma página declara `permission`. */
const loadPageAccess = (client: C3Client, app: AppDef) =>
  app.pages?.some((p) => p.permission) ? client.pageAccess() : Promise.resolve({});
