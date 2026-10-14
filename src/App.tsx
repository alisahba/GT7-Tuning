import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RaceOptions } from './types';
import { CAR_BY_ID, CARS, TRACK_BY_ID, TRACKS } from './lib/data';
import { DEFAULT_ROUTE, parseHash, toHash, type RouteState, type Step } from './lib/route';
import { CarPicker } from './components/CarPicker';
import { TrackPicker } from './components/TrackPicker';
import { RacePicker } from './components/RacePicker';
import { SetupSheet } from './components/SetupSheet';
import { TrackMap } from './components/TrackMap';
import { IconCheck } from './components/Icons';

const STEPS: { id: Step; label: string }[] = [
  { id: 'car', label: 'Car' },
  { id: 'track', label: 'Track' },
  { id: 'race', label: 'Race' },
  { id: 'setup', label: 'Setup' },
];
const HERO_TRACK = TRACK_BY_ID.get('6e378b') ?? TRACKS[0]; // Suzuka

function useRoute() {
  const [route, setRoute] = useState<RouteState>(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const go = useCallback((next: RouteState, replace = false) => {
    const hash = toHash(next);
    if (hash === location.hash) return setRoute(next);
    if (replace) history.replaceState(null, '', hash);
    else history.pushState(null, '', hash);
    setRoute(next);
  }, []);
  return [route, go] as const;
}

export default function App() {
  const [route, go] = useRoute();
  const car = route.car !== undefined ? CAR_BY_ID.get(route.car) : undefined;
  const track = route.track ? TRACK_BY_ID.get(route.track) : undefined;

  // Never land on a step whose prerequisites are missing (e.g. a stale link).
  const step: Step = !car ? 'car' : route.step === 'car' ? 'car' : !track ? 'track' : route.step;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const race: RaceOptions | null = useMemo(
    () =>
      car
        ? { type: route.race, weather: route.weather, style: route.style, hp: route.hp ?? car.hp, kg: route.kg ?? car.kg, dragDistance: route.drag }
        : null,
    [car, route.race, route.weather, route.style, route.hp, route.kg, route.drag],
  );

  const reachable = (s: Step) => s === 'car' || (s === 'track' && !!car) || ((s === 'race' || s === 'setup') && !!car && !!track);

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#/" onClick={(e) => { e.preventDefault(); go(DEFAULT_ROUTE); }}>
          <span className="brand-mark">
            <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 44 Q20 16 34 22 T54 18" /><circle cx="10" cy="44" r="5" /></svg>
          </span>
          <span className="brand-text">GT7 <b>Tuning Lab</b></span>
        </a>
        <nav className="stepper" aria-label="Progress">
          {STEPS.map((s, i) => {
            const idx = STEPS.findIndex((x) => x.id === step);
            const done = i < idx;
            return (
              <button
                key={s.id}
                type="button"
                className={`step ${s.id === step ? 'current' : ''} ${done ? 'done' : ''}`}
                disabled={!reachable(s.id)}
                onClick={() => go({ ...route, step: s.id })}
                aria-current={s.id === step ? 'step' : undefined}
              >
                <span className="step-num">{done ? <IconCheck /> : i + 1}</span>
                <span className="step-label">{s.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {step === 'car' && (
        <div className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Gran Turismo 7 · PlayStation 5</p>
            <h1>Dial in the <span>perfect tune</span>.</h1>
            <p>Pick any of {CARS.length} cars, choose one of {TRACKS.length} track layouts and the race you're entering. Get a complete, ready-to-enter setup — suspension, differential, aero, gearing and brakes.</p>
          </div>
          <div className="hero-map" aria-hidden="true">
            <TrackMap track={HERO_TRACK} animate strokeWidth={16} />
          </div>
        </div>
      )}

      <main className="main">
        {step === 'car' && (
          <CarPicker
            selected={car?.id}
            onPick={(c) => go({ ...route, car: c.id, hp: undefined, kg: undefined, step: track ? 'race' : 'track' })}
          />
        )}
        {step === 'track' && car && (
          <>
            <SelectionBar carName={`${car.maker} ${car.name}`} onChange={() => go({ ...route, step: 'car' })} />
            <TrackPicker selected={track?.id} onPick={(t) => go({ ...route, track: t.id, step: 'race' })} />
          </>
        )}
        {step === 'race' && car && track && race && (
          <RacePicker
            car={car}
            track={track}
            value={{ race: route.race, weather: route.weather, style: route.style, hp: race.hp, kg: race.kg, drag: route.drag }}
            onChange={(p) =>
              go(
                {
                  ...route,
                  race: p.race ?? route.race,
                  weather: p.weather ?? route.weather,
                  style: p.style ?? route.style,
                  hp: p.hp !== undefined ? (p.hp === car.hp ? undefined : p.hp) : route.hp,
                  kg: p.kg !== undefined ? (p.kg === car.kg ? undefined : p.kg) : route.kg,
                  drag: p.drag ?? route.drag,
                },
                true,
              )
            }
            onSubmit={() => go({ ...route, step: 'setup' })}
            onChangeCar={() => go({ ...route, step: 'car' })}
            onChangeTrack={() => go({ ...route, step: 'track' })}
          />
        )}
        {step === 'setup' && car && track && race && (
          <SetupSheet
            car={car}
            track={track}
            race={race}
            onBack={() => go({ ...route, step: 'race' })}
            onRestart={() => go({ ...DEFAULT_ROUTE })}
          />
        )}
      </main>

      <footer className="footer">
        <p>
          Fan-made tool, not affiliated with Sony Interactive Entertainment or Polyphony Digital. “Gran Turismo” is a registered trademark of SIE.
          Car list: <a href="https://github.com/ddm999/gt7info" target="_blank" rel="noreferrer">gt7info</a> · Track maps: <a href="https://github.com/jbhoorasingh/gt7-datalogger-track-data" target="_blank" rel="noreferrer">gt7-datalogger-track-data</a> &amp; <a href="https://github.com/zetetos/gt-telemetry" target="_blank" rel="noreferrer">gt-telemetry</a> · Fallback photos: Wikipedia / Wikimedia Commons.
        </p>
      </footer>
    </div>
  );
}

function SelectionBar({ carName, onChange }: { carName: string; onChange: () => void }) {
  return (
    <div className="selection-bar">
      <span>Tuning for</span>
      <strong>{carName}</strong>
      <button type="button" className="link-btn" onClick={onChange}>Change</button>
    </div>
  );
}
