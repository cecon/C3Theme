import { ElementType, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';

// third-party
import { AddSquare, Archive, Document, Folder2, FolderOpen, Message, MinusSquare, Send2, Star1, Tag, Trash } from 'iconsax-reactjs';

import { StatusChip } from '@c3theme/ui';
import Example, { ExamplePage } from '../Example';

const frame = { border: 1, borderColor: 'divider', borderRadius: 2, p: 1, bgcolor: 'background.paper', minHeight: 220 } as const;

interface Node {
  id: string;
  label: string;
  children?: Node[];
}

// estrutura de pastas usada em vários exemplos
const FILES: Node[] = [
  {
    id: 'financeiro',
    label: 'Financeiro',
    children: [
      {
        id: 'notas',
        label: 'Notas fiscais',
        children: [
          { id: 'nf-out', label: 'Outubro.zip' },
          { id: 'nf-set', label: 'Setembro.zip' }
        ]
      },
      { id: 'boletos', label: 'Boletos a pagar.xlsx' }
    ]
  },
  {
    id: 'rh',
    label: 'Recursos Humanos',
    children: [
      { id: 'ferias', label: 'Escala de férias.pdf' },
      { id: 'contratos', label: 'Contratos', children: [{ id: 'clt', label: 'Modelo CLT.docx' }] }
    ]
  },
  { id: 'logo', label: 'Logotipo.svg' }
];

const ALL_IDS = (nodes: Node[]): string[] => nodes.flatMap((n) => (n.children ? [n.id, ...ALL_IDS(n.children)] : []));

function renderNodes(nodes: Node[]) {
  return nodes.map((n) => (
    <TreeItem key={n.id} itemId={n.id} label={n.label}>
      {n.children && renderNodes(n.children)}
    </TreeItem>
  ));
}

function ControlledDemo() {
  const [expanded, setExpanded] = useState<string[]>(['financeiro']);
  const [selected, setSelected] = useState<string | null>('boletos');
  const all = ALL_IDS(FILES);
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1}>
        <Button size="small" variant="outlined" onClick={() => setExpanded(expanded.length === 0 ? all : [])}>
          {expanded.length === 0 ? 'Expandir tudo' : 'Recolher tudo'}
        </Button>
        <Button size="small" variant="outlined" onClick={() => setSelected(selected ? null : 'logo')}>
          {selected ? 'Limpar seleção' : 'Selecionar logotipo'}
        </Button>
      </Stack>
      <Box sx={frame}>
        <SimpleTreeView
          aria-label="Árvore controlada"
          expandedItems={expanded}
          onExpandedItemsChange={(_, ids) => setExpanded(ids)}
          selectedItems={selected}
          onSelectedItemsChange={(_, id) => setSelected(id)}
        >
          {renderNodes(FILES)}
        </SimpleTreeView>
      </Box>
      <Typography variant="body2" color="text.secondary">
        Selecionado: {selected ?? 'nenhum'} · Abertos: {expanded.length}
      </Typography>
    </Stack>
  );
}

function MultiSelectDemo() {
  const [selected, setSelected] = useState<string[]>(['ferias']);
  return (
    <Stack spacing={1.5}>
      <Box sx={frame}>
        <RichTreeView
          aria-label="Seleção múltipla"
          items={FILES}
          multiSelect
          checkboxSelection
          selectionPropagation={{ descendants: true, parents: true }}
          defaultExpandedItems={['rh', 'financeiro']}
          selectedItems={selected}
          onSelectedItemsChange={(_, ids) => setSelected(ids)}
        />
      </Box>
      <Typography variant="body2" color="text.secondary">
        {selected.length} item(ns) marcado(s)
      </Typography>
    </Stack>
  );
}

interface MailFolder {
  id: string;
  label: string;
  icon: ElementType;
  count?: number;
  children?: MailFolder[];
}

const MAIL: MailFolder[] = [
  { id: 'entrada', label: 'Caixa de entrada', icon: Message, count: 12 },
  { id: 'estrela', label: 'Com estrela', icon: Star1 },
  { id: 'enviados', label: 'Enviados', icon: Send2 },
  {
    id: 'marcadores',
    label: 'Marcadores',
    icon: Tag,
    children: [
      { id: 'clientes', label: 'Clientes', icon: Tag, count: 4 },
      { id: 'fornecedores', label: 'Fornecedores', icon: Tag },
      { id: 'contabilidade', label: 'Contabilidade', icon: Tag, count: 1 }
    ]
  },
  { id: 'arquivo', label: 'Arquivo', icon: Archive },
  { id: 'lixeira', label: 'Lixeira', icon: Trash }
];

function MailLabel({ folder }: { folder: MailFolder }) {
  const Icon = folder.icon;
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', py: 0.25 }}>
      <Icon size={18} />
      <Typography variant="body2" sx={{ flex: 1 }}>
        {folder.label}
      </Typography>
      {folder.count !== undefined && <StatusChip label={String(folder.count)} tone="primary" />}
    </Stack>
  );
}

function renderMail(folders: MailFolder[]) {
  return folders.map((f) => (
    <TreeItem key={f.id} itemId={f.id} label={<MailLabel folder={f} />}>
      {f.children && renderMail(f.children)}
    </TreeItem>
  ));
}

