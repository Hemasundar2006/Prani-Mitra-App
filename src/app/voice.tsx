import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { AudioModule, setAudioModeAsync, useAudioStream } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from 'expo-router';
import { Action, C, Icon, Page, s } from '@/components/design';
import { useApp } from '@/context/AppContext';
import { ServiceId } from '@/data/content';
import { arrayBufferToBase64, combineBase64Chunks, createRealtimeSocket, RealtimeEvent } from '@/services/realtimeAssistant';
import { createVoicePlayback } from '@/services/voicePlayback';
import { mono16k } from '@/utils/voicePcm';
import { t } from '@/i18n';
import { api, RecordingAnalysis } from '@/services/api';
import { UrgencyContactsModal } from '@/components/UrgencyContactsModal';

const topics: { label: string; id: ServiceId; icon: string }[] = [
  { label: 'Animal health', id: 'animal-health', icon: 'paw-outline' }, { label: 'Crops', id: 'farming', icon: 'leaf-outline' },
  { label: 'Government schemes', id: 'schemes', icon: 'business-outline' }, { label: 'General questions', id: 'general', icon: 'chatbubbles-outline' },
  { label: 'Nutrition & feed', id: 'nutrition', icon: 'nutrition-outline' },
];
type Status = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'ended' | 'error';

