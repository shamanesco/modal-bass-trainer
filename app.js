// app.js - Main application controller

import { MODAL_DATA, getMode, getGroove, transposeToRoot } from './modal-data.js';
import { ModalAudioEngine } from './audio.js';
import { FretboardVisualizer } from './fretboard.js';
import { BassPitchDetector } from './pitch-detector.js';

class ModalBassTrainer {
  constructor() {
    // Core components
    this.audioEngine = null;
    this.pitchDetector = null;
    this.fretboard = null;
    
    // State
    this.currentMode = 'dorian';
    this.currentRoot = 'D';
    this.currentRootMIDI = 62; // D3
    this.practiceType = 'drone'; // 'drone' or 'groove'
    this.currentGroove = null;
    this.tempo = 90;
    this.isPlaying = false;
    
    // Analytics
    this.session = {
      startTime: null,
      toneDistribution: new Array(12).fill(0), // Count per chromatic interval
      totalNotes: 0,
      characteristicToneCount: 0,
      avoidToneCount: 0
    };

    // Track last counted MIDI note to prevent counting sustained notes multiple times
    this.lastCountedMIDI = null;
    this.lastNoteTime = null;
    this.lastDetectionTime = null;

    // Debug logging
    this.debugLog = [];
    
    // UI elements
    this.ui = {
      modeSelect: document.getElementById('mode-select'),
      rootSelect: document.getElementById('root-select'),
      practiceTypeRadios: document.getElementsByName('practice-type'),
      grooveSelect: document.getElementById('groove-select'),
      tempoSlider: document.getElementById('tempo-slider'),
      tempoDisplay: document.getElementById('tempo-display'),
      startButton: document.getElementById('start-button'),
      stopButton: document.getElementById('stop-button'),
      inputDeviceSelect: document.getElementById('input-device-select'),
      inputMeter: document.getElementById('input-meter'),
      statsPanel: document.getElementById('stats-panel')
    };
    
    this.init();
  }

  async init() {
    try {
      // Initialize audio engine
      this.audioEngine = new ModalAudioEngine();
      await this.audioEngine.init();
      console.log('Audio engine initialized');

      // Initialize fretboard visualizer
      this.fretboard = new FretboardVisualizer('fretboard-canvas');
      console.log('Fretboard visualizer initialized');

      // Initialize pitch detector
      this.pitchDetector = new BassPitchDetector(
        (freq, conf, noteName, midiNote, cents) => this.onPitchDetected(freq, conf, noteName, midiNote, cents),
        (level) => this.onLevelUpdate(level)
      );

      // Request permission once to get device labels
      let permissionGranted = false;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately, just needed for permission
        permissionGranted = true;
        console.log('Audio permission granted, device labels will be visible');

        // Small delay to let browser update device list after permission grant
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (permError) {
        console.log('Audio permission not granted yet, will request on Start');
      }

      // Get available audio input devices (will have real labels if permission granted)
      await this.populateInputDevices();

      if (permissionGranted) {
        console.log('Devices populated with real labels');
      } else {
        console.log('Devices populated with placeholder names (permission needed)');
      }

      // Setup UI event listeners
      this.setupUIListeners();

      // Set initial mode
      this.updateMode();

      // Show ready state
      this.showStatus('Ready. Select your line input device and click Start.');

    } catch (error) {
      console.error('Initialization error:', error);
      this.showError('Failed to initialize. Please check your audio input permissions.');
    }
  }

  async populateInputDevices() {
    const devices = await this.pitchDetector.getAvailableDevices();
    const select = this.ui.inputDeviceSelect;

    console.log(`Found ${devices.length} audio input devices:`, devices);

    select.innerHTML = '';

    if (devices.length === 0) {
      const option = document.createElement('option');
      option.textContent = 'No input devices found';
      option.disabled = true;
      select.appendChild(option);
      return;
    }

    devices.forEach((device, index) => {
      console.log(`Device ${index + 1} full info:`, {
        deviceId: device.deviceId,
        groupId: device.groupId,
        kind: device.kind,
        label: device.label
      });

      const option = document.createElement('option');
      option.value = device.deviceId;
      // Use device label if available (after permission), otherwise use placeholder
      const label = device.label && device.label.trim() !== ''
        ? device.label
        : `Audio Input ${index + 1}`;
      option.textContent = label;
      select.appendChild(option);
    });
  }

