// material-ui
import Typography from '@mui/material/Typography';

import { Panel } from '@c3theme/ui';

/** Ponto de partida para uma página nova: só um painel com texto. */
export default function SamplePage() {
  return (
    <Panel title="Página de exemplo">
      <Typography color="text.secondary">
        Esta é uma página em branco dentro do layout, com menu, header, caminho e rodapé prontos. Copie este arquivo, troque o conteúdo do
        painel e cadastre a rota e o item de menu da sua área.
      </Typography>
    </Panel>
  );
}
