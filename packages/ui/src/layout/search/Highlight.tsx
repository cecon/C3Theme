import Box from '@mui/material/Box';

import { matchRange } from './highlight';

/** O texto com o trecho que bate com a busca em negrito (sem ligar para acentos). */
export default function Highlight({ text, query }: { text: string; query: string }) {
  const r = matchRange(text, query);
  if (!r) return <>{text}</>;
  return (
    <>
      {text.slice(0, r[0])}
      <Box component="mark" sx={{ bgcolor: 'transparent', color: 'inherit', fontWeight: 700 }}>
        {text.slice(r[0], r[1])}
      </Box>
      {text.slice(r[1])}
    </>
  );
}
