// material-ui
import type { CSSObject, Theme } from '@mui/material/styles';

/** Tons de evento: os da paleta do tema; `danger` é o error e `neutral` o secondary (cinza). */
export type EventTone = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const PALETTE_KEY = {
  primary: 'primary',
  secondary: 'secondary',
  success: 'success',
  warning: 'warning',
  danger: 'error',
  info: 'info',
  neutral: 'secondary'
} as const;

/** Cor cheia do tom do evento (bolinhas do seletor de cor e da agenda). */
export function eventToneMain(theme: Theme, tone: EventTone) {
  return theme.vars.palette[PALETTE_KEY[tone]].main;
}

/** Variáveis do FullCalendar para um tom: fundo suave, borda e texto legíveis no claro e no escuro. */
function toneVars(theme: Theme, tone: EventTone): CSSObject {
  const c = theme.vars.palette[PALETTE_KEY[tone]];
  return {
    '--fc-event-bg-color': `rgb(${c.mainChannel} / 0.14)`,
    '--fc-event-border-color': c.main,
    '--fc-event-text-color': c.dark,
    ...theme.applyStyles('dark', {
      '--fc-event-bg-color': `rgb(${c.mainChannel} / 0.26)`,
      // o tom claro puro dá 4,3:1 sobre o fundo tingido; puxado 15% para o branco passa de 4,5:1 (como o toneText)
      '--fc-event-text-color': `color-mix(in srgb, ${c.light} 85%, #fff)`
    })
  };
}

/** Ajusta o FullCalendar ao tema C3 (cores, fontes, bordas, modo escuro). Vale para a vitrine e para o motor. */
export function calendarStyles(theme: Theme): CSSObject {
  const p = theme.vars.palette;
  // classe `ev-<tom>` no evento (classNames do FullCalendar)
  const tones = Object.fromEntries((Object.keys(PALETTE_KEY) as EventTone[]).map((tone) => [`& .ev-${tone}`, toneVars(theme, tone)]));
  return {
    '--fc-border-color': p.divider,
    '--fc-page-bg-color': p.background.paper,
    '--fc-neutral-bg-color': p.action.hover,
    '--fc-today-bg-color': `rgb(${p.primary.mainChannel} / 0.06)`,
    '--fc-highlight-color': `rgb(${p.primary.mainChannel} / 0.14)`,
    '--fc-now-indicator-color': p.error.main,
    '--fc-list-event-hover-bg-color': p.action.hover,
    '--fc-small-font-size': '0.75rem',
    '& .fc': { fontFamily: theme.typography.fontFamily, fontSize: '0.875rem', color: p.text.primary },
    '& .fc a': { color: 'inherit', textDecoration: 'none' },
    // a borda externa fica com o Paper
    '& .fc-theme-standard .fc-scrollgrid': { border: 0 },
    '& .fc-theme-standard td:last-of-type, & .fc-theme-standard th:last-of-type': { borderInlineEnd: 0 },
    '& .fc-theme-standard .fc-scrollgrid-section-liquid > td, & .fc-theme-standard .fc-scrollgrid-section-body > td': { borderBottom: 0 },
    '& .fc .fc-col-header-cell': { backgroundColor: p.action.hover },
    '& .fc .fc-col-header-cell-cushion': {
      display: 'block',
      padding: '10px 4px',
      color: p.text.secondary,
      fontWeight: 600,
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.04em'
    },
    // número do dia
    '& .fc .fc-daygrid-day-top': { flexDirection: 'row', padding: '4px' },
    '& .fc .fc-daygrid-day-number': {
      minWidth: 26,
      height: 26,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 6px',
      borderRadius: '13px',
      fontWeight: 500,
      fontSize: '0.8125rem'
    },
    '& .fc .fc-day-today .fc-daygrid-day-number': { backgroundColor: p.primary.main, color: p.primary.contrastText },
    // dia de outro mês: cinza secundário em vez de opacidade (com 0,45 o número caía para 2,9:1)
    '& .fc .fc-day-other .fc-daygrid-day-top': { opacity: 1, color: p.text.secondary },
    '& .fc .fc-daygrid-more-link': { color: p.primary.main, fontWeight: 500 },
    '& .fc .fc-popover': { backgroundColor: p.background.paper, boxShadow: theme.shadows[8], borderRadius: '8px', overflow: 'hidden' },
    '& .fc .fc-popover-header': { backgroundColor: p.action.hover, padding: '6px 10px' },
    // grade de horários
    '& .fc .fc-timegrid-slot': { height: 44 },
    '& .fc .fc-timegrid-slot-label-cushion, & .fc .fc-timegrid-axis-cushion': { color: p.text.secondary, fontSize: '0.75rem' },
    '& .fc .fc-timegrid-now-indicator-line': { borderWidth: '2px 0 0' },
    // eventos
    '& .fc .fc-h-event, & .fc .fc-v-event': {
      borderWidth: 0,
      borderInlineStartWidth: 3,
      borderStyle: 'solid',
      borderRadius: '6px',
      cursor: 'pointer',
      boxShadow: 'none'
    },
    '& .fc .fc-daygrid-event': { margin: '1px 4px 2px', padding: '1px 4px' },
    '& .fc .fc-event-main': { fontWeight: 500 },
    // a hora só muda de peso: com opacidade, o texto do evento cai abaixo de 4,5:1
    '& .fc .fc-event-time': { fontWeight: 400 },
    '& .fc .fc-timegrid-event .fc-event-main': { padding: '4px 6px' },
    '& .fc .fc-timegrid-event-harness-inset .fc-timegrid-event': { boxShadow: `0 0 0 1px ${p.background.paper}` },
    '& .fc .fc-event-dragging': { opacity: 0.85 },
    // agenda (lista)
    '& .fc .fc-list': { border: 0 },
    '& .fc .fc-list-day-cushion': { backgroundColor: p.action.hover, padding: '8px 16px' },
    '& .fc .fc-list-day-text, & .fc .fc-list-day-side-text': { fontWeight: 600, display: 'inline-block' },
    '& .fc .fc-list-day-text::first-letter': { textTransform: 'uppercase' },
    '& .fc .fc-list-event td': { padding: '10px 16px' },
    '& .fc .fc-list-event-time': { color: p.text.secondary },
    '& .fc .fc-list-event:hover td': { backgroundColor: p.action.hover },
    '& .fc .fc-list-empty': { backgroundColor: 'transparent', color: p.text.secondary },
    ...tones
  };
}
