import { useSyncExternalStore } from 'react';

/* Small persisted store for per-browser preferences, favourites and saved setups. */

export type Theme = 'system' | 'light' | 'dark';
export interface Settings {
  theme: Theme;
  speed: 'kmh' | 'mph';
  power: 'hp' | 'ps';
  weight: 'kg' | 'lb';
}

export interface SavedSetup {
  id: string;
  name: string;
  hash: string;
  carId: number;
  trackId: string;
  summary: string;
  savedAt: number;
}

interface State {
  settings: Settings;
  favourites: number[];
  recent: number[];
  saved: SavedSetup[];
}

const KEY = 'gt7tl:state:v1';
const DEFAULT: State = {
  settings: { theme: 'system', speed: 'kmh', power: 'hp', weight: 'kg' },
  favourites: [],
  recent: [],
  saved: [],
};

function load(): State {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && typeof raw === 'object') return { ...DEFAULT, ...raw, settings: { ...DEFAULT.settings, ...raw.settings } };
  } catch {
    /* blocked storage or bad JSON – fall back to defaults */
  }
  return DEFAULT;
}

let state = load();
const listeners = new Set<() => void>();

function set(next: Partial<State>) {
  state = { ...state, ...next };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable – keep the in-memory state */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(DEFAULT));
}

export const actions = {
  setSettings(patch: Partial<Settings>) {
    set({ settings: { ...state.settings, ...patch } });
  },
  toggleFavourite(id: number) {
    const has = state.favourites.includes(id);
    set({ favourites: has ? state.favourites.filter((f) => f !== id) : [id, ...state.favourites] });
  },
  pushRecent(id: number) {
    set({ recent: [id, ...state.recent.filter((r) => r !== id)].slice(0, 8) });
  },
  saveSetup(s: Omit<SavedSetup, 'id' | 'savedAt'>) {
    const item: SavedSetup = { ...s, id: Math.random().toString(36).slice(2, 10), savedAt: Date.now() };
    set({ saved: [item, ...state.saved] });
    return item;
  },
  renameSetup(id: string, name: string) {
    set({ saved: state.saved.map((s) => (s.id === id ? { ...s, name } : s)) });
  },
  deleteSetup(id: string) {
    set({ saved: state.saved.filter((s) => s.id !== id) });
  },
};

/* ------------------------------------------------------------------ units */

export function useUnits() {
  const s = useStore((st) => st.settings);
  return {
    settings: s,
    speed: (kmh: number) => (s.speed === 'mph' ? `${Math.round(kmh * 0.621371)} mph` : `${Math.round(kmh)} km/h`),
    speedNum: (kmh: number) => Math.round(s.speed === 'mph' ? kmh * 0.621371 : kmh),
    speedUnit: s.speed === 'mph' ? 'mph' : 'km/h',
    power: (hp: number) => (s.power === 'ps' ? `${Math.round(hp * 1.01387)} PS` : `${Math.round(hp)} hp`),
    powerNum: (hp: number) => Math.round(s.power === 'ps' ? hp * 1.01387 : hp),
    powerFrom: (v: number) => (s.power === 'ps' ? v / 1.01387 : v),
    powerUnit: s.power === 'ps' ? 'PS' : 'hp',
    weight: (kg: number) => (s.weight === 'lb' ? `${Math.round(kg * 2.20462).toLocaleString()} lb` : `${Math.round(kg).toLocaleString()} kg`),
    weightNum: (kg: number) => Math.round(s.weight === 'lb' ? kg * 2.20462 : kg),
    weightFrom: (v: number) => (s.weight === 'lb' ? v / 2.20462 : v),
    weightUnit: s.weight === 'lb' ? 'lb' : 'kg',
  };
}
export type Units = ReturnType<typeof useUnits>;
