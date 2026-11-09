import { createRoot } from 'react-dom/client';

// fontes do painel de aparência (Inter é a padrão)
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/600.css';

import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
