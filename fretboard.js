// fretboard.js - Visual feedback for bass fretboard and modal heat map

class FretboardVisualizer {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Configuration
    this.config = {
      strings: ['G', 'D', 'A', 'E'],
      fretCount: 24,
      displayFrets: 12,        // Show 12 frets at a time
      startFret: 0,            // Current view window start
      stringSpacing: 60,
      fretSpacing: 80,
      nutWidth: 40,
      margin: { top: 80, left: 100, right: 50, bottom: 50 },
      ...options
    };
    
    // Visual state
    this.currentPosition = null;
    this.trail = [];           // Recent notes played
    this.trailMaxLength = 8;
    this.trailFadeTime = 2000; // ms
    
    // Modal data
    this.currentMode = null;
    this.currentRoot = null;
    this.modalIntervals = [];
    
    // Animation
    this.lastFrameTime = 0;
    this.isAnimating = false;
    
    this.resize();
    this.setupEventListeners();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    this.ctx.scale(dpr, dpr);
    
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    this.dimensions = {
      width: rect.width,
      height: rect.height
    };
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.resize());
  }

  // ===== MODAL SETUP =====
  
  setMode(modeName, rootMIDI) {
    this.currentMode = modeName;
    this.currentRoot = rootMIDI;
    
    const mode = getMode(modeName);
    this.modalIntervals = mode.intervals.map(int => ({
      ...int,
      semitones: int.semitones
    }));
    
    this.render();
  }

  // ===== NOTE DETECTION =====
  
  updatePosition(midiNote, timestamp = Date.now()) {
    const position = this.calculatePosition(midiNote);
    
    if (!position) return;
    
    // Add to trail
    this.trail.push({
      position: position,
      midiNote: midiNote,
      timestamp: timestamp,
      intervalFromRoot: (midiNote - this.currentRoot + 12) % 12
    });
    
    // Limit trail length
    if (this.trail.length > this.trailMaxLength) {
      this.trail.shift();
    }
    
    // Update current position
    this.currentPosition = {
      ...position,
      midiNote: midiNote,
      timestamp: timestamp
    };
    
    // Auto-scroll fretboard if needed
    this.autoScroll(position.fret);
    
    // Trigger render
    if (!this.isAnimating) {
      this.startAnimation();
    }
  }

  calculatePosition(midiNote, lastPosition = null) {
    // Standard tuning MIDI notes for open strings
    const openStrings = {
      'E': 40,  // E2
      'A': 45,  // A2
      'D': 50,  // D3
      'G': 55   // G3
    };
    
    // Find all possible positions
    const positions = [];
    
    for (const [stringName, openMIDI] of Object.entries(openStrings)) {
      const fret = midiNote - openMIDI;
      if (fret >= 0 && fret <= this.config.fretCount) {
        positions.push({
          string: stringName,
          fret: fret,
          stringIndex: this.config.strings.indexOf(stringName)
        });
      }
    }
    
    if (positions.length === 0) return null;
    
    // Score positions based on proximity to last position
    if (lastPosition && this.currentPosition) {
      positions.forEach(pos => {
        const stringDiff = Math.abs(pos.stringIndex - this.currentPosition.stringIndex);
        const fretDiff = Math.abs(pos.fret - this.currentPosition.fret);
        
        // Prefer same string or adjacent strings, minimal fret movement
        pos.score = -(stringDiff * 3 + fretDiff);
        
        // Prefer common playing range (frets 0-12)
        if (pos.fret > 12) pos.score -= 5;
      });
      
      positions.sort((a, b) => b.score - a.score);
    }
    
    return positions[0];
  }

  autoScroll(fret) {
    // Keep current note visible in window
    if (fret < this.config.startFret) {
      this.config.startFret = Math.max(0, fret - 2);
    } else if (fret >= this.config.startFret + this.config.displayFrets) {
      this.config.startFret = Math.min(
        this.config.fretCount - this.config.displayFrets,
        fret - this.config.displayFrets + 3
      );
    }
  }

  // ===== RENDERING =====
  
  startAnimation() {
    this.isAnimating = true;
    this.animate();
  }

  animate(timestamp = 0) {
    if (!this.isAnimating) return;
    
    this.render(timestamp);
    
    // Continue if trail has recent notes
    const now = Date.now();
    const hasRecentNotes = this.trail.some(note => 
      now - note.timestamp < this.trailFadeTime
    );
    
    if (hasRecentNotes || this.currentPosition) {
      requestAnimationFrame((ts) => this.animate(ts));
    } else {
      this.isAnimating = false;
    }
  }

  render(timestamp = Date.now()) {
    const { ctx } = this;
    const { width, height } = this.dimensions;
    const { margin, stringSpacing, fretSpacing, nutWidth } = this.config;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw fretboard
    this.drawFretboard();
    
    // Draw modal indicators (if mode is set)
    if (this.currentMode) {
      this.drawModalIndicators();
    }
    
    // Draw trail (fading recent notes)
    this.drawTrail(timestamp);
    
    // Draw current position (brightest)
    if (this.currentPosition) {
      this.drawCurrentPosition();
    }
    
    // Draw heat map
    this.drawHeatMap();
  }

  drawFretboard() {
    const { ctx } = this;
    const { margin, stringSpacing, fretSpacing, nutWidth, strings, displayFrets, startFret } = this.config;
    
    ctx.save();
    
    // Fretboard background
    const fretboardWidth = displayFrets * fretSpacing + nutWidth;
    const fretboardHeight = (strings.length - 1) * stringSpacing + 40;
    
    ctx.fillStyle = '#2a1810';
    ctx.fillRect(
      margin.left,
      margin.top - 20,
      fretboardWidth,
      fretboardHeight
    );
    
    // Draw frets
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    
    for (let i = 0; i <= displayFrets; i++) {
      const x = margin.left + nutWidth + i * fretSpacing;
      const isNut = (startFret === 0 && i === 0);
      
      ctx.lineWidth = isNut ? 4 : 2;
      ctx.strokeStyle = isNut ? '#ccc' : '#888';
      
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + (strings.length - 1) * stringSpacing);
      ctx.stroke();
    }
    
    // Draw strings
    strings.forEach((stringName, index) => {
      const y = margin.top + index * stringSpacing;
      const thickness = 4 - index; // Thicker for lower strings
      
      ctx.strokeStyle = '#666';
      ctx.lineWidth = thickness;
      
      ctx.beginPath();
      ctx.moveTo(margin.left + nutWidth, y);
      ctx.lineTo(margin.left + nutWidth + displayFrets * fretSpacing, y);
      ctx.stroke();
      
      // String labels
      ctx.fillStyle = '#ccc';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(stringName, margin.left + nutWidth - 15, y);
    });
    
    // Fret numbers
    ctx.fillStyle = '#999';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    
    for (let i = 0; i <= displayFrets; i++) {
      const fretNum = startFret + i;
      if (fretNum === 0) continue;
      
      const x = margin.left + nutWidth + (i - 0.5) * fretSpacing;
      ctx.fillText(fretNum, x, margin.top - 10);
    }
    
    // Fret markers (dots at 3, 5, 7, 9, 12, etc.)
    const markerFrets = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
    ctx.fillStyle = '#444';
    
    markerFrets.forEach(fret => {
      if (fret < startFret || fret > startFret + displayFrets) return;
      
      const fretIndex = fret - startFret;
      const x = margin.left + nutWidth + (fretIndex - 0.5) * fretSpacing;
      const y = margin.top + (strings.length - 1) * stringSpacing / 2;
      
      if (fret === 12 || fret === 24) {
        // Double dots
        ctx.beginPath();
        ctx.arc(x, y - 15, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y + 15, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Single dot
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    ctx.restore();
  }

  drawModalIndicators() {
    // Small, subtle dots showing modal scale tones
    const { ctx } = this;
    const { margin, stringSpacing, fretSpacing, nutWidth, strings, displayFrets, startFret } = this.config;
    
    if (!this.currentRoot) return;
    
    ctx.save();
    
    const openStrings = { 'E': 40, 'A': 45, 'D': 50, 'G': 55 };
    
    this.modalIntervals.forEach(interval => {
      const targetMIDI = this.currentRoot + interval.semitones;
      
      strings.forEach((stringName, stringIndex) => {
        const openMIDI = openStrings[stringName];
        const fret = targetMIDI - openMIDI;
        
        // Check octaves too
        for (let octaveOffset = -12; octaveOffset <= 12; octaveOffset += 12) {
          const actualFret = fret + octaveOffset;
          
          if (actualFret >= startFret && actualFret <= startFret + displayFrets && actualFret >= 0) {
            const fretIndex = actualFret - startFret;
            const x = margin.left + nutWidth + (fretIndex - 0.5) * fretSpacing;
            const y = margin.top + stringIndex * stringSpacing;
            
            // Color based on interval type
            const color = MODAL_DATA.colors[interval.color];
            ctx.fillStyle = color + '33'; // 20% opacity
            
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
    });
    
    ctx.restore();
  }

  drawTrail(currentTime) {
    const { ctx } = this;
    const { margin, stringSpacing, fretSpacing, nutWidth, strings, startFret } = this.config;
    
    ctx.save();
    
    // Clean up old trail entries
    this.trail = this.trail.filter(note => 
      currentTime - note.timestamp < this.trailFadeTime
    );
    
    this.trail.forEach(note => {
      const { position, timestamp, intervalFromRoot } = note;
      
      if (position.fret < startFret || position.fret > startFret + this.config.displayFrets) {
        return; // Outside visible range
      }
      
      const fretIndex = position.fret - startFret;
      const x = margin.left + nutWidth + (fretIndex - 0.5) * fretSpacing;
      const y = margin.top + position.stringIndex * stringSpacing;
      
      // Fade based on age
      const age = currentTime - timestamp;
      const opacity = Math.max(0, 1 - (age / this.trailFadeTime));
      
      // Color based on modal function
      const interval = this.modalIntervals.find(int => int.semitones === intervalFromRoot);
      const color = interval ? MODAL_DATA.colors[interval.color] : MODAL_DATA.colors.neutral;
      
      ctx.fillStyle = color + Math.floor(opacity * 128).toString(16).padStart(2, '0');
      ctx.strokeStyle = '#fff' + Math.floor(opacity * 64).toString(16).padStart(2, '0');
      ctx.lineWidth = 2;
      
      const radius = 10 + (1 - opacity) * 5; // Shrink as it fades
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    
    ctx.restore();
  }

  drawCurrentPosition() {
    const { ctx } = this;
    const { margin, stringSpacing, fretSpacing, nutWidth, startFret } = this.config;
    const { position, midiNote, timestamp } = this.currentPosition;
    
    if (position.fret < startFret || position.fret > startFret + this.config.displayFrets) {
      return;
    }
    
    const fretIndex = position.fret - startFret;
    const x = margin.left + nutWidth + (fretIndex - 0.5) * fretSpacing;
    const y = margin.top + position.stringIndex * stringSpacing;
    
    // Determine color based on modal function
    const intervalFromRoot = (midiNote - this.currentRoot + 12) % 12;
    const interval = this.modalIntervals.find(int => int.semitones === intervalFromRoot);
    const color = interval ? MODAL_DATA.colors[interval.color] : MODAL_DATA.colors.passing;
    
    ctx.save();
    
    // Pulsing glow effect
    const pulsePhase = (Date.now() % 1000) / 1000;
    const glowRadius = 20 + Math.sin(pulsePhase * Math.PI * 2) * 3;
    
    // Outer glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
    gradient.addColorStop(0, color + 'ff');
    gradient.addColorStop(0.5, color + '88');
    gradient.addColorStop(1, color + '00');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Main dot
    ctx.fillStyle = color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Note label
    const noteInfo = this.frequencyToNote(this.midiToFreq(midiNote));
    ctx.fillStyle = '#000';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(noteInfo.noteNameOnly, x, y);
    
    // Scale degree label below
    if (interval) {
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.fillText(interval.degree, x, y + 28);
    }
    
    ctx.restore();
  }

  drawHeatMap() {
    const { ctx } = this;
    const { width } = this.dimensions;
    const { margin } = this.config;
    
    if (!this.currentMode) return;
    
    ctx.save();
    
    const heatMapY = margin.top + 4 * this.config.stringSpacing + 80;
    const cellWidth = 50;
    const cellHeight = 40;
    const startX = (width - 12 * cellWidth) / 2;
    
    // Title
    ctx.fillStyle = '#ccc';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Modal Heat Map', width / 2, heatMapY - 30);
    
    // Draw chromatic scale with modal coloring
    const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootPitchClass = this.currentRoot % 12;
    
    for (let i = 0; i < 12; i++) {
      const x = startX + i * cellWidth;
      const interval = i;
      
      // Find if this interval is in the mode
      const modalInterval = this.modalIntervals.find(int => int.semitones === interval);
      const isAvoid = !modalInterval;
      
      const color = modalInterval 
        ? MODAL_DATA.colors[modalInterval.color]
        : MODAL_DATA.colors.passing;
      
      // Background
      ctx.fillStyle = color + '44';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      
      ctx.fillRect(x, heatMapY, cellWidth - 4, cellHeight);
      ctx.strokeRect(x, heatMapY, cellWidth - 4, cellHeight);
      
      // Highlight if currently playing this interval
      if (this.currentPosition) {
        const currentInterval = (this.currentPosition.midiNote - this.currentRoot + 12) % 12;
        if (currentInterval === interval) {
          ctx.fillStyle = color + 'cc';
          ctx.fillRect(x, heatMapY, cellWidth - 4, cellHeight);
        }
      }
      
      // Interval label (scale degree)
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (modalInterval) {
        ctx.fillText(modalInterval.degree, x + cellWidth / 2 - 2, heatMapY + cellHeight / 2 - 5);
      }
      
      // Chromatic interval number
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#aaa';
      ctx.fillText(i === 0 ? 'R' : i, x + cellWidth / 2 - 2, heatMapY + cellHeight / 2 + 8);
    }
    
    ctx.restore();
  }

  // ===== UTILITY =====
  
  midiToFreq(midiNote) {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  frequencyToNote(frequency) {
    const midiNote = 12 * Math.log2(frequency / 440) + 69;
    const midiRounded = Math.round(midiNote);
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = midiRounded % 12;
    const octave = Math.floor(midiRounded / 12) - 1;
    
    return {
      name: noteNames[noteIndex] + octave,
      noteNameOnly: noteNames[noteIndex],
      octave: octave
    };
  }

  clear() {
    this.currentPosition = null;
    this.trail = [];
    this.render();
  }

  cleanup() {
    this.isAnimating = false;
    window.removeEventListener('resize', () => this.resize());
  }
}

// ===== USAGE EXAMPLE =====

/*
const fretboard = new FretboardVisualizer('fretboard-canvas');

// Set mode
fretboard.setMode('dorian', 62); // D Dorian (D3 = MIDI 62)

// Update from pitch detector
detector.onPitchDetected = (freq, conf, noteName, midiNote) => {
  fretboard.updatePosition(midiNote);
};

// Clear
fretboard.clear();

// Cleanup
fretboard.cleanup();
*/