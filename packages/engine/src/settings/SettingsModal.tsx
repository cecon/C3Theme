// Modal de configurações do motor (#119): abas/seções, linhas, subpáginas e políticas declaradas pela spec.
// valores pela porta `settings`, desenha pelo SettingsDialog do @c3theme/ui e grava cada mudança. Nada de tela por
// app: o mesmo componente atende as configurações pessoais e as do servidor.

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import useSettingsFocus from './useSettingsFocus';
import { ApiError } from '../apiError';

import { SettingsDialog, SettingsPage, type SettingsDialogStatus } from '@c3theme/ui';

import { useEngine, useText } from '../context';
import useClientPlatform from '../hooks/useClientPlatform';
import {
  findPage,
  initialSection,
  pageTrail,
  sectionDenied,
  settingsEntries,
  visibleRows,
  visibleSections,
  type SettingsContext,
  type SettingsText
} from '../settings';
import StackDeRows from './SettingsRows';
import { storedSection, storeSection, valoresDaSpec, icone } from './settingsModel';
import type { SettingsPort, SettingsValue } from './port';
import type { SettingsDef, SettingsRowDef } from '../settingsTypes';

export interface SettingsModalProps {
  def: SettingsDef;
  port?: SettingsPort;
  open: boolean;
  onClose: () => void;
  /** seção aberta ao abrir (a política pode passar a seção inicial) */
  section?: string;
  /** chave estável para restaurar a última seção aberta; sem ela, a restauração não usa navegador */
  restoreKey?: string;
  /** rodapé extra do modal pessoal (a entrada das configurações do servidor) */
  footer?: ReactNode;
  /** qual modal está aberto: vai no pedido de mudança da porta */
  scope?: 'personal' | 'server';
}

