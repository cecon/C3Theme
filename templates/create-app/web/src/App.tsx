// O app inteiro sai do motor: menu, rotas, listas, formulários e painel vêm do backend (GET /api/_meta), descritos
// nos JSONs da pasta spec/ do backend. Tela nova = JSON novo lá, não componente aqui (docs/adr/0001).
// Componente custom só para os degraus de cima da escada do c3-spec, registrado por nome em `components`.

import { ptBR } from '@mui/material/locale';
import { Home2, Profile2User } from 'iconsax-reactjs';

import { C3Shell } from '@c3theme/engine';

// só os ícones que a spec cita (`icon`): sem esta lista, a shell omite os ícones da spec
const icons = { Home2, Profile2User };

export default function App() {
  return <C3Shell apiUrl="/api" icons={icons} theme={{ storageKey: '{{name}}', themeOverrides: ptBR }} />;
}
