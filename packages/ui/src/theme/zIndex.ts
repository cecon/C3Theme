/**
 * Escala de camadas do tema (`theme.zIndex`). As do MUI cobrem o que sai do fluxo da página (barra, menu,
 * diálogo, aviso, dica); estas três ficam dentro do conteúdo, sempre abaixo da barra de cima:
 *
 * - `raised` (1): por cima dos vizinhos, ex.: coluna fixa de tabela.
 * - `sticky` (10): cabeçalho ou rodapé grudado na rolagem, ex.: cabeçalho de tabela, caixa de mensagem do chat.
 * - `floating` (20): botão ou aviso flutuando sobre o conteúdo, ex.: "novas mensagens", ação flutuante.
 *
 * Depois vêm as do MUI: mobileStepper 1000, fab 1050, speedDial 1050, appBar 1100, drawer 1200, modal 1300,
 * snackbar 1400, tooltip 1500. Use `sx={{ zIndex: 'sticky' }}` ou `(t) => t.zIndex.sticky`, nunca número solto.
 */
export const Z_INDEX = { raised: 1, sticky: 10, floating: 20 } as const;
