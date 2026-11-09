import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import NativeSelect from '@mui/material/NativeSelect';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { CITIES } from '../data';
import Example, { ExamplePage } from '../Example';
import { BasicDemo, HelperDemo, MENU_PROPS, MultipleDemo, REGIONS, StatusDemo } from './select/demos';

export default function SelectPage() {
  return (
    <ExamplePage intro="A seleção escolhe uma ou mais opções de uma lista fechada. Para listas longas com busca, prefira o autocompletar.">
      <Example
        title="Básico"
        code={`<FormControl fullWidth>
  <InputLabel id="dept-label">Departamento</InputLabel>
  <Select labelId="dept-label" label="Departamento" value={dept} onChange={(e) => setDept(e.target.value)}>
    <MenuItem value="Comercial">Comercial</MenuItem>
  </Select>
</FormControl>`}
      >
        <Stack spacing={2}>
          <BasicDemo />
          <TextField select label="Atalho com TextField" defaultValue="mensal" fullWidth>
            <MenuItem value="semanal">Semanal</MenuItem>
            <MenuItem value="mensal">Mensal</MenuItem>
            <MenuItem value="anual">Anual</MenuItem>
          </TextField>
        </Stack>
      </Example>

      <Example
        title="Texto de ajuda, erro e desabilitado"
        code={`<FormControl error>
  ...
  <FormHelperText>Campo obrigatório.</FormHelperText>
</FormControl>`}
      >
        <HelperDemo />
      </Example>

      <Example
        title="Variantes e tamanhos"
        code={`<TextField select variant="filled" ... />
<TextField select size="small" ... />`}
      >
        <Stack spacing={2}>
          {(['outlined', 'filled', 'standard'] as const).map((variant) => (
            <TextField
              key={variant}
              select
              variant={variant}
              label={{ outlined: 'Contornado', filled: 'Preenchido', standard: 'Padrão' }[variant]}
              defaultValue="sp"
            >
              <MenuItem value="sp">São Paulo</MenuItem>
              <MenuItem value="rj">Rio de Janeiro</MenuItem>
            </TextField>
          ))}
          <TextField select size="small" label="Pequeno" defaultValue="10" sx={{ width: 140 }}>
            {[10, 25, 50].map((n) => (
              <MenuItem key={n} value={String(n)}>
                {n} por página
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Example>

      <Example
        title="Largura automática"
        description="O campo se ajusta à opção escolhida."
        code={`<FormControl sx={{ minWidth: 120 }}>
  <Select autoWidth ... />
</FormControl>`}
      >
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="auto-label">Ordenar</InputLabel>
          <Select labelId="auto-label" autoWidth label="Ordenar" defaultValue="recentes">
            <MenuItem value="recentes">Mais recentes</MenuItem>
            <MenuItem value="valor">Maior valor primeiro</MenuItem>
            <MenuItem value="az">A–Z</MenuItem>
          </Select>
        </FormControl>
      </Example>

      <Example
        title="Múltipla escolha"
        code={`<Select multiple value={valores} renderValue={(s) => s.join(', ')}>
  <MenuItem value="Financeiro"><Checkbox checked={...} /><ListItemText primary="Financeiro" /></MenuItem>
</Select>`}
      >
        <MultipleDemo />
      </Example>

      <Example
        title="Agrupado"
        description="Cidades agrupadas por região."
        code={`<Select>
  <ListSubheader>Sul</ListSubheader>
  <MenuItem value="Curitiba">Curitiba</MenuItem>
</Select>`}
      >
        <FormControl fullWidth>
          <InputLabel id="grupo-label">Cidade</InputLabel>
          <Select labelId="grupo-label" label="Cidade" defaultValue="" MenuProps={MENU_PROPS}>
            {REGIONS.flatMap((r) => [
              <ListSubheader key={r}>{r}</ListSubheader>,
              ...CITIES.filter((c) => c.region === r).map((c) => (
                <MenuItem key={c.name} value={c.name}>
                  {c.name} – {c.uf}
                </MenuItem>
              ))
            ])}
          </Select>
        </FormControl>
      </Example>

      <Example
        title="Valor personalizado"
        description="Situação exibida com StatusChip."
        code={`<TextField select slotProps={{ select: { renderValue: (v) => <StatusChip label={...} tone={...} /> } }}>`}
      >
        <StatusDemo />
      </Example>

      <Example
        title="Nativo"
        description="Usa o seletor do sistema; bom no celular."
        code={`<FormControl fullWidth>
  <InputLabel variant="standard" htmlFor="uf">UF</InputLabel>
  <NativeSelect inputProps={{ id: 'uf' }}>...</NativeSelect>
</FormControl>`}
      >
        <FormControl fullWidth>
          <InputLabel variant="standard" htmlFor="uf-nativo">
            UF
          </InputLabel>
          <NativeSelect defaultValue="PR" inputProps={{ id: 'uf-nativo', name: 'uf' }}>
            {[...new Set(CITIES.map((c) => c.uf))].sort().map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </NativeSelect>
        </FormControl>
      </Example>
    </ExamplePage>
  );
}
