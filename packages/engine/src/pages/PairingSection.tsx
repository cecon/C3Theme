import { useMemo } from 'react';

import { DeviceLink, notify, Panel } from '@c3theme/ui';
import { evaluate } from '../conditions.mjs';
import { useEngine, useText } from '../context';
import useAction from '../hooks/useAction';
import type { EntityDef, FieldType, PairingDef, Text, WireRecord } from '../types';
import { plain } from '../widgets/bulkText';

const str = (v: unknown) => (v === null || v === undefined || v === '' ? undefined : String(v));

interface Props {
  def: EntityDef;
  id: string;
  record: WireRecord;
  title?: Text;
  pairing: PairingDef;
}

/**
 * Seção de ligar aparelho (`pairing`, #6): o `DeviceLink` do @c3theme/ui com o estado tirado do registro (situação,
 * texto do QR, código) e os botões rodando ações de registro. Com `live` na entidade, o registro relê sozinho e o QR
 * novo aparece. Valor da situação fora de `states` esconde a seção.
 */
export default function PairingSection({ def, id, record, title, pairing: p }: Props) {
  const { entities } = useEngine();
  const text = useText();
  const { run } = useAction(def.name);
  const { capabilities } = entities[def.name];
  const types = useMemo(() => Object.fromEntries(def.fields.map((f) => [f.name, f.type])) as Record<string, FieldType>, [def]);
  const status = p.states[String(record[p.status] ?? '')];
  if (!status) return null;

  // botão só com a ação declarada, permitida e valendo agora (visibleWhen)
  const action = (name?: string) => {
    const a = name ? def.actions?.find((x) => x.name === name && x.target !== 'list') : undefined;
    return a && capabilities.actions?.[a.name] && (!a.visibleWhen || evaluate(a.visibleWhen, plain(record), types)) ? a : undefined;
  };
  const go = (name: string, input?: WireRecord) =>
    void run(id, name, input).then((r) => {
      if (!r) notify('Não deu para concluir. Tente de novo.', 'error');
      else if (r.message) notify(r.message);
    });
  const button = (name?: string) => {
    const a = action(name);
    return a ? () => go(a.name) : undefined;
  };
  const code = action(p.actions?.code);
  const phoneField = code?.input?.fields[0]?.name;
  const field = (name?: string) => (name ? str(record[name]) : undefined);

  return (
    <Panel title={title ? text(title) : undefined}>
      <DeviceLink
        status={status}
        qr={field(p.qr)}
        pairingCode={field(p.code)}
        phone={field(p.phone)}
        account={field(p.account)}
        error={field(p.error)}
        steps={p.steps?.map((s) => text(s))}
        codeSteps={p.codeSteps?.map((s) => text(s))}
        onUseQr={button(p.actions?.qr)}
        onCancel={button(p.actions?.cancel)}
        onRetry={button(p.actions?.retry)}
        onUsePairingCode={code && phoneField ? (phone) => go(code.name, { [phoneField]: phone }) : undefined}
      />
    </Panel>
  );
}
