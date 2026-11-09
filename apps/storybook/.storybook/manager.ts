import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

// nome da C3 no lugar do logo do Storybook; o resto segue o tema claro padrão
addons.setConfig({ theme: create({ base: 'light', brandTitle: 'C3 UI · componentes', brandUrl: 'https://cecon.github.io/C3Theme/' }) });
