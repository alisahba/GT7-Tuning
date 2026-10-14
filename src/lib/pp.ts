import model from '../data/pp-model.json';
import type { Car, TyreCode } from '../types';
import { DRY_LADDER, TYRE_NAME } from './tyres';

/* --------------------------------------------------------------------------
 * Performance Points.
 *
 * Stock PP per compound is known for most cars (measured in game). For the
 * rest, and for upgraded cars, PP is scaled with a model fitted on those
 * measurements:  PP ∝ hp^b · kg^c  (b ≈ 0.33, c ≈ −0.23)  × compound ratio.
 * ------------------------------------------------------------------------ */

const M = model as {
  a: number; b: number; c: number;
  groupFactor: Record<string, number>;
  tyreRatio: Record<TyreCode, number>;
};

export const PP_POWER_EXP = M.b;
export const PP_WEIGHT_EXP = M.c;

export interface PPEstimate {
  value: number;
  /** 'measured' = stock car on a measured compound; 'scaled' = measured stock value scaled for upgrades; 'model' = estimate. */
  source: 'measured' | 'scaled' | 'model' | 'user';
}

function stockOn(car: Car, tyre: TyreCode): number | null {
  const pp = car.pp;
  if (!pp) return null;
  if (pp[tyre]) return pp[tyre]!;
  const ref = (Object.keys(pp) as TyreCode[]).find((t) => pp[t]);
  return ref ? (pp[ref]! / M.tyreRatio[ref]) * M.tyreRatio[tyre] : null;
}

export function estimatePP(car: Car, hp: number, kg: number, tyre: TyreCode): PPEstimate {
  const stock = stockOn(car, tyre);
  if (stock !== null) {
    if (hp === car.hp && kg === car.kg) return { value: Math.round(stock), source: 'measured' };
    return { value: Math.round(stock * (hp / car.hp) ** M.b * (kg / car.kg) ** M.c), source: 'scaled' };
  }
  const sm = Math.exp(M.a + M.b * Math.log(hp) + M.c * Math.log(kg)) * (M.groupFactor[car.group] ?? 1);
  return { value: Math.round(sm * M.tyreRatio[tyre]), source: 'model' };
}

export interface PPOption {
  kind: 'restrictor' | 'ballast' | 'tyre' | 'power' | 'combo';
  title: string;
  detail: string;
  resultPP: number;
  recommended?: boolean;
  /** What applying this option sets. */
  restrictor?: number;
  ballast?: number;
  tyre?: TyreCode;
}

export interface PPPlan {
  current: number;
  source: PPEstimate['source'];
  limit: number;
  delta: number; // positive = over the limit
  options: PPOption[];
  restrictor: number; // % (100 = none)
  ballast: number; // kg
  /** Compound the recommended option switches to, if any. */
  tyre?: TyreCode;
}

const RESTRICTOR_MIN = 70;
const BALLAST_MAX = 200;

const withRestrictor = (pp: number, pct: number) => pp * (pct / 100) ** M.b;
const withBallast = (pp: number, kg: number, extra: number) => pp * ((kg + extra) / kg) ** M.c;
/** Lowest restrictor % that gets `pp` to `target` (may be < RESTRICTOR_MIN). */
const restrictorFor = (pp: number, target: number) => Math.floor((target / pp) ** (1 / M.b) * 100);
/** Ballast kg that gets `pp` to `target` (may exceed BALLAST_MAX). */
const ballastFor = (pp: number, target: number, kg: number) => Math.max(0, Math.ceil(kg * ((target / pp) ** (1 / M.c) - 1)));

/**
 * How to bring `current` PP under `limit`, or how much headroom is left.
 * `fixedTyre` = the event mandates the compound (no tyre swap suggestions).
 * `technical` = twisty track, where losing power hurts less than adding weight.
 */
