import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';

// material-ui
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

// third-party
import { More } from 'iconsax-reactjs';

import { evaluate } from '../conditions.mjs';
import { ActionDialog, notify } from '@c3theme/ui';
import { iconByName, useEngine, useText } from '../context';
import useAction from '../hooks/useAction';
import useUndoAction from '../hooks/useUndoAction';
import useActionInput from '../hooks/useActionInput';
import useGridFullScreen from '../hooks/useGridFullScreen';
import useActionReply from '../hooks/useActionReply';
import useTaskTelemetry from '../hooks/useTaskTelemetry';
import ActionBody from './ActionBody';
import BulkReport, { type Report } from './BulkReport';
import { useRepeatLog } from './RepeatLog';
import { loadPrefill } from './prefill';
import { selectionInput } from '../hooks/gridRows';
import { summaryText } from '../pages/list/selectionSum';
import { useUrlSourceParams } from '../pages/list/sourceParams';
import { plain, rowTitle, scopeText } from './bulkText';
import type { RefusedRecord } from '../api';
import type { ActionDef, BulkItem, FieldType, WireRecord } from '../types';
import { paletteOf } from '../tone';

/** Quantas ações aparecem como botão; as demais vão para o menu "Mais". */
const VISIBLE = 2;

export interface RecordActionsProps {
  entity: string;
  /** Um registro: as ações dele, no cabeçalho do detalhe. */
  id?: string;
  record?: WireRecord;
  /** Em lote: as linhas marcadas na lista. Aparecem as ações com `bulk` que valem para ao menos uma delas. */
  rows?: WireRecord[];
  /** Depois de rodar em lote, com os ids que falharam (a lista os deixa marcados). */
  onBulkDone?: (failed: string[]) => void;
}

/**
 * Botões das ações que o usuário pode rodar e cujo `visibleWhen` vale agora, para um registro ou para
 * as linhas marcadas na lista. Ação sem input e sem confirm roda no clique; as outras abrem o diálogo.
 */
