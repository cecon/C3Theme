import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third-party
import { Eye, EyeSlash, Lock, SearchNormal1, Sms, User } from 'iconsax-reactjs';
import { NumericFormat, PatternFormat } from 'react-number-format';

import { notify, OtpInput, PasswordStrength } from '@c3theme/ui';
import Example, { ExamplePage } from '../Example';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function PasswordDemo() {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  return (
    <Stack spacing={1.5}>
      <TextField
        label="Nova senha"
        type={show ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton aria-label={show ? 'Esconder senha' : 'Mostrar senha'} onClick={() => setShow((v) => !v)} edge="end">
                  {show ? <EyeSlash size={18} /> : <Eye size={18} />}
                </IconButton>
              </InputAdornment>
            )
          }
        }}
        helperText="Use letras maiúsculas, minúsculas, números e símbolos."
      />
      <PasswordStrength password={password} />
    </Stack>
  );
}

function ValidationDemo() {
  const [email, setEmail] = useState('ana@exemplo');
  const [touched, setTouched] = useState(true);
  const error = touched && !EMAIL.test(email);
  return (
    <Stack spacing={2}>
      <TextField
        label="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => setTouched(true)}
        error={error}
        helperText={error ? 'Informe um e-mail válido.' : 'Vamos enviar o recibo para este endereço.'}
        required
      />
      <TextField label="Nome" defaultValue="Maria" color="success" focused helperText="Tudo certo." />
      <TextField label="Telefone" defaultValue="(41) 9999" color="warning" focused helperText="Faltam dígitos?" />
    </Stack>
  );
}

function OtpDemo() {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  return (
    <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
      <Typography variant="body2" color="text.secondary">
        Digite 123456 (aceita colar o código inteiro).
      </Typography>
      <Box sx={{ maxWidth: '100%', overflowX: 'auto', pb: 0.5 }}>
        <OtpInput
          value={code}
          onChange={(v) => {
            setCode(v);
            setError(false);
          }}
          error={error}
        />
      </Box>
      <Button
        variant="contained"
        disabled={code.length < 6}
        onClick={() => {
          if (code === '123456') notify('Código confirmado.');
          else {
            setError(true);
            notify('Código incorreto.', 'error');
          }
        }}
      >
        Confirmar
      </Button>
    </Stack>
  );
}

function ControlledDemo() {
  const [name, setName] = useState('Cecília');
  return (
    <Stack spacing={1.5}>
      <TextField label="Seu nome" value={name} onChange={(e) => setName(e.target.value)} slotProps={{ htmlInput: { maxLength: 30 } }} />
      <Typography variant="body2" color="text.secondary">
        Olá, <b>{name || '…'}</b>! ({name.length}/30 caracteres)
      </Typography>
    </Stack>
  );
}

