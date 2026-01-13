# Modal Bass Trainer - Project Guide

## Project Overview

The Modal Bass Trainer is a web-based application designed to help bass guitarists learn and master modal playing through real-time audio feedback and visual guidance. It's a single-page application built with vanilla JavaScript, HTML, and CSS using minimal, well-maintained external dependencies (Pitchy v4 for pitch detection).

**Target Users**: Bass guitarists learning modal theory, musicians practicing jazz/fusion/progressive styles, and students working on modal phrasing and improvisation.

## Quick Start

1. Open `index.html` in a modern web browser (Chrome 88+, Firefox 85+, Safari 14+)
2. Allow microphone/line input access when prompted
3. Select your audio input device
4. Choose a mode (Dorian, Phrygian, Lydian, or Mixolydian) and root note
5. Select practice type (Drone or Groove)
6. Click "Start" to begin practicing

## Project Structure

```
├── index.html          # Main HTML structure (~3.3 KB)
├── app.js             # Main application controller (~21 KB)
├── audio.js           # Audio synthesis and groove generation (~7 KB)
├── pitch-detector.js  # Pitch detection via Pitchy MPM (~6.4 KB)
├── fretboard.js       # Visual fretboard representation (~17 KB)
├── modal-data.js      # Mode definitions and groove presets (~10 KB)
├── config.js          # Centralized configuration management (~9.8 KB)
├── styles.css         # Complete UI styling (~7.3 KB)
├── SPECS.md           # Detailed technical specifications
└── CLAUDE.MD          # This file
```

**Total Size**: ~83 KB (uncompressed source + Pitchy v4 from CDN)

## Key Technologies

- **Web Audio API**: Audio synthesis, input processing, and scheduling
- **MediaDevices API**: Microphone/line input access and device enumeration
- **Canvas API**: Visual fretboard rendering with animations
- **ES6+ JavaScript**: Modern JavaScript features (no transpilation required)
- **ES6 Modules**: Native browser module system for code organization and dependency management
- **Pitchy v4 (External)**: McLeod Pitch Method library for accurate pitch detection (loaded from esm.sh CDN)

## Architecture

### Core Components

1. **App Controller (app.js)**
   - Manages application state and UI interactions
   - Coordinates between audio, pitch detection, and visualization
   - Tracks session statistics and analytics
   - Handles start/stop workflow and control panel updates

2. **Audio Engine (audio.js)**
   - Synthesizes backing tracks using Web Audio API
   - **Drone Mode**: Continuous root note with optional fifth and sub-octave
   - **Groove Mode**: Rhythmic chord progressions with swing feel
   - Lookahead scheduling (25ms precision, 100ms buffer)
   - Envelope shaping (ADSR) and low-pass filtering

3. **Pitch Detector (pitch-detector.js)**
   - Pitchy's McLeod Pitch Method (MPM) for accurate pitch detection
   - Optimized for 4-string bass frequencies (38-280 Hz)
   - FFT buffer size: 4096 samples
   - Calculates frequency, MIDI note, cents deviation, and confidence
   - Minimum confidence threshold: 0.78
   - Detection cooldown: 40ms
   - Time gate: 280ms (prevents sustained note re-counting)

4. **Fretboard Visualizer (fretboard.js)**
   - Canvas-based rendering of 4-string bass (E-A-D-G, 24 frets)
   - Color-coded modal information with real-time position tracking
   - Pulsing glow effect for current note
   - Note trail with fade-out effect (1 second)
   - Auto-scrolling to keep played notes in view
   - Intelligent fret/string position calculation

5. **Modal Data (modal-data.js)**
   - Mode definitions with intervals and characteristics
   - Groove patterns for each mode (3-4 per mode)
   - Color coding system for scale degrees

6. **Configuration Manager (config.js)**
   - Centralized configuration for all tunable parameters
   - Comprehensive inline documentation for each parameter
   - Includes: WHAT IT DOES, TRADE-OFFS, VALID RANGE, RECOMMENDED SETTINGS
   - Helper exports: `getPitchDetectionConfig()`, `getNoteCountingConfig()`
   - See config.js for complete parameter documentation and tuning guidance

## Modal Information System

### Supported Modes

1. **Dorian**: Minor with raised 6th (bright yet grounded)
   - Characteristic: 2, 6
   - Avoid: ♭6

2. **Phrygian**: Dark, Spanish/Middle Eastern flavor
   - Characteristic: ♭2, ♭6
   - Avoid: 2, 6

3. **Lydian**: Bright, dreamy, floating quality
   - Characteristic: ♯4
   - Avoid: 4

4. **Mixolydian**: Major with flat 7 (blues/rock foundation)
   - Characteristic: ♭7
   - Avoid: 7

