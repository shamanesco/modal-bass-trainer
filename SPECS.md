# Modal Bass Trainer - Technical Specifications

## 1. Overview

### 1.1 Purpose
The Modal Bass Trainer is a web-based application designed to help bass guitarists learn and master modal playing through real-time audio feedback and visual guidance.

### 1.2 Target Users
- Bass guitarists learning modal theory
- Musicians practicing jazz, fusion, and progressive styles
- Students working on modal phrasing and improvisation

### 1.3 Platform
- Single-page web application
- Client-side only (no backend required)
- Runs in modern browsers with Web Audio API support

---

## 2. Functional Requirements

### 2.1 Mode Selection
**FR-2.1.1**: The system shall support four musical modes:
- Dorian
- Phrygian
- Lydian
- Mixolydian

**FR-2.1.2**: Each mode shall have defined intervals, characteristic tones, and avoid notes

**FR-2.1.3**: Users shall be able to switch modes via dropdown selection

### 2.2 Root Note Selection
**FR-2.2.1**: The system shall support all 12 chromatic root notes (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)

**FR-2.2.2**: Root note selection shall immediately update all visualizations and audio outputs

### 2.3 Practice Types
**FR-2.3.1**: The system shall provide two practice types:
- **Drone Mode**: Continuous root note with optional fifth and sub-octave
- **Groove Mode**: Rhythmic chord progressions specific to the selected mode

**FR-2.3.2**: Users shall select practice type via radio buttons

### 2.4 Groove Selection
**FR-2.4.1**: Each mode shall have 3-4 pre-programmed groove patterns

**FR-2.4.2**: Groove patterns shall include:
- Chord voicings
- Rhythmic pattern
- Suggested tempo
- Optional swing feel
- Density (sparse/medium/dense)

**FR-2.4.3**: Groove dropdown shall dynamically update based on selected mode

### 2.5 Tempo Control
**FR-2.5.1**: Users shall control tempo via slider input

**FR-2.5.2**: Tempo range: 60-140 BPM

**FR-2.5.3**: Tempo changes shall take effect immediately during playback

**FR-2.5.4**: Tempo display shall show current BPM value

### 2.6 Audio Input
**FR-2.6.1**: The system shall request microphone access from the user

**FR-2.6.2**: The system shall enumerate available audio input devices

**FR-2.6.3**: Users shall select audio input device via dropdown

**FR-2.6.4**: The system shall display real-time input level meter with color coding:
- Green: Good signal level
- Yellow: Low signal level
- Red: Clipping/overload

### 2.7 Pitch Detection
**FR-2.7.1**: The system shall detect pitch from bass guitar input in real-time

**FR-2.7.2**: Detection range: 30-400 Hz (optimized for bass frequencies)

**FR-2.7.3**: The system shall calculate:
- Frequency (Hz)
- MIDI note number
- Note name
- Cents deviation from true pitch
- Confidence score

**FR-2.7.4**: Minimum confidence threshold: 0.85

**FR-2.7.5**: Detection cooldown: 50ms (prevent rapid-fire detections)

### 2.8 Visual Fretboard
**FR-2.8.1**: The system shall display a visual representation of a 4-string bass fretboard

**FR-2.8.2**: Fretboard configuration:
- Strings: E (41), A (45), D (50), G (55) - MIDI note numbers
- Frets: 24 frets
- Canvas-based rendering