  setupUIListeners() {
    // Mode selection
    this.ui.modeSelect.addEventListener('change', () => this.updateMode());
    
    // Root selection
    this.ui.rootSelect.addEventListener('change', () => this.updateMode());
    
    // Practice type (drone vs groove)
    this.ui.practiceTypeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.practiceType = e.target.value;
        this.updateGrooveOptions();
      });
    });
    
    // Groove selection
    this.ui.grooveSelect.addEventListener('change', (e) => {
      this.currentGroove = e.target.value;
    });
    
    // Tempo slider
    this.ui.tempoSlider.addEventListener('input', (e) => {
      this.tempo = parseInt(e.target.value);
      this.ui.tempoDisplay.textContent = this.tempo;
      
      // Update tempo if already playing
      if (this.isPlaying && this.practiceType === 'groove') {
        this.audioEngine.setTempo(this.tempo);
      }
    });
    
    // Start button
    this.ui.startButton.addEventListener('click', () => this.start());
    
    // Stop button
    this.ui.stopButton.addEventListener('click', () => this.stop());
    
    // Input device change
    this.ui.inputDeviceSelect.addEventListener('change', async () => {
      // Cleanup existing stream if any
      if (this.pitchDetector.mediaStream) {
        this.pitchDetector.cleanup();
      }

      // If currently running, reinitialize with new device
      if (this.pitchDetector.isRunning) {
        await this.reinitializePitchDetector();
      }
    });
  }

  updateMode() {
    this.currentMode = this.ui.modeSelect.value;
    this.currentRoot = this.ui.rootSelect.value;
    this.currentRootMIDI = this.noteNameToMIDI(this.currentRoot, 3);
    
    // Update fretboard
    this.fretboard.setMode(this.currentMode, this.currentRootMIDI);
    
    // Update groove options
    this.updateGrooveOptions();
    
    // Show mode info
    const mode = getMode(this.currentMode);
    this.showModeInfo(mode);
  }

  updateGrooveOptions() {
    const select = this.ui.grooveSelect;
    const grooveContainer = select.parentElement;
    const tempoSlider = this.ui.tempoSlider;
    const tempoContainer = tempoSlider.parentElement;

    if (this.practiceType === 'drone') {
      // Hide groove selector
      grooveContainer.style.visibility = 'hidden';
      grooveContainer.style.position = 'absolute';
      grooveContainer.style.pointerEvents = 'none';

      // Hide tempo slider
      tempoContainer.style.visibility = 'hidden';
      tempoContainer.style.position = 'absolute';
      tempoContainer.style.pointerEvents = 'none';
      return;
    }

    // Show groove selector
    grooveContainer.style.visibility = 'visible';
    grooveContainer.style.position = 'relative';
    grooveContainer.style.pointerEvents = 'auto';

    // Show tempo slider
    tempoContainer.style.visibility = 'visible';
    tempoContainer.style.position = 'relative';
    tempoContainer.style.pointerEvents = 'auto';

    // Populate grooves for current mode
    const mode = getMode(this.currentMode);
    select.innerHTML = '';

    mode.grooves.forEach(groove => {
      const option = document.createElement('option');
      option.value = groove.id;
      option.textContent = `${groove.name} - ${groove.description}`;
      select.appendChild(option);
    });

    this.currentGroove = mode.grooves[0].id;
  }

  async start() {
    try {
      // Initialize pitch detector with selected device (only if not already initialized)
      if (!this.pitchDetector.mediaStream) {
        const deviceId = this.ui.inputDeviceSelect.value;
        const success = await this.pitchDetector.init(deviceId);

        if (!success) {
          this.showError('Failed to access line input. Check permissions and device connection.');
          return;
        }
      }

      // Start pitch detection
      this.pitchDetector.start();
      
      // Start audio (drone or groove)
      if (this.practiceType === 'drone') {
        this.audioEngine.startDrone(this.currentRootMIDI, true);
      } else {
        const grooveData = getGroove(this.currentMode, this.currentGroove);
        this.audioEngine.startGroove(this.currentRootMIDI, grooveData, this.tempo);
      }
      
      // Update state
      this.isPlaying = true;
      this.session.startTime = Date.now();
      this.resetSessionStats();
      this.lastCountedMIDI = null; // Reset note tracking for new session
      this.lastNoteTime = null;
      this.lastDetectionTime = Date.now();
      this.debugLog = []; // Clear debug log
      
      // Update UI
      this.ui.startButton.disabled = true;
      this.ui.stopButton.disabled = false;
      this.disableControls(true);
      
      this.showStatus('Playing... Start practicing!');
      
    } catch (error) {
      console.error('Start error:', error);
      this.showError('Failed to start. ' + error.message);
    }
  }

  stop() {
    // Stop audio
    this.audioEngine.stopAll();

    // Stop pitch detection
    this.pitchDetector.stop();

    // Print debug log summary
    this.printDebugSummary();

    // Update state
    this.isPlaying = false;
    this.lastCountedMIDI = null; // Reset note tracking
    this.lastNoteTime = null;
    this.lastDetectionTime = null;

    // Update UI
    this.ui.startButton.disabled = false;
    this.ui.stopButton.disabled = true;
    this.disableControls(false);

    // Show session summary
    this.showSessionSummary();

    this.showStatus('Stopped. Review your session stats below.');
  }

  printDebugSummary() {
    console.log('\n========== SESSION DEBUG SUMMARY ==========');
    console.log(`Total detections: ${this.debugLog.length}`);
    console.log(`Total notes counted: ${this.session.totalNotes}`);
    console.log(`\nDetections that were COUNTED:`);

    const countedNotes = this.debugLog.filter(entry => entry.counted);
    countedNotes.forEach((entry, idx) => {
      console.log(`  ${idx + 1}. ${entry.note} (MIDI ${entry.midi}) at ${entry.time}ms - gap: ${entry.timeSinceLast}ms`);
    });

    console.log(`\nAll detections (showing first 50):`);
    this.debugLog.slice(0, 50).forEach((entry, idx) => {
      const counted = entry.counted ? '✓ COUNTED' : '';
      console.log(`  ${idx + 1}. ${entry.note.padEnd(4)} PC:${entry.pitchClass.toString().padStart(2)} t:${entry.time}ms gap:${entry.timeSinceLast.toString().padStart(4)} pcChg:${entry.pitchChanged} ${counted}`);
    });

    if (this.debugLog.length > 50) {
      console.log(`  ... and ${this.debugLog.length - 50} more detections`);
    }
    console.log('==========================================\n');
  }

  async reinitializePitchDetector() {
    this.pitchDetector.cleanup();
    
    this.pitchDetector = new BassPitchDetector(
      (freq, conf, noteName, midiNote, cents) => this.onPitchDetected(freq, conf, noteName, midiNote, cents),
      (level) => this.onLevelUpdate(level)
    );
    
    const deviceId = this.ui.inputDeviceSelect.value;
    await this.pitchDetector.init(deviceId);
    this.pitchDetector.start();
  }

  onPitchDetected(frequency, confidence, noteName, midiNote, cents) {
    // Update fretboard visualization (always update for real-time feedback)
    this.fretboard.updatePosition(midiNote);

    const now = Date.now();

    // Hybrid approach: 400ms gate + pitch class change
    // With Pitchy's improved stability, reduced from 600ms to 400ms
    const timeSinceLastNote = this.lastNoteTime ? (now - this.lastNoteTime) : Infinity;
    const pitchClass = midiNote % 12;
    const lastPitchClass = this.lastCountedMIDI !== null ? this.lastCountedMIDI % 12 : null;
    const pitchClassChanged = lastPitchClass === null || pitchClass !== lastPitchClass;

    // Count if: 400ms passed AND pitch class changed
    const shouldCount = timeSinceLastNote >= 400 && pitchClassChanged;

    // Log detection
    const logEntry = {
      time: now - this.session.startTime,
      note: noteName,
      midi: midiNote,
      pitchClass: pitchClass,
      timeSinceLast: timeSinceLastNote === Infinity ? 'N/A' : Math.round(timeSinceLastNote),
      pitchChanged: pitchClassChanged,
      counted: shouldCount
    };
    this.debugLog.push(logEntry);

    if (shouldCount) {
      this.trackNote(midiNote);
      this.lastCountedMIDI = midiNote;
      this.lastNoteTime = now;
    }

    // Update last detection time
    this.lastDetectionTime = now;

    // Update real-time stats display
    this.updateStatsDisplay();
  }

  onLevelUpdate(level) {
    // Update input level meter
    const meter = this.ui.inputMeter;
    const normalized = Math.max(0, Math.min(100, (level + 70) * 1.5)); // -70dB to -10dB -> 0-100%
    
    meter.style.width = normalized + '%';
    
    // Color coding
    if (normalized < 30) {
      meter.style.backgroundColor = '#ef4444'; // Red - too quiet
    } else if (normalized > 85) {
      meter.style.backgroundColor = '#f59e0b'; // Orange - clipping risk
    } else {
      meter.style.backgroundColor = '#22c55e'; // Green - good
    }
  }

  trackNote(midiNote) {
    const intervalFromRoot = (midiNote - this.currentRootMIDI + 120) % 12;
    
    // Increment distribution
    this.session.toneDistribution[intervalFromRoot]++;
    this.session.totalNotes++;
    
    // Check if characteristic or avoid tone
    const mode = getMode(this.currentMode);
    const interval = mode.intervals.find(int => int.semitones === intervalFromRoot);
    
    if (interval && interval.color === 'characteristic') {
      this.session.characteristicToneCount++;
    }
    
    const isAvoid = mode.avoidNotes && mode.avoidNotes.some(avoid => avoid.semitones === intervalFromRoot);
    if (isAvoid) {
      this.session.avoidToneCount++;
    }
  }

  updateStatsDisplay() {
    if (!this.isPlaying || this.session.totalNotes === 0) return;
    
    const mode = getMode(this.currentMode);
    
    // Calculate percentages
    const characteristicPct = (this.session.characteristicToneCount / this.session.totalNotes * 100).toFixed(1);
    const avoidPct = (this.session.avoidToneCount / this.session.totalNotes * 100).toFixed(1);
    
    // Calculate stable tones (root and fifth)
    const stableTones = this.session.toneDistribution[0] + this.session.toneDistribution[7];
    const stablePct = (stableTones / this.session.totalNotes * 100).toFixed(1);
    
    const statsHTML = `
      <div class="stat-row">
        <span class="stat-label">Total notes:</span>
        <span class="stat-value">${this.session.totalNotes}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Characteristic tones:</span>
        <span class="stat-value stat-good">${characteristicPct}%</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Stable tones:</span>
        <span class="stat-value">${stablePct}%</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Avoid tones:</span>
        <span class="stat-value stat-warning">${avoidPct}%</span>
      </div>
    `;
    
    this.ui.statsPanel.innerHTML = statsHTML;
  }

  showSessionSummary() {
    if (this.session.totalNotes === 0) {
      this.ui.statsPanel.innerHTML = '<p>No notes detected in this session.</p>';
      return;
    }
    
    const mode = getMode(this.currentMode);
    const duration = ((Date.now() - this.session.startTime) / 1000 / 60).toFixed(1);
    
    // Find most used interval
    const maxInterval = this.session.toneDistribution.indexOf(Math.max(...this.session.toneDistribution));
    const intervalInfo = mode.intervals.find(int => int.semitones === maxInterval);
    
    const characteristicPct = (this.session.characteristicToneCount / this.session.totalNotes * 100).toFixed(1);
    const avoidPct = (this.session.avoidToneCount / this.session.totalNotes * 100).toFixed(1);
    
    let feedback = '';
    if (parseFloat(characteristicPct) > 30) {
      feedback = `<p class="feedback-good">✓ Strong modal character! You emphasized the signature tones.</p>`;
    } else if (parseFloat(characteristicPct) < 15) {
      feedback = `<p class="feedback-warning">⚠ Try emphasizing ${mode.name}'s characteristic tones more (${mode.intervals.filter(i => i.color === 'characteristic').map(i => i.degree).join(', ')}).</p>`;
    }
    
    if (parseFloat(avoidPct) > 10) {
      feedback += `<p class="feedback-warning">⚠ You used avoid tones ${avoidPct}% of the time. These can weaken the modal sound.</p>`;
    }
    
    const summaryHTML = `
      <h3>Session Summary</h3>
      <div class="stat-row">
        <span class="stat-label">Duration:</span>
        <span class="stat-value">${duration} minutes</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Total notes:</span>
        <span class="stat-value">${this.session.totalNotes}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Most used interval:</span>
        <span class="stat-value">${intervalInfo ? intervalInfo.degree : maxInterval} (${intervalInfo ? intervalInfo.label : 'interval'})</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Characteristic tones:</span>
        <span class="stat-value">${characteristicPct}%</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Avoid tones:</span>
        <span class="stat-value">${avoidPct}%</span>
      </div>
      ${feedback}
    `;
    
    this.ui.statsPanel.innerHTML = summaryHTML;
  }

  resetSessionStats() {
    this.session = {
      startTime: Date.now(),
      toneDistribution: new Array(12).fill(0),
      totalNotes: 0,
      characteristicToneCount: 0,
      avoidToneCount: 0
    };
    this.ui.statsPanel.innerHTML = '';
  }

  showModeInfo(mode) {
    const infoPanel = document.getElementById('mode-info-panel');
    if (!infoPanel) return;
    
    const characteristicTones = mode.intervals
      .filter(int => int.color === 'characteristic')
      .map(int => `${int.degree} (${int.label})`)
      .join(', ');
    
    const avoidTones = mode.avoidNotes
      ? mode.avoidNotes.map(avoid => `${avoid.degree} - ${avoid.reason}`).join('<br>')
      : 'None';
    
    infoPanel.innerHTML = `
      <h3>${mode.name} Mode - ${this.currentRoot} Root</h3>
      <p>${mode.description}</p>
      <p><strong>Characteristic tones:</strong> ${characteristicTones}</p>
      <p><strong>Avoid:</strong><br>${avoidTones}</p>
    `;
  }

  disableControls(disabled) {
    this.ui.modeSelect.disabled = disabled;
    this.ui.rootSelect.disabled = disabled;
    this.ui.practiceTypeRadios.forEach(radio => radio.disabled = disabled);
    this.ui.grooveSelect.disabled = disabled;
    this.ui.tempoSlider.disabled = disabled;
    this.ui.inputDeviceSelect.disabled = disabled;
  }

  showStatus(message) {
    const statusEl = document.getElementById('status-message');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = 'status-message';
    }
  }

  showError(message) {
    const statusEl = document.getElementById('status-message');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = 'status-message error';
    }
  }

  noteNameToMIDI(noteName, octave) {
    const noteMap = {
      'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
      'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
    };
    return (octave + 1) * 12 + noteMap[noteName];
  }

  cleanup() {
    this.stop();
    this.pitchDetector.cleanup();
    this.fretboard.cleanup();
  }
}

// ===== INITIALIZE APP ON LOAD =====

let app;

window.addEventListener('DOMContentLoaded', async () => {
  app = new ModalBassTrainer();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (app) {
    app.cleanup();
  }
});