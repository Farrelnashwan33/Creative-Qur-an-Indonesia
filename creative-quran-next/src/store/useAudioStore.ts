import { create } from 'zustand';

interface AudioState {
  isPlaying: boolean;
  currentTrackUrl: string | null;
  currentTrackName: string | null;
  volume: number;
  playbackRate: number;
  play: (url: string, name: string) => void;
  pause: () => void;
  resume: () => void;
  setVolume: (vol: number) => void;
  setPlaybackRate: (rate: number) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  isPlaying: false,
  currentTrackUrl: null,
  currentTrackName: null,
  volume: 1,
  playbackRate: 1,
  
  play: (url, name) => set({ isPlaying: true, currentTrackUrl: url, currentTrackName: name }),
  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),
  setVolume: (vol) => set({ volume: vol }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
}));