**FR-2.8.3**: The system shall show modal information via color coding:
- Green (#22c55e): Characteristic tones
- Blue (#3b82f6): Stable tones (root, fifth)
- Gray (#94a3b8): Neutral scale tones
- Red (#ef4444): Avoid tones
- Dark gray (#64748b): Passing/chromatic tones

**FR-2.8.4**: The system shall display:
- Current playing position with pulsing glow effect
- Note trail showing recently played notes (fading over time)
- Subtle dots indicating scale degrees
- Auto-scrolling to keep played notes in view

**FR-2.8.5**: Position calculation shall intelligently choose the best fret/string combination based on playing context

### 2.9 Chromatic Heat Map
**FR-2.9.1**: The system shall display a chromatic scale heat map showing all 12 notes

**FR-2.9.2**: Each note shall be color-coded according to its modal function

**FR-2.9.3**: The currently played note shall be highlighted

### 2.10 Session Management
**FR-2.10.1**: Users shall start practice sessions via "Start" button

**FR-2.10.2**: Users shall stop sessions via "Stop" button

**FR-2.10.3**: During session, controls shall be disabled except Stop button

**FR-2.10.4**: The system shall track session duration

### 2.11 Session Analytics
**FR-2.11.1**: The system shall track during each session:
- Total notes played
- Note distribution (histogram of which notes were played)
- Characteristic tone usage count
- Avoid tone usage count
- Session duration

**FR-2.11.2**: The system shall calculate percentages:
- Characteristic tone percentage
- Avoid tone percentage

**FR-2.11.3**: Upon session end, the system shall display a session summary modal with:
- Session duration
- Total notes played
- Characteristic tone usage with percentage
- Avoid tone usage with percentage
- Performance feedback message based on metrics

**FR-2.11.4**: Performance feedback shall provide constructive guidance:
- Excellent: High characteristic usage, low avoid usage
- Good: Solid characteristic usage
- Needs Improvement: Low characteristic usage or high avoid usage

### 2.12 Real-time Statistics
**FR-2.12.1**: The system shall display live statistics during practice:
- Total notes played
- Characteristic tones played
- Avoid tones played

### 2.13 Mode Information Display
**FR-2.13.1**: The system shall display current mode information including:
- Mode name
- Description/character
- Key characteristics
- Avoid notes with reasoning

---

## 3. Technical Requirements

### 3.1 Audio Synthesis
**TR-3.1.1**: Audio synthesis shall use Web Audio API

**TR-3.1.2**: Drone mode shall generate:
- Root note oscillator (sine wave)
- Optional fifth oscillator (sine wave)
- Optional sub-octave oscillator (sine wave)

**TR-3.1.3**: Groove mode shall:
- Schedule notes with lookahead timing (25ms precision)
- Use 100ms schedule-ahead buffer
- Support swing feel with configurable swing offset
- Apply envelope shaping (attack, decay, sustain)
- Apply low-pass filtering for warmth

**TR-3.1.4**: MIDI-to-frequency conversion: `440 * Math.pow(2, (midi - 69) / 12)`

**TR-3.1.5**: Master gain control range: 0.0 to 1.0

### 3.2 Pitch Detection Algorithm
**TR-3.2.1**: Detection method: Autocorrelation

**TR-3.2.2**: FFT buffer size: 4096 samples

**TR-3.2.3**: Autocorrelation shall:
- Compute RMS (root mean square) for signal level
- Apply RMS threshold (0.01) to filter noise
- Search for peaks in autocorrelation function
- Use parabolic interpolation for sub-sample accuracy
- Calculate confidence score based on peak clarity

**TR-3.2.4**: Audio constraints:
- echoCancellation: false
- autoGainControl: false
- noiseSuppression: false
- latency: 0

### 3.3 Canvas Rendering
**TR-3.3.1**: Fretboard shall use HTML5 Canvas 2D context

**TR-3.3.2**: Canvas shall scale for high-DPI displays using `devicePixelRatio`

**TR-3.3.3**: Rendering shall occur at animation frame rate using `requestAnimationFrame`

**TR-3.3.4**: Trail fade duration: 1000ms (1 second)

**TR-3.3.5**: Pulsing glow effect: Sinusoidal with 1-second period

### 3.4 Performance
**TR-3.4.1**: Pitch detection shall run continuously at ~100 detections per second

**TR-3.4.2**: Audio scheduling shall maintain precise timing with negligible jitter

**TR-3.4.3**: Canvas rendering shall maintain 60 FPS

**TR-3.4.4**: Memory leaks shall be prevented through proper resource cleanup

### 3.5 Browser Compatibility
**TR-3.5.1**: Required browser APIs:
- Web Audio API
- MediaDevices API (getUserMedia)
- Canvas API
- ES6 JavaScript features

**TR-3.5.2**: Target browsers:
- Chrome/Edge (Chromium) 88+
- Firefox 85+
- Safari 14+

### 3.6 Responsive Design
**TR-3.6.1**: Layout shall adapt to viewport sizes 768px and above

**TR-3.6.2**: Grid layout shall use CSS Grid

**TR-3.6.3**: Canvas shall resize with container while maintaining aspect ratio

---

## 4. Data Structures

### 4.1 Mode Definition
```javascript
{
  name: String,
  description: String,
  intervals: [
    {
      degree: Number (1-7),
      name: String,
      semitones: Number (0-11),
      color: String ('characteristic'|'stable'|'neutral'|'avoid'|'passing')
    }
  ],
  avoidNotes: [
    {
      degree: Number,
      name: String,
      reason: String
    }
  ],
  grooves: [GrooveDefinition]
}
```

### 4.2 Groove Definition
```javascript
{
  name: String,
  root: Number (MIDI offset from root),
  chordQuality: String,
  voicing: [Number] (MIDI intervals),
  pattern: [Number] (beat activation array, length 16),
  tempo: Number (suggested BPM),
  swing: Boolean,
  density: String ('sparse'|'medium'|'dense')
}
```

### 4.3 Pitch Detection Result
```javascript
{
  frequency: Number (Hz),
  confidence: Number (0-1),
  note: Number (MIDI),
  noteName: String ('C4', 'A2', etc.),
  cents: Number (-50 to 50),
  level: Number (RMS amplitude)
}
```

### 4.4 Fretboard Position
```javascript
{
  string: Number (0-3),
  fret: Number (0-24),
  midi: Number,
  timestamp: Number (milliseconds)
}
```

### 4.5 Session Statistics
```javascript
{
  startTime: Number (timestamp),
  notesPlayed: Number,
  noteDistribution: Object (MIDI note -> count),
  characteristicCount: Number,
  avoidCount: Number
}
```

---

## 5. User Interface Specifications

### 5.1 Layout Structure
```
┌─────────────────────────────────────────┐
│ Header: Modal Bass Trainer              │
├─────────────────────────────────────────┤
│ Control Panel (Grid 2x4)                │
│ ┌──────┬──────┬──────┬──────┐          │
│ │Mode  │Root  │Tempo │Device│          │
│ ├──────┼──────┼──────┼──────┤          │
│ │Type  │Groove│Meter │Start │          │
│ └──────┴──────┴──────┴──────┘          │
├─────────────────────────────────────────┤
│ Mode Info Panel                         │
├─────────────────────────────────────────┤
│ Chromatic Heat Map                      │
├─────────────────────────────────────────┤
│ Fretboard Canvas (Full Width)           │
├─────────────────────────────────────────┤
│ Statistics Panel                        │
└─────────────────────────────────────────┘
```

### 5.2 Color Palette
- Background: #0f172a (dark slate)
- Surface: #1e293b (slate)
- Border: #334155 (slate-700)
- Text: #f1f5f9 (slate-100)
- Text Secondary: #94a3b8 (slate-400)
- Primary: #3b82f6 (blue)
- Success: #22c55e (green)
- Warning: #eab308 (yellow)
- Danger: #ef4444 (red)

### 5.3 Typography
- Font Family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system fonts
- Heading: 24px, bold
- Subheading: 18px, semibold
- Body: 14px, normal
- Label: 12px, medium

### 5.4 Control Dimensions
- Button height: 40px
- Input height: 36px
- Border radius: 6px
- Spacing unit: 8px (0.5rem)

### 5.5 Canvas Dimensions
- Width: 100% of container
- Height: 200px (fixed)
- Scaling: Device pixel ratio adjusted

---

## 6. Modal Definitions

### 6.1 Dorian Mode
- **Intervals**: 1, 2, ♭3, 4, 5, 6, ♭7
- **Character**: Minor with raised 6th, bright yet grounded
- **Characteristic Tones**: 2 (Major 2nd), 6 (Major 6th)
- **Avoid Notes**: ♭6 (contradicts raised 6th)
- **Grooves**: Dorian Vamp, Dorian Funk, Dorian Waltz

### 6.2 Phrygian Mode
- **Intervals**: 1, ♭2, ♭3, 4, 5, ♭6, ♭7
- **Character**: Dark, Spanish/Middle Eastern flavor
- **Characteristic Tones**: ♭2 (Minor 2nd), ♭6 (Minor 6th)
- **Avoid Notes**: 2 (contradicts flat 2nd), 6 (contradicts flat 6th)
- **Grooves**: Phrygian Vamp, Phrygian Flamenco, Phrygian Rock

### 6.3 Lydian Mode
- **Intervals**: 1, 2, 3, ♯4, 5, 6, 7
- **Character**: Bright, dreamy, floating quality
- **Characteristic Tones**: ♯4 (Augmented 4th)
- **Avoid Notes**: 4 (contradicts sharp 4th)
- **Grooves**: Lydian Float, Lydian Ballad, Lydian Uptempo, Lydian Funk

### 6.4 Mixolydian Mode
- **Intervals**: 1, 2, 3, 4, 5, 6, ♭7
- **Character**: Major with flat 7, blues/rock foundation
- **Characteristic Tones**: ♭7 (Minor 7th)
- **Avoid Notes**: 7 (contradicts flat 7th)
- **Grooves**: Mixolydian Groove, Mixolydian Blues Shuffle, Mixolydian Rock

---

## 7. Error Handling

### 7.1 Audio Permission Denied
**EH-7.1.1**: If microphone access denied, display error message

**EH-7.1.2**: Provide instructions to enable microphone in browser settings

### 7.2 No Audio Input Devices
**EH-7.2.1**: If no input devices found, display warning message

**EH-7.2.2**: Prompt user to connect microphone

### 7.3 Audio Context Issues
**EH-7.3.1**: Handle AudioContext initialization failures

**EH-7.3.2**: Provide fallback error messages for unsupported browsers

### 7.4 Low Signal Level
**EH-7.4.1**: Visual feedback via input meter color (yellow/red)

**EH-7.4.2**: No pitch detection when signal below threshold

---

## 8. Known Issues

### 8.1 Bug: Drone Fifth Not Playing
**Issue**: In `audio.js:37`, variable `includefifth` (typo) should be `includeFifth`

**Impact**: Fifth oscillator never plays in drone mode

**Location**: `audio.js:37`

**Fix**: Change `if (includefifth)` to `if (includeFifth)`

---

## 9. Future Considerations

### 9.1 Potential Enhancements
- Additional modes (Aeolian, Ionian, Locrian)
- Custom groove creator
- MIDI input support
- Recording/playback functionality
- Multi-octave fretboard view
- Transposition exercises
- Progress tracking over time
- Export session data

### 9.2 Accessibility
- Keyboard navigation
- Screen reader support
- High contrast mode
- Customizable color schemes

---

## 10. File Manifest

| File | Size | Purpose |
|------|------|---------|
| index.html | ~8 KB | HTML structure and UI layout |
| app.js | 15.4 KB | Main application controller |
| audio.js | 7.1 KB | Audio synthesis and groove generation |
| pitch-detector.js | 8.4 KB | Real-time pitch detection |
| fretboard.js | 17 KB | Visual fretboard representation |
| modal-data.js | 10.2 KB | Mode definitions and groove presets |
| styles.css | 7.4 KB | Complete UI styling |

**Total Size**: ~73.5 KB (uncompressed)

---

## 11. Dependencies

**External Dependencies**: None

**Browser APIs Required**:
- Web Audio API
- MediaDevices API
- Canvas API
- ES6+ JavaScript

---

## 12. License & Credits

**License**: Not specified in codebase

**Author**: Not specified in codebase

**Version**: Not specified in codebase

---

*Document Version: 1.0*
*Date: 2026-01-11*
*Generated from codebase analysis*