function wavFromPcm(chunks: ArrayBuffer[]) {
  const pcmLength = chunks.reduce((size, chunk) => size + chunk.byteLength, 0);
  const wav = new Uint8Array(44 + pcmLength);
  const view = new DataView(wav.buffer);
  const ascii = (offset: number, value: string) => { for (let i = 0; i < value.length; i++) wav[offset + i] = value.charCodeAt(i); };
  ascii(0, 'RIFF'); view.setUint32(4, 36 + pcmLength, true); ascii(8, 'WAVE'); ascii(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true); view.setUint32(28, 32000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  ascii(36, 'data'); view.setUint32(40, pcmLength, true);
  let offset = 44;
  for (const chunk of chunks) { wav.set(new Uint8Array(chunk), offset); offset += chunk.byteLength; }
  return wav;
}

export default function Voice() {
  const params = useLocalSearchParams<{ service?: string }>();
  const app = useApp(); const [topic, setTopic] = useState<ServiceId>(() => topics.find(item => item.id === params.service)?.id ?? 'animal-health');
  const [status, setStatus] = useState<Status>('idle'); const [partial, setPartial] = useState(''); const [transcript, setTranscript] = useState<string[]>([]); const [answer, setAnswer] = useState(''); const [error, setError] = useState(''); const [audioChunks, setAudioChunks] = useState(0);
  const socket = useRef<ReturnType<typeof createRealtimeSocket> | null>(null); const active = useRef(false);
  const session = useRef(0); const lastFrame = useRef(0); const lastServerEvent = useRef(0); const awaitingAnswer = useRef(0); const nextAnswer = useRef(true); const ending = useRef(false); const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analysisStarted = useRef(false); const callStartedAt = useRef(0);
  const [playback] = useState(() => createVoicePlayback(setError));
  const recordedPcm = useRef<ArrayBuffer[]>([]);
  const [recordedBytes, setRecordedBytes] = useState(0);
  const [savingRecording, setSavingRecording] = useState(false);
  const [analysis, setAnalysis] = useState<RecordingAnalysis | null>(null); const [analyzing, setAnalyzing] = useState(false); const [showContacts, setShowContacts] = useState(false);
  const replyAudioChunks = useRef<string[]>([]);
  const replySampleRate = useRef(24000);
  const streamRef = useRef<ReturnType<typeof useAudioStream>['stream'] | null>(null);
  const fail = useCallback((message: string) => { session.current++; active.current = false; ending.current = false; if (endTimer.current) clearTimeout(endTimer.current); endTimer.current = null; streamRef.current?.stop(); socket.current?.close(); playback.stop(); setError(message); setStatus('error'); }, [playback]);
  const { stream } = useAudioStream({ sampleRate: 16000, channels: 1, encoding: 'int16', onBuffer: buffer => {
    if (!active.current || !buffer.data.byteLength) return;
    let pcm: ArrayBuffer;
    try { pcm = mono16k(buffer.data, buffer.sampleRate, buffer.channels); }
    catch { fail('The microphone returned an unsupported audio format. Please restart the conversation.'); return; }
    if (socket.current?.send({ type: 'audio', audio: arrayBufferToBase64(pcm) })) {
      const recordedFrame = pcm.slice(0);
      recordedPcm.current.push(recordedFrame);
      setRecordedBytes(value => value + recordedFrame.byteLength);
      lastFrame.current = Date.now(); setAudioChunks(value => value + 1);
    }
  } });
  useEffect(() => { streamRef.current = stream; return () => { if (streamRef.current === stream) streamRef.current = null; }; }, [stream]);
  // The hook's wrapper changes on every render; depend on the native stream itself.
  useEffect(() => () => { session.current++; active.current = false; stream?.stop(); socket.current?.close(); playback.stop(); if (endTimer.current) clearTimeout(endTimer.current); }, [stream, playback]);
  useEffect(() => {
    if (status !== 'listening' && status !== 'speaking') return;
    const timer = setInterval(() => {
      if (!active.current) return;
      if (Date.now() - lastFrame.current > 8000) fail('No microphone audio is arriving. Check microphone permission and restart the conversation.');
      else if (awaitingAnswer.current && Date.now() - awaitingAnswer.current > 25000) fail('Gemini Live received your speech but did not return an answer. Please retry.');
      else if (audioChunks > 10 && Date.now() - lastServerEvent.current > 25000) fail('Audio is reaching Gemini Live, but no response event arrived. Check the Gemini token and connection.');
    }, 2000);
    return () => clearInterval(timer);
  }, [status, audioChunks, fail]);
  function handleEvent(event: RealtimeEvent) {
    lastServerEvent.current = Date.now();
    const type = event.type.replace(/[_-]/g, '.');
    if (['ready', 'started', 'session.started', 'conversation.started'].includes(type)) setStatus('listening');
    else if (type === 'transcript.partial' || type === 'transcript.delta') { if (event.text) { playback.stop(); replyAudioChunks.current = []; } setPartial(event.text ?? ''); setStatus('listening'); }
    else if (type === 'transcript.final' || type === 'final.transcript' || type === 'transcript') { playback.stop(); if (event.text) setTranscript(prev => [...prev, `${t('You:', app.language)} ${event.text}`]); setPartial(''); nextAnswer.current = true; awaitingAnswer.current = Date.now(); }
    else if (['processing', 'utterance.end', 'speech.end'].includes(type)) setStatus('processing');
    else if (['assistant.partial', 'assistant.delta', 'response.partial', 'response.delta', 'answer.partial', 'answer.delta', 'text.delta'].includes(type)) {
      const fresh = nextAnswer.current; nextAnswer.current = false; awaitingAnswer.current = 0;
      setAnswer(prev => fresh ? event.text ?? '' : event.text?.startsWith(prev) ? event.text : prev + (event.text ?? '')); setStatus('speaking');
    }
    else if (['assistant.final', 'assistant.message', 'response.final', 'answer.final'].includes(type)) { awaitingAnswer.current = 0; if (event.text) { setAnswer(event.text); setTranscript(prev => [...prev, `${t('Mitra:', app.language)} ${event.text}`]); } }
    else if (type === 'audio' || type === 'audio.chunk') {
      if (event.audio) { replyAudioChunks.current.push(event.audio); replySampleRate.current = event.sampleRate ?? 24000; setStatus('speaking'); }
    }
    else if (type === 'speech.started' || type === 'interruption') { replyAudioChunks.current = []; playback.stop(); }
    else if (type === 'turn.complete') {
      const hasReplyAudio = replyAudioChunks.current.length > 0;
      if (hasReplyAudio) {
        const audio = combineBase64Chunks(replyAudioChunks.current);
        replyAudioChunks.current = [];
        playback.enqueue({ type: 'audio', audio, format: 'pcm16', sampleRate: replySampleRate.current, channels: 1 }, () => { if (active.current) setStatus('listening'); });
      }
      nextAnswer.current = true;
      if (ending.current) { ending.current = false; if (endTimer.current) clearTimeout(endTimer.current); endTimer.current = null; socket.current?.close(); setStatus('ended'); void analyzeRecording(); }
      else setStatus(hasReplyAudio ? 'speaking' : 'listening');
    }
    else if (type === 'error') fail(event.message ?? 'The assistant could not continue.');
  }
  async function analyzeRecording() {
    if (analysisStarted.current || !app.token || !recordedPcm.current.length) return;
    analysisStarted.current = true; setAnalyzing(true);
    try {
      const bytes = recordedPcm.current.reduce((out, item) => { const next = new Uint8Array(out.byteLength + item.byteLength); next.set(new Uint8Array(out)); next.set(new Uint8Array(item), out.byteLength); return next.buffer; }, new ArrayBuffer(0));
      const result = await api.analyzeRecording(app.token, { audioBase64: arrayBufferToBase64(bytes), language: app.language, service: topic, duration: Math.round((Date.now() - callStartedAt.current) / 1000) });
      setAnalysis(result); if ((result.urgency === 'warning' || result.urgency === 'urgent') && result.contacts?.length) setShowContacts(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not analyze the recording.'); }
    finally { setAnalyzing(false); }
  }
  async function start() {
    if (active.current || status === 'connecting') return;
    if (!app.token) { setError('Please sign in before starting a voice conversation.'); setStatus('error'); return; }
    const epoch = ++session.current;
    socket.current?.close(); playback.stop(); ending.current = false; if (endTimer.current) clearTimeout(endTimer.current); endTimer.current = null;
    setError(''); setPartial(''); setTranscript([]); setAnswer(''); setAnalysis(null); setShowContacts(false); setAnalyzing(false); analysisStarted.current = false; setAudioChunks(0); recordedPcm.current = []; replyAudioChunks.current = []; setRecordedBytes(0); setStatus('connecting');
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync(); if (!permission.granted) throw new Error('Allow microphone access to start a live conversation.');
      if (epoch !== session.current) return;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      if (epoch !== session.current) return;
      if (!stream) throw new Error('Live microphone streaming is not available in this web build. Use the Android or iOS app for live voice conversation.');
      socket.current = createRealtimeSocket(app.token, event => { if (epoch === session.current) handleEvent(event); }, message => { if (epoch === session.current) fail(message); });
      await socket.current.start(app.language, topic);
      if (epoch !== session.current) return;
      active.current = true; callStartedAt.current = Date.now();
      lastFrame.current = Date.now(); lastServerEvent.current = Date.now(); awaitingAnswer.current = 0; nextAnswer.current = true;
      await stream.start();
      if (epoch !== session.current || !active.current) { stream.stop(); return; }
      setStatus('listening');
    } catch (e) { if (epoch === session.current) fail(e instanceof Error ? e.message : 'Could not start the live conversation.'); }
  }
  function stop() {
    if (ending.current) return;
    active.current = false; stream?.stop(); ending.current = true; setStatus('processing');
    // Start analysis from the audio already captured even if the backend closes
    // without sending turn.complete. analysisStarted prevents duplicate requests.
    void analyzeRecording();
    if (!socket.current?.send({ type: 'stop' })) { ending.current = false; socket.current?.close(); setStatus('ended'); return; }
    endTimer.current = setTimeout(() => { if (ending.current) fail('Gemini Live did not finish the voice turn. Please retry.'); }, 30000);
  }
  function reset() { session.current++; active.current = false; ending.current = false; analysisStarted.current = false; setShowContacts(false); if (endTimer.current) clearTimeout(endTimer.current); endTimer.current = null; stream?.stop(); socket.current?.close(); playback.stop(); recordedPcm.current = []; replyAudioChunks.current = []; setRecordedBytes(0); setSavingRecording(false); setAnalyzing(false); setAnalysis(null); setStatus('idle'); setPartial(''); setTranscript([]); setAnswer(''); setError(''); setAudioChunks(0); }
  async function downloadRecording() {
    if (!recordedPcm.current.length || savingRecording) return;
    setSavingRecording(true);
    try {
      const wav = wavFromPcm(recordedPcm.current);
      const filename = `prani-mitra-voice-${new Date().toISOString().replace(/[:.]/g, '-')}.wav`;
      if (Platform.OS === 'web') {
        const blobUrl = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }));
        const anchor = document.createElement('a'); anchor.href = blobUrl; anchor.download = filename; anchor.click();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      } else {
        const file = new File(Paths.cache, filename);
        await file.write(wav);
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { dialogTitle: 'Save your voice recording', mimeType: 'audio/wav', UTI: 'public.wav' });
        else throw new Error('Sharing is not available on this device.');
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save the voice recording.'); }
    finally { setSavingRecording(false); }
  }
  return <Page back title={status === 'idle' ? 'Talk with Mitra' : 'Prani Mitra'} subtitle={status === 'idle' ? 'Speak naturally and see the conversation live.' : 'Live voice conversation'}>
    {status === 'idle' ? <><Text style={s.h2}>{t('Choose a topic', app.language)}</Text><View style={[s.row, { flexWrap: 'wrap' }]}>{topics.map(item => <TouchableOpacity key={item.id} accessibilityRole="radio" accessibilityState={{ checked: topic === item.id }} onPress={() => setTopic(item.id)} style={[s.row, { width: '47%', minHeight: 62, flexGrow: 1, padding: 12, borderRadius: 14, backgroundColor: topic === item.id ? C.green : C.sage }]}><Icon name={item.icon} color={topic === item.id ? C.white : C.green} size={20} /><Text style={[s.small, { color: topic === item.id ? C.white : C.text, fontWeight: '700', flex: 1 }]}>{t(item.label, app.language)}</Text></TouchableOpacity>)}</View><View style={[s.card, { backgroundColor: C.sage }]}><Text style={s.h2}>{t('Ready to start?', app.language)}</Text><Text style={s.body}>{t('Language:', app.language)} {app.language}{'\n'}{t('Service:', app.language)} {t(topics.find(item => item.id === topic)?.label, app.language)}</Text><Action title="Start conversation" icon="mic-outline" onPress={start} /></View></> : <>
      <View style={[s.card, { paddingVertical: 12, backgroundColor: C.dark }]}><View style={s.between}><View style={s.row}><View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.sage, alignItems: 'center', justifyContent: 'center' }}><Icon name="sparkles-outline" color={C.green} size={23} /></View><View><Text style={[s.h3, { color: C.white }]}>Prani Mitra</Text><Text style={{ color: '#C5D9CD' }}>{t(status === 'speaking' ? 'Mitra is replying…' : status === 'ended' ? 'Call ended' : 'Listening live…', app.language)}</Text></View></View>{status !== 'ended' && <TouchableOpacity accessibilityRole="button" onPress={stop} style={{ borderWidth: 1, borderColor: '#C5D9CD', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9 }}><Text style={{ color: C.white, fontWeight: '700' }}>{t('End live call', app.language)}</Text></TouchableOpacity>}</View></View>
      <View style={[s.card, { minHeight: 420, alignItems: 'center', justifyContent: 'center', backgroundColor: '#24191D', borderColor: '#3C2D31', paddingHorizontal: 28 }]}><View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: '#8A4708', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}><Text style={{ color: C.white, fontSize: 54, fontWeight: '300' }}>P</Text></View><Text style={[s.h2, { color: '#F8E7E8', textAlign: 'center' }]}>Prani Mitra</Text><Text style={{ color: '#D6C0C3', marginTop: 6 }}>{t(status === 'connecting' ? 'Connecting to Gemini Live…' : status === 'listening' ? 'Live call · Listening…' : status === 'processing' ? 'Finishing your turn…' : status === 'speaking' ? 'Mitra is replying…' : status === 'ended' ? 'Call ended' : 'Ready', app.language)}</Text><Text style={{ color: '#F8E7E8', fontSize: 18, lineHeight: 28, textAlign: 'center', marginTop: 28 }}>{partial || answer || t('Speak naturally. Your words and Mitra’s response will appear here.', app.language)}</Text></View>
      {transcript.map((line, index) => <View key={`${line}-${index}`} style={s.card}><Text style={s.body}>{line}</Text></View>)}
      {answer ? <View style={[s.card, { backgroundColor: '#F1F7FF' }]}><Text style={s.label}>PRANI MITRA</Text><Text style={s.body}>{answer}</Text></View> : null}
      {analyzing ? <View style={s.card}><Text style={s.h3}>{t('Analyzing…', app.language)}</Text><Text style={s.body}>{t('Your call is being summarized and checked for immediate action.', app.language)}</Text></View> : null}
      {analysis ? <View style={[s.card, { backgroundColor: analysis.urgency === 'urgent' ? '#FCEAE7' : C.sage }]}><Text style={s.label}>{t('Summary', app.language)}</Text><Text style={s.body}>{analysis.summary}</Text><Text style={s.label}>{t('Immediate action', app.language)}</Text><Text style={s.body}>{analysis.immediateAction || t('No immediate action detected.', app.language)}</Text><Text style={[s.small, { color: analysis.urgency === 'urgent' ? C.red : C.green }]}>{t(analysis.urgency === 'urgent' ? 'Urgent' : analysis.urgency === 'warning' ? 'Warning' : 'Normal', app.language)}</Text></View> : null}
      {error ? <Text accessibilityRole="alert" style={[s.body, { color: C.red }]}>{t(error, app.language)}</Text> : null}
      {status === 'error' ? <Action title="Try again" icon="refresh-outline" onPress={start} /> : status === 'processing' ? <Action title="Finishing call…" secondary disabled onPress={() => {}} /> : status !== 'ended' ? <Action title="End live call" secondary icon="call-outline" onPress={stop} /> : <Action title="New live call" onPress={reset} />}
      {recordedBytes > 0 ? <Action title={savingRecording ? 'Preparing recording…' : `${t('Download your voice recording', app.language)} (${Math.ceil(recordedBytes / 32000)} ${t('sec', app.language)})`} secondary icon="download-outline" disabled={savingRecording} onPress={downloadRecording} /> : null}
      <View style={[s.card, { backgroundColor: '#FFFDF5' }]}><Text style={s.label}>{t('YOU SAID', app.language)}</Text>{transcript.length || partial ? <>{transcript.filter(line => line.startsWith(`${t('You:', app.language)} `)).map((line, index) => <Text key={`${line}-${index}`} style={s.body}>{line.slice(`${t('You:', app.language)} `.length)}</Text>)}{partial ? <Text style={[s.body, { color: C.green }]}>{partial}</Text> : null}</> : <Text style={s.small}>{t('Your recognized speech will appear here.', app.language)}</Text>}</View>
    </>}
    <UrgencyContactsModal visible={showContacts} contacts={analysis?.contacts ?? []} language={app.language} onClose={() => setShowContacts(false)} />
  </Page>;
}
