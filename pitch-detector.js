// pitch-detector.js - Real-time bass pitch detection from line input

class BassPitchDetector {
  constructor(onPitchDetected, onLevelUpdate) {
    this.audioContext = null;
    this.analyser = null;
    this.mediaStream = null;
    this.rafID = null;
    
    // Callbacks
    this.onPitchDetected = onPitchDetected; // (frequency, confidence, noteName, midiNote)
    this.onLevelUpdate = onLevelUpdate;     // (level) for input meter
    
    // Detection parameters
    this.bufferSize = 4096;  // Larger FFT for low frequencies
    this.sampleRate = 44100;
    this.minFrequency = 30;   // Below low E (41.2 Hz)
    this.maxFrequency = 400;  // Above typical bass range
    this.threshold = -50;     // dB threshold for detection
    this.confidenceThreshold = 0.85;
    
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
      const result = this.autoCorrelate(buffer);
      
      if (result.frequency > 0 && result.confidence > this.confidenceThreshold) {
        // Cooldown to prevent rapid-fire detections
        const now = Date.now();
        if (now - this.lastDetectionTime > this.detectionCooldown) {
          const noteInfo = this.frequencyToNote(result.frequency);
          
          if (this.onPitchDetected) {
            this.onPitchDetected(
              result.frequency,
              result.confidence,
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

  // Autocorrelation algorithm - best for bass frequencies
  autoCorrelate(buffer) {
    const size = buffer.length;
    const maxSamples = Math.floor(size / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let foundGoodCorrelation = false;
    
    // Calculate RMS for normalization
    const rms = Math.sqrt(buffer.reduce((sum, val) => sum + val * val, 0) / size);
    
    if (rms < 0.01) {
      return { frequency: -1, confidence: 0 };
    }
    
    // Limit search range based on expected frequency
    const minOffset = Math.floor(this.sampleRate / this.maxFrequency);
    const maxOffset = Math.floor(this.sampleRate / this.minFrequency);
    
    // Find the best correlation
    for (let offset = minOffset; offset < maxOffset && offset < maxSamples; offset++) {
      let correlation = 0;
      
      for (let i = 0; i < maxSamples; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + offset]);
      }
      
      correlation = 1 - (correlation / maxSamples);
      
      if (correlation > 0.9) {
        foundGoodCorrelation = true;
        if (correlation > bestCorrelation) {
          bestCorrelation = correlation;
          bestOffset = offset;
        }
      } else if (foundGoodCorrelation) {
        // Found peak, start declining
        break;
      }
    }
    
    if (bestCorrelation > 0.01 && bestOffset !== -1) {
      // Refine with parabolic interpolation
      const refinedOffset = this.parabolicInterpolation(
        buffer, 
        bestOffset,
        maxSamples
      );
      
      const frequency = this.sampleRate / refinedOffset;
      
      // Validate frequency is in expected range
      if (frequency >= this.minFrequency && frequency <= this.maxFrequency) {
        return {
          frequency: frequency,
          confidence: bestCorrelation
        };
      }
    }
    
    return { frequency: -1, confidence: 0 };
  }

  parabolicInterpolation(buffer, offset, maxSamples) {
    // Improve accuracy using neighboring correlations
    if (offset < 1 || offset >= maxSamples - 1) {
      return offset;
    }
    
    const prev = this.correlationAtOffset(buffer, offset - 1, maxSamples);
    const curr = this.correlationAtOffset(buffer, offset, maxSamples);
    const next = this.correlationAtOffset(buffer, offset + 1, maxSamples);
    
    const delta = (prev - next) / (2 * (prev - 2 * curr + next));
    
    return offset + delta;
  }

  correlationAtOffset(buffer, offset, maxSamples) {
    let correlation = 0;
    for (let i = 0; i < maxSamples; i++) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }
    return 1 - (correlation / maxSamples);
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