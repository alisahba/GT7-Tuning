import type { Car, CarCategory, Drivetrain, RaceOptions, Track } from '../types';

/* --------------------------------------------------------------------------
 * GT7 tuning calculator.
 *
 * The numbers follow the ranges of the GT7 Settings screen:
 *   anti-roll bars 1–10, damping compression 20–40 %, expansion 30–50 %,
 *   camber 0.0–6.0°, toe ±1.00°, LSD 5–60, brake balance −5…+5.
 * Ride height and downforce ranges differ per car, so they are expressed
 * relative to each car's own range (mm above the minimum / % of the range).
 * ------------------------------------------------------------------------ */

export interface Pair { front: number; rear: number }
export interface LsdUnit { initial: number; accel: number; braking: number }

export interface TrackProfile {
  cornersPerKm: number;
  /** 0 = flat-out (oval / Le Mans) … 1 = tight & twisty. */
  downforce: number;
  /** 0 = billiard table … 1 = Nordschleife-grade bumps. */
  bumps: number;
  speedClass: 'High-speed' | 'Balanced' | 'Technical';
  isOval: boolean;
}

export interface Setup {
  profile: TrackProfile;
  tyreFront: string;
  tyreRear: string;
  rideHeight: Pair;
  arb: Pair;
  compression: Pair;
  expansion: Pair;
  frequency: Pair;
  camber: Pair;
  /** Degrees, positive = toe-in, negative = toe-out. */
  toe: Pair;
  lsdFront: LsdUnit | null;
  lsdRear: LsdUnit | null;
  /** Front share of drive torque for 4WD cars with a torque-vectoring centre diff. */
  torqueSplit: number | null;
  /** Percent of the car's downforce range, null when the car has no adjustable aero. */
  aero: Pair | null;
  topSpeed: number | null;
  /** Estimated speed reached at the end of the longest straight with this car. */
  straightSpeed: number;
  /** Steps on the GT7 −5…+5 scale; negative = towards the front. */
  brakeBalance: number;
  ecu: number;
  tcs: number;
  notes: { area: string; text: string }[];
  warnings: string[];
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round = (v: number, step = 1) => Math.round(v / step) * step;
const r2 = (v: number) => Math.round(v * 100) / 100;

/* ------------------------------------------------------------ track model */

// Hand-calibrated downforce demand for circuits where corner counts mislead
// (long flat-out sections broken by chicanes, ovals, the Route X speed bowl).
const DOWNFORCE_OVERRIDE: Record<string, number> = {
  c272b2: 0.2, // Le Mans
  fbd5bc: 0.1, // Le Mans no chicane
  e6817f: 0.22, // Monza
  f9e0f3: 0.12, // Monza no chicane
  d93f3a: 0.08, // Daytona tri-oval
  c58e28: 0.32, // Daytona road course
  ef3232: 0.0, // Special Stage Route X
  '6bf104': 0.1, // Blue Moon Bay oval
  edfde6: 0.1,
  '6e659a': 0.3, // Northern Isle
  '6e378b': 0.62, // Suzuka
  '12ceac': 0.52, // Nordschleife
  '8dd16b': 0.52,
  fd4818: 0.48, // Nürburgring 24h
  '31acde': 0.48,
  '592211': 0.48,
  '3c4be1': 0.42, // Spa
  d60ebc: 0.42,
  ec1eb6: 0.42, // Mount Panorama
  d066e4: 0.36, // Fuji
  b1c9f8: 0.36,
  '65e108': 0.25, // High Speed Ring
  ede05f: 0.25,
  '60d74b': 0.38, // Watkins Glen
  '381321': 0.42, // Big Willow
};

const BUMPS: [RegExp, number][] = [
  [/Fishermans/, 0.85],
  [/Windmills/, 0.8],
  [/Colorado/, 0.75],
  [/Lake Louise/, 0.6],
  [/Rallycross/, 0.6],
  [/Mount Panorama/, 0.6],
  [/Eiger/, 0.5],
  [/Tokyo/, 0.45],
  [/Alsace/, 0.45],
  [/Goodwood/, 0.4],
  [/Mans/, 0.35],
  [/Road Atlanta|Trial Mountain|Grand Valley|Sainte-Croix/, 0.35],
  [/Laguna|Deep Forest|Dragon Trail|Watkins|Interlagos|Kyoto/, 0.3],
  [/Daytona/, 0.25],
];

export function profileTrack(track: Track): TrackProfile {
  const km = track.length / 1000;
  const cornersPerKm = track.turns / km;
  const isOval = /Tri-Oval|Northern Isle|^Blue Moon Bay Speedway( Reverse)?$|Route X/.test(track.name);
  let downforce =
    DOWNFORCE_OVERRIDE[track.id] ??
    0.55 + 0.15 * (cornersPerKm - 3) - 0.12 * Math.log2(Math.max(track.straight, 150) / 700);
  downforce = clamp(downforce, 0, 0.95);

  let bumps = 0.2;
  const nordschleife = /Nürburgring|Nurburgring/.test(track.name) && track.length > 10000;
  if (nordschleife) bumps = 0.9;
  else for (const [re, v] of BUMPS) if (re.test(track.name)) { bumps = v; break; }
  bumps = clamp(bumps + Math.min(track.elevation / 500, 0.12), 0, 1);

  const speedClass = downforce < 0.33 ? 'High-speed' : downforce < 0.58 ? 'Balanced' : 'Technical';
  return { cornersPerKm: r2(cornersPerKm), downforce: r2(downforce), bumps: r2(bumps), speedClass, isOval };
}

/* -------------------------------------------------------------- car model */

interface CatBase {
  hz: number; camF: number; camR: number; rhF: number; rhR: number;
  comp: number; exp: number; cda: number; aero: boolean; slicks: boolean;
}

const BASE: Record<CarCategory, CatBase> = {
  road:    { hz: 2.0, camF: 1.6, camR: 1.1, rhF: 12, rhR: 16, comp: 28, exp: 38, cda: 0.7, aero: false, slicks: false },
  race:    { hz: 3.2, camF: 2.6, camR: 1.9, rhF: 6, rhR: 10, comp: 30, exp: 40, cda: 0.8, aero: true, slicks: true },
  gr4:     { hz: 2.9, camF: 2.4, camR: 1.8, rhF: 6, rhR: 10, comp: 30, exp: 40, cda: 0.76, aero: true, slicks: true },
  gr3:     { hz: 3.4, camF: 2.8, camR: 2.1, rhF: 4, rhR: 9, comp: 31, exp: 41, cda: 0.82, aero: true, slicks: true },
  gr2:     { hz: 4.0, camF: 3.0, camR: 2.2, rhF: 3, rhR: 8, comp: 32, exp: 42, cda: 0.85, aero: true, slicks: true },
  gr1:     { hz: 4.4, camF: 3.0, camR: 2.2, rhF: 2, rhR: 7, comp: 32, exp: 42, cda: 0.75, aero: true, slicks: true },
  grb:     { hz: 2.2, camF: 1.5, camR: 0.9, rhF: 22, rhR: 24, comp: 27, exp: 37, cda: 0.8, aero: true, slicks: true },
  formula: { hz: 4.6, camF: 3.2, camR: 2.0, rhF: 2, rhR: 6, comp: 32, exp: 42, cda: 0.95, aero: true, slicks: true },
  kart:    { hz: 3.0, camF: 1.0, camR: 0.5, rhF: 0, rhR: 0, comp: 30, exp: 40, cda: 0.45, aero: false, slicks: true },
};

/** Front:rear spring-frequency multipliers per drivetrain (front, rear). */
const DT_FREQ: Record<Drivetrain, [number, number]> = {
  FF: [1.0, 1.12],
  FR: [1.0, 1.05],
  MR: [1.0, 1.03],
  RR: [1.04, 1.0],
  '4WD': [1.0, 1.07],
};
const DT_ARB: Record<Drivetrain, [number, number]> = {
  FF: [3, 7],
  FR: [5, 4],
  MR: [6, 4],
  RR: [7, 3],
  '4WD': [4, 6],
};

/**
 * Speed (km/h) reached after `distance` metres of full throttle, starting at
 * `v0` km/h, with a simple power / aero-drag / rolling-resistance model.
 */
export function accelerate(hp: number, kg: number, cda: number, distance: number, v0: number, grip = 1.1): number {
  const mass = kg + 75; // + driver
  const power = hp * 745.7 * 0.86; // wheel power after driveline losses
  const rho = 1.2;
  let v = Math.max(v0 / 3.6, 1);
  let s = 0;
  const dt = 0.02;
  while (s < distance) {
    const traction = grip * 9.81 * mass;
    const drive = Math.min(power / v, traction);
    const resist = 0.5 * rho * cda * v * v + 0.015 * mass * 9.81;
    const a = (drive - resist) / mass;
    if (a <= 0.001) break; // reached terminal speed
    v += a * dt;
    s += v * dt;
  }
  return v * 3.6;
}

export function terminalSpeed(hp: number, kg: number, cda: number): number {
  return accelerate(hp, kg, cda, 50000, 100);
}

/* ------------------------------------------------------------ the solver */

export function computeSetup(car: Car, track: Track, race: RaceOptions): Setup {
  const base = BASE[car.cat];
  const profile = profileTrack(track);
  const notes: Setup['notes'] = [];
  const warnings: string[] = [];
  const style = clamp(race.style, -1, 1);
  const wet = race.weather === 'wet';
  const offroad = track.surface === 'dirt' || track.surface === 'snow' || track.surface === 'mixed';
  const drift = race.type === 'drift';
  const drag = race.type === 'drag';
  const endurance = race.type === 'endurance';
  const hpPerTon = (race.hp / race.kg) * 1000;
  const dt = car.dt;

  /* ---------- tyres */
  let tyreFront: string, tyreRear: string;
  if (track.surface === 'snow') tyreFront = tyreRear = 'Snow';
  else if (track.surface === 'dirt' || track.surface === 'mixed') tyreFront = tyreRear = 'Dirt';
  else if (wet) {
    tyreFront = tyreRear = 'Intermediate';
    notes.push({ area: 'Tyres', text: 'Intermediates for a damp or drying track; switch to Heavy Wet once water is standing on the racing line.' });
  }
  else if (drift) {
    tyreFront = hpPerTon > 330 ? 'Sports Soft' : 'Sports Medium';
    tyreRear = hpPerTon > 330 ? 'Sports Medium' : 'Sports Hard';
  } else if (drag) tyreFront = tyreRear = base.slicks ? 'Racing Soft' : 'Sports Soft';
  else {
    const family = base.slicks ? 'Racing' : 'Sports';
    const compound = race.type === 'time-trial' ? 'Soft' : endurance ? 'Hard' : 'Medium';
    tyreFront = tyreRear = `${family} ${compound}`;
  }

  /* ---------- natural frequency (Hz) */
  let hz = base.hz;
  if (car.cat === 'road') hz = 1.9 + clamp((hpPerTon - 150) / 650, 0, 0.7);
  if (base.aero) hz += 0.35 * (profile.downforce - 0.5);
  hz *= 1 - 0.18 * profile.bumps;
  if (wet) hz *= 0.9;
  if (endurance) hz *= 0.97;
  if (offroad) hz = car.cat === 'grb' ? 1.9 : 1.7;
  if (drift) hz = Math.max(hz, 2.6);
  if (drag) hz = Math.max(1.8, hz * 0.85);
  const [fqF, fqR] = DT_FREQ[dt];
  const frequency = {
    front: r2(clamp(hz * fqF * (1 - 0.03 * style), 1.2, 6)),
    rear: r2(clamp(hz * fqR * (1 + 0.03 * style), 1.2, 6)),
  };
  if (drag) frequency.rear = r2(frequency.front * 0.9); // let the rear squat for launch
  notes.push({
    area: 'Springs',
    text: `${frequency.front.toFixed(2)}/${frequency.rear.toFixed(2)} Hz suits a ${labelCat(car.cat)} on a ${profile.bumps > 0.5 ? 'bumpy' : 'smooth'}, ${profile.speedClass.toLowerCase()} layout. The rear runs ${frequency.rear >= frequency.front ? 'slightly stiffer to keep the car flat and help it rotate' : 'softer to tame the rear-engine pendulum'}.`,
  });

  /* ---------- ride height (mm above the car's minimum) */
  let rhF = base.rhF + 18 * profile.bumps;
  let rhR = base.rhR + 18 * profile.bumps;
  if (wet) { rhF += 5; rhR += 5; }
  if (offroad) { rhF = Math.max(rhF, 45); rhR = Math.max(rhR, 50); }
  if (drift) { rhF = base.rhF + 15; rhR = base.rhR + 8; }
  if (drag) { rhF = base.rhF + 20; rhR = base.rhR; }
  if (profile.isOval && !offroad) { rhF -= 2; rhR -= 2; }
  const rideHeight = { front: Math.max(0, round(rhF)), rear: Math.max(0, round(rhR)) };

  /* ---------- anti-roll bars */
  let [arbF, arbR] = DT_ARB[dt];
  const stiff = car.cat === 'formula' || car.cat === 'gr1' || car.cat === 'gr2' ? 1 : car.cat === 'road' ? -1 : 0;
  arbF += stiff; arbR += stiff;
  arbF -= Math.round(style); arbR += Math.round(style);
  if (profile.bumps > 0.6) { arbF -= 1; arbR -= 1; }
  if (wet) { arbF -= 1; arbR -= 1; }
  if (offroad) { arbF = 3; arbR = dt === 'FF' ? 5 : 4; }
  if (drift) { arbF = 7; arbR = 4; }
  if (drag) { arbF = 2; arbR = 2; }
  const arb = { front: clamp(arbF, 1, 10), rear: clamp(arbR, 1, 10) };

  /* ---------- dampers */
  let comp = base.comp - 6 * profile.bumps + 2;
  let exp = base.exp - 4 * profile.bumps + 2;
  if (wet) { comp -= 2; exp -= 3; }
  if (offroad) { comp = 25; exp = 34; }
  const compression = { front: round(clamp(comp, 20, 40)), rear: round(clamp(comp + 2, 20, 40)) };
  const expansion = { front: round(clamp(exp, 30, 50)), rear: round(clamp(exp + 2 + style * 2, 30, 50)) };
  if (drift) Object.assign(compression, { front: 35, rear: 25 }), Object.assign(expansion, { front: 45, rear: 32 });
  if (drag) Object.assign(compression, { front: 40, rear: 20 }), Object.assign(expansion, { front: 30, rear: 50 });

  /* ---------- alignment */
  let camF = base.camF, camR = base.camR;
  if (profile.downforce > 0.6) { camF += 0.3; camR += 0.2; }
  if (profile.isOval) { camF -= 0.4; camR -= 0.3; }
  if (endurance) { camF -= 0.4; camR -= 0.3; }
  if (wet) { camF -= 0.5; camR -= 0.4; }
  if (offroad) { camF = 1.0; camR = 0.5; }
  if (drift) { camF = 4.5; camR = 0.6; }
  if (drag) { camF = 0; camR = 0; }
  const camber = { front: r2(clamp(round(camF, 0.1), 0, 6)), rear: r2(clamp(round(camR, 0.1), 0, 6)) };

  let toeF = dt === 'FF' ? 0 : -0.05;
  let toeR = dt === 'FF' ? -0.05 : dt === 'RR' || dt === 'MR' ? 0.2 : dt === '4WD' ? 0.12 : 0.15;
  toeR -= 0.05 * style;
  if (offroad) { toeF = 0; toeR = dt === 'FF' ? 0 : 0.1; }
  if (drift) { toeF = -0.2; toeR = 0.3; }
  if (drag) { toeF = 0; toeR = 0; }
  const toe = { front: r2(toeF), rear: r2(toeR) };

  notes.push({
    area: 'Alignment',
    text: `${camber.front.toFixed(1)}° / ${camber.rear.toFixed(1)}° negative camber${endurance ? ' (reduced to save tyre wear)' : ''}${wet ? ' (reduced for a bigger wet contact patch)' : ''}. ${toe.rear > 0 ? `Rear toe-in of ${toe.rear.toFixed(2)}° keeps the ${dt} rear planted on power.` : 'A touch of rear toe-out helps this front-driver rotate.'}`,
  });

  /* ---------- differential */
  const powerLock = clamp(Math.round(34 - (hpPerTon - 200) / 30), 15, 40);
  let lsdFront: LsdUnit | null = null;
  let lsdRear: LsdUnit | null = null;
  let torqueSplit: number | null = null;

  if (dt === 'FF') {
    lsdFront = { initial: 8, accel: clamp(Math.round(powerLock * 0.7), 10, 30), braking: 8 };
  } else if (dt === '4WD') {
    lsdFront = { initial: 8, accel: 15, braking: 10 };
    lsdRear = { initial: 12, accel: powerLock, braking: 20 };
    torqueSplit = clamp(Math.round(30 + 6 * -style), 20, 45);
  } else {
    lsdRear = { initial: dt === 'MR' || dt === 'RR' ? 12 : 10, accel: powerLock, braking: dt === 'RR' ? 25 : 20 };
  }
  if (lsdRear) lsdRear.braking = clamp(lsdRear.braking - Math.round(4 * style), 5, 60);
  if (wet) {
    if (lsdFront) lsdFront.accel = Math.max(5, lsdFront.accel - 5);
    if (lsdRear) { lsdRear.accel = Math.max(5, lsdRear.accel - 6); lsdRear.initial = Math.max(5, lsdRear.initial - 2); }
    if (torqueSplit !== null) torqueSplit = Math.min(50, torqueSplit + 8);
  }
  if (offroad) {
    if (lsdFront) Object.assign(lsdFront, { initial: 12, accel: 25, braking: 12 });
    if (lsdRear) Object.assign(lsdRear, { initial: 15, accel: 40, braking: 25 });
    if (torqueSplit !== null) torqueSplit = 40;
  }
  if (drift) {
    if (lsdRear) Object.assign(lsdRear, { initial: 40, accel: 60, braking: 45 });
    if (lsdFront) Object.assign(lsdFront, dt === 'FF' ? { initial: 30, accel: 50, braking: 20 } : { initial: 10, accel: 20, braking: 10 });
    if (torqueSplit !== null) torqueSplit = 10;
    if (dt === 'FF') warnings.push('Front-wheel-drive cars cannot hold a powered drift — expect handbrake/lift-off slides only.');
  }
  if (drag) {
    if (lsdRear) Object.assign(lsdRear, { initial: 25, accel: 60, braking: 5 });
    if (lsdFront) Object.assign(lsdFront, { initial: 20, accel: 50, braking: 5 });
    if (torqueSplit !== null) torqueSplit = 45;
  }
  notes.push({
    area: 'Differential',
    text:
      drift ? 'High locking front-to-back keeps both rear wheels spinning together for long, controllable angle.'
      : dt === 'FF' ? 'Low initial torque keeps the front pointing into corners; moderate acceleration lock limits inside-wheel spin on exit.'
      : `Acceleration lock of ${(lsdRear ?? lsdFront)!.accel} balances traction against power-on understeer for ${Math.round(hpPerTon)} hp/tonne${torqueSplit !== null ? `; a ${torqueSplit}:${100 - torqueSplit} split lets the rear help rotate the car` : ''}.`,
  });

  /* ---------- aero */
  let aero: Pair | null = null;
  if (base.aero || car.cat === 'road') {
    let d = profile.downforce;
    if (wet) d += 0.2;
    if (offroad) d = 0.45;
    if (drift) d = 0.25;
    if (drag) d = 0;
    if (endurance) d -= 0.03;
    const rearBias = dt === 'FF' ? 0.0 : dt === '4WD' ? 0.05 : 0.1;
    const f = clamp(d - 0.05 * -style, 0, 1);
    const r = clamp(d + rearBias + 0.05 * -style, 0, 1);
    aero = { front: round(f * 100, 5), rear: round(r * 100, 5) };
    notes.push({
      area: 'Aero',
      text: `${profile.speedClass} layout (${profile.cornersPerKm} turns/km, longest straight ${track.straight} m): run ${aero.front}% / ${aero.rear}% of the available downforce range${car.cat === 'road' ? ' — only applies once a custom wing or aero kit is fitted' : ''}.`,
    });
  }

  /* ---------- transmission */
  const cda = base.cda + (aero ? 0.25 * ((aero.front + aero.rear) / 200) : 0);
  const vmax = terminalSpeed(race.hp, race.kg, cda);
  const distance = drag ? race.dragDistance : track.straight;
  const entry = drag ? 0 : clamp(70 + 30 * (1 - profile.downforce) + 0.02 * track.straight, 70, 220);
  const straightSpeed = Math.round(drag ? accelerate(race.hp, race.kg, cda, distance, 0, 1.15) : accelerate(race.hp, race.kg, cda, distance, entry));
  let topSpeed: number | null = Math.round(Math.min(vmax * 1.03, straightSpeed * 1.05 + 5) / 5) * 5;
  if (car.asp === 'EV') {
    topSpeed = null;
    warnings.push('Electric cars use a single fixed reduction gear in GT7 — the transmission cannot be re-geared.');
  } else {
    notes.push({
      area: 'Gearing',
      text: `This car should reach about ${straightSpeed} km/h at the end of the ${drag ? `${distance} m strip` : `longest straight (${track.straight} m)`}. Setting top speed to ${topSpeed} km/h uses every gear without hitting the limiter early.`,
    });
  }

  /* ---------- brakes, power, aids */
  let brakeBalance = dt === 'FF' ? 1 : dt === 'RR' ? -1 : 0;
  if (wet) brakeBalance -= 1;
  brakeBalance += Math.round(style);
  if (drift) brakeBalance = 1;
  brakeBalance = clamp(brakeBalance, -5, 5);

  let tcs = 0;
  const twitchy = dt === 'FR' || dt === 'RR' || dt === 'MR';
  if (twitchy && hpPerTon > 450) tcs = 1;
  if (twitchy && hpPerTon > 650) tcs = 2;
  if (wet) tcs += twitchy ? 2 : 1;
  if (offroad) tcs = Math.max(tcs, 1);
  if (drift || drag) tcs = 0;
  tcs = clamp(tcs, 0, 5);

  /* ---------- sanity warnings */
  if (offroad && (base.slicks && car.cat !== 'grb' && car.cat !== 'race')) warnings.push(`${labelCat(car.cat)} cars are built for tarmac — GT7 events on ${track.surface} usually require a rally (Gr.B) or road car.`);
  if (offroad && (car.cat === 'formula' || car.cat === 'kart')) warnings.push('This car cannot realistically be driven on this surface.');
  if (wet && !track.rain) warnings.push('GT7 does not offer rain at this track — the wet setup is shown for reference only.');
  if (drag && !/Route X/.test(track.name)) warnings.push('Drag runs are best done on Special Stage Route X.');
  if (car.cat === 'kart') warnings.push('Racing karts expose very few settings in GT7 — apply the values that are available.');
  if (car.cat !== 'road' && car.cat !== 'kart') notes.push({ area: 'Regulations', text: 'In Sport Mode / BoP races many of these settings are locked — use this sheet for Custom Races, Lobbies and Time Trials.' });

  return {
    profile,
    tyreFront,
    tyreRear,
    rideHeight,
    arb,
    compression,
    expansion,
    frequency,
    camber,
    toe,
    lsdFront,
    lsdRear,
    torqueSplit,
    aero,
    topSpeed,
    straightSpeed,
    brakeBalance,
    ecu: 100,
    tcs,
    notes,
    warnings,
  };
}

export function labelCat(cat: CarCategory): string {
  return ({
    road: 'road car', race: 'race car', gr4: 'Gr.4', gr3: 'Gr.3', gr2: 'Gr.2', gr1: 'Gr.1',
    grb: 'Gr.B rally', formula: 'formula', kart: 'kart',
  } as const)[cat];
}

export const CATEGORY_LABEL: Record<CarCategory, string> = {
  road: 'Road', race: 'Race', gr4: 'Gr.4', gr3: 'Gr.3', gr2: 'Gr.2', gr1: 'Gr.1', grb: 'Gr.B', formula: 'Formula', kart: 'Kart',
};
