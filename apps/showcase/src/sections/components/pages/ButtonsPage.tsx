import { ExamplePage } from '../Example';
import { BasicExamples } from './buttons/BasicExamples';
import { MoreExamples } from './buttons/MoreExamples';

export default function ButtonsPage() {
  return (
    <ExamplePage intro="Botões disparam ações. Use o preenchido para a ação principal da tela, o contornado para ações secundárias e o de texto para ações discretas.">
      <BasicExamples />
      <MoreExamples />
    </ExamplePage>
  );
}
