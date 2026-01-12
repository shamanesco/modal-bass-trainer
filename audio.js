// audio.js - Drone and groove generation

import { getGroove } from './modal-data.js';

export class ModalAudioEngine {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.oscillators = [];
    this.scheduledNotes = [];
    this.isPlaying = false;
    this.currentBeat = 0;
    this.tempo = 90;
    this.lookahead = 25.0; // ms
    this.scheduleAheadTime = 0.1; // seconds
    this.nextNoteTime = 0.0;
    this.timerID = null;
  }

  async init() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.audioContext.destination);
  }

  // ===== DRONE MODE =====
  
  startDrone(rootPitch, includeFifth = true) {
    this.stopAll();
    this.isPlaying = true;
    
    const rootFreq = this.midiToFreq(rootPitch);
    const fifthFreq = this.midiToFreq(rootPitch + 7);
    
    // Root oscillator - warm sine wave
    const rootOsc = this.createOscillator(rootFreq, 'sine', 0.4);

    if (includeFifth) {
      // Fifth oscillator - softer
      const fifthOsc = this.createOscillator(fifthFreq, 'sine', 0.2);
    }
    
    // Add subtle sub-octave for bass richness
    const subOsc = this.createOscillator(rootFreq / 2, 'sine', 0.15);
  }

  createOscillator(frequency, type, volume) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = type;
    osc.frequency.value = frequency;
    
    gain.gain.value = volume;
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    this.oscillators.push({osc, gain});
    
    return osc;
  }

  // ===== GROOVE MODE =====
  
  startGroove(rootPitch, grooveData, tempo) {
    this.stopAll();
    this.tempo = tempo;
    this.isPlaying = true;
    this.currentBeat = 0;
    this.nextNoteTime = this.audioContext.currentTime;
    
    this.grooveData = this.prepareGrooveData(rootPitch, grooveData);
    
    // Start scheduler
    this.scheduler();
  }

  prepareGrooveData(rootPitch, grooveData) {
    // Convert groove definition to playable data
    const prepared = {
      chords: grooveData.chords.map(chord => ({
        frequencies: chord.voicing.map(semitone => 
          this.midiToFreq(rootPitch + semitone)
        ),
        duration: chord.duration
      })),
      pattern: grooveData.pattern,
      swing: grooveData.swing,
      beatsPerMeasure: grooveData.pattern.length
    };
    
    return prepared;
  }

  scheduler() {
    // Schedule notes slightly ahead for tight timing
    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentBeat, this.nextNoteTime);
      this.nextNote();
    }
    
    if (this.isPlaying) {
      this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
    }
  }

  scheduleNote(beatNumber, time) {
    const pattern = this.grooveData.pattern;
    const patternIndex = beatNumber % pattern.length;
    
    // Check if this beat should play
    if (pattern[patternIndex] === 1) {
      // Determine which chord to play
      const chordIndex = this.getChordForBeat(beatNumber);
      const chord = this.grooveData.chords[chordIndex];
      
      // Apply swing if needed
      let swingOffset = 0;
      if (this.grooveData.swing && beatNumber % 2 === 1) {
        swingOffset = (60.0 / this.tempo) * 0.15; // Swing feel
      }
      
      this.playChord(chord.frequencies, time + swingOffset, 0.5);
    }
  }

  getChordForBeat(beatNumber) {
    // Calculate which chord based on duration
    let totalBeats = 0;
    for (let i = 0; i < this.grooveData.chords.length; i++) {
      totalBeats += this.grooveData.chords[i].duration;
      if (beatNumber < totalBeats) {
        return i;
      }
    }
    // Loop back to first chord
    return 0;
  }

  playChord(frequencies, time, duration) {
    frequencies.forEach((freq, index) => {
      this.playNote(freq, time, duration, 0.15 / frequencies.length);
    });
  }

  playNote(frequency, time, duration, volume) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    // Warmer sound for bass-range chords
    osc.type = 'triangle';
    osc.frequency.value = frequency;
    
    // Low-pass filter for smoothness
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1;
    
    // Envelope
    gain.gain.value = 0;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.02); // Quick attack
    gain.gain.exponentialRampToValueAtTime(volume * 0.7, time + duration * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(time);
    osc.stop(time + duration);
    
    // Track for cleanup
    this.scheduledNotes.push({osc, gain, stopTime: time + duration});
    
    // Auto-cleanup
    setTimeout(() => {
      const index = this.scheduledNotes.findIndex(n => n.osc === osc);
      if (index > -1) this.scheduledNotes.splice(index, 1);
    }, (duration + 0.1) * 1000);
  }

  nextNote() {
    // Calculate next beat time
    const secondsPerBeat = 60.0 / this.tempo;
    this.nextNoteTime += secondsPerBeat;
    
    this.currentBeat++;
    
    // Loop pattern
    const totalBeats = this.grooveData.chords.reduce((sum, chord) => 
      sum + chord.duration, 0
    );
    if (this.currentBeat >= totalBeats) {
      this.currentBeat = 0;
    }
  }

  // ===== UTILITY =====
  
  midiToFreq(midiNote) {
    // MIDI note 60 = C4 = 261.63 Hz
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  setTempo(newTempo) {
    this.tempo = newTempo;
  }

  setVolume(volume) {
    // volume: 0.0 to 1.0
    this.masterGain.gain.setValueAtTime(
      volume * 0.3, 
      this.audioContext.currentTime
    );
  }

  stopAll() {
    this.isPlaying = false;
    
    // Clear scheduler
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
    
    // Stop all drone oscillators
    this.oscillators.forEach(({osc, gain}) => {
      gain.gain.exponentialRampToValueAtTime(
        0.01, 
        this.audioContext.currentTime + 0.05
      );
      osc.stop(this.audioContext.currentTime + 0.1);
    });
    this.oscillators = [];
    
    // Scheduled notes will auto-cleanup
  }

  suspend() {
    if (this.audioContext) {
      this.audioContext.suspend();
    }
  }

  resume() {
    if (this.audioContext) {
      this.audioContext.resume();
    }
  }
}

// ===== USAGE EXAMPLE =====

/*
const engine = new ModalAudioEngine();
await engine.init();

// Drone mode
const rootNote = 62; // MIDI D (D3)
engine.startDrone(rootNote, true); // with fifth

// Groove mode
const grooveData = getGroove('dorian', 'dorian_funk');
engine.startGroove(rootNote, grooveData, 100);

// Control
engine.setTempo(120);
engine.setVolume(0.5);
engine.stopAll();
*/