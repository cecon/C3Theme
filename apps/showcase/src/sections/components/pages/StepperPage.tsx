import Example, { ExamplePage } from '../Example';
import { LinearDemo, NonLinearDemo, VerticalDemo } from './stepper/demos';
import { CarouselDemo, CustomIconsDemo } from './stepper/moreDemos';

export default function StepperPage() {
  return (
    <ExamplePage intro="Etapas guiam a pessoa por um processo em ordem, como cadastro ou finalização de compra.">
      <Example
        title="Linear"
        description="Com etapa opcional que pode ser pulada. Vira vertical no celular."
        code={`<Stepper activeStep={etapa}>
  <Step><StepLabel>Carrinho</StepLabel></Step>
  <Step><StepLabel optional={<Typography variant="caption">Opcional</Typography>}>Entrega</StepLabel></Step>
</Stepper>`}
        wide
      >
        <LinearDemo />
      </Example>

      <Example
        title="Não linear"
        description="Etapas clicáveis, em qualquer ordem."
        code={`<Stepper nonLinear alternativeLabel activeStep={etapa}>
  <Step completed={feitas[0]}><StepButton onClick={() => setEtapa(0)}>Dados da empresa</StepButton></Step>
</Stepper>`}
      >
        <NonLinearDemo />
      </Example>

      <Example
        title="Vertical"
        code={`<Stepper orientation="vertical" activeStep={etapa}>
  <Step><StepLabel>...</StepLabel><StepContent>...</StepContent></Step>
</Stepper>`}
      >
        <VerticalDemo />
      </Example>

      <Example
        title="Ícones e erro"
        code={`<StepLabel error slots={{ stepIcon: MeuIcone }} optional={<Typography color="error">Cartão recusado</Typography>}>Pagamento</StepLabel>`}
      >
        <CustomIconsDemo />
      </Example>

      <Example
        title="Carrossel"
        description="MobileStepper com pontos e deslizamento."
        code={`<MobileStepper variant="dots" steps={4} activeStep={atual} nextButton={...} backButton={...} />`}
      >
        <CarouselDemo />
      </Example>
    </ExamplePage>
  );
}
