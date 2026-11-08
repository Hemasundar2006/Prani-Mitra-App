import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AudioModule, setAudioModeAsync, useAudioStream } from 'expo-audio';
import { Action, Page, Section, s, C } from '@/components/design';
import { useApp } from '@/context/AppContext';
import { api, RecordingAnalysis } from '@/services/api';
import { arrayBufferToBase64 } from '@/services/realtimeAssistant';
import { mono16k } from '@/utils/voicePcm';
import { createVoicePlayback } from '@/services/voicePlayback';
import { t } from '@/i18n';
import { UrgencyContactsModal } from '@/components/UrgencyContactsModal';

export default function RecordingAnalysisScreen() {
  const { service = 'general' } = useLocalSearchParams<{ service?: string }>();
  const app = useApp(); const chunks = useRef<ArrayBuffer[]>([]); const startedAt = useRef(0);
  const [recording, setRecording] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [result, setResult] = useState<RecordingAnalysis | null>(null); const [showContacts, setShowContacts] = useState(false);
  const playback = useRef(createVoicePlayback(message => setError(message))).current;
  const { stream } = useAudioStream({ sampleRate: 16000, channels: 1, encoding: 'int16', onBuffer: buffer => { if (!recording || !buffer.data.byteLength) return; try { chunks.current.push(mono16k(buffer.data, buffer.sampleRate, buffer.channels)); } catch (e) { setError(e instanceof Error ? e.message : 'Could not capture audio.'); } } });
  async function start() { setError(''); setResult(null); setShowContacts(false); chunks.current = []; const permission = await AudioModule.requestRecordingPermissionsAsync(); if (!permission.granted) { setError('Allow microphone access to start recording.'); return; } await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true }); startedAt.current = Date.now(); setRecording(true); await stream?.start(); }
  async function stopAndAnalyze() { setRecording(false); stream?.stop(); if (!chunks.current.length) { setError('No recording captured.'); return; } setBusy(true); try { const bytes = chunks.current.reduce((out, item) => { const next = new Uint8Array(out.byteLength + item.byteLength); next.set(new Uint8Array(out)); next.set(new Uint8Array(item), out.byteLength); return next.buffer; }, new ArrayBuffer(0)); const analysis = await api.analyzeRecording(app.token ?? '', { audioBase64: arrayBufferToBase64(bytes), language: app.language, service, duration: Math.round((Date.now() - startedAt.current) / 1000) }); setResult(analysis); if ((analysis.urgency === 'warning' || analysis.urgency === 'urgent') && analysis.contacts?.length) setShowContacts(true); if (analysis.audioBase64) playback.enqueue({ type: 'audio', audio: analysis.audioBase64, format: analysis.audioFormat ?? 'wav', sampleRate: analysis.audioSampleRate }); } catch (e) { setError(e instanceof Error ? e.message : 'Could not analyze the recording.'); } finally { setBusy(false); } }
  return <Page back title="Analyze a recording" subtitle="Record and understand your farming conversation.">
    <View style={[s.card, { backgroundColor: recording ? C.sage : C.white, alignItems: 'center' }]}><Text style={s.h2}>{t(recording ? 'Recording…' : busy ? 'Analyzing…' : 'Choose service', app.language)}</Text><Text style={s.body}>{app.language}</Text>{recording ? <Action title="Stop and analyze" icon="stop-circle-outline" onPress={stopAndAnalyze} /> : <Action title="Start recording" icon="mic-outline" onPress={start} loading={busy} />}</View>
    {error ? <Text accessibilityRole="alert" style={[s.body, { color: C.red }]}>{t(error, app.language)}</Text> : null}
    {result ? <><Section title="Transcript" /><View style={s.card}><Text style={s.body}>{result.transcript}</Text></View><Section title="Summary" /><View style={s.card}><Text style={s.body}>{result.summary}</Text></View><Section title="Immediate action" /><View style={[s.card, { backgroundColor: result.urgency === 'urgent' ? '#FCEAE7' : C.sage }]}><Text style={s.h3}>{t(result.urgency === 'urgent' ? 'Urgent' : result.urgency === 'warning' ? 'Warning' : 'Normal', app.language)}</Text><Text style={s.body}>{result.immediateAction || t('No immediate action detected.', app.language)}</Text></View></> : null}
    <UrgencyContactsModal visible={showContacts} contacts={result?.contacts ?? []} language={app.language} onClose={() => setShowContacts(false)} />
  </Page>;
}
