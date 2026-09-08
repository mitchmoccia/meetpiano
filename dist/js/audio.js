const PARTIALS = [1, 2, 3, 4];
const PARTIAL_GAINS = [1, 0.27, 0.11, 0.045];

export function createAudio() {
  let audioContext = null;
  let master = null;
  let muted = false;
  let unlocked = false;
  const voices = new Map();

  function ensure() {
    if (!audioContext) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return false;
      try {
        audioContext = new Audio();
        master = audioContext.createGain();
        master.gain.value = muted ? 0 : 0.42;
        const compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.value = -12;
        compressor.ratio.value = 4;
        master.connect(compressor);
        compressor.connect(audioContext.destination);
      } catch (_) {
        return false;
      }
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
    unlocked = true;
    return true;
  }

  function play(note, velocity = 0.75) {
    if (!ensure()) return false;
    release(note);
    const now = audioContext.currentTime;
    const voiceGain = audioContext.createGain();
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.exponentialRampToValueAtTime(Math.max(0.03, velocity) * 0.6, now + 0.008);
    voiceGain.gain.exponentialRampToValueAtTime(velocity * 0.24 + 0.0001, now + 0.19);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
    voiceGain.connect(master);
    const frequency = 440 * Math.pow(2, (note - 69) / 12);
    const oscillators = PARTIALS.map((partial, index) => {
      const oscillator = audioContext.createOscillator();
      const partialGain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency * partial;
      partialGain.gain.value = PARTIAL_GAINS[index];
      oscillator.connect(partialGain);
      partialGain.connect(voiceGain);
      oscillator.start(now);
      oscillator.stop(now + 2.3);
      return oscillator;
    });
    const entry = { gain: voiceGain, oscillators };
    voices.set(note, entry);
    oscillators[0].onended = () => {
      if (voices.get(note) === entry) voices.delete(note);
      voiceGain.disconnect();
    };
    return true;
  }

  function release(note) {
    const voice = voices.get(note);
    if (!voice || !audioContext) return;
    const now = audioContext.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setTargetAtTime(0.0001, now, 0.065);
    voice.oscillators.forEach((oscillator) => {
      try { oscillator.stop(now + 0.4); } catch (_) {}
    });
    voices.delete(note);
  }

  function releaseAll() {
    [...voices.keys()].forEach(release);
  }

  function setMuted(next) {
    muted = Boolean(next);
    if (master && audioContext) {
      master.gain.setTargetAtTime(muted ? 0 : 0.42, audioContext.currentTime, 0.02);
    }
  }

  return {
    ensure,
    play,
    release,
    releaseAll,
    setMuted,
    isMuted: () => muted,
    isUnlocked: () => unlocked,
    canPlay: () => Boolean(window.AudioContext || window.webkitAudioContext)
  };
}
