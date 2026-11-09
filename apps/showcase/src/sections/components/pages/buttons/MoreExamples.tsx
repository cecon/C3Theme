// Exemplos de botão além do básico.
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Fab from '@mui/material/Fab';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { Add, ArrowDown2, Edit, DocumentUpload, Heart, Home2, Send2, Setting2, Trash } from 'iconsax-reactjs';
import { notify, SoftIconButton } from '@c3theme/ui';
import Example, { Row } from '../../Example';
import { COLOR_LABEL, TONES, ToggleDemos } from './demos';

/** Botões de ícone, largura, envio de arquivo, FAB, grupos e alternância. */
export function MoreExamples() {
  return (
    <>
      <Example
        title="Botão de ícone"
        description="Sempre com aria-label, já que não tem texto."
        code={`<IconButton aria-label="Editar" color="primary"><Edit /></IconButton>`}
      >
        <Stack spacing={1.5}>
          <Row>
            <IconButton aria-label="Início">
              <Home2 size={20} />
            </IconButton>
            <IconButton aria-label="Editar" color="primary">
              <Edit size={20} />
            </IconButton>
            <IconButton aria-label="Favoritar" color="error">
              <Heart size={20} />
            </IconButton>
            <IconButton aria-label="Configurações" color="secondary" size="small">
              <Setting2 size={16} />
            </IconButton>
            <IconButton aria-label="Excluir" disabled>
              <Trash size={20} />
            </IconButton>
          </Row>
        </Stack>
      </Example>

      <Example
        title="Botão de ícone suave (SoftIconButton)"
        description="Do @c3theme/ui: fundo suave, contorno ou tracejado, em qualquer tom."
        code={`<SoftIconButton tone="success" aria-label="Aprovar"><TickCircle /></SoftIconButton>
<SoftIconButton tone="danger" look="outlined" aria-label="Excluir"><Trash /></SoftIconButton>
<SoftIconButton look="dashed" shape="circle" aria-label="Adicionar"><Add /></SoftIconButton>`}
      >
        <Stack spacing={1.5}>
          {(['soft', 'outlined', 'dashed'] as const).map((look) => (
            <Row key={look}>
              {TONES.map((tone) => (
                <SoftIconButton
                  key={tone}
                  tone={tone}
                  look={look}
                  shape={look === 'dashed' ? 'circle' : 'rounded'}
                  aria-label={`Adicionar (${tone})`}
                >
                  <Add size={18} />
                </SoftIconButton>
              ))}
            </Row>
          ))}
        </Stack>
      </Example>

      <Example
        title="Largura total"
        description="Útil em formulários estreitos e no celular."
        code={`<Button variant="contained" fullWidth>Entrar</Button>`}
      >
        <Stack spacing={1.5}>
          <Button variant="contained" fullWidth>
            Entrar
          </Button>
          <Button variant="outlined" fullWidth>
            Criar conta
          </Button>
        </Stack>
      </Example>

      <Example
        title="Sombra e tracejado"
        description="Acabamentos para destaque ou para a ação de adicionar."
        code={`<Button variant="contained" sx={{ boxShadow: (t) => \`0 8px 20px rgb(\${t.vars.palette.primary.mainChannel} / 0.35)\` }}>Destaque</Button>
<Button variant="outlined" sx={{ borderStyle: 'dashed' }} startIcon={<Add />}>Adicionar item</Button>`}
      >
        <Row gap={2}>
          {(['primary', 'success', 'error'] as const).map((c) => (
            <Button
              key={c}
              variant="contained"
              color={c}
              sx={(t) => ({ boxShadow: `0 8px 20px rgb(${t.vars.palette[c].mainChannel} / 0.35)` })}
            >
              {COLOR_LABEL[c]}
            </Button>
          ))}
          <Button variant="outlined" sx={{ borderStyle: 'dashed' }} startIcon={<Add size={18} />}>
            Adicionar item
          </Button>
        </Row>
      </Example>

      <Example
        title="Envio de arquivo"
        description="Um botão que abre o seletor de arquivos."
        code={`<Button component="label" variant="outlined" startIcon={<DocumentUpload />}>
  Enviar arquivo
  <input hidden type="file" onChange={...} />
</Button>`}
      >
        <Row>
          <Button component="label" variant="outlined" startIcon={<DocumentUpload size={18} />}>
            Enviar arquivo
            <input
              hidden
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) notify(`Arquivo "${file.name}" selecionado.`, 'info');
              }}
            />
          </Button>
          <IconButton component="label" color="primary" aria-label="Enviar imagem">
            <DocumentUpload size={20} />
            <input hidden type="file" accept="image/*" onChange={() => notify('Imagem selecionada.', 'info')} />
          </IconButton>
        </Row>
      </Example>

      <Example
        title="Botão flutuante (FAB)"
        description="Para a ação principal de telas de lista no celular."
        code={`<Fab color="primary" aria-label="Adicionar"><Add /></Fab>
<Fab variant="extended" color="secondary"><Edit /> Editar</Fab>`}
      >
        <Row gap={2}>
          <Fab color="primary" aria-label="Adicionar">
            <Add size={22} />
          </Fab>
          <Fab color="secondary" size="medium" aria-label="Editar">
            <Edit size={20} />
          </Fab>
          <Fab size="small" aria-label="Favoritar" sx={{ color: 'error.main' }}>
            <Heart size={18} />
          </Fab>
          <Fab variant="extended" color="primary">
            <Send2 size={18} style={{ marginInlineEnd: 8 }} />
            Enviar
          </Fab>
          <Fab disabled aria-label="Desabilitado">
            <Add size={22} />
          </Fab>
        </Row>
      </Example>

      <Example
        title="Grupo de botões"
        code={`<ButtonGroup variant="outlined">
  <Button>Um</Button><Button>Dois</Button><Button>Três</Button>
</ButtonGroup>`}
      >
        <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
          <ButtonGroup variant="contained" aria-label="Ações">
            <Button>Salvar</Button>
            <Button>Salvar e novo</Button>
            <Button aria-label="Mais opções">
              <ArrowDown2 size={16} />
            </Button>
          </ButtonGroup>
          <ButtonGroup variant="outlined" color="secondary" aria-label="Página">
            <Button>Anterior</Button>
            <Button>1</Button>
            <Button>2</Button>
            <Button>Próxima</Button>
          </ButtonGroup>
          <ButtonGroup variant="text" size="small" aria-label="Filtros">
            <Button>Todos</Button>
            <Button>Ativos</Button>
            <Button>Arquivados</Button>
          </ButtonGroup>
          <ButtonGroup orientation="vertical" variant="outlined" aria-label="Vertical" sx={{ alignSelf: 'flex-start' }}>
            <Button>Primeiro</Button>
            <Button>Segundo</Button>
            <Button>Terceiro</Button>
          </ButtonGroup>
        </Stack>
      </Example>

      <Example
        title="Botões de alternância"
        description="Escolha de uma ou várias opções em um grupo compacto."
        code={`<ToggleButtonGroup value={alinhamento} exclusive onChange={(_, v) => setAlinhamento(v)}>
  <ToggleButton value="left" aria-label="Alinhar à esquerda"><TextalignLeft /></ToggleButton>
  ...
</ToggleButtonGroup>`}
      >
        <ToggleDemos />
      </Example>
    </>
  );
}
