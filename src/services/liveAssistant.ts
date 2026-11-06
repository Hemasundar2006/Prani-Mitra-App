import { Language, ServiceId } from '@/data/content';

export type AssistantMessage = { role: 'user' | 'assistant'; content: string };
const configuredAssistantUrl = process.env.EXPO_PUBLIC_ASSISTANT_URL;
export const ASSISTANT_URL = configuredAssistantUrl ?? 'https://prani-mitra-backend1.onrender.com/api/assistant';
export const assistantLanguage = (language: Language) => language === 'हिन्दी' ? 'Hindi' : language === 'తెలుగు' ? 'Telugu' : 'English';
export const assistantService = (service: ServiceId) => ({ farming: 'Farming', 'animal-health': 'Animal Health', nutrition: 'Animal Health', schemes: 'Government Schemes', emergency: 'Animal Health', general: 'General Queries' })[service];

async function call(action: 'reply' | 'summary' | 'transcribe' | 'speak', payload: Record<string, unknown>, token?: string, signal?: AbortSignal): Promise<string | ArrayBuffer> {
  if (!ASSISTANT_URL) throw new Error('Configure EXPO_PUBLIC_ASSISTANT_URL with the deployed assistant-service URL before using voice or chat.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 50000);
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  try {
    const response = await fetch(ASSISTANT_URL, { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json', Accept: action === 'speak' ? 'audio/wav' : 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ action, ...payload }) });
    if (!response.ok) { const body = await response.json().catch(() => ({})) as { error?: string }; throw new Error(response.status === 404 ? 'The assistant endpoint is unavailable. Configure its service URL.' : body.error || `The assistant could not respond (${response.status}).`); }
    if (action === 'speak') return response.arrayBuffer();
    const body = await response.json() as { text?: string };
    if (typeof body.text !== 'string' || !body.text.trim()) throw new Error('The assistant returned an empty response.');
    return body.text.trim();
  } catch (error) { if (controller.signal.aborted && !signal?.aborted) throw new Error('The assistant took too long to respond. Please try again.'); if (error instanceof TypeError) throw new Error('Could not reach the assistant service. Check its URL and connection.'); throw error; }
  finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}

export const liveAssistant = {
  reply: (language: Language, service: ServiceId, messages: AssistantMessage[], token?: string, signal?: AbortSignal) => call('reply', { language: assistantLanguage(language), service: assistantService(service), messages: messages.slice(-20) }, token, signal) as Promise<string>,
  summary: (language: Language, messages: AssistantMessage[], token?: string, signal?: AbortSignal) => call('summary', { language: assistantLanguage(language), messages: messages.slice(-20) }, token, signal) as Promise<string>,
  transcribe: (language: Language, audio: string, token?: string, signal?: AbortSignal) => call('transcribe', { language: assistantLanguage(language), audio }, token, signal) as Promise<string>,
  speak: (language: Language, text: string, token?: string, signal?: AbortSignal) => call('speak', { language: assistantLanguage(language), text }, token, signal) as Promise<ArrayBuffer>,
};
