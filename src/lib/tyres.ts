import type { TyreCode } from '../types';

export const TYRES: { code: TyreCode; name: string; short: string }[] = [
  { code: 'CH', name: 'Comfort Hard', short: 'CH' },
  { code: 'CM', name: 'Comfort Medium', short: 'CM' },
  { code: 'CS', name: 'Comfort Soft', short: 'CS' },
  { code: 'SH', name: 'Sports Hard', short: 'SH' },
  { code: 'SM', name: 'Sports Medium', short: 'SM' },
  { code: 'SS', name: 'Sports Soft', short: 'SS' },
  { code: 'RH', name: 'Racing Hard', short: 'RH' },
  { code: 'RM', name: 'Racing Medium', short: 'RM' },
  { code: 'RS', name: 'Racing Soft', short: 'RS' },
  { code: 'IM', name: 'Intermediate', short: 'IM' },
  { code: 'W', name: 'Heavy Wet', short: 'W' },
  { code: 'D', name: 'Dirt', short: 'D' },
  { code: 'S', name: 'Snow', short: 'S' },
];

export const TYRE_NAME = Object.fromEntries(TYRES.map((t) => [t.code, t.name])) as Record<TyreCode, string>;

/** Dry tarmac compounds from hardest/slowest to softest/fastest. */
export const DRY_LADDER: TyreCode[] = ['CH', 'CM', 'CS', 'SH', 'SM', 'SS', 'RH', 'RM', 'RS'];

/** Rough distance (km) a compound lasts at tyre-wear ×1 before grip falls away. */
export const TYRE_LIFE_KM: Record<TyreCode, number> = {
  CH: 360, CM: 280, CS: 200, SH: 230, SM: 160, SS: 110, RH: 180, RM: 130, RS: 90, IM: 140, W: 140, D: 120, S: 120,
};