### Color Coding

- **Green (#22c55e)**: Characteristic tones
- **Blue (#3b82f6)**: Stable tones (root, fifth)
- **Gray (#94a3b8)**: Neutral scale tones
- **Red (#ef4444)**: Avoid tones
- **Dark gray (#64748b)**: Passing/chromatic tones

## Features

### Practice Modes

- **Drone Mode**: Continuous backing drone on root note with optional fifth/sub-octave
- **Groove Mode**: Pre-programmed chord progressions with various rhythmic patterns

### Real-Time Feedback

- Visual fretboard showing current playing position
- Chromatic heat map displaying modal function of each note
- Input level meter with color-coded signal strength
- Live statistics during practice (notes played, characteristic/avoid tone usage)

### Session Analytics

- Total notes played
- Note distribution histogram
- Characteristic tone usage percentage
- Avoid tone usage percentage
- Performance feedback with constructive guidance

### Audio Input

- Device enumeration and selection
- Line input support (optimized for bass guitar)
- Real-time signal level monitoring
- Low-latency audio constraints (no echo cancellation, AGC, or noise suppression)

## Configuration

### Audio Constraints
```javascript
{
  echoCancellation: false,
  autoGainControl: false,
  noiseSuppression: false,
  latency: 0
}
```

### Core Configuration (Tunable via config.js)

**Pitch Detection Parameters:**
- FFT Size: 4096
- Sample Rate: 44100 Hz (default)
- Frequency Range: 38-280 Hz (optimized for 4-string bass)
- Confidence Threshold: 0.78
- RMS Threshold: -50 dB
- Detection Cooldown: 40ms

**Note Counting Parameters:**
- Time Gate: 280ms (minimum time between counting same pitch class)
- Pitch Class Matching: Enabled (prevents octave jump false positives)

**Analyser Settings:**
- Smoothing Time Constant: 0.3
- Min/Max Decibels: -70 to -10 dB

**Note**: See config.js for complete documentation, trade-offs, and tuning guidance for all parameters.

### Performance Targets
- Pitch detection: ~100 detections/second
- Canvas rendering: 60 FPS
- Audio scheduling: <1ms jitter

## Known Issues

No known issues at this time.

## Development Guidelines

### Code Style
- Vanilla JavaScript (ES6+)
- No build tools or transpilation
- Functional programming where appropriate
- Clear separation of concerns across modules

### Adding New Modes
1. Define mode in `modal-data.js` with intervals and characteristics
2. Add grooves specific to the mode
3. Update mode selection dropdown in `index.html`

### Adding New Grooves
1. Add groove definition to mode's `grooves` array in `modal-data.js`
2. Include: name, root offset, chord quality, voicing, pattern, tempo, swing, density
3. Pattern is 16-step array (0 = rest, 1 = play)

### Modifying Visualizations
- Fretboard rendering logic in `fretboard.js`
- Colors defined in CSS variables (styles.css)
- Canvas size: 100% width, 200px height (scales with device pixel ratio)

## Future Enhancements

### Potential Features
- Additional modes (Aeolian, Ionian, Locrian)
- Custom groove creator
- MIDI input support
- Recording/playback functionality
- Multi-octave fretboard view
- Transposition exercises
- Progress tracking over multiple sessions
- Export session data (JSON/CSV)

### Accessibility Improvements
- Keyboard navigation
- Screen reader support
- High contrast mode
- Customizable color schemes
- Font size adjustments

## Troubleshooting

### No Audio Input Detected
- Check browser permissions for microphone access
- Verify line input device is connected and selected
- Ensure device is not in use by another application
- Check system audio settings

### Poor Pitch Detection
- Increase input signal level (green on meter is ideal)
- Reduce background noise
- Play single notes cleanly (avoid harmonics/noise)
- Ensure proper bass guitar setup (intonation, clean tone)

### Performance Issues
- Close other browser tabs
- Disable browser extensions
- Check CPU usage
- Try a different browser (Chrome recommended)

### Configuration Tuning

Common issues and parameter adjustments (edit config.js):

- **Octave jumps detected**: Increase `confidenceThreshold` (0.78 → 0.82) or reduce `maxFrequency` (280 → 260 Hz)
- **Missing fast notes**: Reduce `timeGateMs` (280 → 250 ms) or `detectionCooldown` (40 → 30 ms)
- **False positives from noise**: Increase `threshold` (-50 → -45 dB) or `confidenceThreshold` (0.78 → 0.85)
- **Missing quiet notes**: Decrease `threshold` (-50 → -55 dB) or `confidenceThreshold` (0.78 → 0.70)

See config.js for detailed parameter documentation and trade-offs.

## Browser Compatibility

### Required APIs
- Web Audio API
- MediaDevices API (getUserMedia)
- Canvas API
- ES6+ JavaScript (classes, arrow functions, const/let, etc.)

### Supported Browsers
- Chrome/Edge (Chromium) 88+
- Firefox 85+
- Safari 14+

### Not Supported
- Internet Explorer (any version)
- Older mobile browsers
- Browsers without Web Audio API support

## ES6 Module Architecture

The application uses native ES6 modules for code organization:

**Module Structure**:
```
index.html (loads all modules with type="module")
├── config.js → Exports CONFIG and helper functions
├── modal-data.js → Exports MODAL_DATA and mode/groove utilities
├── audio.js → Exports ModalAudioEngine class
├── pitch-detector.js → Exports BassPitchDetector (imports Pitchy from CDN)
├── fretboard.js → Exports FretboardVisualizer class
└── app.js → Main controller (imports all above modules)
```

**External Dependencies**:
- Pitchy v4 loaded from esm.sh CDN for pitch detection
- No npm, webpack, or build tools required
- Modules load natively in modern browsers

**Load Order**: Configuration → Data → Audio → Detection → Visualization → App

## Technical Deep Dive

### Pitch Detection Algorithm

Uses Pitchy's McLeod Pitch Method (MPM):
1. Capture audio samples (4096 buffer)
2. Calculate RMS for signal level threshold
3. Pass audio data to Pitchy's McLeod Pitch Method (MPM)
4. MPM uses periodic waveform detection (more accurate than autocorrelation)
5. Frequency range filtered to 38-280 Hz (4-string bass optimization)
6. Confidence threshold (0.78) filters out unclear signals
7. Convert frequency to MIDI note and cents deviation
8. Apply 40ms detection cooldown and 280ms time gate to prevent re-counting

**Performance Evolution**:
- **Original**: Custom autocorrelation (86% accuracy, 600ms time gate)
- **Jan 12, 2026**: Pitchy MPM integration (87.5% accuracy, 400ms time gate)
- **Jan 11-13, 2026**: Parameter tuning (100% 4th string, 77% → 100% 2nd string fast)
- **Current (Option 1 Balanced)**: 98.7% average accuracy, 280ms time gate

### Groove Scheduling
Precise timing using Web Audio API:
1. Lookahead scheduling with 25ms precision
2. 100ms schedule-ahead buffer
3. Notes scheduled at exact AudioContext time
4. Swing feel implemented with timing offset
5. Envelope applied: 5ms attack, 20ms decay, 0.7 sustain
6. Low-pass filter (800 Hz) for warmth

### Fretboard Position Calculation
Intelligent algorithm considering:
- Previously played position (prefers nearby frets)
- Open strings vs. fretted positions
- Typical bass playing patterns
- Minimizes unnecessary position shifts
- Maintains playability context

## Performance Optimization

### Canvas Rendering
- Uses `requestAnimationFrame` for smooth 60 FPS
- Scales for high-DPI displays using `devicePixelRatio`
- Efficient trail system with timestamp-based fading
- Only redraws when needed

### Audio Processing
- Continuous pitch detection without blocking UI
- Web Workers not needed (audio processing off main thread)
- Leverages Pitchy's optimized McLeod Pitch Method implementation
- Configurable parameters via config.js for scenario-specific tuning
- Memory leak prevention with proper cleanup

### Memory Management
- Oscillators and audio nodes properly disposed
- Event listeners cleaned up on stop
- Canvas cleared between frames
- No memory leaks in continuous operation

## Session Analytics Details

### Tracked Metrics
- **Total Notes Played**: Count of all detected notes above confidence threshold
- **Note Distribution**: Histogram of MIDI notes played (frequency of each note)
- **Characteristic Count**: Notes that are characteristic tones of the mode
- **Avoid Count**: Notes marked as avoid notes for the mode
- **Session Duration**: Elapsed time from start to stop

### Performance Feedback
- **Excellent**: >60% characteristic usage, <10% avoid usage
- **Good**: >40% characteristic usage, <20% avoid usage
- **Needs Improvement**: Lower characteristic or higher avoid usage

## Contributing

This project uses vanilla JavaScript with minimal external dependencies. To contribute:
1. Test changes in multiple browsers
2. Maintain vanilla JavaScript approach with minimal, well-maintained dependencies
3. Evaluate new dependencies for: size, maintenance status, performance, and necessity
4. Keep bundle size minimal and module structure clean
5. Document new features in SPECS.md
6. Update this CLAUDE.MD file for significant changes
7. Test configuration parameter changes across various playing styles and environments

## Credits

**License**: Not specified
**Author**: Not specified
**Version**: Not specified in codebase

---

*Last Updated: 2026-01-13*
*Document Version: 2.0*
