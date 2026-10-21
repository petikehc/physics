import { create } from 'zustand';

/** Which star of the constellation the viewer is pointing at, and which they have chosen (by index, or null). */
interface ConstellationState {
  hovered: number | null;
  selected: number | null;
  set: (s: Partial<Pick<ConstellationState, 'hovered' | 'selected'>>) => void;
}

export const useConstellation = create<ConstellationState>((set) => ({
  hovered: null,
  selected: null,
  set: (s) => set(s),
}));