export default function TextFieldPage() {
  return (
    <ExamplePage intro="Campos de texto recebem dados digitados. Sempre tenha um rótulo visível; use o texto de ajuda para orientar e mostrar erros.">
      <Example
        title="Variantes"
        code={`<TextField label="Contornado" />
<TextField label="Preenchido" variant="filled" />
<TextField label="Padrão" variant="standard" />`}
      >
        <Stack spacing={2}>
          <TextField label="Contornado" />
          <TextField label="Preenchido" variant="filled" />
          <TextField label="Padrão" variant="standard" />
        </Stack>
      </Example>

      <Example
        title="Propriedades de formulário"
        code={`<TextField label="Obrigatório" required />
<TextField label="Desabilitado" disabled />
<TextField label="Somente leitura" slotProps={{ input: { readOnly: true } }} />`}
      >
        <Stack spacing={2}>
          <TextField label="Obrigatório" required defaultValue="Razão social" />
          <TextField label="Desabilitado" disabled defaultValue="Não editável" />
          <TextField label="Somente leitura" defaultValue="CNPJ 12.345.678/0001-90" slotProps={{ input: { readOnly: true } }} />
          <TextField label="Quantidade" type="number" defaultValue={3} />
          <TextField label="Pesquisar" type="search" />
          <TextField label="Com texto de ajuda" helperText="Aparece logo abaixo do campo." />
        </Stack>
      </Example>

      <Example
        title="Validação"
        description="Erro, sucesso e alerta com mensagem."
        code={`<TextField label="E-mail" error={invalido} helperText={invalido ? 'Informe um e-mail válido.' : ''} />`}
      >
        <ValidationDemo />
      </Example>

      <Example
        title="Ícones e adornos"
        code={`<TextField label="Valor" slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }} />`}
      >
        <Stack spacing={2}>
          <TextField
            label="Usuário"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <User size={18} />
                  </InputAdornment>
                )
              }
            }}
          />
          <TextField
            label="E-mail"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Sms size={18} />
                  </InputAdornment>
                )
              }
            }}
          />
          <TextField label="Valor" slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }} />
          <TextField label="Peso" slotProps={{ input: { endAdornment: <InputAdornment position="end">kg</InputAdornment> } }} />
          <TextField
            placeholder="Buscar pedidos"
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchNormal1 size={16} />
                  </InputAdornment>
                )
              },
              htmlInput: { 'aria-label': 'Buscar pedidos' }
            }}
          />
        </Stack>
      </Example>

      <Example
        title="Máscaras"
        description="CPF, telefone, CEP e dinheiro com react-number-format."
        code={`<PatternFormat customInput={TextField} format="###.###.###-##" label="CPF" />
<NumericFormat customInput={TextField} thousandSeparator="." decimalSeparator="," prefix="R$ " decimalScale={2} fixedDecimalScale label="Valor" />`}
      >
        <Stack spacing={2}>
          <PatternFormat customInput={TextField} format="###.###.###-##" mask="_" label="CPF" defaultValue="12345678909" />
          <PatternFormat customInput={TextField} format="(##) #####-####" mask="_" label="Celular" />
          <PatternFormat customInput={TextField} format="#####-###" mask="_" label="CEP" />
          <NumericFormat
            customInput={TextField}
            label="Valor"
            thousandSeparator="."
            decimalSeparator=","
            prefix="R$ "
            decimalScale={2}
            fixedDecimalScale
            defaultValue={1500}
          />
        </Stack>
      </Example>

      <Example
        title="Senha com força"
        description="Com PasswordStrength do @c3theme/ui."
        code={`<TextField type={mostrar ? 'text' : 'password'} ... />
<PasswordStrength password={senha} />`}
      >
        <PasswordDemo />
      </Example>

      <Example
        title="Código de verificação"
        description="OtpInput do @c3theme/ui."
        code={`<OtpInput value={codigo} onChange={setCodigo} length={6} error={erro} />`}
      >
        <OtpDemo />
      </Example>

      <Example
        title="Várias linhas"
        code={`<TextField label="Observações" multiline rows={4} />
<TextField label="Cresce até 6 linhas" multiline minRows={2} maxRows={6} />`}
      >
        <Stack spacing={2}>
          <TextField label="Observações" multiline rows={3} defaultValue="Entregar no período da tarde." />
          <TextField label="Cresce até 6 linhas" multiline minRows={2} maxRows={6} placeholder="Escreva à vontade…" />
        </Stack>
      </Example>

      <Example
        title="Tamanhos e largura"
        code={`// pequeno: tabela e filtro; médio: formulário (padrão); grande: login e telas com poucos campos
<TextField size="small" label="Pequeno" />
<TextField label="Médio" />
<TextField size="large" label="Grande" />
<TextField fullWidth label="Largura total" />`}
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
            <TextField size="small" label="Pequeno" />
            <TextField label="Médio" />
            <TextField size="large" label="Grande" />
          </Stack>
          <TextField fullWidth label="Largura total" />
          <TextField
            size="small"
            label="Senha (pequeno com ícone)"
            type="password"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock size={16} />
                  </InputAdornment>
                )
              }
            }}
          />
        </Stack>
      </Example>

      <Example
        title="Controlado"
        description="O valor fica no estado e reage a cada tecla."
        code={`<TextField value={nome} onChange={(e) => setNome(e.target.value)} />`}
      >
        <ControlledDemo />
      </Example>
    </ExamplePage>
  );
}
