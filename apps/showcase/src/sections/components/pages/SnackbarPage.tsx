import Button from '@mui/material/Button';
import { notify } from '@c3theme/ui';
import Example, { ExamplePage, Row } from '../Example';
import { BasicDemo, ColoredDemo, DurationDemo, PositionDemo, SEVERITIES, TransitionDemo, UndoDemo } from './snackbar/demos';
import { StackDemo } from './snackbar/StackDemo';

export default function SnackbarPage() {
  return (
    <ExamplePage intro="Avisos são mensagens curtas que aparecem num canto e somem sozinhas. No dia a dia use notify() do @c3theme/ui; os demais exemplos mostram o Snackbar do MUI para casos especiais.">
      <Example
        title="notify (recomendado)"
        description="Uma chamada, de qualquer lugar do app."
        code={`import { notify } from '@c3theme/ui';

notify('Cliente salvo com sucesso.');           // sucesso
notify('Não foi possível salvar.', 'error');`}
        wide
      >
        <Row gap={1}>
          {SEVERITIES.map((s) => (
            <Button key={s.severity} variant="contained" color={s.severity} onClick={() => notify(s.text, s.severity)}>
              {s.label}
            </Button>
          ))}
        </Row>
      </Example>

      <Example
        title="Básico"
        code={`<Snackbar open={aberto} autoHideDuration={4000} onClose={() => setAberto(false)} message="Rascunho salvo." />`}
      >
        <BasicDemo />
      </Example>

      <Example
        title="Com ação e fechar"
        description="Desfazer uma exclusão."
        code={`<Snackbar message="E-mail movido para a lixeira." action={<><Button onClick={desfazer}>Desfazer</Button><IconButton aria-label="Fechar" /></>} />`}
      >
        <UndoDemo />
      </Example>

      <Example
        title="Coloridos"
        description="Alert dentro do Snackbar, em três aparências."
        code={`<Snackbar open={aberto} onClose={fechar}>
  <Alert severity="warning" variant="outlined" onClose={fechar}>...</Alert>
</Snackbar>`}
        wide
      >
        <ColoredDemo />
      </Example>

      <Example title="Posição" code={`<Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center' }} ... />`}>
        <PositionDemo />
      </Example>

      <Example title="Transições" code={`<Snackbar slots={{ transition: Fade }} ... />`}>
        <TransitionDemo />
      </Example>

      <Example title="Tempo para fechar" code={`<Snackbar autoHideDuration={segundos * 1000} ... />`}>
        <DurationDemo />
      </Example>

      <Example
        title="Vários ao mesmo tempo"
        description="Pilha com limite, sem repetidos e com 'fechar todos'."
        code={`// lista no estado + Portal com Stack fixo no canto
<Portal>
  <Stack sx={{ position: 'fixed', top: 80, right: 16 }}>
    {avisos.map((a) => <Grow in key={a.id}><Alert severity={a.severity} onClose={() => remover(a.id)}>{a.text}</Alert></Grow>)}
  </Stack>
</Portal>`}
      >
        <StackDemo />
      </Example>
    </ExamplePage>
  );
}
