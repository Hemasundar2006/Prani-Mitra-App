/* global __dirname, Buffer */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

class FakeSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static instances = [];
  readyState = FakeSocket.CONNECTING;
  bufferedAmount = 0;
  sent = [];
  constructor(url) { this.url = url; FakeSocket.instances.push(this); }
  send(value) { this.sent.push(JSON.parse(value)); }
  open() { this.readyState = FakeSocket.OPEN; this.onopen?.(); }
  message(data) { this.onmessage?.({ data: JSON.stringify(data) }); }
  close(code = 1000, reason = '') { this.readyState = 3; this.onclose?.({ code, reason }); }
}

const source = fs.readFileSync(path.join(__dirname, '../src/services/realtimeAssistant.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsObject = {};
const sandbox = {
  exports: exportsObject,
  require: name => { if (name === 'react-native') return { Platform: { OS: 'android' } }; throw new Error(name); },
  WebSocket: FakeSocket,
  process: { env: {} },
  fetch: async () => ({ ok: true, status: 200, json: async () => ({ token: 'ephemeral-test-token' }) }),
  setTimeout,
  clearTimeout,
  Uint8Array,
  ArrayBuffer,
  TextDecoder,
  encodeURIComponent,
};
vm.runInNewContext(compiled, sandbox);

const flush = () => new Promise(resolve => setImmediate(resolve));

(async () => {
  const appConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../app.json'), 'utf8')).expo;
  const easConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../eas.json'), 'utf8'));
  assert.ok(appConfig.plugins.some(plugin => Array.isArray(plugin) && plugin[0] === 'expo-audio' && plugin[1].recordAudioAndroid === true));
  assert.equal(easConfig.build.production.environment, 'production');
  assert.equal(easConfig.build.production.env.EXPO_PUBLIC_GEMINI_TOKEN_URL, 'https://prani-mitra-backend1.onrender.com/api/assistant/live-token');
  assert.equal(exportsObject.realtimeLanguage('English'), 'English');
  assert.equal(exportsObject.realtimeLanguage('हिन्दी'), 'Hindi');
  assert.equal(exportsObject.realtimeLanguage('తెలుగు'), 'Telugu');
  for (const [id, label] of Object.entries({ farming: 'Farming', 'animal-health': 'Animal Health', nutrition: 'Nutrition', schemes: 'Government Schemes', general: 'General Queries' })) {
    assert.equal(exportsObject.realtimeService(id), label);
  }

  const pcmExports = {};
  const pcmSource = fs.readFileSync(path.join(__dirname, '../src/utils/voicePcm.ts'), 'utf8');
  vm.runInNewContext(ts.transpileModule(pcmSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: pcmExports, ArrayBuffer, DataView, Uint8Array });
  const stereo = new Int16Array(480 * 2).fill(2000);
  const mono = new Int16Array(pcmExports.mono16k(stereo.buffer, 48000, 2));
  assert.equal(mono.length, 160);
  assert.ok(mono.every(sample => sample === 2000));

  const events = [];
  const failures = [];
  const client = exportsObject.createRealtimeSocket('login-token', event => events.push(event), message => failures.push(message));
  const starting = client.start('తెలుగు', 'animal-health');
  for (let i = 0; i < 10 && !FakeSocket.instances.length; i++) await flush();
  const wire = FakeSocket.instances[0];
  assert.ok(wire, 'fetches ephemeral token before opening the Gemini socket');
  assert.match(wire.url, /BidiGenerateContentConstrained\?access_token=ephemeral-test-token/);
  assert.equal(client.send({ type: 'audio', audio: 'early' }), false);
  wire.open();
  const setup = wire.sent[0].setup;
  assert.equal(setup.model, 'models/gemini-3.8-live');
  assert.deepEqual(setup.generationConfig.responseModalities, ['AUDIO']);
  assert.match(setup.systemInstruction.parts[0].text, /Telugu/);
  assert.match(setup.systemInstruction.parts[0].text, /Animal Health/);
  wire.message({ setupComplete: {} });
  await starting;
  assert.ok(events.some(event => event.type === 'ready'));

  assert.equal(client.send({ type: 'audio', audio: 'AAAA' }), true);
  assert.deepEqual(wire.sent[1], { realtimeInput: { audio: { mimeType: 'audio/pcm;rate=16000', data: 'AAAA' } } });
  assert.equal(client.send({ type: 'stop' }), true);
  assert.deepEqual(wire.sent[2], { realtimeInput: { audioStreamEnd: true } });

  wire.message({ serverContent: { inputTranscription: { text: 'నా పశువు' }, outputTranscription: { text: 'పశువును' }, modelTurn: { parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: 'AQID' } }] }, turnComplete: true } });
  await flush();
  await flush();
  assert.ok(events.some(event => event.type === 'transcript.partial' && event.text === 'నా పశువు'));
  assert.ok(events.some(event => event.type === 'assistant.partial' && event.text === 'పశువును'));
  assert.ok(events.some(event => event.type === 'audio' && event.sampleRate === 24000 && event.format === 'pcm16'));
  assert.ok(events.some(event => event.type === 'turn.complete'));
  client.close();
  assert.equal(failures.length, 0);

  const cancelling = exportsObject.createRealtimeSocket('login-token', () => {}, () => {});
  let resolveToken;
  sandbox.fetch = () => new Promise(resolve => { resolveToken = resolve; });
  const cancelledStart = cancelling.start('English', 'general');
  cancelling.close();
  await assert.rejects(cancelledStart, /Call ended/);
  resolveToken({ ok: true, status: 200, json: async () => ({ token: 'late-token' }) });
  await flush();
  assert.equal(FakeSocket.instances.length, 1, 'does not open a socket after cancellation');

  assert.equal(exportsObject.arrayBufferToBase64(new Uint8Array([0, 255, 15, 22]).buffer), Buffer.from([0, 255, 15, 22]).toString('base64'));
  console.log('PASS: production microphone config, EAS production token URL, 3 languages, 5 service contexts, PCM conversion, ephemeral-token handshake, Gemini setup/audio/transcription/turn events, cancellation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
