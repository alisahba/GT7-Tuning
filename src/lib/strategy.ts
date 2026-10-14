import type { TyreCode } from '../types';
import { TYRE_LIFE_KM } from './tyres';

export interface StrategyInput {
  laps: number;
  lengthM: number;
  hp: number;
  tyre: TyreCode;
  fuelMult: number;
  wearMult: number;
  /** Measured fuel use per lap at ×1 (percent of tank); estimated if omitted. */
  fuelPerLap?: number;
  ev: boolean;
}

export interface Stint {
  from: number;
  to: number;
  fuel: number; // % to start the stint with
  tyre: TyreCode;
}

export interface Strategy {
  fuelPerLap: number;
  fuelEstimated: boolean;
  tyreLaps: number;
  fuelLaps: number;
  totalFuel: number;
  stops: number;
  stints: Stint[];
  fuelMapTip: string | null;
}

/** Fuel used per lap at ×1 in % of a full tank (rule of thumb: ≈0.3 %/km + 0.06 %/km per 100 hp). */
export function estimateFuelPerLap(lengthM: number, hp: number): number {
  return (lengthM / 1000) * (0.3 + 0.0006 * hp);
}

export function planStrategy(i: StrategyInput): Strategy {
  const fuelEstimated = !i.fuelPerLap;
  const base = i.fuelPerLap ?? estimateFuelPerLap(i.lengthM, i.hp);
  const fuelPerLap = i.fuelMult > 0 ? base * i.fuelMult : 0;
  const lapKm = i.lengthM / 1000;
  const tyreLaps = i.wearMult > 0 ? Math.max(1, Math.floor((TYRE_LIFE_KM[i.tyre] * 0.9) / (lapKm * i.wearMult))) : Infinity;
  const fuelLaps = fuelPerLap > 0 ? Math.max(1, Math.floor(99 / fuelPerLap)) : Infinity;
  const stintMax = Math.min(tyreLaps, fuelLaps, i.laps);
  const stintCount = Math.max(1, Math.ceil(i.laps / stintMax));
  const stops = stintCount - 1;
  const stints: Stint[] = [];
  let lap = 1;
  for (let s = 0; s < stintCount; s++) {
    const len = Math.ceil((i.laps - lap + 1) / (stintCount - s));
    const need = fuelPerLap > 0 ? Math.min(100, Math.ceil(fuelPerLap * (len + 0.5))) : 100;
    stints.push({ from: lap, to: lap + len - 1, fuel: need, tyre: i.tyre });
    lap += len;
  }
  const totalFuel = fuelPerLap * i.laps;
  let fuelMapTip: string | null = null;
  if (stops >= 1 && fuelLaps < tyreLaps && Math.ceil(i.laps / stops) <= tyreLaps) {
    // Saving needed to finish with one stop fewer. Each leaner fuel-map step
    // saves very roughly 4–5 % fuel for a small loss of power.
    const needed = 1 - (99 * stops) / totalFuel;
    if (needed > 0 && needed < 0.22) {
      fuelMapTip = `Running Fuel Map ${Math.min(6, 1 + Math.ceil(needed / 0.045))} (≈ ${Math.ceil(needed * 100)} % leaner) could save a stop.`;
    }
  }
  return { fuelPerLap, fuelEstimated, tyreLaps, fuelLaps, totalFuel, stops, stints, fuelMapTip };
}
