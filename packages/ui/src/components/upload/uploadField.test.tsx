// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { UploadedFile, Uploader } from './types';
import UploadField, { type UploadFieldProps } from './UploadField';

afterEach(cleanup);

const theme = createTheme({ cssVariables: true });
const file = (name: string, size = 10, type = 'application/pdf') => new File(['x'.repeat(size)], name, { type });

function Harness(props: Partial<UploadFieldProps> & { upload: Uploader; onValue?: (v: UploadedFile[]) => void; initial?: UploadedFile[] }) {
  const [value, setValue] = useState<UploadedFile[]>(props.initial ?? []);
  return (
    <UploadField
      label="Anexos"
      {...props}
      value={value}
      onChange={(v) => {
        setValue(v);
        props.onValue?.(v);
      }}
    />
  );
}

const field = (props: Parameters<typeof Harness>[0]) =>
  render(
    <ThemeProvider theme={theme}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <Harness {...props} />
      </IntlProvider>
    </ThemeProvider>
  );

const choose = (files: File[]) => fireEvent.change(document.querySelector('input[type=file]')!, { target: { files } });

describe('UploadField', () => {
  it('envia o arquivo escolhido, mostra o progresso e guarda a referência do servidor', async () => {
    let finish!: (f: UploadedFile) => void;
    const upload: Uploader = vi.fn((f, ctx) => {
      ctx.onProgress(0.5);
      return new Promise<UploadedFile>((r) => (finish = r)).then((done) => ({ ...done, name: f.name }));
    });
    const onValue = vi.fn();
    field({ upload, onValue, accept: ['.pdf'] });
    expect(screen.getByText('Arraste arquivos aqui ou clique para escolher')).toBeTruthy();
    choose([file('nota.pdf')]);
    expect(await screen.findByText('50%')).toBeTruthy();
    finish({ id: 'f1', name: 'nota.pdf', size: 10, url: '/f1' });
    await waitFor(() => expect(onValue).toHaveBeenCalledWith([{ id: 'f1', name: 'nota.pdf', size: 10, url: '/f1' }]));
    expect(screen.getByRole('link', { name: 'nota.pdf' }).getAttribute('href')).toBe('/f1');
    fireEvent.click(screen.getByRole('button', { name: 'Tirar nota.pdf' }));
    expect(onValue).toHaveBeenLastCalledWith([]);
  });

  it('recusa tipo errado, arquivo vazio e o que passa do limite, dizendo o motivo', () => {
    const upload = vi.fn<Uploader>(() => new Promise(() => {}));
    field({ upload, accept: ['.pdf'], maxFiles: 2 });
    choose([file('foto.png', 10, 'image/png'), file('vazio.pdf', 0), file('a.pdf'), file('b.pdf'), file('c.pdf')]);
    expect(screen.getByText(/foto\.png: Tipo de arquivo não aceito\. Use \.pdf\./)).toBeTruthy();
    expect(screen.getByText(/vazio\.pdf: Arquivo vazio\./)).toBeTruthy();
    expect(screen.getByText(/No máximo 2 arquivos\./)).toBeTruthy();
    expect(upload).toHaveBeenCalledTimes(2);
  });

  it('falha de rede: avisa e "Tentar de novo" envia de novo', async () => {
    const upload = vi.fn<Uploader>().mockRejectedValueOnce(new Error('network')).mockResolvedValue({ id: 'f2', name: 'b.pdf', size: 10 });
    const onValue = vi.fn();
    field({ upload, onValue });
    choose([file('b.pdf')]);
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }));
    await waitFor(() => expect(onValue).toHaveBeenCalledWith([{ id: 'f2', name: 'b.pdf', size: 10 }]));
  });

  it('arrastar e soltar envia; arquivo único troca o anterior', async () => {
    const upload = vi.fn<Uploader>(async (f) => ({ id: f.name, name: f.name, size: f.size }));
    const onValue = vi.fn();
    field({ upload, onValue, maxFiles: 1, initial: [{ id: 'old', name: 'velho.pdf', size: 5 }] });
    const drop = screen.getByRole('button', { name: /Arraste o arquivo aqui/ });
    fireEvent.dragOver(drop);
    fireEvent.drop(drop, { dataTransfer: { files: [file('novo.pdf')] } });
    // o anterior sai quando o novo termina (antes, o render no meio do envio trazia o velho de volta)
    await waitFor(() => expect(onValue).toHaveBeenLastCalledWith([{ id: 'novo.pdf', name: 'novo.pdf', size: 10 }]));
  });

  it('somente leitura: sem área de envio nem remover; vazio mostra traço', () => {
    field({ upload: vi.fn(), readOnly: true });
    expect(screen.queryByRole('button', { name: /Arraste/ })).toBeNull();
    expect(screen.getByText('—')).toBeTruthy();
  });
});
