import type { Car, CarGroup, Drivetrain, RaceType, TyreCode } from '../types';

/* --------------------------------------------------------------------------
 * GT7 World Circuits event series.
 *
 * Series rules (PP limit, eligible cars) come from the series name / in-game
 * regulations. Rounds list the tracks and typical lap counts reported by the
 * community; Polyphony adjusts events between updates, so every value can be
 * edited in the app to match the Regulations screen exactly.
 * ------------------------------------------------------------------------ */

export interface Round {
  track: string;
  laps: number;
  ppLimit?: number;
  note?: string;
}

export interface EventSeries {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  ppLimit?: number;
  groups?: CarGroup[];
  drivetrains?: Drivetrain[];
  origin?: 'Japan' | 'Europe' | 'America';
  restriction: string;
  tyre?: TyreCode;
  laps: number;
  raceType: RaceType;
  rounds: Round[];
}

const EU = new Set(['de', 'it', 'fr', 'gb', 'se', 'es', 'at', 'cz', 'be', 'ch', 'hr', 'nl']);

export const EVENT_SERIES: EventSeries[] = [
  {
    id: 'sunday-cup', name: 'Sunday Cup', level: 'Beginner', groups: ['N'],
    restriction: 'Road cars (Gr.N)', laps: 3, raceType: 'sprint',
    rounds: [],
  },
  {
    id: 'clubman-cup-plus', name: 'Clubman Cup Plus', level: 'Beginner', groups: ['N'],
    restriction: 'Road cars (Gr.N) · PP limit varies by round', laps: 3, raceType: 'sprint',
    rounds: [
      { track: 'f18da2', laps: 3, ppLimit: 550 },
      { track: '65e108', laps: 3, ppLimit: 550 },
      { track: 'b72701', laps: 3, ppLimit: 350, note: 'Specified car: MINI' },
      { track: 'd066e4', laps: 3, ppLimit: 700 },
      { track: 'e6817f', laps: 5, ppLimit: 700 },
      { track: 'ef3232', laps: 1, ppLimit: 720 },
    ],
  },
  {
    id: 'european-sunday-cup-400', name: 'European Sunday Cup 400', level: 'Beginner', ppLimit: 400, origin: 'Europe', groups: ['N'],
    restriction: 'European road cars', laps: 3, raceType: 'sprint', rounds: [],
  },
  {
    id: 'european-sunday-cup-500', name: 'European Sunday Cup 500', level: 'Beginner', ppLimit: 500, origin: 'Europe', groups: ['N'],
    restriction: 'European road cars', laps: 3, raceType: 'sprint',
    rounds: [{ track: 'd84128', laps: 3 }],
  },
  {
    id: 'american-sunday-cup-600', name: 'American Sunday Cup 600', level: 'Intermediate', ppLimit: 600, origin: 'America', groups: ['N'],
    restriction: 'American road cars', laps: 3, raceType: 'sprint', rounds: [],
  },
  {
    id: 'japanese-fr-challenge-450', name: 'Japanese FR Challenge 450', level: 'Beginner', ppLimit: 450, origin: 'Japan', drivetrains: ['FR'], groups: ['N'],
    restriction: 'Japanese front-engine, rear-drive road cars', laps: 3, raceType: 'sprint', rounds: [],
  },
  {
    id: 'japanese-clubman-cup-550', name: 'Japanese Clubman Cup 550', level: 'Intermediate', ppLimit: 550, origin: 'Japan', groups: ['N'],
    restriction: 'Japanese road cars', laps: 3, raceType: 'sprint',
    rounds: [
      { track: '1d0c5e', laps: 3 },
      { track: 'd066e4', laps: 3 },
      { track: 'afcb24', laps: 3 },
      { track: 'd60ebc', laps: 3 },
      { track: 'a8725d', laps: 3 },
      { track: '6cdd45', laps: 3 },
      { track: 'ef9ee9', laps: 3 },
      { track: '6dfca5', laps: 3 },
      { track: 'd83aeb', laps: 3 },
    ],
  },
  {
    id: 'japanese-4wd-challenge-550', name: 'Japanese 4WD Challenge 550', level: 'Intermediate', ppLimit: 550, origin: 'Japan', drivetrains: ['4WD'], groups: ['N'],
    restriction: 'Japanese four-wheel-drive road cars', laps: 3, raceType: 'sprint', rounds: [],
  },
  {
    id: 'american-clubman-cup-700', name: 'American Clubman Cup 700', level: 'Intermediate', ppLimit: 700, origin: 'America', groups: ['N'],
    restriction: 'American road cars', laps: 3, raceType: 'sprint',
    rounds: [
      { track: 'c58e28', laps: 3 },
      { track: 'ef3232', laps: 1 },
      { track: '6cdd45', laps: 3 },
      { track: 'da093f', laps: 3 },
      { track: '60d74b', laps: 3 },
      { track: 'ede05f', laps: 3 },
    ],
  },
  {
    id: 'wtc-600', name: 'World Touring Car 600', level: 'Intermediate', ppLimit: 600,
    restriction: 'Any car up to 600 PP — Gr.4 cars fit well', laps: 5, raceType: 'sprint',
    rounds: [
      { track: 'f3f7f9', laps: 5 },
      { track: '6e378b', laps: 5 },
      { track: '36a3db', laps: 5 },
    ],
  },
  {
    id: 'wtc-700', name: 'World Touring Car 700', level: 'Advanced', ppLimit: 700,
    restriction: 'Any car up to 700 PP', laps: 10, raceType: 'sprint',
    rounds: [
      { track: '0457d4', laps: 10 },
      { track: '3f4c16', laps: 10 },
      { track: '6cdd45', laps: 10 },
      { track: '802508', laps: 5 },
      { track: 'aa8dc5', laps: 5 },
      { track: 'fd4818', laps: 1 },
    ],
  },
  {
    id: 'wtc-800', name: 'World Touring Car 800', level: 'Advanced', ppLimit: 800,
    restriction: 'Any car up to 800 PP — Gr.3 cars fit well', laps: 12, raceType: 'endurance',
    rounds: [
      { track: 'e9eec1', laps: 15 },
      { track: 'd60ebc', laps: 12 },
      { track: 'c272b2', laps: 3 },
    ],
  },
  {
    id: 'wtc-900', name: 'World Touring Car 900', level: 'Expert', ppLimit: 900,
    restriction: 'Any car up to 900 PP', laps: 10, raceType: 'endurance',
    rounds: [
      { track: '1d0c5e', laps: 10 },
      { track: '2066d9', laps: 10 },
      { track: '6e378b', laps: 10 },
      { track: '802508', laps: 10 },
      { track: 'd60ebc', laps: 10 },
      { track: '101516', laps: 12 },
    ],
  },
  {
    id: 'gt-cup-gr4', name: 'GT Cup Gr.4', level: 'Intermediate', groups: ['4'],
    restriction: 'Gr.4 cars', laps: 5, raceType: 'sprint', rounds: [],
  },
  {
    id: 'gt-cup-gr3', name: 'GT Cup Gr.3', level: 'Advanced', groups: ['3'],
    restriction: 'Gr.3 cars', laps: 5, raceType: 'sprint',
    rounds: [
      { track: '6e378b', laps: 5 },
      { track: '3c4be1', laps: 5 },
      { track: '5ba087', laps: 5 },
      { track: 'c58e28', laps: 10 },
      { track: 'f3f7f9', laps: 7 },
      { track: 'd93f3a', laps: 7 },
      { track: '0457d4', laps: 7 },
      { track: 'ec1eb6', laps: 10 },
    ],
  },
  {
    id: 'gr1-prototype', name: 'Gr.1 Prototype Series', level: 'Expert', groups: ['1'],
    restriction: 'Gr.1 prototypes (opponents ≤ 950 PP)', laps: 10, raceType: 'endurance',
    rounds: [
      { track: '954433', laps: 8 },
      { track: '6e378b', laps: 10 },
      { track: 'c58e28', laps: 10 },
      { track: 'd066e4', laps: 10 },
      { track: 'c2fd94', laps: 10 },
      { track: 'd3bd76', laps: 15 },
      { track: '60d74b', laps: 15 },
      { track: 'c272b2', laps: 7 },
      { track: 'e9eec1', laps: 10 },
      { track: 'da093f', laps: 20, note: '30-minute race' },
    ],
  },
  {
    id: 'super-formula', name: 'Super Formula', level: 'Expert', groups: ['X'],
    restriction: 'Super Formula SF19 / SF23', laps: 10, raceType: 'sprint', rounds: [],
  },
  {
    id: 'dirt', name: 'Dirt & snow events', level: 'Intermediate', groups: ['B', 'N'],
    restriction: 'Gr.B rally cars or road cars on dirt/snow tyres', laps: 3, raceType: 'sprint', rounds: [],
  },
];