export default function TreeViewPage() {
  return (
    <ExamplePage intro="A árvore mostra hierarquias, como pastas, categorias ou estrutura de uma empresa. Usa o @mui/x-tree-view.">
      <Example
        title="Básica"
        code={`<SimpleTreeView>
  <TreeItem itemId="financeiro" label="Financeiro">
    <TreeItem itemId="boletos" label="Boletos a pagar.xlsx" />
  </TreeItem>
</SimpleTreeView>`}
      >
        <Box sx={frame}>
          <SimpleTreeView aria-label="Arquivos">{renderNodes(FILES)}</SimpleTreeView>
        </Box>
      </Example>

      <Example
        title="A partir de dados"
        description="RichTreeView monta a árvore de uma lista de objetos."
        code={`<RichTreeView items={[{ id: 'financeiro', label: 'Financeiro', children: [...] }]} />`}
      >
        <Box sx={frame}>
          <RichTreeView aria-label="Arquivos a partir de dados" items={FILES} defaultExpandedItems={['financeiro', 'notas']} />
        </Box>
      </Example>

      <Example
        title="Controlada"
        description="Expansão e seleção ficam no estado da página."
        code={`<SimpleTreeView expandedItems={abertos} onExpandedItemsChange={(_, ids) => setAbertos(ids)}
  selectedItems={sel} onSelectedItemsChange={(_, id) => setSel(id)}>...</SimpleTreeView>`}
      >
        <ControlledDemo />
      </Example>

      <Example
        title="Seleção múltipla com caixas"
        description="Marcar uma pasta marca o que está dentro."
        code={`<RichTreeView items={itens} multiSelect checkboxSelection selectionPropagation={{ descendants: true, parents: true }} />`}
      >
        <MultiSelectDemo />
      </Example>

      <Example
        title="Itens desabilitados"
        description="Podem ou não receber foco pelo teclado."
        code={`<TreeItem itemId="rh" label="Recursos Humanos" disabled />
<SimpleTreeView disabledItemsFocusable>...</SimpleTreeView>`}
      >
        <Box sx={frame}>
          <SimpleTreeView aria-label="Com itens desabilitados" disabledItemsFocusable defaultExpandedItems={['financeiro']}>
            <TreeItem itemId="financeiro" label="Financeiro">
              <TreeItem itemId="notas" label="Notas fiscais" />
              <TreeItem itemId="boletos" label="Boletos (sem acesso)" disabled />
            </TreeItem>
            <TreeItem itemId="rh" label="Recursos Humanos (sem acesso)" disabled>
              <TreeItem itemId="ferias" label="Escala de férias.pdf" />
            </TreeItem>
            <TreeItem itemId="logo" label="Logotipo.svg" />
          </SimpleTreeView>
        </Box>
      </Example>

      <Example
        title="Ícones personalizados"
        code={`<SimpleTreeView slots={{ expandIcon: AddSquare, collapseIcon: MinusSquare, endIcon: Document }}>...</SimpleTreeView>`}
      >
        <Box sx={frame}>
          <SimpleTreeView
            aria-label="Ícones personalizados"
            defaultExpandedItems={['financeiro', 'rh']}
            slots={{ expandIcon: AddSquare, collapseIcon: MinusSquare, endIcon: Document }}
            slotProps={{
              expandIcon: { width: 16, height: 16 },
              collapseIcon: { width: 16, height: 16 },
              endIcon: { width: 16, height: 16, opacity: 0.6 }
            }}
            sx={{
              '& .MuiTreeItem-content': { gap: 1 },
              '& .MuiTreeItem-groupTransition': { ml: 1.5, pl: 1, borderLeft: '1px dashed', borderColor: 'divider' }
            }}
          >
            {renderNodes(FILES)}
          </SimpleTreeView>
        </Box>
      </Example>

      <Example
        title="Rótulo rico"
        description="Pastas de e-mail com ícone e contador."
        code={`<TreeItem itemId="entrada" label={<Stack direction="row"><Message /> Caixa de entrada <StatusChip label="12" /></Stack>} />`}
        wide
      >
        <Box sx={{ ...frame, maxWidth: 420 }}>
          <SimpleTreeView aria-label="Pastas de e-mail" defaultExpandedItems={['marcadores']} defaultSelectedItems="entrada">
            {renderMail(MAIL)}
          </SimpleTreeView>
        </Box>
      </Example>

      <Example
        title="Pastas abertas e fechadas"
        description="Ícone muda conforme o estado."
        code={`slots={{ expandIcon: Folder2, collapseIcon: FolderOpen, endIcon: Document }}`}
      >
        <Box sx={frame}>
          <RichTreeView
            aria-label="Pastas"
            items={FILES}
            defaultExpandedItems={['rh']}
            slots={{ expandIcon: Folder2, collapseIcon: FolderOpen, endIcon: Document }}
            slotProps={{
              expandIcon: { width: 18, height: 18 },
              collapseIcon: { width: 18, height: 18 },
              endIcon: { width: 18, height: 18 }
            }}
          />
        </Box>
      </Example>
    </ExamplePage>
  );
}
