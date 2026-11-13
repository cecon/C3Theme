// Modal de configurações do motor (#119): a spec declara abas/seções, linhas, subpáginas e políticas; o motor lê os
// valores pela porta `settings`, desenha pelo SettingsDialog do @c3theme/ui e grava cada mudança. Nada de tela por
// app: o mesmo componente atende as configurações pessoais e as do servidor.

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { SettingsDialog, SettingsPage, type SettingsDialogStatus } from '@c3theme/ui';

import { iconByName, useEngine, useText, type C3Icons } from '../context';
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
import StackDeRows from './StackDeRows';
import { storeSection, storedSection, valoresDaSpec } from './valores';
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

function icone(name: string | undefined, icons: C3Icons | undefined): ReactNode {
  const Icone = iconByName(name, icons);
  return Icone === undefined ? undefined : <Icone size={18} />;
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
  const contexto = useMemo<SettingsContext>(
    () => ({ platform, ...(pageAccess === undefined ? {} : { pageAccess }) }),
    [platform, pageAccess]
  );
  const chave = restoreKey ?? text(def.title);
  const [valor, setValor] = useState<Record<string, SettingsValue>>(() => valoresDaSpec(def));
  const [versao, setVersao] = useState<string>();
  const [situacao, setSituacao] = useState<SettingsDialogStatus>('pronto');
  const [secao, setSecao] = useState(() => def.sections[0]?.id ?? '');
  const [paginas, setPaginas] = useState<string[]>([]);
  const [busca, setBusca] = useState('');
  const [destaque, setDestaque] = useState<string>();
  const [salvando, setSalvando] = useState(0);
  const [salvo, setSalvo] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const aberturaDaPagina = useRef<{ page: string; row?: string } | null>(null);
  const sections = useMemo(() => visibleSections(def, contexto), [def, contexto]);
  const atual = sections.find((candidata) => candidata.id === secao) ?? sections[0];
  const pagina = atual === undefined || paginas.length === 0 ? undefined : findPage(atual, paginas);
  const rows = visibleRows(pagina?.rows ?? atual?.rows, platform);
  const entries = useMemo(() => settingsEntries(def, contexto, text as SettingsText), [def, contexto, text]);

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
        const dados = await port.load();
        if (!ativo) return;
        setValor({ ...valoresDaSpec(def), ...dados.values });
        setVersao(dados.version);
        setSituacao('pronto');
      } catch {
        if (ativo) setSituacao('erro');
      }
    };
    void carregar();
    return () => {
      ativo = false;
    };
  }, [open, port, def, tentativa]);

  useEffect(() => {
    if (!open) return;
    const restaurada = def.restoreSection === true ? storedSection(chave) : undefined;
    setSecao(initialSection(def, contexto, pedida ?? restaurada));
    setPaginas([]);
    setBusca('');
  }, [open, def, contexto, pedida, chave]);

  // escolher um resultado ou voltar de uma subpágina rola até a linha, destaca e foca o controle
  useEffect(() => {
    if (destaque === undefined) return;
    const rolar = window.setTimeout(() => {
      const alvo = document.querySelector<HTMLElement>(`[data-settings-row="${destaque}"]`);
      alvo?.scrollIntoView?.({ block: 'center' });
      alvo?.querySelector<HTMLElement>('button, input, [role="switch"]')?.focus();
    }, 0);
    const limpar = window.setTimeout(() => setDestaque(undefined), 2500);
    return () => {
      window.clearTimeout(rolar);
      window.clearTimeout(limpar);
    };
  }, [destaque]);

  const mudarSecao = (id: string) => {
    setSecao(id);
    setPaginas([]);
    if (def.restoreSection === true) storeSection(chave, id);
  };

  const abrirPagina = (id: string) => {
    const ativo = document.activeElement;
    const linha = ativo instanceof HTMLElement ? ativo.closest<HTMLElement>('[data-settings-row]') : null;
    const row = linha?.dataset.settingsRow;
    aberturaDaPagina.current = { page: id, ...(row === undefined ? {} : { row }) };
    setPaginas((atuais) => [...atuais, id]);
  };

  const voltar = (ate: number) => {
    setPaginas((atuais) => atuais.slice(0, ate));
    const abertura = aberturaDaPagina.current;
    window.setTimeout(() => {
      // a linha que abriu a subpágina foi desmontada; o foco volta para a linha recém-renderizada
      const alvo = abertura?.row === undefined ? null : document.querySelector<HTMLElement>(`[data-settings-row="${abertura.row}"] button`);
      alvo?.focus();
    }, 0);
  };

  const escolher = (hit: { section: string; page?: string; id: string }) => {
    setSecao(hit.section);
    setPaginas(hit.page === undefined ? [] : hit.page.split('/'));
    setDestaque(hit.id);
  };

  const gravar = useCallback(
    async (row: SettingsRowDef, novo: string | number | boolean) => {
      setValor((atuais) => ({ ...atuais, [row.id]: novo }));
      setSalvo(false);
      if (port?.change === undefined) return;
      setSalvando((atualSalvando) => atualSalvando + 1);
      try {
        await port.change({
          modal: scope,
          section: secao,
          ...(paginas.length === 0 ? {} : { page: paginas.join('/') }),
          row: row.id,
          value: novo
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
      onRetry={() => setTentativa((atualTentativa) => atualTentativa + 1)}
      saving={salvando > 0}
      saved={salvo}
      pendingChanges={confirmarFechamento && salvando > 0}
      {...(footer === undefined ? {} : { footer })}
      {...(versao === undefined ? {} : { version: versao })}
    >
      {pagina === undefined ? (
        <StackDeRows
          rows={rows}
          valor={valor}
          text={text}
          components={components}
          gravar={gravar}
          executar={executar}
          abrirPagina={abrirPagina}
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
          />
        </SettingsPage>
      )}
    </SettingsDialog>
  );
}
