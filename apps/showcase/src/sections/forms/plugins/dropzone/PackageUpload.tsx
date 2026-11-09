import { useState } from 'react';

import { Panel, UploadField, type UploadedFile, type Uploader } from '@c3theme/ui';

/** "Servidor" da demonstração: sobe em ~2 s com progresso; arquivo com "falha" no nome dá erro de rede. */
const fakeUpload: Uploader = (file, { onProgress, signal }) =>
  new Promise((resolve, reject) => {
    let sent = 0;
    const timer = window.setInterval(() => {
      sent = Math.min(1, sent + 0.1 + Math.random() * 0.1);
      onProgress(sent);
      if (file.name.includes('falha') && sent > 0.5) {
        window.clearInterval(timer);
        reject(new Error('network'));
      } else if (sent >= 1) {
        window.clearInterval(timer);
        resolve({ id: `${file.name}-${Date.now()}`, name: file.name, size: file.size, contentType: file.type });
      }
    }, 200);
    signal.addEventListener('abort', () => (window.clearInterval(timer), reject(new Error('abort'))));
  });

/** O UploadField do @c3theme/ui: envia na hora, com progresso, cancelar e tentar de novo. */
export function PackageUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  return (
    <Panel title="Envio com progresso (UploadField)" subtitle="Cada arquivo sobe na hora; o formulário guarda só a referência">
      <UploadField
        label="Anexos do pedido"
        value={files}
        onChange={setFiles}
        upload={fakeUpload}
        accept={['.pdf', '.png', '.jpg']}
        maxFiles={5}
      />
    </Panel>
  );
}
