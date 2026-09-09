(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const missions = [
    { title: 'Every adventure\nstarts with a note.', eyebrow: 'MISSION 01 · MEET YOUR NOTES', description: 'Play C, then D, then E. The glowing key will show you where to start.', notes: [60,62,64], hints: true, success: 'Three notes. You did that! +20 XP' },
    { title: 'Let’s take it\nfrom the top.', eyebrow: 'MISSION 02 · TURN IT AROUND', description: 'Now come back down: E, D, C. Same three notes, a whole new sound.', notes: [64,62,60], hints: true, success: 'Up and down. Look at you go! +20 XP' },
    { title: 'A melody\nof your own.', eyebrow: 'MISSION 03 · YOUR LITTLE FINALE', description: 'Ready for a little more? Play E, D, C, D, E. Listen first if you like. This time, the key hints take a break.', notes: [64,62,60,62,64], hints: false, success: 'That was your first little melody! +20 XP' }
  ];
  const worlds = [
    { kicker:'WORLD 01 · THE BEGINNING',title:'A first note worth celebrating.',description:'Discover the keys, hear the difference, and put your first little melody together. Confidence starts here.',skills:['Finding notes','Listening','First melodies'],learnHref:'/learn/',learnLabel:'Open First Notes' },
    { kicker:'WORLD 02 · FIND YOUR GROOVE',title:'You’re the heartbeat of the band.',description:'Clap it, hear it, play it. Build a steady beat and keep the music moving, even when the backing track takes a little break.',skills:['Steady pulse','Rhythm patterns','Playing in time'],learnHref:'/learn/?unit=rhythm-club',learnLabel:'Open Rhythm Club' },
    { kicker:'WORLD 03 · BETTER TOGETHER',title:'Two hands. One very happy brain.',description:'Let your left hand join the adventure. Start with simple bass notes, add a melody, and work toward making music with both hands.',skills:['Hand coordination','Bass notes','Simple chords'] },
    { kicker:'WORLD 04 · FOLLOW YOUR CURIOSITY',title:'What happens if you play it your way?',description:'Explore quiet and loud, answer a musical question, and invent a little melody. Making music has room for your own ideas.',skills:['Dynamics','Improvising','Musical expression'] },
    { kicker:'WORLD 05 · YOUR MOMENT',title:'The best audience? Your favorite people.',description:'Put your skills together in a piece you can share. Keep going through the little wobbles, finish your song, and enjoy your moment.',skills:['Independent playing','Musical memory','Performance confidence'] }
  ];
  const names = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const computerKeys = {a:60,w:61,s:62,e:63,d:64,f:65,t:66,g:67,y:68,h:69,u:70,j:71};
  let mission = 0, position = 0, xp = 0, busy = false, complete = false, muted = false;
  let audioContext = null, master = null, transitionTimer = null, demoTimers = [], playingDemo = false, midiAccess = null;
  const voices = new Map();
  const heldComputerKeys = new Set();

  function ensureAudio() {
    if (!audioContext) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) { $('#mission-feedback').textContent = 'Your browser can’t play sound here. You can still try the notes.'; return false; }
      try {
        audioContext = new Audio();
        master = audioContext.createGain();
        master.gain.value = muted ? 0 : 0.42;
        const compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.value = -12;
        compressor.ratio.value = 4;
        master.connect(compressor);
        compressor.connect(audioContext.destination);
      } catch (_) { return false; }
    }
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    return true;
  }

  function playTone(note, velocity = 0.75) {
    if (!ensureAudio()) return;
    releaseTone(note);
    const now = audioContext.currentTime;
    const voiceGain = audioContext.createGain();
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.exponentialRampToValueAtTime(Math.max(0.03, velocity) * 0.6, now + 0.008);
    voiceGain.gain.exponentialRampToValueAtTime(velocity * 0.24 + 0.0001, now + 0.19);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
    voiceGain.connect(master);
    const frequency = 440 * Math.pow(2, (note - 69) / 12);
    const oscillators = [1,2,3,4].map((partial,index) => {
      const oscillator = audioContext.createOscillator();
      const partialGain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency * partial;
      partialGain.gain.value = [1,0.27,0.11,0.045][index];
      oscillator.connect(partialGain);
      partialGain.connect(voiceGain);
      oscillator.start(now);
      oscillator.stop(now + 2.3);
      return oscillator;
    });
    const entry = { gain:voiceGain, oscillators };
    voices.set(note, entry);
    oscillators[0].onended = () => { if (voices.get(note) === entry) voices.delete(note); voiceGain.disconnect(); };
  }

  function releaseTone(note) {
    const voice = voices.get(note);
    if (!voice || !audioContext) return;
    const now = audioContext.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setTargetAtTime(0.0001, now, 0.065);
    voice.oscillators.forEach(oscillator => { try { oscillator.stop(now + 0.4); } catch (_) {} });
    voices.delete(note);
  }

  function visualNote(note) { return 60 + ((note % 12 + 12) % 12); }
  function keyElement(note) { return $(`[data-note="${visualNote(note)}"]`); }
  function press(note, velocity = 0.75, source = 'user') {
    playTone(note, velocity);
    keyElement(note)?.classList.add('pressed');
    if (source === 'user' && !busy && !complete && !playingDemo) assess(note);
  }
  function release(note) { releaseTone(note); keyElement(note)?.classList.remove('pressed'); }

  function renderSequence() {
    const current = missions[mission];
    $('#note-sequence').replaceChildren(...current.notes.map((note,index) => {
      const item = document.createElement('span');
      item.className = 'sequence-note' + (index < position ? ' done' : index === position ? ' current' : '');
      item.textContent = names[note % 12];
      item.setAttribute('aria-label', `${names[note % 12]}${index < position ? ', played' : index === position ? ', play next' : ''}`);
      return item;
    }));
    $$('.piano-key').forEach(key => key.classList.remove('hint'));
    if (current.hints && position < current.notes.length) keyElement(current.notes[position])?.classList.add('hint');
  }

  function renderMission() {
    const current = missions[mission];
    $('#mission-eyebrow').textContent = current.eyebrow;
    $('#mission-title').textContent = current.title;
    $('#mission-title').style.whiteSpace = 'pre-line';
    $('#mission-description').textContent = current.description;
    $$('.mission-step').forEach((step,index) => {
      step.classList.toggle('active', index === mission);
      step.classList.toggle('done', index < mission);
      step.textContent = index < mission ? '✓' : String(index + 1);
    });
    renderSequence();
  }

  function assess(note) {
    const current = missions[mission];
    const expected = current.notes[position];
    if (note % 12 !== expected % 12) {
      $('#mission-feedback').textContent = `You found ${names[note % 12]}. Try ${names[expected % 12]} next.`;
      return;
    }
    position++;
    renderSequence();
    if (position < current.notes.length) {
      $('#mission-feedback').textContent = ['That’s the one!','You’ve got this.','Keep that melody going.'][position % 3];
      return;
    }
    busy = true;
    xp += 20;
    $('#xp-total').textContent = String(xp);
    $('#mission-feedback').textContent = current.success;
    $('#listen-button').disabled = true;
    transitionTimer = window.setTimeout(() => {
      if (mission < missions.length - 1) {
        mission++;
        position = 0;
        busy = false;
        $('#listen-button').disabled = false;
        $('#mission-feedback').textContent = 'A new little challenge. Ready?';
        renderMission();
      } else {
        complete = true;
        busy = false;
        $$('.mission-step').forEach(step => { step.classList.add('done'); step.classList.remove('active'); step.textContent = '✓'; });
        $('#game-celebration').hidden = false;
        $('.game-body').inert = true;
        $('.game-bottomline').inert = true;
        $('#replay-button').focus({preventScroll:true});
      }
    }, 1350);
  }

  function stopDemo() {
    demoTimers.forEach(timer => clearTimeout(timer));
    demoTimers = [];
    playingDemo = false;
    $('#listen-button').disabled = busy || complete;
    $('#listen-button span').textContent = 'Hear it first';
    $$('.piano-key').forEach(key => key.classList.remove('pressed'));
    [...voices.keys()].forEach(releaseTone);
  }

  $('#listen-button').addEventListener('click', () => {
    if (busy || complete || playingDemo) return;
    ensureAudio();
    playingDemo = true;
    $('#listen-button').disabled = true;
    $('#listen-button span').textContent = 'Listening…';
    $('#mission-feedback').textContent = 'Listen to the little melody.';
    missions[mission].notes.forEach((note,index) => {
      demoTimers.push(setTimeout(() => press(note, 0.65, 'demo'), index * 540 + 120));
      demoTimers.push(setTimeout(() => release(note), index * 540 + 480));
    });
    demoTimers.push(setTimeout(() => { stopDemo(); $('#mission-feedback').textContent = 'Your turn. Take your time.'; }, missions[mission].notes.length * 540 + 150));
  });

  $$('.piano-key').forEach(key => {
    const note = Number(key.dataset.note);
    key.addEventListener('pointerdown', event => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      event.preventDefault();
      key.focus({preventScroll:true});
      try { key.setPointerCapture(event.pointerId); } catch (_) {}
      press(note);
    });
    ['pointerup','pointercancel','lostpointercapture'].forEach(type => key.addEventListener(type, () => release(note)));
    key.addEventListener('keydown', event => {
      if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) { event.preventDefault(); press(note); }
    });
    key.addEventListener('keyup', event => {
      if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); release(note); }
    });
    key.addEventListener('click', event => {
      if (event.detail === 0) { press(note); window.setTimeout(() => release(note), 300); }
    });
  });

  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
    const key = event.key.toLowerCase();
    if (!(key in computerKeys)) return;
    const rect = $('.game-shell').getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight || complete) return;
    event.preventDefault();
    heldComputerKeys.add(key);
    press(computerKeys[key]);
  });
  document.addEventListener('keyup', event => {
    const key = event.key.toLowerCase();
    if (!heldComputerKeys.has(key)) return;
    heldComputerKeys.delete(key);
    release(computerKeys[key]);
  });
  window.addEventListener('blur', () => {
    heldComputerKeys.clear();
    stopDemo();
    [...voices.keys()].forEach(releaseTone);
    $$('.piano-key').forEach(key => key.classList.remove('pressed'));
  });

  $('#sound-toggle').addEventListener('click', () => {
    muted = !muted;
    if (master && audioContext) master.gain.setTargetAtTime(muted ? 0 : 0.42, audioContext.currentTime, 0.02);
    $('#sound-toggle').setAttribute('aria-pressed', String(muted));
    $('#sound-toggle').setAttribute('aria-label', muted ? 'Enable sound' : 'Mute sound');
    $('#sound-toggle span').textContent = muted ? 'Sound off' : 'Sound on';
  });

  $('#replay-button').addEventListener('click', () => {
    clearTimeout(transitionTimer);
    stopDemo();
    mission = 0; position = 0; xp = 0; busy = false; complete = false;
    $('#game-celebration').hidden = true;
    $('.game-body').inert = false;
    $('.game-bottomline').inert = false;
    $('#xp-total').textContent = '0';
    $('#listen-button').disabled = false;
    $('#mission-feedback').textContent = 'Here we go again!';
    renderMission();
    keyElement(60).focus({preventScroll:true});
  });

  function wireMidiInputs() {
    const inputs = [...midiAccess.inputs.values()].filter(input => input.state === 'connected');
    inputs.forEach(input => {
      input.onmidimessage = ({data}) => {
        if (!data || data.length < 3) return;
        const [status,note,velocity] = data;
        const command = status & 0xf0;
        if (command === 0x90 && velocity > 0) press(note, velocity / 127);
        if (command === 0x80 || (command === 0x90 && velocity === 0)) release(note);
      };
    });
    $('#midi-status').textContent = inputs.length ? `Connected: ${inputs.map(input => input.name || 'MIDI keyboard').join(', ')}. Try any C, D, and E.` : 'MIDI is ready. Connect your keyboard by USB, then play a note.';
    $('#midi-button').textContent = inputs.length ? 'Keyboard connected ✓' : 'Listening for a keyboard…';
  }

  $('#midi-button').addEventListener('click', async () => {
    ensureAudio();
    if (!navigator.requestMIDIAccess) {
      $('#midi-status').textContent = 'This browser doesn’t support MIDI. Try a compatible desktop browser such as Chrome, or keep playing with the on-screen keys.';
      return;
    }
    if (midiAccess) { wireMidiInputs(); return; }
    $('#midi-button').disabled = true;
    $('#midi-status').textContent = 'Allow access to your MIDI keyboard when your browser asks.';
    try {
      midiAccess = await navigator.requestMIDIAccess({sysex:false});
      wireMidiInputs();
      midiAccess.onstatechange = wireMidiInputs;
    } catch (_) {
      $('#midi-status').textContent = 'Keyboard access wasn’t available. Check your browser’s MIDI permissions, or try the on-screen keys.';
    } finally { $('#midi-button').disabled = false; }
  });

  $$('.journey-stop').forEach(button => button.addEventListener('click', () => {
    const world = worlds[Number(button.dataset.world)];
    $$('.journey-stop').forEach(stop => { stop.classList.toggle('selected', stop === button); stop.setAttribute('aria-pressed', String(stop === button)); });
    $('#world-kicker').textContent = world.kicker;
    $('#world-title').textContent = world.title;
    $('#world-description').textContent = world.description;
    const learnLink = $('#world-learn-link');
    if (learnLink) {
      if (world.learnHref) {
        learnLink.hidden = false;
        learnLink.innerHTML = `<a href="${world.learnHref}">${world.learnLabel}</a>`;
      } else {
        learnLink.hidden = true;
        learnLink.replaceChildren();
      }
    }
    $('#skill-tags').replaceChildren(...world.skills.map(skill => { const tag = document.createElement('span'); tag.textContent = skill; return tag; }));
  }));
})();
