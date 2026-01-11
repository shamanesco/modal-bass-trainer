const MODAL_DATA = {
  
  // Mode definitions
  modes: {
    
    dorian: {
      name: "Dorian",
      intervals: [
        {degree: '1', semitones: 0, color: 'stable', label: 'Root'},
        {degree: '2', semitones: 2, color: 'neutral', label: 'Major 2nd'},
        {degree: 'b3', semitones: 3, color: 'neutral', label: 'Minor 3rd'},
        {degree: '4', semitones: 5, color: 'neutral', label: 'Perfect 4th'},
        {degree: '5', semitones: 7, color: 'stable', label: 'Perfect 5th'},
        {degree: '6', semitones: 9, color: 'characteristic', label: 'Major 6th'},
        {degree: 'b7', semitones: 10, color: 'characteristic', label: 'Minor 7th'}
      ],
      avoidNotes: [
        {degree: '7', semitones: 11, color: 'avoid', reason: 'Major 7th pulls toward major tonality'}
      ],
      description: "Minor mode with raised 6th - bright yet grounded",
      
      grooves: [
        {
          id: 'dorian_classic',
          name: "Classic Modal",
          chords: [
            {root: 0, quality: 'm7', voicing: [0, 3, 7, 10], duration: 4}
          ],
          pattern: [1, 0, 0, 0], // Whole notes, beat 1 only
          tempo: 80,
          swing: false,
          density: 'sparse',
          description: "Spacious whole notes - maximum room to explore"
        },
        {
          id: 'dorian_funk',
          name: "Funk Vamp",
          chords: [
            {root: 0, quality: 'm9', voicing: [0, 3, 7, 10, 14], duration: 1}
          ],
          pattern: [1, 0, 1, 0, 0, 1, 0, 1], // Syncopated 8th notes
          tempo: 100,
          swing: false,
          density: 'medium',
          description: "Syncopated rhythm - groove in the pocket"
        },
        {
          id: 'dorian_float',
          name: "Two-Chord Float",
          chords: [
            {root: 0, quality: 'm7', voicing: [0, 3, 7, 10], duration: 2},
            {root: 2, quality: 'm7', voicing: [2, 5, 9, 12], duration: 2}
          ],
          pattern: [1, 0, 1, 0], // Half notes
          tempo: 75,
          swing: false,
          density: 'sparse',
          description: "Gentle movement within mode"
        },
        {
          id: 'dorian_sowhat',
          name: "So What",
          chords: [
            {root: 0, quality: 'm11', voicing: [0, 7, 10, 14, 17], duration: 1.5}
          ],
          pattern: [1, 0, 0, 1, 0, 0], // Dotted quarter feel
          tempo: 135,
          swing: true,
          density: 'medium',
          description: "Jazz swing - Miles Davis style"
        }
      ]
    },
    
    phrygian: {
      name: "Phrygian",
      intervals: [
        {degree: '1', semitones: 0, color: 'stable', label: 'Root'},
        {degree: 'b2', semitones: 1, color: 'characteristic', label: 'Minor 2nd'},
        {degree: 'b3', semitones: 3, color: 'neutral', label: 'Minor 3rd'},
        {degree: '4', semitones: 5, color: 'neutral', label: 'Perfect 4th'},
        {degree: '5', semitones: 7, color: 'stable', label: 'Perfect 5th'},
        {degree: 'b6', semitones: 8, color: 'characteristic', label: 'Minor 6th'},
        {degree: 'b7', semitones: 10, color: 'neutral', label: 'Minor 7th'}
      ],
      avoidNotes: [
        {degree: '2', semitones: 2, color: 'avoid', reason: 'Major 2nd loses dark character'},
        {degree: '6', semitones: 9, color: 'avoid', reason: 'Major 6th contradicts mode'}
      ],
      description: "Dark, exotic mode - Spanish/Middle Eastern flavor",
      
      grooves: [
        {
          id: 'phrygian_meditative',
          name: "Meditative Drone",
          chords: [
            {root: 0, quality: 'm', voicing: [0, 3, 7], duration: 4}
          ],
          pattern: [1, 0, 0, 0],
          tempo: 70,
          swing: false,
          density: 'sparse',
          description: "Slow, hypnotic - feel the b2 tension"
        },
        {
          id: 'phrygian_flamenco',
          name: "Flamenco Vamp",
          chords: [
            {root: 0, quality: 'm', voicing: [0, 3, 7], duration: 2},
            {root: 1, quality: 'maj', voicing: [1, 5, 8], duration: 2} // bII chord
          ],
          pattern: [1, 0, 1, 0],
          tempo: 95,
          swing: false,
          density: 'medium',
          description: "Spanish flavor - emphasizes b2 relationship"
        },
        {
          id: 'phrygian_metal',
          name: "Metal Riff",
          chords: [
            {root: 0, quality: '5', voicing: [0, 7], duration: 1}
          ],
          pattern: [1, 0, 0, 1, 1, 0, 1, 0], // Driving 8ths
          tempo: 120,
          swing: false,
          density: 'dense',
          description: "Heavy, aggressive - power chord feel"
        }
      ]
    },
    
    lydian: {
      name: "Lydian",
      intervals: [
        {degree: '1', semitones: 0, color: 'stable', label: 'Root'},
        {degree: '2', semitones: 2, color: 'neutral', label: 'Major 2nd'},
        {degree: '3', semitones: 4, color: 'neutral', label: 'Major 3rd'},
        {degree: '#4', semitones: 6, color: 'characteristic', label: 'Augmented 4th'},
        {degree: '5', semitones: 7, color: 'stable', label: 'Perfect 5th'},
        {degree: '6', semitones: 9, color: 'neutral', label: 'Major 6th'},
        {degree: '7', semitones: 11, color: 'characteristic', label: 'Major 7th'}
      ],
      avoidNotes: [
        {degree: '4', semitones: 5, color: 'avoid', reason: 'Perfect 4th pulls toward major scale'}
      ],
      description: "Bright, dreamy major mode - floating quality",
      
      grooves: [
        {
          id: 'lydian_floating',
          name: "Floating Maj7",
          chords: [
            {root: 0, quality: 'maj7', voicing: [0, 4, 7, 11], duration: 4}
          ],
          pattern: [1, 0, 0, 0],
          tempo: 75,
          swing: false,
          density: 'sparse',
          description: "Airy, suspended - let the #4 shine"
        },
        {
          id: 'lydian_bossa',
          name: "Bossa Nova",
          chords: [
            {root: 0, quality: 'maj9', voicing: [0, 4, 7, 11, 14], duration: 2}
          ],
          pattern: [1, 0, 1, 1, 0, 1, 0, 0],
          tempo: 110,
          swing: false,
          density: 'medium',
          description: "Latin groove - bright and rhythmic"
        },
        {
          id: 'lydian_twochord',
          name: "Lydian Lift",
          chords: [
            {root: 0, quality: 'maj7', voicing: [0, 4, 7, 11], duration: 2},
            {root: 2, quality: 'maj7', voicing: [2, 6, 9, 13], duration: 2} // II chord
          ],
          pattern: [1, 0, 1, 0],
          tempo: 85,
          swing: false,
          density: 'sparse',
          description: "Gentle motion - avoids resolution"
        }
      ]
    },
    
    mixolydian: {
      name: "Mixolydian",
      intervals: [
        {degree: '1', semitones: 0, color: 'stable', label: 'Root'},
        {degree: '2', semitones: 2, color: 'neutral', label: 'Major 2nd'},
        {degree: '3', semitones: 4, color: 'characteristic', label: 'Major 3rd'},
        {degree: '4', semitones: 5, color: 'neutral', label: 'Perfect 4th'},
        {degree: '5', semitones: 7, color: 'stable', label: 'Perfect 5th'},
        {degree: '6', semitones: 9, color: 'neutral', label: 'Major 6th'},
        {degree: 'b7', semitones: 10, color: 'characteristic', label: 'Minor 7th'}
      ],
      avoidNotes: [
        {degree: '7', semitones: 11, color: 'avoid', reason: 'Major 7th creates major scale'}
      ],
      description: "Major mode with b7 - blues/rock foundation",
      
      grooves: [
        {
          id: 'mixo_dominant',
          name: "Dominant Vamp",
          chords: [
            {root: 0, quality: '7', voicing: [0, 4, 7, 10], duration: 4}
          ],
          pattern: [1, 0, 0, 0],
          tempo: 90,
          swing: false,
          density: 'sparse',
          description: "Static dominant - no resolution"
        },
        {
          id: 'mixo_rock',
          name: "Rock Groove",
          chords: [
            {root: 0, quality: '7', voicing: [0, 4, 7, 10], duration: 1}
          ],
          pattern: [1, 0, 1, 0, 1, 1, 0, 1],
          tempo: 115,
          swing: false,
          density: 'medium',
          description: "Driving rock rhythm"
        },
        {
          id: 'mixo_bVII',
          name: "bVII Movement",
          chords: [
            {root: 0, quality: '7', voicing: [0, 4, 7, 10], duration: 2},
            {root: -2, quality: 'maj', voicing: [-2, 2, 5], duration: 2} // bVII
          ],
          pattern: [1, 0, 1, 0],
          tempo: 100,
          swing: false,
          density: 'medium',
          description: "Classic Mixolydian move - reinforces b7"
        },
        {
          id: 'mixo_shuffle',
          name: "Blues Shuffle",
          chords: [
            {root: 0, quality: '7', voicing: [0, 4, 7, 10], duration: 1.5}
          ],
          pattern: [1, 0, 0, 1, 0, 0],
          tempo: 125,
          swing: true,
          density: 'medium',
          description: "Swing feel - blues context"
        }
      ]
    }
  },
  
  // Color scheme definitions
  colors: {
    characteristic: '#22c55e',  // Green - modal signature tones
    stable: '#3b82f6',          // Blue - root and fifth
    neutral: '#94a3b8',         // Gray - other scale tones
    avoid: '#ef4444',           // Red - contradicts mode
    passing: '#64748b'          // Dark gray - chromatic
  },
  
  // Standard 4-string bass tuning
  tuning: {
    strings: ['E', 'A', 'D', 'G'],
    pitches: [
      {string: 'E', basePitch: 41.20},   // E1
      {string: 'A', basePitch: 55.00},   // A1
      {string: 'D', basePitch: 73.42},   // D2
      {string: 'G', basePitch: 98.00}    // G2
    ],
    fretCount: 24
  }
};

// Helper function to get mode data
function getMode(modeName) {
  return MODAL_DATA.modes[modeName];
}

// Helper function to get groove preset
function getGroove(modeName, grooveId) {
  const mode = MODAL_DATA.modes[modeName];
  return mode.grooves.find(g => g.id === grooveId);
}

// Helper to transpose intervals to specific root
function transposeToRoot(mode, rootNote) {
  // rootNote is 0-11 (C=0, C#=1, etc.)
  return mode.intervals.map(interval => ({
    ...interval,
    absolutePitch: (rootNote + interval.semitones) % 12
  }));
}