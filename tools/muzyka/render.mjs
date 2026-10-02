// Render MIDI -> WAV (stereo 44.1 kHz) przez spessasynth_core i bank GeneralUser GS (wbudowany pogłos syntezatora).
//   node render.mjs <bank.sf2> <wejście.mid> <wyjście.wav> [ogon_s]
import * as fs from 'node:fs/promises';
import { createRequire } from 'node:module';
const req = createRequire(process.env.MUZ_NODE || '/home/user/muzyka/package.json');
const { audioToWav, BasicMIDI, SoundBankLoader, SpessaSynthProcessor, SpessaSynthSequencer, SpessaLog } = await import(req.resolve('spessasynth_core'));
const [sfp, midp, outp, tail = '3'] = process.argv.slice(2);
const sf = await fs.readFile(sfp), mid = await fs.readFile(midp);
const midi = BasicMIDI.fromArrayBuffer(mid.buffer.slice(mid.byteOffset, mid.byteOffset + mid.byteLength));
const bank = SoundBankLoader.fromArrayBuffer(sf.buffer.slice(sf.byteOffset, sf.byteOffset + sf.byteLength));
const SR = 44100, synth = new SpessaSynthProcessor(SR, { eventsEnabled: false });
SpessaLog.setLogLevel(false, false, false);
synth.soundBankManager.addSoundBank(bank, 'main'); await synth.processorInitialized;
synth.setSystemParameter('autoAllocateVoices', true);
const seq = new SpessaSynthSequencer(synth); seq.loadNewSongList([midi]); seq.loop = false; seq.play();
const n = Math.ceil(SR * (midi.duration + +tail)), L = new Float32Array(n), R = new Float32Array(n);
for (let f = 0; f < n; f += 128) { seq.processTick(); synth.process(L, R, f, Math.min(128, n - f)); }
await fs.writeFile(outp, new Uint8Array(audioToWav([L, R], SR)));
console.log('ok', outp, midi.duration.toFixed(1) + 's');
