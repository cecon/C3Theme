import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { notify, Panel } from '@c3theme/ui';
import { ColorId, Product } from './data';
import { useStore } from './store';
import { EMPTY, schema } from './novo-produto/schema';
import type { FormValues } from './novo-produto/schema';
import { ImageDrop } from './novo-produto/ImageDrop';
import { InfoPanel } from './novo-produto/InfoPanel';
import { PricePanel } from './novo-produto/PricePanel';
import { ColorsPanel } from './novo-produto/ColorsPanel';

export default function NewProductPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { products, saveProduct } = useStore();
  const editing = products.find((p) => p.id === Number(params.get('editar')));

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = form;

  useEffect(() => {
    reset(editing ? { ...editing, tamanhos: editing.tamanhos ?? [], imagens: editing.imagens ?? [] } : EMPTY);
  }, [editing, reset]);

  function submit(v: FormValues) {
    const id = editing?.id ?? products.reduce((m, p) => Math.max(m, p.id), 0) + 1;
    const product: Product = {
      ...(editing ?? { notas: [0, 0, 0, 0, 0], criadoEm: new Date().toISOString(), especificacoes: [] }),
      ...v,
      id,
      cores: v.cores as ColorId[],
      tamanhos: v.tamanhos.length ? v.tamanhos : undefined,
      imagens: v.imagens.length ? v.imagens : undefined,
      destaques: editing?.destaques ?? [v.resumo]
    };
    saveProduct(product);
    notify(editing ? 'Produto atualizado.' : 'Produto cadastrado e já aparece na vitrine.');
    navigate('/apps/loja/lista');
  }

  return (
    <FormProvider {...form}>
      <Box component="form" onSubmit={handleSubmit(submit)} noValidate>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack sx={{ gap: 3 }}>
              <InfoPanel title={editing ? `Editando: ${editing.nome}` : 'Informações do produto'} />

              <PricePanel />
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Stack sx={{ gap: 3 }}>
              <Panel title="Imagens" subtitle="A primeira é a capa">
                <Controller
                  control={control}
                  name="imagens"
                  render={({ field }) => <ImageDrop value={field.value ?? []} onChange={field.onChange} />}
                />
              </Panel>

              <ColorsPanel />
            </Stack>
          </Grid>

          <Grid size={12}>
            <Stack direction="row" sx={{ gap: 1.5, justifyContent: 'flex-end' }}>
              <Button color="secondary" onClick={() => navigate('/apps/loja/lista')}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" loading={isSubmitting}>
                {editing ? 'Salvar alterações' : 'Cadastrar produto'}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </FormProvider>
  );
}
