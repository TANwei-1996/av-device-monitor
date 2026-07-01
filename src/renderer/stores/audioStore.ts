import { create } from 'zustand';

interface AudioAnalysis {
  dbfs: number;
  waveform: number[];
  spectrum: number[];
  timestamp: number;
}

interface EQBand {
  frequency: number;
  gain: number;
  Q: number;
}

interface AudioState {
  isCapturing: boolean;
  audioData: AudioAnalysis | null;
  denoiseLevel: number;
  eqBands: EQBand[];
  gain: number;
  
  setCapturing: (capturing: boolean) => void;
  setAudioData: (data: AudioAnalysis) => void;
  setDenoiseLevel: (level: number) => void;
  setEQBands: (bands: EQBand[]) => void;
  setGain: (gain: number) => void;
}

const defaultEQFrequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const useAudioStore = create<AudioState>((set) => ({
  isCapturing: false,
  audioData: null,
  denoiseLevel: 0,
  eqBands: defaultEQFrequencies.map((freq) => ({
    frequency: freq,
    gain: 0,
    Q: 1.0,
  })),
  gain: 0,

  setCapturing: (capturing) => set({ isCapturing: capturing }),
  setAudioData: (data) => set({ audioData: data }),
  setDenoiseLevel: (level) => {
    set({ denoiseLevel: level });
    window.electron.setDenoiseLevel(level);
  },
  setEQBands: (bands) => {
    set({ eqBands: bands });
    window.electron.setEQ(bands);
  },
  setGain: (gain) => {
    set({ gain });
    window.electron.setGain(gain);
  },
}));
