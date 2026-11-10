/** Em que pé está a conversa por voz. O app decide pelo provedor (WebRTC, WebSocket, nativo). */
export type VoiceState = 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

/** Uma fala da conversa por voz, para a legenda ao vivo. */
export interface VoiceCaption {
  who: 'user' | 'assistant';
  text: string;
}
