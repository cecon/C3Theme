// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import WindowDragBar from './WindowDragBar';

afterEach(cleanup);

const bar = () => document.querySelector<HTMLElement>('[data-window-drag]');

describe('WindowDragBar', () => {
  it('no Mac e no Windows, faixa fixa no topo escondida do leitor de tela', () => {
    render(<WindowDragBar desktop={{ platform: 'mac' }} />);
    expect(bar()).not.toBeNull();
    expect(bar()!.getAttribute('aria-hidden')).toBe('true');
    cleanup();
    render(<WindowDragBar desktop={{ platform: 'windows' }} />);
    expect(bar()).not.toBeNull();
  });

  it('sem botões de janela a desviar (Linux ou moldura do sistema), nada', () => {
    render(<WindowDragBar desktop={{ platform: 'linux' }} />);
    expect(bar()).toBeNull();
    render(<WindowDragBar desktop={{ platform: 'mac', controls: false }} />);
    expect(bar()).toBeNull();
  });
});
