import { Language, ServiceId } from '@/data/content';

export type RealtimeEvent = { type: string; text?: string; audio?: string; message?: string; format?: string; sampleRate?: number; channels?: number };
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://prani-mitra-backend1.onrender.com/api';
export const GEMINI_TOKEN_URL = process.env.EXPO_PUBLIC_GEMINI_TOKEN_URL ?? `${API_URL.replace(/\/$/, '')}/assistant/live-token`;
export const GEMINI_LIVE_MODEL = 'models/gemini-3.8-live';

export const realtimeLanguage = (language: Language) => language === 'हिन्दी' ? 'Hindi' : language === 'తెలుగు' ? 'Telugu' : 'English';
export const realtimeService = (service: ServiceId) => ({ farming: 'Farming', 'animal-health': 'Animal Health', nutrition: 'Nutrition', schemes: 'Government Schemes', emergency: 'Animal Health', general: 'General Queries' })[service];

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer); const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]; const b = i + 1 < bytes.length ? bytes[i + 1] : 0; const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    output += alphabet[a >> 2] + alphabet[((a & 3) << 4) | (b >> 4)] + (i + 1 < bytes.length ? alphabet[((b & 15) << 2) | (c >> 6)] : '=') + (i + 2 < bytes.length ? alphabet[c & 63] : '=');
  }
  return output;
}

export function combineBase64Chunks(chunks: string[]) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const decoded = chunks.map(value => {
    const input = value.replace(/[^A-Za-z0-9+/=]/g, '');
    const bytes = new Uint8Array(Math.floor(input.length * 3 / 4) - (input.endsWith('==') ? 2 : input.endsWith('=') ? 1 : 0));
    let offset = 0;
    for (let i = 0; i < input.length; i += 4) {
      const a = alphabet.indexOf(input[i]); const b = alphabet.indexOf(input[i + 1]);
      const c = input[i + 2] === '=' ? 0 : alphabet.indexOf(input[i + 2]);
      const d = input[i + 3] === '=' ? 0 : alphabet.indexOf(input[i + 3]);
      if (offset < bytes.length) bytes[offset++] = (a << 2) | (b >> 4);
      if (offset < bytes.length) bytes[offset++] = ((b & 15) << 4) | (c >> 2);
      if (offset < bytes.length) bytes[offset++] = ((c & 3) << 6) | d;
    }
    return bytes;
  });
  const merged = new Uint8Array(decoded.reduce((length, part) => length + part.length, 0));
  let offset = 0;
  for (const part of decoded) { merged.set(part, offset); offset += part.length; }
  return arrayBufferToBase64(merged.buffer);
}

async function decodeSocketMessage(data: unknown) {
  if (typeof data === 'string') return data;
  if (data && typeof (data as { text?: unknown }).text === 'function') return (data as Blob).text();
  const decoder = new TextDecoder();
  if (data instanceof ArrayBuffer) return decoder.decode(data);
  if (ArrayBuffer.isView(data)) return decoder.decode(data);
  throw new Error('Unsupported WebSocket frame type.');
}

function serviceInstruction(language: string, service: string) {
  const scope: Record<string, string> = {
    'Animal Health': 'Give safe animal care guidance, do not claim a definitive diagnosis or prescribe drug dosages, and urge urgent veterinary care for danger signs.',
    Farming: 'Help with crops, soil, irrigation, pests, harvest, and locally safe farming practices.',
    Nutrition: 'Help with livestock feed and crop nutrition; ask for species, age or growth stage, and quantities when needed.',
    'Government Schemes': 'Explain scheme requirements generally and direct users to official sources for current eligibility and deadlines.',
    'General Queries': 'Help with Prani Mitra and farmer-related questions, and politely redirect unrelated requests.',
  };
  return `You are Mitra, a helpful voice assistant for Indian farmers. Speak naturally and concisely in ${language}. The selected service is ${service}. ${scope[service] ?? scope['General Queries']}`;
}

