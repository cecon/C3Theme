import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Location } from 'iconsax-reactjs';
import { CITIES, integer, SKILLS } from '../data';
import Example, { ExamplePage } from '../Example';
import { CheckboxesDemo, CreatableDemo, FixedTagsDemo, MultipleDemo, byName, cityLabel } from './autocomplete/demos';
import { AsyncDemo, LabelsDemo, PeopleDemo } from './autocomplete/searchDemos';

export default function AutocompletePage() {
  return (
    <ExamplePage intro="Campo de texto com sugestões. Serve para escolher em listas longas, marcar várias opções ou criar valores novos.">
      <Example
        title="Básico"
        code={`<Autocomplete
  options={cidades}
  getOptionLabel={(c) => \`\${c.name} – \${c.uf}\`}
  renderInput={(params) => <TextField {...params} label="Cidade" />}
/>`}
      >
        <Autocomplete options={CITIES} getOptionLabel={cityLabel} renderInput={(params) => <TextField {...params} label="Cidade" />} />
      </Example>

      <Example
        title="Agrupado"
        description="Opções agrupadas por região."
        code={`<Autocomplete options={cidades} groupBy={(c) => c.region} ... />`}
      >
        <Autocomplete
          options={byName}
          groupBy={(c) => c.region}
          getOptionLabel={cityLabel}
          renderInput={(params) => <TextField {...params} label="Cidade por região" />}
        />
      </Example>

      <Example
        title="Opção personalizada"
        description="Cada opção mostra ícone e dados extras."
        code={`renderOption={(props, c) => <li {...props}><Location /> {c.name} <small>{c.population}</small></li>}`}
      >
        <Autocomplete
          options={CITIES}
          autoHighlight
          getOptionLabel={cityLabel}
          renderOption={(props, c) => {
            const { key, ...rest } = props;
            return (
              <Box component="li" key={key} {...rest} sx={{ gap: 1.5 }}>
                <Box sx={{ color: 'primary.main', display: 'flex' }}>
                  <Location size={18} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {c.name}
                  <Typography variant="caption" color="text.secondary" component="span" sx={{ ml: 1 }}>
                    {c.uf}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {integer.format(c.population)} hab.
                </Typography>
              </Box>
            );
          }}
          renderInput={(params) => <TextField {...params} label="Escolha a cidade" />}
        />
      </Example>

      <Example
        title="Pessoas com avatar"
        code={`renderOption={(props, p) => <li {...props}><SoftAvatar>{iniciais}</SoftAvatar> {p.name}</li>}`}
      >
        <PeopleDemo />
      </Example>

      <Example title="Múltiplo" code={`<Autocomplete multiple options={habilidades} value={valor} onChange={(_, v) => setValor(v)} ... />`}>
        <MultipleDemo />
      </Example>

      <Example
        title="Com caixas de seleção"
        code={`<Autocomplete multiple disableCloseOnSelect renderOption={(props, o, { selected }) => <li {...props}><Checkbox checked={selected} />{o}</li>} />`}
      >
        <CheckboxesDemo />
      </Example>

      <Example
        title="Itens fixos"
        description="'React' não pode ser removido."
        code={`renderValue={(tags, getItemProps) => tags.map((o, i) => <Chip {...getItemProps({ index: i })} disabled={fixos.includes(o)} />)}`}
      >
        <FixedTagsDemo />
      </Example>

      <Example
        title="Limite de itens visíveis"
        description="Mostra +N quando o campo não está em foco."
        code={`<Autocomplete multiple limitTags={2} ... />`}
      >
        <Autocomplete
          multiple
          limitTags={2}
          options={SKILLS}
          defaultValue={['React', 'Node.js', 'SQL', 'Docker']}
          renderInput={(params) => <TextField {...params} label="Stack do projeto" />}
        />
      </Example>

      <Example
        title="Criar nova opção"
        code={`<Autocomplete freeSolo filterOptions={(opts, p) => [...filtrar(opts, p), { label: \`Adicionar "\${p.inputValue}"\` }]} />`}
      >
        <CreatableDemo />
      </Example>

      <Example
        title="Carregamento assíncrono"
        description="Abra a lista: as opções chegam depois de 1,2 s."
        code={`<Autocomplete open={aberto} loading={carregando} loadingText="Buscando cidades…" ... />`}
      >
        <AsyncDemo />
      </Example>

      <Example
        title="Etiquetas coloridas"
        description="Seleção de etiquetas com cor e descrição."
        code={`renderValue={(tags, getItemProps) => tags.map((o, i) => <Chip icon={<Dot tone={o.tone} />} label={o.name} {...getItemProps({ index: i })} />)}`}
      >
        <LabelsDemo />
      </Example>

      <Example
        title="Tamanhos e estados"
        code={`<Autocomplete size="small" ... />
<Autocomplete disabled ... />
<Autocomplete readOnly ... />`}
      >
        <Stack spacing={2}>
          <Autocomplete size="small" options={SKILLS} renderInput={(params) => <TextField {...params} label="Pequeno" />} />
          <Autocomplete
            multiple
            size="small"
            options={SKILLS}
            defaultValue={['Python']}
            renderInput={(params) => <TextField {...params} label="Pequeno múltiplo" />}
          />
          <Autocomplete disabled options={SKILLS} renderInput={(params) => <TextField {...params} label="Desabilitado" />} />
          <Autocomplete
            readOnly
            options={SKILLS}
            defaultValue="Kotlin"
            renderInput={(params) => <TextField {...params} label="Somente leitura" />}
          />
        </Stack>
      </Example>
    </ExamplePage>
  );
}
