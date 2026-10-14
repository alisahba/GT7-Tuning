import { describe, expect, it } from 'vitest';
import { CARS, CAR_BY_ID, TRACKS, TRACK_BY_ID } from './data';
import { accelerate, computeSetup, profileTrack, type Setup } from './tuning';
import type { Car, RaceOptions, RaceType, Track } from '../types';

const RACES: RaceType[] = ['time-trial', 'sprint', 'endurance', 'drift', 'drag'];
const opts = (car: Car, type: RaceType = 'sprint', extra: Partial<RaceOptions> = {}): RaceOptions => ({
  type, weather: 'dry', style: 0, hp: car.hp, kg: car.kg, dragDistance: 402, ...extra,
});

function expectLegal(s: Setup) {
  const pairs = (p: { front: number; rear: number }, lo: number, hi: number) => {
    expect(p.front).toBeGreaterThanOrEqual(lo);
    expect(p.front).toBeLessThanOrEqual(hi);
    expect(p.rear).toBeGreaterThanOrEqual(lo);
    expect(p.rear).toBeLessThanOrEqual(hi);
  };
  pairs(s.arb, 1, 10);
  pairs(s.compression, 20, 40);
  pairs(s.expansion, 30, 50);
  pairs(s.camber, 0, 6);
  pairs(s.toe, -1, 1);
  pairs(s.frequency, 1, 6);
  pairs(s.rideHeight, 0, 80);
  if (s.aero) pairs(s.aero, 0, 100);
  for (const u of [s.lsdFront, s.lsdRear]) {
    if (!u) continue;
    for (const v of [u.initial, u.accel, u.braking]) {
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThanOrEqual(60);
    }
  }
  if (s.torqueSplit !== null) {
    expect(s.torqueSplit).toBeGreaterThanOrEqual(5);
    expect(s.torqueSplit).toBeLessThanOrEqual(50);
  }
  expect(Math.abs(s.brakeBalance)).toBeLessThanOrEqual(5);
  expect(s.tcs).toBeGreaterThanOrEqual(0);
  expect(s.tcs).toBeLessThanOrEqual(5);
  if (s.topSpeed !== null) {
    expect(s.topSpeed).toBeGreaterThan(40);
    expect(s.topSpeed).toBeLessThan(700);
  }
  for (const n of Object.values(s)) if (typeof n === 'number') expect(Number.isFinite(n)).toBe(true);
}

describe('data', () => {
  it('has every car and track with the fields the tuner needs', () => {
    expect(CARS.length).toBeGreaterThan(500);
    expect(TRACKS.length).toBe(121);
    for (const c of CARS) {
      expect(['FF', 'FR', 'MR', 'RR', '4WD']).toContain(c.dt);
      expect(c.hp).toBeGreaterThan(0);
      expect(c.kg).toBeGreaterThan(100);
      expect(c.front).toBeGreaterThan(20);
      expect(c.front).toBeLessThan(80);
    }
    for (const t of TRACKS) {
      expect(t.map?.d.startsWith('M')).toBe(true);
      expect(t.length).toBeGreaterThan(500);
    }
    expect(new Set(TRACKS.map((t) => t.id)).size).toBe(TRACKS.length);
  });
});

describe('computeSetup', () => {
  const sampleTracks = ['6e378b', '12ceac', 'd93f3a', 'f18da2', '795ed4', '40e254', 'ef3232'].map((id) => TRACK_BY_ID.get(id)!);
  const sampleCars = [205, 3224, 3313, 2149, 1370, 3475, 2060, 3390, 3232, 3600].map((id) => CAR_BY_ID.get(id)!);

  it('stays inside GT7 setting ranges for every car', () => {
    for (const car of CARS) for (const track of sampleTracks.slice(0, 3)) expectLegal(computeSetup(car, track, opts(car)));
  });

  it('stays inside GT7 setting ranges for every track, race type and weather', () => {
    for (const track of TRACKS)
      for (const car of sampleCars)
        for (const type of RACES)
          for (const weather of ['dry', 'wet'] as const)
            for (const style of [-1, 1]) expectLegal(computeSetup(car, track, opts(car, type, { weather, style })));
  });

  it('uses rally setups and tyres off-tarmac', () => {
    const car = CAR_BY_ID.get(3232)!; // WRX Gr.B
    const s = computeSetup(car, TRACK_BY_ID.get('795ed4')!, opts(car)); // Fishermans Ranch
    expect(s.tyreFront).toBe('Dirt');
    expect(s.rideHeight.front).toBeGreaterThanOrEqual(45);
    const snow = computeSetup(car, TRACK_BY_ID.get('40e254')!, opts(car));
    expect(snow.tyreFront).toBe('Snow');
  });

  it('runs less downforce at Monza than at Tsukuba', () => {
    const car = CAR_BY_ID.get(3224)!;
    const monza = computeSetup(car, TRACK_BY_ID.get('e6817f')!, opts(car));
    const tsukuba = computeSetup(car, TRACK_BY_ID.get('f18da2')!, opts(car));
    expect(monza.aero!.front).toBeLessThan(tsukuba.aero!.front);
    expect(monza.topSpeed!).toBeGreaterThan(tsukuba.topSpeed!);
  });

  it('softens the car in the wet', () => {
    const car = CAR_BY_ID.get(3224)!;
    const t = TRACK_BY_ID.get('3c4be1')!;
    const dry = computeSetup(car, t, opts(car));
    const wet = computeSetup(car, t, opts(car, 'sprint', { weather: 'wet' }));
    expect(wet.frequency.front).toBeLessThan(dry.frequency.front);
    expect(wet.tyreFront).toBe('Intermediate');
    expect(wet.tcs).toBeGreaterThan(dry.tcs);
  });

  it('locks the diff for drifting', () => {
    const car = CAR_BY_ID.get(205)!;
    const s = computeSetup(car, TRACK_BY_ID.get('6e378b')!, opts(car, 'drift'));
    expect(s.lsdRear!.accel).toBe(60);
    expect(s.camber.front).toBeGreaterThan(4);
  });

  it('does not offer gearing for electric cars', () => {
    const car = CAR_BY_ID.get(3390)!; // Taycan
    expect(computeSetup(car, TRACK_BY_ID.get('6e378b')!, opts(car)).topSpeed).toBeNull();
  });

  it('respects upgraded power', () => {
    const car = CAR_BY_ID.get(205)!;
    const t = TRACK_BY_ID.get('e6817f')!;
    const stock = computeSetup(car, t, opts(car));
    const tuned = computeSetup(car, t, opts(car, 'sprint', { hp: 550 }));
    expect(tuned.topSpeed!).toBeGreaterThan(stock.topSpeed!);
  });
});

describe('physics helpers', () => {
  it('produces plausible speeds', () => {
    // ~280 hp, 1270 kg road car: 400 m from a standstill ≈ 160–190 km/h.
    const v = accelerate(280, 1270, 0.7, 402, 0);
    expect(v).toBeGreaterThan(150);
    expect(v).toBeLessThan(200);
  });

  it('classifies well-known tracks', () => {
    const p = (id: string) => profileTrack(TRACK_BY_ID.get(id) as Track);
    expect(p('e6817f').speedClass).toBe('High-speed');
    expect(p('f18da2').speedClass).toBe('Technical');
    expect(p('12ceac').bumps).toBeGreaterThan(0.8);
    expect(p('d93f3a').isOval).toBe(true);
  });
});
