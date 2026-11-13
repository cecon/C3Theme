import { useEffect, useState } from 'react';

/** Espera local de reenvio; o sistema continua responsável pelo limite real de tentativas. */
export default function useCodeWait(initial = 0) {
  const [wait, setWait] = useState(initial);
  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);
  return [wait, setWait] as const;
}
