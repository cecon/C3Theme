import { FormattedMessage } from 'react-intl';

// material-ui
import Typography from '@mui/material/Typography';

import { Panel } from '@c3theme/ui';

export default function SamplePage() {
  return (
    <Panel title={<FormattedMessage id="inicio.titulo" defaultMessage="Página de exemplo" />}>
      <Typography color="text.secondary">
        <FormattedMessage
          id="inicio.texto"
          defaultMessage="Ponto de partida do sistema. Crie as telas em src/pages, registre a rota no App.tsx e o item no menu.ts."
        />
      </Typography>
    </Panel>
  );
}
