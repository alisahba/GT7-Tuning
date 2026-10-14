import type { EventRules, RaceType, TyreCode, Weather } from '../types';
import { TYRES } from './tyres';

export type Step = 'car' | 'track' | 'race' | 'setup' | 'garage';

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
  event: EventRules;
}

export const DEFAULT_ROUTE: RouteState = { step: 'car', race: 'sprint', weather: 'dry', style: 0, drag: 402, event: {} };

const RACES: RaceType[] = ['time-trial', 'sprint', 'endurance', 'drift', 'drag'];
const STEPS: Step[] = ['car', 'track', 'race', 'setup', 'garage'];
const TYRE_CODES = new Set(TYRES.map((t) => t.code));

export function parseHash(hash: string): RouteState {
  const q = new URLSearchParams(hash.replace(/^#\/?/, ''));
  const num = (k: string) => {
    const v = q.get(k);
    return v !== null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined;
  };
  const step = q.get('step') as Step;
  const race = q.get('race') as RaceType;
  const tyre = q.get('tyre') as TyreCode;
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
    event: {
      series: q.get('ev') ?? undefined,
      laps: num('laps'),
      ppLimit: num('pp'),
      tyre: TYRE_CODES.has(tyre) ? tyre : undefined,
      bop: q.get('bop') === '1' || undefined,
      fuelMult: num('fuel'),
      wearMult: num('wear'),
      currentPP: num('cpp'),
    },
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
  const e = s.event;
  if (e.series) q.set('ev', e.series);
  if (e.laps !== undefined) q.set('laps', String(e.laps));
  if (e.ppLimit !== undefined) q.set('pp', String(e.ppLimit));
  if (e.tyre) q.set('tyre', e.tyre);
  if (e.bop) q.set('bop', '1');
  if (e.fuelMult !== undefined) q.set('fuel', String(e.fuelMult));
  if (e.wearMult !== undefined) q.set('wear', String(e.wearMult));
  if (e.currentPP !== undefined) q.set('cpp', String(e.currentPP));
  return '#/' + q.toString();
}
