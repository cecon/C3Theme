// Painel de cores e ilustração.
import Box from '@mui/material/Box';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { TickCircle } from 'iconsax-reactjs';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Panel } from '@c3theme/ui';
import { COLORS, ColorId, SHAPES } from '../data';
import ProductArt from '../ProductArt';
import type { FormValues } from './schema';

/** Cores disponíveis e ilustração do produto. */
export function ColorsPanel() {
  const {
    control,
    formState: { errors }
  } = useFormContext<FormValues>();
  const [forma, cores, imagens, nome] = useWatch({ control, name: ['forma', 'cores', 'imagens', 'nome'] });
  return (
    <>
      <Panel title="Cores e ilustração">
        <Controller
          control={control}
          name="cores"
          render={({ field }) => (
            <Box>
              <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }} role="group" aria-label="Cores disponíveis">
                {(Object.keys(COLORS) as ColorId[]).map((c) => {
                  const list = field.value ?? [];
                  const on = list.includes(c);
                  return (
                    <Tooltip key={c} title={COLORS[c].nome}>
                      <Box
                        component="button"
                        type="button"
                        aria-label={COLORS[c].nome}
                        aria-pressed={on}
                        onClick={() => field.onChange(on ? list.filter((x) => x !== c) : [...list, c])}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          cursor: 'pointer',
                          bgcolor: COLORS[c].hex,
                          border: 2,
                          borderColor: on ? 'primary.main' : 'divider',
                          display: 'grid',
                          placeItems: 'center',
                          color: c === 'branco' || c === 'amarelo' ? 'grey.900' : 'common.white'
                        }}
                      >
                        {on && <TickCircle size={16} variant="Bold" />}
                      </Box>
                    </Tooltip>
                  );
                })}
              </Stack>
              <FormHelperText error={!!errors.cores}>{errors.cores?.message ?? 'A primeira cor escolhida é a principal.'}</FormHelperText>
            </Box>
          )}
        />
        <Controller
          control={control}
          name="forma"
          render={({ field }) => (
            <TextField select label="Ilustração (sem fotos)" fullWidth size="small" sx={{ mt: 2.5 }} {...field}>
              {Object.entries(SHAPES).map(([k, v]) => (
                <MenuItem key={k} value={k}>
                  {v}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Box sx={{ mt: 2.5, maxWidth: 220, mx: 'auto' }}>
          <ProductArt
            forma={forma ?? 'caixaSom'}
            cor={(cores?.[0] as ColorId) ?? 'cinza'}
            src={imagens?.[0]}
            alt={`Prévia de ${nome || 'novo produto'}`}
          />
        </Box>
      </Panel>
    </>
  );
}