export function planPP(opts: {
  current: number;
  source: PPEstimate['source'];
  limit: number;
  hp: number;
  kg: number;
  tyre: TyreCode;
  fixedTyre: boolean;
  technical: boolean;
}): PPPlan {
  const { current, limit, hp, kg, tyre, fixedTyre, technical } = opts;
  const target = limit - 0.5;
  const delta = current - limit;
  const options: PPOption[] = [];
  const canSwapTyre = !fixedTyre && DRY_LADDER.includes(tyre);

  if (delta > 0) {
    const pct = restrictorFor(current, target);
    const kgNeeded = ballastFor(current, target, kg);
    const restrictorOk = pct >= RESTRICTOR_MIN;
    const ballastOk = kgNeeded <= BALLAST_MAX;
    if (restrictorOk) {
      options.push({
        kind: 'restrictor', title: `Power restrictor ${pct}%`, restrictor: pct,
        detail: `Cuts about ${Math.round(hp * (1 - pct / 100))} hp. Keeps the car light, so it still brakes and turns well.`,
        resultPP: Math.round(withRestrictor(current, pct)),
      });
    }
    if (ballastOk) {
      options.push({
        kind: 'ballast', title: `Ballast ${kgNeeded} kg`, ballast: kgNeeded,
        detail: 'Keeps full power for the straights; the car brakes and turns a little more lazily.',
        resultPP: Math.round(withBallast(current, kg, kgNeeded)),
      });
    }
    if (restrictorOk && ballastOk) {
      // Middle ground: half the PP cut from each.
      const mid = Math.sqrt(target / current);
      const p2 = Math.max(RESTRICTOR_MIN, restrictorFor(1, mid));
      const b2 = Math.min(BALLAST_MAX, ballastFor(withRestrictor(current, p2), target, kg));
      options.push({
        kind: 'combo', title: `Restrictor ${p2}% + ${b2} kg ballast`, restrictor: p2, ballast: b2,
        detail: 'Splits the cut so neither straight-line speed nor agility suffers too much.',
        resultPP: Math.round(withBallast(withRestrictor(current, p2), kg, b2)),
      });
    }
    if (!restrictorOk) {
      // The restrictor alone can't do it: max it out and add ballast…
      const b2 = ballastFor(withRestrictor(current, RESTRICTOR_MIN), target, kg);
      if (b2 <= BALLAST_MAX) {
        options.push({
          kind: 'combo', title: `Restrictor ${RESTRICTOR_MIN}% + ${b2} kg ballast`, restrictor: RESTRICTOR_MIN, ballast: b2,
          detail: 'A big cut with both tools near their limits.',
          resultPP: Math.round(withBallast(withRestrictor(current, RESTRICTOR_MIN), kg, b2)),
        });
      }
    }
    if (canSwapTyre) {
      // …or step to a harder compound, with the restrictor making up the rest.
      for (let j = DRY_LADDER.indexOf(tyre) - 1; j >= 0; j--) {
        const t = DRY_LADDER[j];
        const onTyre = (current * ratioOf(t)) / ratioOf(tyre);
        if (onTyre <= target) {
          options.push({ kind: 'tyre', title: `Switch to ${TYRE_NAME[t]}`, tyre: t, detail: 'No mechanical change, but less grip everywhere.', resultPP: Math.round(onTyre) });
          break;
        }
        const p3 = restrictorFor(onTyre, target);
        if (!restrictorOk && p3 >= RESTRICTOR_MIN) {
          options.push({
            kind: 'combo', title: `${TYRE_NAME[t]} + restrictor ${p3}%`, tyre: t, restrictor: p3,
            detail: 'A harder tyre takes some PP off, so the restrictor can stay higher.',
            resultPP: Math.round(withRestrictor(onTyre, p3)),
          });
          break;
        }
      }
    }
    const preferred =
      options.find((o) => o.kind === (technical ? 'restrictor' : 'ballast')) ??
      options.find((o) => o.kind === 'restrictor' || o.kind === 'ballast') ??
      options.find((o) => o.kind === 'combo') ??
      options[0];
    if (preferred) preferred.recommended = true;
  } else {
    const head = -delta;
    const extraHp = Math.floor(hp * ((target / current) ** (1 / M.b) - 1));
    if (extraHp >= 5) {
      options.push({
        kind: 'power', title: `Up to +${extraHp} hp available`,
        detail: `${Math.round(head)} PP spare — add power (engine parts, ECU or turbo, where the car allows them) or remove weight until you reach ${limit} PP.`,
        resultPP: limit,
      });
    }
    if (canSwapTyre) {
      let pick: TyreCode | null = null;
      for (let j = DRY_LADDER.indexOf(tyre) + 1; j < DRY_LADDER.length; j++) {
        if ((current * ratioOf(DRY_LADDER[j])) / ratioOf(tyre) <= target) pick = DRY_LADDER[j];
      }
      if (pick) {
        options.push({
          kind: 'tyre', title: `Fit ${TYRE_NAME[pick]}`, tyre: pick,
          detail: 'Softer tyres are usually the most lap time per PP.',
          resultPP: Math.round((current * ratioOf(pick)) / ratioOf(tyre)),
          recommended: true,
        });
      }
    }
  }
  const rec = delta > 0 ? options.find((o) => o.recommended) : undefined;
  return {
    current, source: opts.source, limit, delta: Math.round(delta), options,
    restrictor: rec?.restrictor ?? 100, ballast: rec?.ballast ?? 0, tyre: rec?.tyre,
  };
}

function ratioOf(t: TyreCode) {
  return M.tyreRatio[t] ?? 1;
}

/** GT7 ballast position −50 (front) … +50 (rear): put weight where the car is light. */
export function ballastPosition(frontPct: number): number {
  return Math.max(-50, Math.min(50, Math.round(((frontPct - 48) * 4) / 5) * 5));
}
