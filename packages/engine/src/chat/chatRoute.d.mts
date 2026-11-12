export const CONVERSATION_ID: RegExp;
export function routeParams(path: string | undefined): string[];
export function conversationParam(conversation: string | undefined, path: string | undefined): string | null;
export function conversationIssue(conversation: string | undefined, path: string | undefined): string | null;
