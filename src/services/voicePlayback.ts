import { createAudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { RealtimeEvent } from './realtimeAssistant';

// Each event must contain PCM16 samples or a self-contained WAV/MP3 audio segment.
export function createVoicePlayback(onError: (message: string) => void) {
  let generation = 0;
  let pending = Promise.resolve();
  let cancelCurrent: (() => void) | undefined;
  let count = 0;
  const stop = () => { generation++; cancelCurrent?.(); pending = Promise.resolve(); };
  const enqueue = (event: RealtimeEvent, onFinished?: () => void) => {
    const epoch = generation;
    pending = pending.then(async () => {
      if (epoch !== generation || !event.audio) return;
      let bytes = Uint8Array.from(atob(event.audio.replace(/^data:[^,]+,/, '')), c => c.charCodeAt(0));
      const wav = String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF';
      const mp3 = String.fromCharCode(...bytes.slice(0, 3)) === 'ID3' || (bytes[0] === 255 && (bytes[1] & 224) === 224);
      if (!wav && !mp3) {
        if (!event.sampleRate || !['pcm', 'pcm_s16le', 's16le', 'int16', 'pcm16'].includes(event.format ?? '')) {
          throw new Error('Voice audio needs a WAV/MP3 segment or PCM16 format and sampleRate from the backend.');
        }
        const channels = event.channels ?? 1;
        const output = new Uint8Array(44 + bytes.length); const view = new DataView(output.buffer);
        const tag = (offset: number, text: string) => { for (let i = 0; i < text.length; i++) output[offset + i] = text.charCodeAt(i); };
        tag(0, 'RIFF'); view.setUint32(4, 36 + bytes.length, true); tag(8, 'WAVE'); tag(12, 'fmt ');
        view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, channels, true);
        view.setUint32(24, event.sampleRate, true); view.setUint32(28, event.sampleRate * channels * 2, true);
        view.setUint16(32, channels * 2, true); view.setUint16(34, 16, true); tag(36, 'data'); view.setUint32(40, bytes.length, true);
        output.set(bytes, 44); bytes = output;
      }
      let file: File | undefined; let url: string;
      if (Platform.OS === 'web') url = URL.createObjectURL(new Blob([bytes], { type: mp3 ? 'audio/mpeg' : 'audio/wav' }));
      else { file = new File(Paths.cache, `mitra-${Date.now()}-${count++}.${mp3 ? 'mp3' : 'wav'}`); await file.write(bytes); url = file.uri; }
      const cleanup = () => { if (file?.exists) file.delete(); if (Platform.OS === 'web') URL.revokeObjectURL(url); };
      if (epoch !== generation) { cleanup(); return; }
      try {
        await new Promise<void>((resolve, reject) => {
          const player = createAudioPlayer(url, { updateInterval: 100 });
          const finish = () => { clearTimeout(timer); subscription.remove(); player.remove(); cancelCurrent = undefined; resolve(); };
          const subscription = player.addListener('playbackStatusUpdate', status => { if (status.didJustFinish) finish(); });
          const timer = setTimeout(() => { finish(); onError('Voice playback timed out.'); }, 60000);
          cancelCurrent = finish;
          try { player.play(); } catch (error) { finish(); reject(error); }
        });
      } finally { cleanup(); }
      if (epoch === generation) onFinished?.();
    }).catch(error => { if (epoch === generation) onError(error instanceof Error ? error.message : 'Could not play the voice response.'); });
  };
  return { enqueue, stop };
}
