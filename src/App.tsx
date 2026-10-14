import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RaceOptions } from './types';
import { CAR_BY_ID, CARS, TRACK_BY_ID, TRACKS } from './lib/data';
import { DEFAULT_ROUTE, parseHash, toHash, type RouteState, type Step } from './lib/route';
import { actions, useStore } from './lib/store';
import { CarPicker } from './components/CarPicker';
import { TrackPicker } from './components/TrackPicker';
import { RacePicker } from './components/RacePicker';
import { SetupSheet } from './components/SetupSheet';
import { Garage } from './components/Garage';
import { SettingsMenu } from './components/SettingsMenu';
import { TrackMap } from './components/TrackMap';
import { IconCheck, IconGarage } from './components/Icons';

const STEPS: { id: Exclude<Step, 'garage'>; label: string }[] = [
  { id: 'car', label: 'Car' },
  { id: 'track', label: 'Track' },
  { id: 'race', label: 'Event' },
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
    if (hash !== location.hash) {
      if (replace) history.replaceState(null, '', hash);
      else history.pushState(null, '', hash);
    }
    setRoute(next);
  }, []);
  return [route, go] as const;
}

function useTheme() {
  const theme = useStore((s) => s.settings.theme);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);
}

export default function App() {
  useTheme();
  const [route, go] = useRoute();
  const savedCount = useStore((s) => s.saved.length);
  const car = route.car !== undefined ? CAR_BY_ID.get(route.car) : undefined;
  const track = route.track ? TRACK_BY_ID.get(route.track) : undefined;

  // Never land on a step whose prerequisites are missing (e.g. a stale link).
  const step: Step =
    route.step === 'garage' ? 'garage' : !car ? 'car' : route.step === 'car' ? 'car' : !track ? 'track' : route.step;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const race: RaceOptions | null = useMemo(
    () =>
      car
        ? {
            type: route.race,
            weather: route.weather,
            style: route.style,
            hp: route.hp ?? car.hp,
            kg: route.kg ?? car.kg,
            dragDistance: route.drag,
            event: route.event,
          }
        : null,
    [car, route.race, route.weather, route.style, route.hp, route.kg, route.drag, route.event],
  );

  const reachable = (s: Step) => s === 'car' || (s === 'track' && !!car) || ((s === 'race' || s === 'setup') && !!car && !!track);
  const stepIndex = STEPS.findIndex((x) => x.id === step);

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#/" onClick={(e) => { e.preventDefault(); go(DEFAULT_ROUTE); }}>
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32"><path d="M5 22c3-9 8-13 13-11s5 7 9 5" /><circle cx="5" cy="22" r="2.4" /></svg>
          </span>
          <span className="brand-text">GT7 <em>Tuning Lab</em></span>
        </a>
        <nav className="stepper" aria-label="Progress">
          {STEPS.map((s, i) => {
            const done = stepIndex > i;
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
        <div className="top-actions">
          <button
            type="button"
            className={`icon-btn ${step === 'garage' ? 'on' : ''}`}
            onClick={() => go({ ...route, step: step === 'garage' ? (car ? (track ? 'race' : 'track') : 'car') : 'garage' })}
            aria-label="My garage"
            title="My garage — saved setups & favourites"
          >
            <IconGarage />
            <span className="icon-btn-label">Garage</span>
            {savedCount > 0 && <span className="badge">{savedCount}</span>}
          </button>
          <SettingsMenu />
        </div>
      </header>

      {step === 'car' && (
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Gran Turismo 7 · Setup companion</p>
            <h1>The right setup for every car, circuit and event.</h1>
            <p className="lede">
              Choose from {CARS.length} cars and {TRACKS.length} layouts, add the event's regulations and PP limit, and get a complete
              sheet — suspension, differential, aero, gearing, brakes, PP adjustment and pit strategy.
            </p>
          </div>
          <div className="hero-map" aria-hidden="true">
            <TrackMap track={HERO_TRACK} animate strokeWidth={12} />
            <span className="hero-map-caption">Suzuka Circuit · traced from an in-game lap</span>
          </div>
        </section>
      )}

      <main className="main">
        {step === 'garage' && (
          <Garage
            onOpen={(hash) => go(parseHash(hash))}
            onPickCar={(id) => go({ ...route, car: id, hp: undefined, kg: undefined, step: track ? 'race' : 'track' })}
          />
        )}
        {step === 'car' && (
          <CarPicker
            selected={car?.id}
            onPick={(c) => {
              actions.pushRecent(c.id);
              go({ ...route, car: c.id, hp: undefined, kg: undefined, event: { ...route.event, currentPP: undefined }, step: track ? 'race' : 'track' });
            }}
          />
        )}
        {step === 'track' && car && (
          <TrackPicker
            car={car}
            selected={track?.id}
            onChangeCar={() => go({ ...route, step: 'car' })}
            onPick={(t) => go({ ...route, track: t.id, step: 'race' })}
          />
        )}
        {step === 'race' && car && track && race && (
          <RacePicker
            car={car}
            track={track}
            route={route}
            race={race}
            onChange={(next) => go(next, true)}
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
          A fan-made companion for Gran Turismo 7. Not affiliated with Sony Interactive Entertainment or Polyphony Digital; “Gran Turismo” is a
          registered trademark of SIE. Car data and stock PP: <a href="https://github.com/ddm999/gt7info" target="_blank" rel="noreferrer">gt7info</a>.
          Track maps: <a href="https://github.com/jbhoorasingh/gt7-datalogger-track-data" target="_blank" rel="noreferrer">gt7-datalogger-track-data</a> and{' '}
          <a href="https://github.com/zetetos/gt-telemetry" target="_blank" rel="noreferrer">gt-telemetry</a>. Fallback photos: Wikipedia / Wikimedia Commons.
        </p>
      </footer>
    </div>
  );
}