export default function RecordActions({ entity, id, record, rows, onBulkDone }: RecordActionsProps) {
  const { entities, icons, client } = useEngine();
  const { def, capabilities } = entities[entity];
  const text = useText();
  const intl = useIntl();
  const { run, runBulk, runTogether, running, error, fieldErrors, reset } = useAction(entity);
  const deliver = useActionReply();
  const undoer = useUndoAction(entity);
  const [open, setOpen] = useState<ActionDef | null>(null);
  const form = useActionInput(open);
  const size = useGridFullScreen(form, open);
  // a tarefa vai do clique até rodar com sucesso; fechar o diálogo antes disso é abandono
  const task = useTaskTelemetry();
  const [menu, setMenu] = useState<HTMLElement | null>(null);
  // ação `repeat` (bipar em sequência): o resultado de cada leitura fica no diálogo
  const repeat = useRepeatLog();
  const [report, setReport] = useState<Report<ActionDef> | null>(null);
  const closeReport = () => {
    onBulkDone?.(report?.keep ?? report?.failed.map((f) => f.id) ?? []);
    setReport(null);
  };

  const bulk = rows !== undefined;
  // consulta do sistema: a ação em conjunto lê as linhas com os parâmetros da lista (os da URL)
  const sourceParams = useUrlSourceParams(def, bulk);
  const types = useMemo(() => Object.fromEntries(def.fields.map((f) => [f.name, f.type])) as Record<string, FieldType>, [def]);
  const targets = useMemo(() => (bulk ? rows : record ? [record] : []).map((r) => ({ row: r, values: plain(r) })), [bulk, rows, record]);
  // linhas em que a ação vale agora; em lote, as outras nem vão ao servidor
  const eligible = (a: ActionDef) => targets.filter((t) => !a.visibleWhen || evaluate(a.visibleWhen, t.values, types));
  // as da lista (`target: list`) ficam no topo da lista (ListActions)
  const available = (def.actions ?? []).filter(
    (a) => a.target !== 'list' && capabilities.actions?.[a.name] && (!bulk || a.bulk) && eligible(a).length > 0
  );

  const success = (action: ActionDef) => (action.successMessage ? text(action.successMessage) : 'Feito.');

  /** Uma linha do relatório: título da linha e a mensagem do erro, com os erros de campo. */
  const failure = (chosen: WireRecord[], f: RefusedRecord) => {
    const row = chosen.find((r) => r.id === f.id);
    const fields = Object.values(f.error.fields ?? {}).flatMap((list) => list.map((e) => e.message));
    return { id: f.id, title: row ? rowTitle(def, row) : `#${f.id}`, message: [f.error.message, ...fields].join(' ') };
  };

  /** Em conjunto: roda uma vez sobre todos; recusado, o relatório diz quem barrou e os outros ficam marcados. */
  async function together(action: ActionDef, chosen: WireRecord[], body: WireRecord): Promise<boolean | 'refused'> {
    const out = await runTogether(
      chosen.map((r) => r.id!),
      action.name,
      body,
      sourceParams
    );
    if (out.ok) {
      notify(out.result.message ?? success(action));
      deliver(out.result);
      onBulkDone?.([]);
      return true;
    }
    if (!out.refused) return false;
    const failed = out.refused.map((f) => failure(chosen, f));
    const barred = new Set(failed.map((f) => f.id));
    const n = failed.length;
    setReport({
      action,
      ok: 0,
      skipped: rows!.length - chosen.length,
      failed,
      message: `Nada foi feito: ${n === 1 ? '1 registro não aceita' : `${n} registros não aceitam`} a ação. Os outros ficam marcados para rodar de novo.`,
      keep: chosen.map((r) => r.id!).filter((id) => !barred.has(id))
    });
    return 'refused';
  }

  async function execute(action: ActionDef, body: WireRecord): Promise<boolean | 'refused'> {
    if (!bulk) {
      const result = await run(id!, action.name, body);
      if (!result) return false;
      const version = result.data?._version;
      // ação com inverse: Desfazer no aviso, conferido pela versão no servidor
      const undo =
        version && undoer.inverse(action)
          ? {
              label: 'Desfazer',
              onClick: () => void undoer.undo(id!, action, version).then((o) => notify(o.message, o.ok ? 'success' : 'warning'))
            }
          : undefined;
      if (action.repeat) repeat.push(result.message ?? success(action));
      else notify(result.message ?? success(action), 'success', undo);
      deliver(result);
      return true;
    }
    const chosen = eligible(action).map((t) => t.row);
    if (action.bulk === 'together') return together(action, chosen, body);
    const result = await runBulk(
      chosen.map((r) => r.id!),
      action.name,
      body
    );
    if (!result) return false;
    // título guardado agora: na fila, a linha que mudou de situação sai da lista antes do relatório fechar
    const failed = result.results.filter((r): r is BulkItem & { ok: false } => !r.ok).map((f) => failure(chosen, f));
    const skipped = rows!.length - chosen.length;
    if (failed.length === 0 && skipped === 0) {
      // com um registro só, a mensagem do sistema vale; com vários, o total
      const only = result.results.length === 1 && result.results[0].ok ? result.results[0].message : undefined;
      notify(only ?? (result.meta.ok === 1 ? success(action) : `${success(action)} (${result.meta.ok} registros)`));
      onBulkDone?.([]);
    } else {
      // a seleção só muda quando o relatório fecha: sem linha marcada, a barra (e este diálogo) somem
      setReport({ action, ok: result.meta.ok, skipped, failed });
    }
    return true;
  }

  async function start(action: ActionDef) {
    setMenu(null);
    task.start({ entity, op: 'action', action: action.name });
    // em lote sempre confirma: o diálogo diz em quantos registros vai rodar
    if (!bulk && !action.input && !action.confirm) {
      const ok = await execute(action, {});
      if (ok) task.done();
      else setOpen(action); // mostra o erro no diálogo, em vez de um aviso que some
      return;
    }
    reset();
    repeat.clear();
    const initial = await loadPrefill(client, entity, action, bulk ? undefined : id);
    if (!initial) return task.abandon();
    form.reset(action, {
      ...initial,
      ...selectionInput(
        action,
        eligible(action).map((t) => t.row),
        (r) => rowTitle(def, r)
      )
    });
    setOpen(action);
  }

  async function confirm() {
    const body = open && form.body();
    const done = open && body ? await execute(open, body) : false;
    // recusada em conjunto: o diálogo fecha e o relatório diz quem barrou
    if (done === 'refused') task.abandon();
    else if (done) task.done();
    // bipar em sequência: o diálogo fica, o input volta aos padrões e o foco ao primeiro campo
    if (done === true && open?.repeat && !bulk) {
      reset();
      form.reset(open);
      task.start({ entity, op: 'action', action: open.name });
    } else if (done) setOpen(null);
  }

  // sem ação para mostrar, segue montado enquanto o diálogo ou o relatório estão abertos
  if (available.length === 0 && !open && !report) return null;

  const button = (a: ActionDef) => {
    const Icon = iconByName(a.icon, icons);
    return (
      <Button
        key={a.name}
        variant={bulk ? 'text' : 'outlined'}
        size={bulk ? 'small' : undefined}
        // na faixa primária da seleção, a ação neutra fica na cor primária
        color={bulk && !a.tone ? 'primary' : paletteOf(a.tone ?? 'neutral', 'secondary')}
        startIcon={Icon ? <Icon size={bulk ? 16 : 18} /> : undefined}
        onClick={() => start(a)}
        disabled={running}
      >
        {text(a.label)}
        {/* a contagem só aparece quando a ação não vale para todas as marcadas */}
        {bulk && eligible(a).length < rows!.length && ` (${eligible(a).length})`}
      </Button>
    );
  };
  const shown = available.length > VISIBLE + 1 ? available.slice(0, VISIBLE) : available;
  const rest = available.slice(shown.length);
  const fieldErrorText = (name: string) => form.localErrors[name] ?? fieldErrors[name]?.[0]?.message;
  // erro geral só quando não é de campo, ou quando cita campo que o diálogo não mostra
  const generalError =
    error && (Object.keys(fieldErrors).length === 0 || Object.keys(fieldErrors).some((k) => !form.knows(k))) ? error : undefined;

  return (
    <>
      {shown.map(button)}
      {rest.length > 0 && (
        <>
          <Button variant="outlined" color="secondary" onClick={(e) => setMenu(e.currentTarget)} aria-label="Mais ações">
            <More size={18} />
          </Button>
          <Menu anchorEl={menu} open={menu !== null} onClose={() => setMenu(null)}>
            {rest.map((a) => (
              <MenuItem key={a.name} onClick={() => start(a)} sx={a.tone === 'danger' ? { color: 'error.main' } : undefined}>
                {text(a.label)}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}

      <ActionDialog
        open={open !== null}
        title={open ? text(open.label) : ''}
        description={
          open && bulk ? (
            <>
              {open.description && <>{text(open.description)} </>}
              {bulkScope(open)}
            </>
          ) : open?.description ? (
            text(open.description)
          ) : undefined
        }
        confirm={open?.confirm ? text(open.confirm) : undefined}
        confirmLabel={open?.confirmLabel ? text(open.confirmLabel) : undefined}
        tone={open?.tone}
        {...size}
        loading={running}
        error={generalError}
        dirty={form.dirty}
        onClose={() => {
          task.abandon();
          setOpen(null);
        }}
        onConfirm={confirm}
      >
        <ActionBody
          entity={entity}
          id={bulk ? undefined : id}
          action={open}
          form={form}
          error={fieldErrorText}
          bulk={bulk}
          ids={bulk && open?.bulk === 'together' ? eligible(open).map((t) => t.row.id!) : undefined}
          params={sourceParams}
          log={open?.repeat && !bulk ? repeat.items : undefined}
        />
      </ActionDialog>

      <BulkReport report={report} title={report ? text(report.action.label) : ''} onClose={closeReport} />
    </>
  );

  function bulkScope(a: ActionDef) {
    const chosen = eligible(a).map((t) => t.row);
    const fields = a.summary?.map((s) => s.field) ?? [];
    return scopeText(a, chosen.length, rows!.length, fields.length ? summaryText(def, chosen, fields, intl.locale, text) : '');
  }
}
