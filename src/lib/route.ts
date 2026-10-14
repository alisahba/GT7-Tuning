import type { RaceType, Weather } from '../types';

export type Step = 'car' | 'track' | 'race' | 'setup';

export interface RouteState {
  step: Step;
  car?: number;
  track?: string;
  race: RaceType;
  weather: Weather;
  style: number;
  hp?: number;
  kg?: number;
  drag: number;
}

export const DEFAULT_ROUTE: RouteState = { step: 'car', race: 'sprint', weather: 'dry', style: 0, drag: 402 };

const RACES: RaceType[] = ['time-trial', 'sprint', 'endurance', 'drift', 'drag'];
const STEPS: Step[] = ['car', 'track', 'race', 'setup'];

export function parseHash(hash: string): RouteState {
  const q = new URLSearchParams(hash.replace(/^#\/?/, ''));
  const num = (k: string) => (q.has(k) && Number.isFinite(Number(q.get(k))) ? Number(q.get(k)) : undefined);
  const step = q.get('step') as Step;
  const race = q.get('race') as RaceType;
  return {
    step: STEPS.includes(step) ? step : 'car',
    car: num('car'),
    track: q.get('track') ?? undefined,
    race: RACES.includes(race) ? race : 'sprint',
    weather: q.get('weather') === 'wet' ? 'wet' : 'dry',
    style: Math.max(-1, Math.min(1, num('style') ?? 0)),
    hp: num('hp'),
    kg: num('kg'),
    drag: num('drag') ?? 402,
  };
}

export function toHash(s: RouteState): string {
  const q = new URLSearchParams();
  q.set('step', s.step);
  if (s.car !== undefined) q.set('car', String(s.car));
  if (s.track) q.set('track', s.track);
  if (s.race !== 'sprint') q.set('race', s.race);
  if (s.weather !== 'dry') q.set('weather', s.weather);
  if (s.style) q.set('style', String(s.style));
  if (s.hp !== undefined) q.set('hp', String(s.hp));
  if (s.kg !== undefined) q.set('kg', String(s.kg));
  if (s.race === 'drag' && s.drag !== 402) q.set('drag', String(s.drag));
  return '#/' + q.toString();
}
