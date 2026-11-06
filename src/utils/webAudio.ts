// The assistant API accepts a short mono PCM WAV clip. Adapted from the supplied demo's audio utility.
export function encodeWav(chunks: readonly Float32Array[], sampleRate: number): string {
  const count = chunks.reduce((total, chunk) => total + chunk.length, 0);
  if (!count || count > 480000) throw new Error('The recording is too long. Please ask a shorter question.');
  const bytes = new Uint8Array(44 + count * 2);
  const view = new DataView(bytes.buffer);
  const label = (offset: number, value: string) => bytes.set(new TextEncoder().encode(value), offset);
  label(0, 'RIFF');
  view.setUint32(4, bytes.length - 8, true);
  label(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  label(36, 'data');
  view.setUint32(40, count * 2, true);
  let offset = 44;
  for (const chunk of chunks) {
    for (const sample of chunk) {
      view.setInt16(offset, Math.max(-32768, Math.min(32767, Math.round(sample * 32767))), true);
      offset += 2;
    }
  }
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
