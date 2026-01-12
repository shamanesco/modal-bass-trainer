// pitch-detector.js - Real-time bass pitch detection from line input

import { PitchDetector } from 'https://esm.sh/pitchy@4';

export class BassPitchDetector {
  constructor(onPitchDetected, onLevelUpdate) {
    this.audioContext = null;
    this.analyser = null;
    this.mediaStream = null;
    this.rafID = null;

    // Callbacks
    this.onPitchDetected = onPitchDetected; // (frequency, confidence, noteName, midiNote)
    this.onLevelUpdate = onLevelUpdate;     // (level) for input meter

    // Detection parameters optimized for 4-string bass (E1-G3: 41.2-196 Hz)
    this.bufferSize = 4096;  // Good for bass frequencies (~93ms resolution at 44.1kHz)
    this.sampleRate = 44100;
    this.minFrequency = 38;   // Just below E1 (41.2 Hz) with margin
    this.maxFrequency = 260;  // Just above B3 (246.94 Hz on 24th fret)
    this.threshold = -50;     // dB threshold for detection
    this.confidenceThreshold = 0.75;  // Lower for Pitchy's stricter clarity metric

    // Pitchy detector (initialized after we know sample rate)
    this.pitchyDetector = null;

    // State
    this.isRunning = false;
    this.lastDetectedNote = null;
    this.lastDetectionTime = 0;
    this.detectionCooldown = 50; // ms between detections
  }

  async init(deviceId = null) {
    try {
      // Request line input access
      const constraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,  // Capture only channel 1 (mono)
          deviceId: deviceId ? { exact: deviceId } : undefined
        }
      };
      
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Setup audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.sampleRate = this.audioContext.sampleRate;
      
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Create analyser
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.bufferSize;
      this.analyser.smoothingTimeConstant = 0.3;
      this.analyser.minDecibels = -70;
      this.analyser.maxDecibels = -10;
      
      source.connect(this.analyser);

      // Initialize Pitchy detector optimized for bass frequencies
      this.pitchyDetector = PitchDetector.forFloat32Array(this.bufferSize);

      return true;
    } catch (error) {
      console.error('Failed to initialize line input:', error);
      return false;
    }
  }

  async getAvailableDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audioinput');
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.detectPitch();
  }

  stop() {
    this.isRunning = false;
    if (this.rafID) {
      cancelAnimationFrame(this.rafID);
      this.rafID = null;
    }
  }

  detectPitch() {
    if (!this.isRunning) return;
    
    const buffer = new Float32Array(this.bufferSize);
    this.analyser.getFloatTimeDomainData(buffer);
    
    // Calculate RMS level for input meter
    const level = this.calculateRMS(buffer);
    if (this.onLevelUpdate) {
      this.onLevelUpdate(level);
    }
    
    // Only detect if signal is strong enough
    if (level > this.threshold) {
      // Use Pitchy to detect pitch (McLeod Pitch Method)
      const [frequency, clarity] = this.pitchyDetector.findPitch(buffer, this.sampleRate);

      // Validate frequency is in bass range and clarity meets threshold
      if (frequency > 0 &&
          frequency >= this.minFrequency &&
          frequency <= this.maxFrequency &&
          clarity > this.confidenceThreshold) {

        // Cooldown to prevent rapid-fire detections
        const now = Date.now();
        if (now - this.lastDetectionTime > this.detectionCooldown) {
          const noteInfo = this.frequencyToNote(frequency);

          if (this.onPitchDetected) {
            this.onPitchDetected(
              frequency,
              clarity,
              noteInfo.name,
              noteInfo.midi,
              noteInfo.cents
            );
          }

          this.lastDetectedNote = noteInfo;
          this.lastDetectionTime = now;
        }
      }
    }
    
    this.rafID = requestAnimationFrame(() => this.detectPitch());
  }

  calculateRMS(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sum / buffer.length);
    
    // Convert to dB
    return 20 * Math.log10(rms + 1e-10);
  }

  frequencyToNote(frequency) {
    // A4 = 440 Hz = MIDI note 69
    const midiNote = 12 * Math.log2(frequency / 440) + 69;
    const midiRounded = Math.round(midiNote);
    const cents = Math.round((midiNote - midiRounded) * 100);
    
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = midiRounded % 12;
    const octave = Math.floor(midiRounded / 12) - 1;
    
    return {
      name: noteNames[noteIndex] + octave,
      midi: midiRounded,
      cents: cents,
      noteNameOnly: noteNames[noteIndex],
      octave: octave
    };
  }

  cleanup() {
    this.stop();
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// ===== USAGE EXAMPLE =====

/*
// Initialize detector
const detector = new BassPitchDetector(
  (frequency, confidence, noteName, midiNote, cents) => {
    console.log(`Detected: ${noteName} (${frequency.toFixed(2)} Hz)`);
    console.log(`Confidence: ${(confidence * 100).toFixed(1)}%`);
    console.log(`Tuning: ${cents > 0 ? '+' : ''}${cents} cents`);
    
    // Update UI: fretboard, heat map, etc.
    updateFretboard(noteName, midiNote);
    updateHeatMap(midiNote);
  },
  (level) => {
    // Update input level meter
    updateLevelMeter(level);
  }
);

// Get available line input devices
const devices = await detector.getAvailableDevices();
console.log('Available line inputs:', devices);

// Initialize with specific device (or null for default)
const success = await detector.init(devices[0]?.deviceId);

if (success) {
  detector.start();
}

// When done
detector.cleanup();
*/