export const SERIES_BY_ID = new Map(EVENT_SERIES.map((s) => [s.id, s]));

/** Series with a round at this track first, then the rest. */
export function seriesForTrack(trackId: string) {
  const at: { series: EventSeries; round: Round }[] = [];
  for (const s of EVENT_SERIES) for (const r of s.rounds) if (r.track === trackId) at.push({ series: s, round: r });
  return at;
}

export interface Eligibility {
  ok: boolean;
  reasons: string[];
}

export function checkEligibility(car: Car, series: EventSeries | undefined): Eligibility {
  if (!series) return { ok: true, reasons: [] };
  const reasons: string[] = [];
  if (series.groups && !series.groups.includes(car.group)) reasons.push(`Needs ${series.restriction.toLowerCase()} — this car is ${groupLabel(car.group)}.`);
  if (series.drivetrains && !series.drivetrains.includes(car.dt)) reasons.push(`Needs ${series.drivetrains.join('/')} — this car is ${car.dt}.`);
  if (series.origin === 'Japan' && car.country !== 'jp') reasons.push('Needs a Japanese manufacturer.');
  if (series.origin === 'America' && car.country !== 'us') reasons.push('Needs an American manufacturer.');
  if (series.origin === 'Europe' && !EU.has(car.country)) reasons.push('Needs a European manufacturer.');
  if (series.id === 'super-formula' && !/Super Formula/.test(car.name)) reasons.push('Needs a Super Formula car.');
  return { ok: reasons.length === 0, reasons };
}

export function groupLabel(g: CarGroup): string {
  return g === 'N' ? 'a road car (Gr.N)' : g === 'X' ? 'Gr.X' : `Gr.${g}`;
}
