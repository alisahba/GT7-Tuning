import { useMemo, useState, type ReactNode } from 'react';
import type { Car, EventRules, RaceOptions, RaceType, Track, TyreCode } from '../types';
import { EVENT_SERIES, SERIES_BY_ID, checkEligibility, seriesForTrack, type EventSeries } from '../lib/events';
import { computeSetup } from '../lib/tuning';
import type { RouteState } from '../lib/route';
import { useUnits } from '../lib/store';
import { TYRES, TYRE_NAME } from '../lib/tyres';
import { CarImage } from './CarImage';
import { TrackMap } from './TrackMap';
import { NumberField, Seg, fmtKm } from './common';
import { IconArrow, IconBolt, IconCheck, IconDrift, IconFlag, IconFuel, IconRain, IconReset, IconStopwatch, IconSun, IconWarn } from './Icons';

const RACES: { type: RaceType; title: string; text: string; icon: ReactNode }[] = [
  { type: 'time-trial', title: 'Time trial', text: 'One perfect lap', icon: <IconStopwatch /> },
  { type: 'sprint', title: 'Sprint race', text: 'Short race in traffic', icon: <IconFlag /> },
  { type: 'endurance', title: 'Endurance', text: 'Tyre & fuel friendly', icon: <IconFuel /> },
  { type: 'drift', title: 'Drift', text: 'Angle and control', icon: <IconDrift /> },
  { type: 'drag', title: 'Drag', text: 'Straight-line launch', icon: <IconBolt /> },
];

type Mode = 'track' | 'series' | 'custom';

interface Props {
  car: Car;
  track: Track;
  route: RouteState;
  race: RaceOptions;
  onChange: (next: RouteState) => void;
  onSubmit: () => void;
  onChangeCar: () => void;
  onChangeTrack: () => void;
}

