import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import useSWR, { useSWRConfig } from 'swr';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';

import { evaluate } from '../conditions.mjs';
import { FormSkeleton, notify, Panel } from '@c3theme/ui';
import { ApiError } from '../api';
import { branchLabel, useEngine, useText } from '../context';
import FieldInput from '../widgets/FieldInput';
import RecordActions from '../widgets/RecordActions';
import { initialRecord, newLabel, toInput, urlValues, withParent } from '../formValues';
import { allDayPatch } from '../calendarForm';
import { EditButtons, FormFrame } from './FormHeader';
import DeleteDialog from './DeleteDialog';
import FormSections from './FormSections';
import { formBlocks } from '../skeletonShape';
import LossDialog from './LossDialog';
import useLeaveGuard from '../hooks/useLeaveGuard';
import useFormTelemetry from '../hooks/useFormTelemetry';
import { changedFields } from '../telemetry';
import { fieldTypes, fieldVisible, lostSections, sectionGates } from '../sectionVisibility';
import type { FieldDef, Text, WireRecord } from '../types';
import { createdPath, extraReadOnly, recordTitle } from '../views';

type Errors = Record<string, string>;

/** Formulário aberto dentro de outro (diálogo): campos fixos travados e sem navegação. */
export interface Embedded {
  /** Valores que o formulário não mostra e sempre envia, ex.: { company_id: '7' }. */
  fixed: Record<string, unknown>;
  /** Valores iniciais editáveis de um registro novo, ex.: o nome já digitado na busca. */
  initial?: WireRecord;
  /** Chamado ao fechar; `changed` diz se algo foi gravado ou excluído e `saved` traz o registro gravado. */
  onClose: (changed: boolean, saved?: WireRecord) => void;
  /** Avisa quem abriu o formulário se há edição não salva, para não descartar ao clicar fora do diálogo. */
  onDirtyChange?: (dirty: boolean) => void;
  /** Abre já editando (o lápis da lista); Cancelar fecha em vez de voltar à leitura. */
  edit?: boolean;
}

/**
 * Criação (`id` ausente), detalhe e edição de um registro.
 * O detalhe é o próprio formulário em modo leitura: o usuário vê o mesmo layout que vai editar.
 */
