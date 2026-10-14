export type Drivetrain = 'FF' | 'FR' | 'MR' | 'RR' | '4WD';
export type Aspiration = 'NA' | 'TB' | 'SC' | 'EV' | 'HY';
export type CarCategory = 'road' | 'race' | 'gr4' | 'gr3' | 'gr2' | 'gr1' | 'grb' | 'formula' | 'kart';
/** Official GT7 car group. */
export type CarGroup = 'N' | '1' | '2' | '3' | '4' | 'B' | 'X';
export type TyreCode = 'CH' | 'CM' | 'CS' | 'SH' | 'SM' | 'SS' | 'RH' | 'RM' | 'RS' | 'IM' | 'W' | 'D' | 'S';

export interface Car {
  id: number;
  name: string;
  maker: string;
  /** ISO country code of the manufacturer ("pdi" for Polyphony originals). */
  country: string;
  year: number | null;
  group: CarGroup;
  /** Tuning class (official group, refined for race/formula/kart). */
  cat: CarCategory;
  dt: Drivetrain;
  asp: Aspiration;
  hp: number;
  kg: number;
  /** Front axle weight share in percent. */
  front: number;
  /** Stock Performance Points per tyre compound, measured in game (when known). */
  pp?: Partial<Record<TyreCode, number>>;
}

export type Surface = 'tarmac' | 'dirt' | 'snow' | 'mixed';
export type Region = 'Europe' | 'America' | 'Asia-Oceania';

export interface TrackMap {
  w: number;
  h: number;
  d: string;
  start: [number, number];
  dir: number;
}

export interface Track {
  id: string;
  name: string;
  venue: string;
  venueId: string;
  layout: string;
  country: string;
  countryName: string;
  region: Region;
  turns: number;
  length: number;
  elevation: number;
  straight: number;
  kind: 'real' | 'original';
  rain: boolean;
  surface: Surface;
  reverse: boolean;
  /** False when the layout has no recording of its own and shows the venue's main layout. */
  mapExact: boolean;
  map: TrackMap | null;
}

export type RaceType = 'time-trial' | 'sprint' | 'endurance' | 'drift' | 'drag';
export type Weather = 'dry' | 'wet';

/** Regulations of the event being entered (all optional). */
export interface EventRules {
  /** Preset series id, if one was picked. */
  series?: string;
  laps?: number;
  ppLimit?: number;
  /** Compound the event requires. */
  tyre?: TyreCode;
  /** Balance of Performance on — car settings are locked. */
  bop?: boolean;
  fuelMult?: number;
  wearMult?: number;
  /** PP of the car as shown in the game right now (overrides the estimate). */
  currentPP?: number;
}

export interface RaceOptions {
  type: RaceType;
  weather: Weather;
  /** -1 = maximum stability … +1 = maximum rotation / agility. */
  style: number;
  /** Current (possibly upgraded) output and weight; defaults to stock. */
  hp: number;
  kg: number;
  /** Drag strip length in metres (drag only). */
  dragDistance: number;
  event: EventRules;
}