export function RacePicker({ car, track, route, race, onChange, onSubmit, onChangeCar, onChangeTrack }: Props) {
  const u = useUnits();
  const atTrack = useMemo(() => seriesForTrack(track.id), [track.id]);
  const series = route.event.series ? SERIES_BY_ID.get(route.event.series) : undefined;
  const [mode, setMode] = useState<Mode>(series ? (atTrack.some((a) => a.series.id === series.id) ? 'track' : 'series') : atTrack.length ? 'track' : 'custom');
  const setup = useMemo(() => computeSetup(car, track, race), [car, track, race]);
  const elig = checkEligibility(car, series);
  const ev = route.event;

  const patch = (p: Partial<RouteState>) => onChange({ ...route, ...p });
  const setEvent = (p: Partial<EventRules>) => patch({ event: { ...ev, ...p } });
  const applySeries = (s: EventSeries, laps?: number, ppLimit?: number) =>
    patch({
      race: s.raceType,
      event: { ...ev, series: s.id, laps: laps ?? s.laps, ppLimit: ppLimit ?? s.ppLimit, tyre: s.tyre, bop: undefined },
    });
  const clearSeries = () => patch({ event: { currentPP: ev.currentPP } });

  const modified = race.hp !== car.hp || race.kg !== car.kg;
  const styleLabel = route.style <= -0.5 ? 'Stable' : route.style >= 0.5 ? 'Agile' : route.style < 0 ? 'Leaning stable' : route.style > 0 ? 'Leaning agile' : 'Balanced';
  const pp = setup.ppPlan;

  return (
    <section className="page event-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Step 3 of 4</p>
          <h2 className="page-title">Set up the event</h2>
          <p className="page-sub">Pick a GT7 event or enter the regulations yourself — PP limit, laps, tyres and multipliers all shape the setup.</p>
        </div>
      </header>

      <div className="event-layout">
        <div className="event-main">
          {/* ------------------------------------------------ event choice */}
          <section className="card">
            <header className="card-head">
              <h3>Event</h3>
              <Seg
                size="sm"
                label="Event source"
                value={mode}
                onChange={(m) => { setMode(m); if (m === 'custom') clearSeries(); }}
                options={[
                  { value: 'track', label: <>At this track <span className="seg-count">{atTrack.length}</span></> },
                  { value: 'series', label: 'All series' },
                  { value: 'custom', label: 'Custom' },
                ]}
              />
            </header>

            {mode === 'track' && (
              atTrack.length ? (
                <div className="event-list">
                  {atTrack.map(({ series: s, round }) => {
                    const on = ev.series === s.id && ev.laps === round.laps;
                    const ok = checkEligibility(car, s).ok;
                    return (
                      <button key={s.id + round.laps} type="button" className={`event-row ${on ? 'on' : ''}`} onClick={() => applySeries(s, round.laps, round.ppLimit)}>
                        <span className="event-name">{s.name}<small>{s.restriction}{round.note ? ` · ${round.note}` : ''}</small></span>
                        <span className="event-meta">{round.ppLimit ?? s.ppLimit ? <b>{round.ppLimit ?? s.ppLimit} PP</b> : <b>No PP limit</b>}<small>{round.laps} {round.laps === 1 ? 'lap' : 'laps'}</small></span>
                        <span className={`elig ${ok ? 'ok' : 'no'}`} title={ok ? 'Your car is eligible' : 'Your car is not eligible'}>{ok ? <IconCheck /> : <IconWarn />}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="muted">No catalogued events at {track.name} yet. Choose a series or enter the regulations under <b>Custom</b>.</p>
              )
            )}

            {mode === 'series' && (
              <div className="series-grid">
                {EVENT_SERIES.map((s) => {
                  const ok = checkEligibility(car, s).ok;
                  return (
                    <button key={s.id} type="button" className={`series-card ${ev.series === s.id ? 'on' : ''}`} onClick={() => applySeries(s)}>
                      <span className="series-level">{s.level}</span>
                      <strong>{s.name}</strong>
                      <span>{s.restriction}</span>
                      <span className="series-foot">
                        <b>{s.ppLimit ? `${s.ppLimit} PP` : 'No PP limit'}</b>
                        <span className={`elig ${ok ? 'ok' : 'no'}`}>{ok ? <IconCheck /> : <IconWarn />}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {mode === 'custom' && <p className="muted">Enter the event's regulations below — copy them from the event's <b>Regulations</b> screen in GT7.</p>}

            {series && (
              <div className={`eligibility ${elig.ok ? 'ok' : 'no'}`}>
                {elig.ok ? <IconCheck /> : <IconWarn />}
                <div>
                  <b>{series.name}</b> — {elig.ok ? `your ${car.name} is eligible.` : 'your car is not eligible:'}
                  {!elig.ok && <ul>{elig.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
                </div>
              </div>
            )}
          </section>

          {/* ------------------------------------------------ regulations */}
          <section className="card">
            <header className="card-head"><h3>Regulations</h3><span className="muted small">Leave blank if the event has none</span></header>
            <div className="field-grid">
              <NumberField label="Max PP" value={ev.ppLimit} min={100} max={1500} placeholder="None" onChange={(v) => setEvent({ ppLimit: v })} hint="Performance Points limit" />
              <NumberField label="Laps" value={ev.laps} min={1} max={200} placeholder="—" onChange={(v) => setEvent({ laps: v })} />
              <label className="field">
                <span className="field-label">Required tyres</span>
                <span className="field-box">
                  <select value={ev.tyre ?? ''} onChange={(e) => setEvent({ tyre: (e.target.value || undefined) as TyreCode | undefined })}>
                    <option value="">Any</option>
                    {TYRES.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
                  </select>
                </span>
              </label>
              <NumberField label="Fuel use" value={ev.fuelMult} min={0} max={20} unit="×" placeholder="1" onChange={(v) => setEvent({ fuelMult: v })} />
              <NumberField label="Tyre wear" value={ev.wearMult} min={0} max={50} unit="×" placeholder="1" onChange={(v) => setEvent({ wearMult: v })} />
              <label className="field">
                <span className="field-label">Balance of Performance</span>
                <span className="field-box toggle-box">
                  <label className="toggle">
                    <input type="checkbox" checked={!!ev.bop} onChange={(e) => setEvent({ bop: e.target.checked || undefined })} />
                    <span className="toggle-ui" />
                    {ev.bop ? 'On (settings locked)' : 'Off'}
                  </label>
                </span>
              </label>
            </div>
          </section>

          {/* ------------------------------------------------ race type */}
          <section className="card">
            <header className="card-head"><h3>Race type</h3></header>
            <div className="race-grid">
              {RACES.map((r) => (
                <button key={r.type} type="button" className={`race-card ${route.race === r.type ? 'on' : ''}`} onClick={() => patch({ race: r.type })} aria-pressed={route.race === r.type}>
                  <span className="race-icon">{r.icon}</span>
                  <strong>{r.title}</strong>
                  <span>{r.text}</span>
                </button>
              ))}
            </div>
            {route.race === 'drag' && (
              <div className="inline-opt">
                <span>Distance</span>
                <Seg size="sm" label="Drag distance" value={route.drag} onChange={(drag) => patch({ drag })} options={[{ value: 402, label: '¼ mile' }, { value: 1000, label: '1,000 m' }]} />
              </div>
            )}
          </section>

          {/* ------------------------------------------------ conditions */}
          <section className="card two-col">
            <div>
              <header className="card-head"><h3>Conditions</h3></header>
              <Seg
                label="Weather"
                value={route.weather}
                onChange={(weather) => patch({ weather })}
                options={[{ value: 'dry', label: <><IconSun /> Dry</> }, { value: 'wet', label: <><IconRain /> Wet</> }]}
              />
              {!track.rain && route.weather === 'wet' && <p className="hint warn">GT7 has no rain at this track.</p>}
              {track.surface !== 'tarmac' && <p className="hint">Surface: <b>{track.surface === 'mixed' ? 'tarmac & dirt' : track.surface}</b> — a rally setup is applied automatically.</p>}
            </div>
            <div>
              <header className="card-head"><h3>Handling</h3><span className="pill">{styleLabel}</span></header>
              <input className="range" type="range" min={-1} max={1} step={0.5} value={route.style} onChange={(e) => patch({ style: Number(e.target.value) })} aria-label="Handling preference" />
              <div className="range-labels"><span>Stable</span><span>Balanced</span><span>Agile</span></div>
            </div>
          </section>

          {/* ------------------------------------------------ car spec */}
          <section className="card">
            <header className="card-head">
              <h3>Your car as built</h3>
              {(modified || ev.currentPP) && (
                <button type="button" className="text-btn" onClick={() => patch({ hp: undefined, kg: undefined, event: { ...ev, currentPP: undefined } })}><IconReset /> Reset to stock</button>
              )}
            </header>
            <div className="field-grid">
              <NumberField label="Power" unit={u.powerUnit} value={u.powerNum(race.hp)} min={10} max={3000}
                onChange={(v) => { const hp = v ? Math.round(u.powerFrom(v)) : car.hp; patch({ hp: hp === car.hp ? undefined : hp }); }} />
              <NumberField label="Weight" unit={u.weightUnit} value={u.weightNum(race.kg)} min={100} max={4000}
                onChange={(v) => { const kg = v ? Math.round(u.weightFrom(v)) : car.kg; patch({ kg: kg === car.kg ? undefined : kg }); }} />
              <NumberField label="PP shown in game" value={ev.currentPP} min={50} max={1500} placeholder={`≈ ${setup.ppEstimate.source === 'user' ? '' : setup.ppEstimate.value}`}
                onChange={(v) => setEvent({ currentPP: v })} hint="Optional — makes the PP plan exact" />
            </div>
            <p className="hint">
              Stock: {u.power(car.hp)} · {u.weight(car.kg)} · {car.dt} · {car.front}:{100 - car.front} weight split. Update after engine or weight-reduction upgrades;
              entering the in-game PP (on {TYRE_NAME[setup.ppTyre]}) makes the PP plan exact.
            </p>
          </section>
        </div>

        {/* ------------------------------------------------ summary */}
        <aside className="event-aside">
          <div className="summary">
            <button type="button" className="summary-car" onClick={onChangeCar}>
              <CarImage car={car} />
              <span><small>{car.maker}</small><b>{car.name}</b></span>
            </button>
            <button type="button" className="summary-track" onClick={onChangeTrack}>
              <span className="summary-map"><TrackMap track={track} strokeWidth={16} /></span>
              <span><small>{track.venue}</small><b>{track.layout}</b><em>{fmtKm(track.length)} · {track.turns} turns</em></span>
            </button>
            <dl className="summary-list">
              <div><dt>Event</dt><dd>{series?.name ?? 'Custom'}</dd></div>
              <div><dt>Tyres</dt><dd>{TYRE_NAME[setup.tyreRear]}</dd></div>
              <div><dt>PP</dt><dd>{setup.ppEstimate.source === 'user' ? '' : '≈ '}{setup.ppEstimate.value}{ev.ppLimit ? ` / ${ev.ppLimit}` : ''}</dd></div>
              {pp && (
                <div className={pp.delta > 0 ? 'over' : 'under'}>
                  <dt>{pp.delta > 0 ? 'Over limit' : 'Headroom'}</dt>
                  <dd>{Math.abs(pp.delta)} PP{pp.delta > 0 && (pp.restrictor < 100 || pp.ballast > 0) ? ` → ${[pp.restrictor < 100 && `${pp.restrictor}%`, pp.ballast > 0 && `${pp.ballast} kg`].filter(Boolean).join(' + ')}` : ''}</dd>
                </div>
              )}
              {setup.strategy && <div><dt>Pit stops</dt><dd>{setup.strategy.stops === 0 ? 'None' : setup.strategy.stops}</dd></div>}
              {series && <div className={elig.ok ? 'under' : 'over'}><dt>Eligible</dt><dd>{elig.ok ? 'Yes' : 'No'}</dd></div>}
            </dl>
            <button type="button" className="btn btn-primary btn-block" onClick={onSubmit}>
              Generate setup <IconArrow />
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
