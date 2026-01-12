# Modal Bass Trainer - Project Guide

## Project Overview

The Modal Bass Trainer is a web-based application designed to help bass guitarists learn and master modal playing through real-time audio feedback and visual guidance. It's a single-page application built entirely with vanilla JavaScript, HTML, and CSS with no external dependencies.

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
├── index.html          # Main HTML structure (~3 KB)
├── app.js             # Main application controller (~16 KB)
├── audio.js           # Audio synthesis and groove generation (~7 KB)
├── pitch-detector.js  # Real-time pitch detection (~8 KB)
├── fretboard.js       # Visual fretboard representation (~17 KB)
├── modal-data.js      # Mode definitions and groove presets (~10 KB)
├── styles.css         # Complete UI styling (~7 KB)
├── SPECS.md           # Detailed technical specifications
└── CLAUDE.MD          # This file
```

**Total Size**: ~73.5 KB (uncompressed, no dependencies)

## Key Technologies

- **Web Audio API**: Audio synthesis, input processing, and scheduling
- **MediaDevices API**: Microphone/line input access and device enumeration
- **Canvas API**: Visual fretboard rendering with animations
- **ES6+ JavaScript**: Modern JavaScript features (no transpilation required)

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
   - Autocorrelation-based pitch detection
   - Optimized for bass frequencies (30-400 Hz)
   - FFT buffer size: 4096 samples
   - Calculates frequency, MIDI note, cents deviation, and confidence
   - Minimum confidence threshold: 0.85
   - Detection cooldown: 50ms

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

### Pitch Detection Parameters
- FFT Size: 4096
- Sample Rate: 44100 Hz (default)
- Frequency Range: 30-400 Hz
- Confidence Threshold: 0.85
- RMS Threshold: 0.01
- Cooldown: 50ms

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

## Technical Deep Dive

### Pitch Detection Algorithm
Uses autocorrelation method:
1. Capture audio samples (4096 buffer)
2. Calculate RMS for signal level
3. Apply RMS threshold to filter noise
4. Compute autocorrelation function
5. Search for peaks in correlation
6. Use parabolic interpolation for sub-sample accuracy
7. Calculate confidence based on peak clarity
8. Convert frequency to MIDI note and cents deviation

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
- Efficient autocorrelation with early exit conditions
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

This is a standalone project with no external dependencies. To contribute:
1. Test changes in multiple browsers
2. Maintain vanilla JavaScript approach (no frameworks)
3. Keep bundle size minimal
4. Document new features in SPECS.md
5. Update this CLAUDE.MD file for significant changes

## Credits

**License**: Not specified
**Author**: Not specified
**Version**: Not specified in codebase

---

*Last Updated: 2026-01-12*
*Document Version: 1.0*
