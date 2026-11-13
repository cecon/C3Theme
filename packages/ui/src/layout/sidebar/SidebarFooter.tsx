import { useEffect, useRef } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import type { SectionSidebarProps } from './types';
import { visibleCards } from './preferences';

export default function SidebarFooter({
  cards = [],
  dismissed,
  onDismiss,
  onCardAction,
  onOverflowAlert
}: Pick<SectionSidebarProps, 'cards' | 'onCardAction' | 'onOverflowAlert'> & {
  dismissed: string[];
  onDismiss: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = visibleCards(cards, dismissed);
  const hasAlert = shown.some((c) => c.severity !== 'ok');
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => onOverflowAlert?.(hasAlert && element.scrollHeight > element.clientHeight);
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    observer?.observe(element);
    return () => {
      observer?.disconnect();
      onOverflowAlert?.(false);
    };
  }, [hasAlert, onOverflowAlert, cards.length, dismissed.length]);
  return (
    <Box ref={ref} component="footer" sx={{ maxHeight: '30%', overflowY: 'auto', flexShrink: 0 }}>
      {shown.map((card) => (
        <Alert
          key={card.id}
          severity={card.severity === 'critical' ? 'error' : card.severity === 'warning' ? 'warning' : 'success'}
          onClose={card.dismissible ? () => onDismiss(card.id) : undefined}
          sx={{ m: 1 }}
        >
          <strong>{card.label}</strong>
          {card.message && <div>{card.message}</div>}
          <Button size="small" onClick={() => onCardAction?.(card.id, card.action.id)}>
            {card.action.label}
          </Button>
        </Alert>
      ))}
    </Box>
  );
}
