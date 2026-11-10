import Box from '@mui/material/Box';

import { SoftAvatar } from '@c3theme/ui';
import { useEngine } from '../context';
import { avatarTone, initialsOf } from '../pages/list/richCell';
import type { EntityDef, RecordImageDef, WireRecord } from '../types';
import { recordTitle } from '../views';

/** Props do componente que desenha o rosto do registro (`image: { component }`). */
export interface RecordImageProps {
  entity: EntityDef;
  record: WireRecord;
  /** Lado do quadrado, em px. */
  size: number;
}

/**
 * Rosto do registro na galeria e no cabeçalho (#13): a imagem do campo (URL), o componente registrado na shell, ou as
 * iniciais do título numa cor estável por registro. `square` preenche um quadrado (cartão); sem ele, avatar redondo.
 */
export default function RecordImage(props: { def: EntityDef; record: WireRecord; image?: RecordImageDef; size: number; square?: boolean }) {
  const { def, record, image, size, square } = props;
  const { components } = useEngine();
  const title = recordTitle(def, record) || String(record.id ?? '');
  if (image && typeof image === 'object') {
    const Face = components[image.component] as unknown as React.ComponentType<RecordImageProps> | undefined;
    if (Face) return <Face entity={def} record={record} size={size} />;
  }
  const src = typeof image === 'string' && typeof record[image] === 'string' ? (record[image] as string) : undefined;
  if (square && src)
    return (
      <Box component="img" src={src} alt="" loading="lazy" sx={{ width: '100%', height: size, objectFit: 'cover', display: 'block' }} />
    );
  if (square)
    return (
      <Box sx={{ height: size, display: 'grid', placeItems: 'center', bgcolor: 'action.hover' }}>
        <SoftAvatar size="xl" tone={avatarTone(record.id as string)} aria-hidden>
          {initialsOf(title)}
        </SoftAvatar>
      </Box>
    );
  return (
    <SoftAvatar src={src} alt="" tone={avatarTone(record.id as string)} sx={{ width: size, height: size, fontSize: size / 2.5 }}>
      {initialsOf(title)}
    </SoftAvatar>
  );
}