export function createRealtimeSocket(loginToken: string, onEvent: (event: RealtimeEvent) => void, onFailure: (message: string) => void) {
  let socket: WebSocket | null = null; let intentionalClose = false; let started = false; let ready = false;
  let rejectStart: ((error: Error) => void) | undefined; let setupTimer: ReturnType<typeof setTimeout> | null = null;
  const fail = (message: string) => { if (setupTimer) clearTimeout(setupTimer); rejectStart?.(new Error(message)); rejectStart = undefined; if (!intentionalClose) onFailure(message); };
  const send = (payload: Record<string, unknown>) => {
    if (!started || !ready || socket?.readyState !== WebSocket.OPEN) return false;
    if (socket.bufferedAmount > 512000) { fail('The Gemini Live connection is too slow. Please reconnect.'); return false; }
    if (payload.type === 'audio' && typeof payload.audio === 'string') {
      socket.send(JSON.stringify({ realtimeInput: { audio: { mimeType: 'audio/pcm;rate=16000', data: payload.audio } } }));
    } else if (payload.type === 'stop') {
      socket.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
    }
    return true;
  };
  const start = (language: Language, service: ServiceId) => new Promise<void>(async (resolve, reject) => {
    rejectStart = error => reject(error);
    try {
      const tokenResponse = await fetch(GEMINI_TOKEN_URL, {
        method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${loginToken}` },
        body: JSON.stringify({ purpose: 'gemini-live', model: GEMINI_LIVE_MODEL.replace(/^models\//, '') }),
      });
      const tokenPayload = await tokenResponse.json().catch(() => null) as { token?: string; name?: string; message?: string; error?: string } | null;
      const ephemeralToken = tokenPayload?.token ?? tokenPayload?.name;
      if (!tokenResponse.ok || !ephemeralToken) throw new Error(tokenPayload?.message ?? tokenPayload?.error ?? `Could not get a Gemini Live session token (${tokenResponse.status}).`);
      if (intentionalClose) throw new Error('Call ended.');
      const endpoint = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(ephemeralToken)}`;
      socket = new WebSocket(endpoint);
      setupTimer = setTimeout(() => { fail('Gemini Live setup timed out. Please retry.'); socket?.close(); }, 20000);
      socket.onopen = () => {
        if (intentionalClose) return;
        socket?.send(JSON.stringify({ setup: {
          model: GEMINI_LIVE_MODEL,
          generationConfig: { responseModalities: ['AUDIO'] },
          realtimeInputConfig: { automaticActivityDetection: {
            disabled: false,
            startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
            endOfSpeechSensitivity: 'END_SENSITIVITY_LOW',
            prefixPaddingMs: 40,
            silenceDurationMs: 800,
          } },
          inputAudioTranscription: {}, outputAudioTranscription: {},
          systemInstruction: { parts: [{ text: serviceInstruction(realtimeLanguage(language), realtimeService(service)) }] },
        } }));
      };
      socket.onmessage = async message => {
        let raw: Record<string, any>;
        try {
          raw = JSON.parse(await decodeSocketMessage(message.data)) as Record<string, any>;
        } catch (error) {
          fail(error instanceof Error && error.message.includes('Unsupported WebSocket')
            ? 'Gemini Live sent a WebSocket frame format this app cannot read.'
            : 'Gemini Live sent an invalid JSON event.');
          return;
        }
        try {
          if (raw.setupComplete ?? raw.setup_complete) { ready = true; started = true; if (setupTimer) clearTimeout(setupTimer); setupTimer = null; rejectStart = undefined; onEvent({ type: 'ready' }); resolve(); return; }
          if (raw.error) { fail(typeof raw.error === 'string' ? raw.error : raw.error.message ?? 'Gemini Live rejected the session.'); return; }
          const content = raw.serverContent ?? raw;
          const inputText = content.inputTranscription?.text;
          if (inputText) onEvent({ type: content.inputTranscription.finished ? 'transcript.final' : 'transcript.partial', text: inputText });
          const outputText = content.outputTranscription?.text;
          if (outputText) onEvent({ type: content.outputTranscription.finished ? 'assistant.final' : 'assistant.partial', text: outputText });
          for (const part of content.modelTurn?.parts ?? []) {
            if (part.text) onEvent({ type: 'assistant.partial', text: part.text });
            if (part.inlineData?.data) {
              const mime = String(part.inlineData.mimeType ?? 'audio/pcm;rate=24000');
              const rate = Number(mime.match(/rate=(\d+)/)?.[1] ?? 24000);
              onEvent({ type: 'audio', audio: part.inlineData.data, format: 'pcm16', sampleRate: rate, channels: 1 });
            }
          }
          if (content.interrupted) onEvent({ type: 'interruption' });
          if (content.turnComplete) onEvent({ type: 'turn.complete' });
        } catch {
          const eventShape = Object.keys(raw).slice(0, 6).join(', ');
          fail(`Gemini Live sent an unsupported event${eventShape ? ` (${eventShape})` : ''}.`);
        }
      };
      socket.onerror = () => fail('Could not connect directly to Gemini Live. Check the Gemini token service and network.');
      socket.onclose = event => { ready = false; started = false; if (!intentionalClose) fail(`Gemini Live closed the connection (${event.code}${event.reason ? `: ${event.reason}` : ''}).`); };
    } catch (error) { fail(error instanceof Error ? error.message : 'Could not start Gemini Live.'); }
  });
  return {
    start,
    send,
    close: () => { intentionalClose = true; ready = false; started = false; if (setupTimer) clearTimeout(setupTimer); rejectStart?.(new Error('Call ended.')); rejectStart = undefined; socket?.close(1000, 'call ended'); },
  };
}
