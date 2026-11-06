// Normalize the actual hardware rate/channel count to the wire contract: PCM16 mono, 16 kHz.
export function mono16k(data: ArrayBuffer, sampleRate: number, channels: number): ArrayBuffer {
  if (!Number.isFinite(sampleRate) || sampleRate < 8000 || !Number.isInteger(channels) || channels < 1) throw new Error('The microphone returned an invalid audio format.');
  if (sampleRate === 16000 && channels === 1) return data;
  const input = new DataView(data);
  const frames = Math.floor(data.byteLength / (2 * channels));
  const length = Math.floor(frames * 16000 / sampleRate);
  const output = new ArrayBuffer(length * 2); const view = new DataView(output);
  const ratio = sampleRate / 16000;
  for (let i = 0; i < length; i++) {
    const begin = Math.floor(i * ratio); const end = Math.min(frames, Math.max(begin + 1, Math.floor((i + 1) * ratio)));
    let sum = 0;
    for (let j = begin; j < end; j++) for (let channel = 0; channel < channels; channel++) sum += input.getInt16((j * channels + channel) * 2, true);
    view.setInt16(i * 2, Math.round(sum / ((end - begin) * channels)), true);
  }
  return output;
}
