import Example, { ExamplePage } from '../Example';
import { AlertDemo, ConfirmationDemo, FormDemo, SimpleDemo } from './dialogs/BasicDemos';
import { CustomizedDemo, FullScreenDemo, ResponsiveDemo, SizesDemo } from './dialogs/LayoutDemos';
import { DraggableDemo, ScrollDemo, TransitionDemo } from './dialogs/BehaviorDemos';

export default function DialogsPage() {
  return (
    <ExamplePage intro="Diálogos interrompem a tarefa para pedir uma decisão ou informação. Sempre confirme antes de excluir.">
      <Example
        title="Simples"
        description="Escolha em uma lista."
        code={`<Dialog open={aberto} onClose={fechar}>
  <DialogTitle>Escolha o responsável</DialogTitle>
  <List>...</List>
</Dialog>`}
      >
        <SimpleDemo />
      </Example>

      <Example
        title="Alerta de exclusão"
        code={`<Dialog open={aberto} maxWidth="xs">
  <DialogContent>Excluir este cliente?</DialogContent>
  <DialogActions><Button>Cancelar</Button><Button color="error" variant="contained">Excluir</Button></DialogActions>
</Dialog>`}
      >
        <AlertDemo />
      </Example>

      <Example
        title="Formulário"
        code={`<Dialog slotProps={{ paper: { component: 'form', onSubmit } }}>...<Button type="submit">Enviar</Button></Dialog>`}
      >
        <FormDemo />
      </Example>

      <Example
        title="Confirmação"
        description="Escolha que só vale ao confirmar."
        code={`<DialogContent dividers><RadioGroup value={rascunho} onChange={...} /></DialogContent>`}
      >
        <ConfirmationDemo />
      </Example>

      <Example
        title="Personalizado"
        description="Botão de fechar no título e divisórias."
        code={`<DialogTitle>...</DialogTitle>
<IconButton aria-label="Fechar" sx={{ position: 'absolute', right: 12, top: 12 }} />
<DialogContent dividers>...</DialogContent>`}
      >
        <CustomizedDemo />
      </Example>

      <Example
        title="Tela cheia"
        code={`<Dialog fullScreen slots={{ transition: SlideUp }}>
  <AppBar position="sticky">...</AppBar>
</Dialog>`}
      >
        <FullScreenDemo />
      </Example>

      <Example title="Tamanhos" code={`<Dialog maxWidth="md" fullWidth>...</Dialog>`}>
        <SizesDemo />
      </Example>

      <Example
        title="Responsivo"
        description="Tela cheia abaixo de 900 px."
        code={`const telaCheia = useMediaQuery((t) => t.breakpoints.down('md'));
<Dialog fullScreen={telaCheia}>...</Dialog>`}
      >
        <ResponsiveDemo />
      </Example>

      <Example
        title="Arrastável"
        description="Sem biblioteca extra: eventos de ponteiro no papel."
        code={`<Dialog slots={{ paper: PapelArrastavel }}>...</Dialog>`}
      >
        <DraggableDemo />
      </Example>

      <Example
        title="Rolagem"
        description="Conteúdo longo rola dentro do diálogo ou com a página."
        code={`<Dialog scroll="paper">...</Dialog>
<Dialog scroll="body">...</Dialog>`}
      >
        <ScrollDemo />
      </Example>

      <Example title="Transição" code={`<Dialog slots={{ transition: SlideUp }}>...</Dialog>`}>
        <TransitionDemo />
      </Example>
    </ExamplePage>
  );
}
