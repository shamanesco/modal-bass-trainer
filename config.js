// config.js - Centralized configuration for pitch detection and note counting

/**
 * Modal Bass Trainer Configuration
 *
 * This file contains all configurable parameters for pitch detection and note counting.
 * Modify these values to tune the app's behavior for different scenarios.
 *
 * Each parameter includes comprehensive documentation:
 * - WHAT IT DOES: Plain English explanation
 * - TRADE-OFFS: Impact of different values
 * - VALID RANGE: Acceptable values and units
 * - RECOMMENDED SETTINGS: Default and scenario-specific values
 * - CURRENT: Active value
 */

export const CONFIG = {
  pitchDetection: {
    /**
     * @property {number} bufferSize - FFT buffer size for frequency analysis
     *
     * WHAT IT DOES:
     * Controls the number of audio samples analyzed per pitch detection cycle.
     * Larger buffers provide better low-frequency accuracy but slower response time.
     * Must be a power of 2 (512, 1024, 2048, 4096, 8192, 16384).
     *
     * TRADE-OFFS:
     * - 2048: ~46ms latency, fast response, less accurate below E2 (82 Hz)
     * - 4096: ~93ms latency, balanced accuracy/speed (RECOMMENDED)
     * - 8192: ~186ms latency, best accuracy for very low notes
     *
     * VALID RANGE: 512 to 16384 (must be power of 2)
     *
     * RECOMMENDED SETTINGS:
     * - Standard 4-string bass (EADG): 4096
     * - 5-string bass with low B: 8192
     * - Fast/responsive feel: 2048 (less accurate)
     *
     * CURRENT: 4096
     */
    bufferSize: 4096,

    /**
     * @property {number} minFrequency - Minimum frequency to detect (Hz)
     *
     * WHAT IT DOES:
     * Lower bound for pitch detection frequency range.
     * Filters out sub-bass noise and room rumble below this threshold.
     *
     * TRADE-OFFS:
     * - Lower (20-25 Hz): Detect very low notes (5-string low B at 30.9 Hz) but more noise
     * - Higher (40-45 Hz): Faster processing, rejects more noise, may miss low E
     *
     * VALID RANGE: 20-100 Hz
     *
     * RECOMMENDED SETTINGS:
     * - Standard 4-string bass: 38 Hz (just below low E at 41.2 Hz)
     * - 5-string bass (low B): 25 Hz (below B0 at 30.9 Hz)
     * - Noisy environment: 40-45 Hz (more aggressive filtering)
     *
     * CURRENT: 38 Hz
     */
    minFrequency: 38,

    /**
     * @property {number} maxFrequency - Maximum frequency to detect (Hz)
     *
     * WHAT IT DOES:
     * Upper bound for pitch detection frequency range.
     * Filters out harmonics and overtones above this threshold.
     *
     * TRADE-OFFS:
     * - Lower (200-220 Hz): More aggressive harmonic rejection, may miss high notes on G string
     * - Higher (400+ Hz): Catches higher notes but may detect first harmonic (octave up)
     *
     * VALID RANGE: 200-1000 Hz
     *
     * RECOMMENDED SETTINGS:
     * - Standard 4-string bass (24 frets): 260 Hz (just above B3 at 246.94 Hz)
     * - Extended range/high playing: 350-400 Hz
     * - Conservative (reduce octave jumps): 220 Hz
     *
     * CURRENT: 280 Hz (Option 1: Balanced - better high-frequency tracking)
     */
    maxFrequency: 280,

    /**
     * @property {number} threshold - Minimum signal level (dB) to trigger detection
     *
     * WHAT IT DOES:
     * Minimum RMS signal level required to attempt pitch detection.
     * Acts as a gate to prevent processing when no bass signal is present.
     *
     * TRADE-OFFS:
     * - Lower (-60 dB): Detect very quiet/soft playing, but more false positives from noise
     * - Higher (-40 dB): Only detect loud/clean signals, may miss fingerstyle dynamics
     *
     * VALID RANGE: -70 to -30 dB
     *
     * RECOMMENDED SETTINGS:
     * - Line input with proper gain staging: -50 dB
     * - Very soft/quiet playing: -55 to -60 dB
     * - Noisy environment or hot signal: -40 to -45 dB
     *
     * CURRENT: -50 dB
     */
    threshold: -50,

    /**
     * @property {number} confidenceThreshold - Minimum Pitchy clarity score (0-1)
     *
     * WHAT IT DOES:
     * Minimum "clarity" score from Pitchy's McLeod Pitch Method to accept a detection.
     * Higher values = more selective (fewer false positives, may miss valid notes).
     *
     * TRADE-OFFS:
     * - Lower (0.5-0.7): More sensitive, catches quieter notes, more errors during note attacks
     * - Higher (0.8-0.9): Very accurate, fewer false positives, may miss legitimate notes
     *
     * VALID RANGE: 0.5-0.95
     *
     * RECOMMENDED SETTINGS:
     * - Balanced (default): 0.75
     * - Soft/fingerstyle playing with harmonics: 0.70
     * - Clean picked tone: 0.80
     * - Maximum accuracy (may miss notes): 0.85-0.90
     *
     * CURRENT: 0.78 (Option 1: Balanced - reduces octave jumps)
     */
    confidenceThreshold: 0.78,

    /**
     * @property {number} detectionCooldown - Minimum time between detections (ms)
     *
     * WHAT IT DOES:
     * Minimum time between consecutive pitch detection callbacks.
     * Prevents rapid-fire detections but doesn't affect final note counting (that's timeGateMs).
     *
     * TRADE-OFFS:
     * - Lower (20-30 ms): More responsive to pitch changes, higher CPU usage
     * - Higher (75-100 ms): Less CPU load, slower response to rapid note changes
     *
     * VALID RANGE: 10-200 ms
     *
     * RECOMMENDED SETTINGS:
     * - Standard real-time detection: 50 ms (20 detections/second)
     * - Fast passages/responsive feel: 25-30 ms
     * - CPU-constrained devices: 75-100 ms
     *
     * CURRENT: 40 ms (Option 1: Balanced - more responsive for fast playing)
     */
    detectionCooldown: 40,

    /**
     * Web Audio API AnalyserNode settings
     * These control the FFT analyzer behavior and visualization
     */
    analyser: {
      /**
       * @property {number} smoothingTimeConstant - FFT temporal smoothing (0-1)
       *
       * WHAT IT DOES:
       * Controls smoothing of frequency data over time.
       * 0 = no smoothing (instant response), 1 = maximum smoothing (very gradual)
       *
       * TRADE-OFFS:
       * - Lower (0-0.2): More responsive but jittery/noisy display
       * - Higher (0.5-0.8): Smoother display but laggy response
       *
       * VALID RANGE: 0.0-1.0
       *
       * RECOMMENDED SETTINGS:
       * - Real-time responsiveness: 0.3 (default)
       * - Smoother visualization: 0.5
       * - Instant response (no smoothing): 0.0
       *
       * CURRENT: 0.3
       */
      smoothingTimeConstant: 0.3,

      /**
       * @property {number} minDecibels - FFT visualization minimum (dB)
       *
       * WHAT IT DOES:
       * Minimum power value for FFT data scaling.
       * Controls input meter sensitivity and dynamic range visualization.
       *
       * VALID RANGE: -100 to -30 dB
       * RECOMMENDED: -70 dB for line input
       * CURRENT: -70 dB
       */
      minDecibels: -70,

      /**
       * @property {number} maxDecibels - FFT visualization maximum (dB)
       *
       * WHAT IT DOES:
       * Maximum power value for FFT data scaling.
       * Controls input meter range and clipping point for visualization.
       *
       * VALID RANGE: -40 to 0 dB
       * RECOMMENDED: -10 dB for line input
       * CURRENT: -10 dB
       */
      maxDecibels: -10
    }
  },

  noteCounting: {
    /**
     * @property {number} timeGateMs - Minimum time between counting notes (ms)
     *
     * WHAT IT DOES:
     * Minimum time that must pass before counting another note of the same pitch class.
     * Prevents re-counting sustained notes while allowing rapid note sequences.
     * Combined with pitch class matching for hybrid duplicate detection.
     *
     * TRADE-OFFS:
     * - Lower (200-250 ms): Counts faster playing (4-5 notes/sec) but may double-count sustained notes
     * - Higher (400-600 ms): Safer against double-counting but may miss fast repeated notes
     *
     * VALID RANGE: 100-2000 ms
     *
     * RECOMMENDED SETTINGS:
     * - Balanced (scales/modal exercises): 300 ms (3.33 notes/sec max)
     * - Fast runs/technical playing: 250 ms (4 notes/sec max)
     * - Slow/sustained playing: 400-600 ms (1.67-2.5 notes/sec max)
     *
     * PERFORMANCE HISTORY:
     * - Started at 600 ms with custom autocorrelation (86% accuracy)
     * - Reduced to 400 ms with Pitchy (87.5% accuracy)
     * - Reduced to 300 ms with Pitchy (100% accuracy on 4th string, 77% on 2nd string fast)
     * - Option 1 (Balanced): 280 ms for faster note sequences (3.57 notes/sec)
     *
     * CURRENT: 280 ms (Option 1: Balanced - allows faster chromatic passages)
     */
    timeGateMs: 280,

    /**
     * @property {boolean} enablePitchClassMatching - Use pitch class for duplicate detection
     *
     * WHAT IT DOES:
     * When enabled, uses pitch class (note name without octave) for duplicate detection.
     * Prevents octave jumps from being counted as the same note.
     * Example: C3 and C4 are counted as different notes (both are pitch class C).
     *
     * TRADE-OFFS:
     * - true (recommended): Counts octaves separately, prevents octave jump false positives
     * - false: Treats all octaves of same note as identical (may miss legitimate octave changes)
     *
     * VALID RANGE: true/false
     *
     * RECOMMENDED: true (always enabled for accurate statistics)
     *
     * TECHNICAL NOTE:
     * Pitch class is calculated as: midiNote % 12
     * - C = 0, C# = 1, D = 2, ... B = 11
     * - Works across all octaves (C3 % 12 = 0, C4 % 12 = 0)
     *
     * CURRENT: true
     */
    enablePitchClassMatching: true
  }
};

/**
 * Helper function to get pitch detection configuration
 * @returns {Object} Pitch detection configuration object
 */
export function getPitchDetectionConfig() {
  return CONFIG.pitchDetection;
}

/**
 * Helper function to get note counting configuration
 * @returns {Object} Note counting configuration object
 */
export function getNoteCountingConfig() {
  return CONFIG.noteCounting;
}

/**
 * Get complete configuration object
 * @returns {Object} Full configuration
 */
export function getConfig() {
  return CONFIG;
}
