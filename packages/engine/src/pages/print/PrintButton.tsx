// Botão Imprimir do registro (`views.form.print`): monta a folha fora da tela, num portal no body, e chama a
// impressão do navegador quando as filhas chegaram. Na impressão só a folha aparece; fora dela, a folha não aparece.
import { useState } from 'react';
import { createPortal } from 'react-dom';

// material-ui
import Button from '@mui/material/Button';
import GlobalStyles from '@mui/material/GlobalStyles';

// third-party
import { Printer } from 'iconsax-reactjs';

import type { EntityDef, WireRecord } from '../../types';
import RecordPrint from './RecordPrint';

/** Porta da impressão: os testes trocam por um espião. */
export const printPort = { print: () => window.print() };

const SHEET = 'c3-print-sheet';

export default function PrintButton({ def, record }: { def: EntityDef; record: WireRecord }) {
  const [printing, setPrinting] = useState(false);
  return (
    <>
      <Button startIcon={<Printer size={18} />} onClick={() => setPrinting(true)} loading={printing}>
        Imprimir
      </Button>
      {printing &&
        createPortal(
          <div className={SHEET}>
            <GlobalStyles
              styles={{
                [`.${SHEET}`]: { display: 'none' },
                '@media print': { [`body > *:not(.${SHEET})`]: { display: 'none !important' }, [`.${SHEET}`]: { display: 'block' } }
              }}
            />
            <RecordPrint
              def={def}
              record={record}
              onReady={() => {
                // a impressão do navegador segura a página até fechar; depois a folha sai do DOM
                setTimeout(() => {
                  printPort.print();
                  setPrinting(false);
                }, 0);
              }}
            />
          </div>,
          document.body
        )}
    </>
  );
}
