// material-ui
import Box from '@mui/material/Box';
import { keyframes } from '@mui/material/styles';

const bounce = keyframes`
  0%, 80%, 100% { transform: translateY(0); opacity: .4; }
  40% { transform: translateY(-4px); opacity: 1; }
`;

/** Três pontos pulando: alguém digitando ou o assistente pensando. Parados com movimento reduzido. */
export default function Dots() {
  return (
    <Box aria-hidden sx={{ display: 'flex', gap: 0.5 }}>
      {[0, 1, 2].map((d) => (
        <Box
          key={d}
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: 'text.secondary',
            animation: `${bounce} 1.2s ${d * 0.15}s infinite ease-in-out`,
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
          }}
        />
      ))}
    </Box>
  );
}
