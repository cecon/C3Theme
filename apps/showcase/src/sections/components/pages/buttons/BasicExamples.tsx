// Exemplos básicos de botão.
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { Add, ArrowDown2, Send2, Trash } from 'iconsax-reactjs';
import Example, { Row } from '../../Example';
import { COLORS, COLOR_LABEL, LoadingDemo } from './demos';

/** Variantes, cores, tamanhos, ícone e carregando. */
export function BasicExamples() {
  return (
    <>
      <Example
        title="Variantes"
        description="Preenchido, contornado e texto."
        code={`<Button variant="contained">Salvar</Button>
<Button variant="outlined">Cancelar</Button>
<Button variant="text">Ver detalhes</Button>`}
      >
        <Row>
          <Button variant="contained">Salvar</Button>
          <Button variant="outlined">Cancelar</Button>
          <Button variant="text">Ver detalhes</Button>
        </Row>
      </Example>

      <Example title="Desabilitados" code={`<Button variant="contained" disabled>Salvar</Button>`}>
        <Row>
          <Button variant="contained" disabled>
            Salvar
          </Button>
          <Button variant="outlined" disabled>
            Cancelar
          </Button>
          <Button variant="text" disabled>
            Ver detalhes
          </Button>
        </Row>
      </Example>

      <Example
        title="Cores"
        description="Todas as cores do tema nas três variantes."
        code={`<Button variant="contained" color="success">Sucesso</Button>`}
        wide
      >
        <Stack spacing={1.5}>
          {(['contained', 'outlined', 'text'] as const).map((variant) => (
            <Row key={variant}>
              {COLORS.map((color) => (
                <Button key={color} variant={variant} color={color}>
                  {COLOR_LABEL[color]}
                </Button>
              ))}
            </Row>
          ))}
        </Stack>
      </Example>

      <Example
        title="Tamanhos"
        code={`<Button size="small">Pequeno</Button>
<Button size="medium">Médio</Button>
<Button size="large">Grande</Button>`}
      >
        <Stack spacing={1.5}>
          {(['contained', 'outlined'] as const).map((variant) => (
            <Row key={variant}>
              <Button variant={variant} size="small">
                Pequeno
              </Button>
              <Button variant={variant} size="medium">
                Médio
              </Button>
              <Button variant={variant} size="large">
                Grande
              </Button>
            </Row>
          ))}
        </Stack>
      </Example>

      <Example
        title="Com ícone"
        description="Ícone antes ou depois do texto."
        code={`<Button variant="contained" startIcon={<Add size={18} />}>Novo</Button>
<Button variant="outlined" color="error" startIcon={<Trash size={18} />}>Excluir</Button>
<Button endIcon={<Send2 size={18} />}>Enviar</Button>`}
      >
        <Row>
          <Button variant="contained" startIcon={<Add size={18} />}>
            Novo
          </Button>
          <Button variant="outlined" color="error" startIcon={<Trash size={18} />}>
            Excluir
          </Button>
          <Button variant="contained" color="success" endIcon={<Send2 size={18} />}>
            Enviar
          </Button>
          <Button variant="text" endIcon={<ArrowDown2 size={16} />}>
            Mais opções
          </Button>
        </Row>
      </Example>

      <Example
        title="Carregando"
        description="Clique para simular um envio de 1,5 s."
        code={`<Button variant="contained" loading={salvando} onClick={salvar}>Salvar</Button>
<Button loading={salvando} loadingPosition="start" startIcon={<Send2 />}>Enviar</Button>`}
      >
        <LoadingDemo />
      </Example>
    </>
  );
}