/** O modal de configurações: a seção atual, a subpágina aberta, a busca e o estado do painel. */
export default function SettingsModal({
  def,
  port,
  open,
  onClose,
  section: pedida,
  restoreKey,
  footer,
  scope = 'personal'
}: SettingsModalProps) {
  const { icons, components, pageAccess } = useEngine();
  const text = useText();
  const platform = useClientPlatform();
  const [capabilities, setCapabilities] = useState<readonly string[]>();
  const contexto = useMemo<SettingsContext>(
    () => ({ platform, capabilities, ...(pageAccess === undefined ? {} : { pageAccess }) }),
    [platform, pageAccess, capabilities]
  );
  const chave = restoreKey ?? text(def.title);
  const [valor, setValor] = useState<Record<string, SettingsValue>>(() => valoresDaSpec(def));
  const [versao, setVersao] = useState<string>();
  const [situacao, setSituacao] = useState<SettingsDialogStatus>('pronto');
  const [secao, setSecao] = useState(() => def.sections[0]?.id ?? '');
  const [paginas, setPaginas] = useState<string[]>([]);
  const [busca, setBusca] = useState('');
  const [salvando, setSalvando] = useState(0);
  const [salvo, setSalvo] = useState(false);
  const [failedWrites, setFailedWrites] = useState<Record<string, () => Promise<void>>>({});
  const writes = useRef(Promise.resolve());
  const [tentativa, setTentativa] = useState(0);
  const { panel, openers, highlight, focusRow } = useSettingsFocus(open);
  const sections = useMemo(() => visibleSections(def, contexto), [def, contexto]);
  const atual = sections.find((candidata) => candidata.id === secao) ?? sections[0];
  const pagina = atual === undefined || paginas.length === 0 ? undefined : findPage(atual, paginas);
  const rows = visibleRows(pagina?.rows ?? atual?.rows, platform);
  const entries = useMemo(() => settingsEntries(def, contexto, text as SettingsText, scope === 'server'), [def, contexto, text, scope]);
  useEffect(() => {
    if (open && situacao === 'pronto' && def.initialFocusRow) focusRow(def.initialFocusRow);
  }, [open, situacao, def.initialFocusRow, focusRow]);

  useEffect(() => {
    if (!open) return;
    let ativo = true;
    const carregar = async () => {
      if (port === undefined) {
        setValor(valoresDaSpec(def));
        setVersao(undefined);
        setSituacao('pronto');
        return;
      }
      setSituacao('carregando');
      try {
        const dados = await port.load({ modal: scope });
        if (!ativo) return;
        setValor({ ...valoresDaSpec(def), ...dados.values });
        setVersao(dados.version);
        setCapabilities(dados.capabilities);
        setSituacao('pronto');
      } catch (error) {
        if (ativo) setSituacao(error instanceof ApiError && error.status === 403 ? 'sem-permissao' : 'erro');
      }
    };
    void carregar();
    return () => {
      ativo = false;
    };
  }, [open, port, def, tentativa, scope]);

  useEffect(() => {
    if (!open) return;
    const restaurada = def.restoreSection === true ? storedSection(chave) : undefined;
    setSecao(initialSection(def, contexto, pedida ?? restaurada));
    setPaginas([]);
    setBusca('');
  }, [open, def, contexto, pedida, chave]);

  const mudarSecao = (id: string) => {
    setSecao(id);
    setPaginas([]);
    if (def.restoreSection === true) storeSection(chave, id);
  };

  const abrirPagina = (id: string) => {
    openers.current[paginas.length] =
      (document.activeElement as HTMLElement | null)?.closest<HTMLElement>('[data-settings-row]')?.dataset.settingsRow ?? '';
    setPaginas((atuais) => [...atuais, id]);
  };

  const voltar = (ate: number) => {
    setPaginas((atuais) => atuais.slice(0, ate));
    const id = openers.current[ate];
    openers.current = openers.current.slice(0, ate);
    if (id) focusRow(id);
  };

  const escolher = (hit: { section: string; page?: string; id: string }) => {
    setSecao(hit.section);
    setPaginas(hit.page === undefined ? [] : hit.page.split('/'));
    focusRow(hit.id);
  };

  const gravar = useCallback(
    async (row: SettingsRowDef, novo: string | number | boolean): Promise<void> => {
      if ('readOnly' in row.control && row.control.readOnly) return;
      setValor((atuais) => ({ ...atuais, [row.id]: novo }));
      setSalvo(false);
      if (port?.change === undefined) return;
      setSalvando((atualSalvando) => atualSalvando + 1);
      try {
        const task = writes.current
          .catch(() => {})
          .then(() =>
            port.change!({
              modal: scope,
              section: secao,
              ...(paginas.length === 0 ? {} : { page: paginas.join('/') }),
              row: row.id,
              value: novo
            })
          );
        writes.current = task;
        await task;
        setFailedWrites((pending) => {
          const next = { ...pending };
          delete next[row.id];
          return next;
        });
        setSalvo(true);
        window.setTimeout(() => setSalvo(false), 2000);
      } catch {
        setFailedWrites((pending) => ({ ...pending, [row.id]: () => gravar(row, novo) }));
        setSituacao('erro');
      } finally {
        setSalvando((atualSalvando) => atualSalvando - 1);
      }
    },
    [port, secao, paginas, scope]
  );

  const executar = useCallback(
    async (row: SettingsRowDef, action: string) => {
      if (port?.action === undefined) return;
      setSalvando((atualSalvando) => atualSalvando + 1);
      try {
        await port.action({
          modal: scope,
          section: secao,
          ...(paginas.length === 0 ? {} : { page: paginas.join('/') }),
          row: row.id,
          action
        });
        setSalvo(true);
        window.setTimeout(() => setSalvo(false), 2000);
      } catch {
        setSituacao('erro');
      } finally {
        setSalvando((atualSalvando) => atualSalvando - 1);
      }
    },
    [port, secao, paginas, scope]
  );

  const denied = atual !== undefined && sectionDenied(atual, contexto);
  const situacaoDaSecao: SettingsDialogStatus = situacao === 'pronto' && denied ? 'sem-permissao' : situacao;
  const confirmarFechamento = def.confirmPending !== false;

  return (
    <SettingsDialog
      open={open}
      title={text(def.title)}
      {...(def.description === undefined ? {} : { description: text(def.description) })}
      onClose={onClose}
      closeOnBackdrop={def.closeOnBackdrop !== false}
      sections={sections.map((item) => ({
        id: item.id,
        label: text(item.title),
        ...(item.description === undefined ? {} : { description: text(item.description) }),
        ...(icone(item.icon, icons) === undefined ? {} : { icon: icone(item.icon, icons) })
      }))}
      section={atual?.id ?? ''}
      onSectionChange={mudarSecao}
      {...(def.search === undefined
        ? {}
        : { search: { entries, value: busca, onChange: setBusca, onPick: escolher, placeholder: text(def.search) } })}
      status={situacaoDaSecao}
      statusMessage={
        Object.keys(failedWrites).length
          ? text({
              id: 'c3.settingsModal.saveError',
              defaultMessage: 'Não foi possível salvar. Seus ajustes continuam aqui; tente de novo.'
            })
          : undefined
      }
      onRetry={() => {
        if (Object.keys(failedWrites).length) {
          setSituacao('pronto');
          for (const retry of Object.values(failedWrites)) void retry();
        } else setTentativa((atualTentativa) => atualTentativa + 1);
      }}
      saving={salvando > 0}
      saved={salvo}
      pendingChanges={confirmarFechamento && (salvando > 0 || Object.keys(failedWrites).length > 0)}
      confirmClose={{
        description: text({
          id: 'c3.settingsModal.pendingDescription',
          defaultMessage: 'Há alterações pendentes. Fechar descarta ajustes locais, mas não cancela pedidos já enviados.'
        })
      }}
      {...(footer === undefined ? {} : { footer })}
      {...(versao === undefined ? {} : { version: versao })}
    >
      <Box ref={panel} tabIndex={-1}>
        {pagina === undefined ? (
          <StackDeRows
            rows={rows}
            valor={valor}
            text={text}
            components={components}
            gravar={gravar}
            executar={executar}
            abrirPagina={abrirPagina}
            highlight={highlight}
          />
        ) : (
          <SettingsPage
            trail={[
              { label: text(atual?.title), onClick: () => voltar(0) },
              ...pageTrail(atual!, paginas).map((item, indice) => ({
                label: text(item.title),
                ...(indice === paginas.length - 1 ? {} : { onClick: () => voltar(indice + 1) })
              }))
            ]}
            onBack={() => voltar(paginas.length - 1)}
          >
            <StackDeRows
              rows={rows}
              valor={valor}
              text={text}
              components={components}
              gravar={gravar}
              executar={executar}
              abrirPagina={abrirPagina}
              highlight={highlight}
            />
          </SettingsPage>
        )}
      </Box>
    </SettingsDialog>
  );
}