export default function EntityForm({ entity, id, embedded }: { entity: string; id?: string; embedded?: Embedded }) {
  const { client, entities, components, org } = useEngine();
  const { def, capabilities } = entities[entity];
  const scoped = org && def.scope && def.scope !== 'group' ? org : undefined;
  const text = useText();
  const navigate = useNavigate();
  const { mutate } = useSWRConfig();

  const isNew = id === undefined;
  const { data: loaded, error: loadError } = useSWR(isNew ? null : ['c3-record', entity, id], () => client.get(entity, id!));
  // "Adicionar" com um preset ativo (`/cliente/new?preset=clientes`) já traz os defaults dele,
  const [params] = useSearchParams();
  // e o calendário abre o novo com a data do dia clicado (`?f.prazo=2026-10-31`)
  const blank = () => ({
    ...initialRecord(def, params.get('preset'), embedded, (e) => entities[e]?.def),
    ...(embedded ? {} : urlValues(params, def.fields))
  });
  const [record, setRecord] = useState<WireRecord>(() => (isNew ? blank() : {}));
  const [editing, setEditing] = useState(isNew || Boolean(embedded?.edit));
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmLoss, setConfirmLoss] = useState<Text[]>();

  useEffect(() => {
    if (loaded) setRecord(loaded);
  }, [loaded]);

  // edição não salva: o que está na tela difere do que veio do servidor (ou dos padrões, se é novo)
  const initial = useMemo(() => (isNew ? blank() : loaded), [isNew, def, loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = editing && !saving && initial !== undefined && JSON.stringify(record) !== JSON.stringify(initial);
  const onDirtyChange = embedded?.onDirtyChange;
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  useLeaveGuard(dirty);
  const taskDone = useFormTelemetry(entity, isNew, editing);

  const types = useMemo(() => fieldTypes(def), [def]);
  const gates = useMemo(() => sectionGates(def), [def]);
  // o campo some com a seção dele (visibleWhen da seção) ou pela condição própria
  const visible = (f: FieldDef) => fieldVisible(f, record, types, gates);
  // senha de registro gravado: vazio mantém a atual, então não é obrigatória
  const required = (f: FieldDef) =>
    !(f.writeOnly && !isNew) && (Boolean(f.required) || Boolean(f.requiredWhen && evaluate(f.requiredWhen, record, types)));

  // travado: sem permissão para alterar; na alteração, createOnly ou readOnlyWhen sobre o registro como está gravado
  const locked = (f: FieldDef) =>
    f.denied === 'readOnly' || (!isNew && Boolean(f.createOnly || (f.readOnlyWhen && loaded && evaluate(f.readOnlyWhen, loaded, types))));

  const change = (name: string, value: unknown) => {
    // dia inteiro do calendário: início e fim vão para a meia-noite (ou voltam a ter hora)
    setRecord((r) => ({ ...r, [name]: value, ...allDayPatch(def, r, name, value) }));
    setErrors(({ [name]: _, ...rest }) => rest);
  };

  // lista de uma filha with_parent: troca as linhas e limpa os erros dela
  const onRows = (child: string, rows: WireRecord[]) => {
    setRecord((r) => ({ ...r, [child]: rows }));
    setErrors((errs) => Object.fromEntries(Object.entries(errs).filter(([k]) => k.split('.')[0] !== child)));
  };

  const sections = def.views?.form?.sections ?? [{ rows: def.fields.filter((f) => !f.readOnly).map((f) => [f.name]) }];
  const readOnlyFields = extraReadOnly(def, sections);

  async function save(confirmed = false) {
    // seção que ficou escondida apaga o que tinha gravado: confirma antes
    const lost = isNew ? [] : lostSections(def, loaded, record);
    if (lost.length && !confirmed) {
      setConfirmLoss(lost);
      return;
    }
    setConfirmLoss(undefined);
    // mesma regra do backend, para o erro aparecer antes de ir ao servidor
    const local: Errors = {};
    for (const f of def.fields) {
      if (f.readOnly || !visible(f)) continue;
      const v = record[f.name];
      if (required(f) && (v === null || v === undefined || v === '')) local[f.name] = 'Campo obrigatório.';
    }
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }
    setSaving(true);
    setFormError(undefined);
    try {
      const body = toInput(def, record, visible, (e) => entities[e]?.def);
      const saved = isNew ? await client.create(entity, body) : await client.update(entity, id!, body);
      taskDone({ fields: changedFields(initial, record) });
      notify('Salvo.');
      mutate((key) => Array.isArray(key) && key[0] === 'c3-list' && key[1] === entity);
      if (embedded) {
        embedded.onClose(true, saved);
      } else if (isNew) {
        navigate(createdPath(def, saved), { replace: true });
      } else {
        mutate(['c3-record', entity, id], saved, { revalidate: false });
        setRecord(saved);
        setEditing(false);
      }
    } catch (e) {
      if (e instanceof ApiError && e.fields) {
        setErrors(Object.fromEntries(Object.entries(e.fields).map(([k, v]) => [k, v[0].message])));
        // erros das linhas filhas (`itens.2.ean`) são mostrados na seção delas
        const unknown = Object.keys(e.fields).filter(
          (k) => !def.fields.some((f) => f.name === k) && !withParent(def).some((r) => r.entity === k.split('.')[0])
        );
        setFormError(unknown.length ? e.message : undefined);
      } else {
        setFormError(e instanceof Error ? e.message : 'Erro ao salvar.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setConfirmDelete(false);
    try {
      await client.remove(entity, id!);
      mutate((key) => Array.isArray(key) && key[0] === 'c3-list' && key[1] === entity);
      notify('Excluído.');
      if (embedded) embedded.onClose(true);
      else navigate(`/${entity}`, { replace: true });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Erro ao excluir.');
    }
  }

  // diálogo com rodapé: o formulário é as partes do diálogo; enquanto carrega, só um respiro em volta
  const pad = embedded && def.views?.form?.actions === 'footer' ? { m: 3 } : undefined;
  if (loadError) {
    return (
      <Alert sx={pad} severity={loadError instanceof ApiError && loadError.status === 404 ? 'warning' : 'error'}>
        {loadError.message}
      </Alert>
    );
  }
  if (!isNew && !loaded) {
    const blocks = formBlocks(def, sections, embedded ? Object.keys(embedded.fixed) : []);
    return (
      <Box sx={pad}>
        <FormSkeleton blocks={blocks.length ? blocks : undefined} />
      </Box>
    );
  }

  const title = isNew ? newLabel(def, text) : (loaded && recordTitle(def, loaded)) || text(def.label.singular);
  // capabilities são da filial ativa; o registro pode ser de outra filial (lista com várias)
  const canUpdate = capabilities.update && (loaded?._can?.update ?? true);
  const canDelete = capabilities.delete && (loaded?._can?.delete ?? true);
  // dono do registro: no novo, onde vai ser gravado (a filial ativa); no existente, de quem é
  let owner: string | undefined;
  if (scoped && isNew) {
    const { branch, company } = branchLabel(scoped, scoped.active);
    owner = def.scope === 'branch' ? `Será gravado em ${branch} · ${company}` : `Será gravado em ${company}`;
  } else if (scoped) {
    owner = [loaded?._branch?.title, loaded?._company?.title].filter(Boolean).join(' · ');
  }
  const DetailComponent = !editing && def.views?.detail?.component ? components[def.views.detail.component] : undefined;
  const form = def.views?.form;
  // botões no fim (da página ou do diálogo): o título da página já diz o que é
  const footer = form?.actions === 'footer';
  const submit = text((isNew ? form?.submitLabel?.new : form?.submitLabel?.edit) ?? 'Salvar');
  const cancel = () => {
    if ((isNew || embedded?.edit) && embedded) embedded.onClose(false);
    else if (isNew) navigate(-1);
    else {
      setRecord(loaded!);
      setErrors({});
      setFormError(undefined);
      setEditing(false);
    }
  };

  const inDialog = Boolean(embedded) && footer;
  const readButtons = !editing && (
    <>
      {embedded && <Button onClick={() => embedded.onClose(false)}>Fechar</Button>}
      {!isNew && loaded && <RecordActions entity={entity} id={id!} record={loaded} />}
      {canDelete && (
        <Button color="error" onClick={() => setConfirmDelete(true)}>
          Excluir
        </Button>
      )}
      {canUpdate && (
        <Button variant="contained" onClick={() => setEditing(true)}>
          Editar
        </Button>
      )}
    </>
  );
  const editButtons = editing && (
    <EditButtons
      footer={footer}
      dialog={inDialog}
      submit={submit}
      saving={saving}
      onCancel={cancel}
      onDelete={inDialog && !isNew && canDelete ? () => setConfirmDelete(true) : undefined}
    />
  );

  return (
    <>
      <FormFrame
        dialog={inDialog}
        title={inDialog && editing && !isNew ? `Editar ${text(def.label.singular).toLowerCase()}` : title}
        owner={owner}
        header={!(footer && editing && !owner)}
        top={readButtons || (!footer && editButtons)}
        bottom={footer && editButtons}
        onSubmit={(e) => {
          e.preventDefault();
          // diálogos abertos daqui (filho, cadastro rápido, ação) são portais: o submit deles sobe pelo React até aqui
          e.stopPropagation();
          if (editing) save();
        }}
      >
        {formError && <Alert severity="error">{formError}</Alert>}

        {DetailComponent ? (
          <DetailComponent entity={def} record={record} />
        ) : (
          <FormSections
            sections={sections}
            ctx={{ def, record, errors, editing, id, dirty, embedded, flat: inDialog, visible, required, locked, change, onRows }}
          />
        )}

        {!isNew && readOnlyFields.length > 0 && (
          <Panel>
            <Grid container spacing={2.5}>
              {readOnlyFields.map((f) => (
                <Grid key={f.name} size={{ xs: 12, md: 6 }}>
                  <FieldInput field={f} value={record[f.name]} onChange={() => {}} readOnly />
                </Grid>
              ))}
            </Grid>
          </Panel>
        )}
      </FormFrame>

      <LossDialog sections={confirmLoss} onCancel={() => setConfirmLoss(undefined)} onConfirm={() => save(true)} />
      <DeleteDialog open={confirmDelete} title={title} onCancel={() => setConfirmDelete(false)} onConfirm={remove} />
    </>
  );
}
