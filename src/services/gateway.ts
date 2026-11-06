import { Language, ServiceId } from '@/data/content';
import { liveAssistant } from './liveAssistant';

export type Message = { id: string; role: 'user' | 'assistant'; text: string };
export type Profile = { name: string; phone: string; village: string; farming: string[] };
export type Conversation = { id: string; service: ServiceId; language: Language; title: string; date: string; messages: Message[]; saved: boolean };

export const assistantGateway = {
  reply(service: ServiceId, language: Language, messages: Message[], token?: string, signal?: AbortSignal) {
    return liveAssistant.reply(language, service, messages.filter(m => m.id !== 'hello').slice(-20).map(m => ({ role: m.role, content: m.text })), token, signal);
  },
};
