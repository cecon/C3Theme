import type { ModelGroup, ModelOption } from '@c3theme/chat';

const paid = (value: string, label: string, description?: string): ModelOption => ({ value, label, description });
const free = (value: string, label: string, description?: string): ModelOption => ({ value, label, description, flags: ['free'] });
const local = (value: string, label: string, description: string): ModelOption => ({ value, label, description, flags: ['local'] });

/**
 * Lista como o OpenCode devolve: modelos grátis (sem login) misturados com pagos, um provedor que precisa entrar e
 * modelos locais. 3 provedores, 30 modelos.
 */
export const MODELOS: ModelGroup[] = [
  {
    id: 'opencode',
    label: 'OpenCode Zen',
    status: { label: 'Conectado', tone: 'success' },
    options: [
      free('opencode/grok-code', 'Grok Code Fast', '256 mil de contexto'),
      free('opencode/qwen3-coder', 'Qwen3 Coder', '262 mil de contexto'),
      free('opencode/kimi-k2', 'Kimi K2', '128 mil de contexto'),
      free('opencode/glm-4.6', 'GLM 4.6', '200 mil de contexto'),
      free('opencode/deepseek-v3', 'DeepSeek V3.2', '128 mil de contexto'),
      { ...free('opencode/minimax-m2', 'MiniMax M2'), unavailable: 'Fora do ar agora; tente mais tarde' },
      paid('opencode/gpt-5', 'GPT-5', 'US$ 1,25 / 10 por milhão de tokens'),
      paid('opencode/gpt-5-mini', 'GPT-5 Mini', 'US$ 0,25 / 2 por milhão de tokens'),
      paid('opencode/gpt-5-codex', 'GPT-5 Codex', 'Feito para código'),
      paid('opencode/gemini-pro', 'Gemini 2.5 Pro', '1 milhão de contexto'),
      { ...paid('opencode/gemini-flash', 'Gemini 2.5 Flash', '1 milhão de contexto'), tags: [{ label: 'Rápido', tone: 'neutral' }] },
      paid('opencode/qwen3-max', 'Qwen3 Max'),
      paid('opencode/sonnet', 'Claude Sonnet 4.5', 'Pelo OpenCode, cobrado por uso')
    ]
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    status: { label: 'Precisa entrar', tone: 'warning' },
    unavailable: 'Entre com a sua conta da Anthropic para usar',
    options: [
      paid('anthropic/opus', 'Claude Opus 4.1', '200 mil de contexto'),
      paid('anthropic/sonnet', 'Claude Sonnet 4.5', '200 mil de contexto, até 1 milhão'),
      paid('anthropic/haiku', 'Claude Haiku 4.5', 'Rápido e barato'),
      paid('anthropic/sonnet-4', 'Claude Sonnet 4'),
      paid('anthropic/opus-4', 'Claude Opus 4'),
      paid('anthropic/sonnet-3.7', 'Claude Sonnet 3.7'),
      paid('anthropic/haiku-3.5', 'Claude Haiku 3.5')
    ]
  },
  {
    id: 'ollama',
    label: 'Ollama',
    status: { label: 'Neste computador', tone: 'info' },
    options: [
      local('ollama/qwen2.5-coder:7b', 'Qwen2.5 Coder 7B', '4,7 GB'),
      local('ollama/qwen2.5-coder:32b', 'Qwen2.5 Coder 32B', '20 GB'),
      local('ollama/llama3.1:8b', 'Llama 3.1 8B', '4,9 GB'),
      local('ollama/deepseek-r1:14b', 'DeepSeek R1 14B', '9 GB'),
      local('ollama/gemma3:12b', 'Gemma 3 12B', '8,1 GB'),
      local('ollama/mistral-small', 'Mistral Small 24B', '14 GB'),
      local('ollama/phi4', 'Phi-4 14B', '9,1 GB'),
      local('ollama/gpt-oss:20b', 'gpt-oss 20B', '14 GB'),
      { ...local('ollama/llama3.3:70b', 'Llama 3.3 70B', '43 GB'), unavailable: 'Não baixado: rode ollama pull llama3.3:70b' },
      local('ollama/codestral', 'Codestral 22B', '13 GB')
    ]
  }
];
