import { useMemo, useState, type ReactNode } from 'react';
import type { Car, RaceOptions, Track } from '../types';
import { SERIES_BY_ID } from '../lib/events';
import { computeSetup, type LsdUnit, type Setup } from '../lib/tuning';
import { actions, useUnits, type Units } from '../lib/store';
import { TYRE_NAME } from '../lib/tyres';
import { GROUP_LABEL } from './CarPicker';
import { CarImage } from './CarImage';
import { TrackMap } from './TrackMap';
import { Flag, fmtKm } from './common';
import { IconBack, IconCheck, IconCopy, IconLink, IconLock, IconPrint, IconSave, IconWarn } from './Icons';

const RACE_LABEL: Record<RaceOptions['type'], string> = {
  'time-trial': 'Time trial', sprint: 'Sprint race', endurance: 'Endurance', drift: 'Drift', drag: 'Drag',
};

export const fmtToe = (v: number) => (v === 0 ? '0.00°' : `${Math.abs(v).toFixed(2)}° ${v > 0 ? 'in' : 'out'}`);
export const fmtBrake = (v: number) => (v === 0 ? 'Neutral' : `${Math.abs(v)} step${Math.abs(v) > 1 ? 's' : ''} to the ${v < 0 ? 'front' : 'rear'}`);
const fmtPos = (v: number) => (v === 0 ? '0 (centre)' : `${v > 0 ? '+' : ''}${v} (${v < 0 ? 'front' : 'rear'})`);

interface Props {
  car: Car;
  track: Track;
  race: RaceOptions;
  onBack: () => void;
  onRestart: () => void;
}

export function SetupSheet({ car, track, race, onBack, onRestart }: Props) {
  const s = useMemo(() => computeSetup(car, track, race), [car, track, race]);
  const u = useUnits();
  const series = race.event.series ? SERIES_BY_ID.get(race.event.series) : undefined;
  const [toast, setToast] = useState('');
  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2000);
  };
  const copy = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(msg);
    } catch {
      flash('Copy failed — select and copy manually');
    }
  };
  const save = () => {
    const def = `${car.name} · ${track.layout === 'Full Course' ? track.venue : track.name}`;
    const name = prompt('Name this setup', def);
    if (name === null) return;
    actions.saveSetup({
      name: name.trim() || def,
      hash: location.hash,
      carId: car.id,
      trackId: track.id,
      summary: `${series?.name ?? RACE_LABEL[race.type]}${race.event.ppLimit ? ` · ${race.event.ppLimit} PP` : ''}${race.event.laps ? ` · ${race.event.laps} laps` : ''} · ${TYRE_NAME[s.tyreRear]}`,
    });
    flash('Saved to your garage');
  };
  const L = s.locked;

  return (
    <section className="page sheet">
      <div className="sheet-hero">
        <div className="sheet-car"><CarImage car={car} /></div>
        <div className="sheet-title">
          <p className="eyebrow">Recommended setup</p>
          <h2>{car.name}</h2>
          <p className="sheet-maker"><Flag code={car.country} /> {car.maker} · {GROUP_LABEL[car.group]} · {car.dt} · {u.power(s.effHp)} · {u.weight(s.effKg)}</p>
          <div className="sheet-chips">
            {series && <span className="chip on">{series.name}</span>}
            <span className="chip">{RACE_LABEL[race.type]}</span>
            {race.event.laps ? <span className="chip">{race.event.laps} laps</span> : null}
            {race.event.ppLimit ? <span className="chip">≤ {race.event.ppLimit} PP</span> : null}
            <span className="chip">{race.weather === 'wet' ? 'Wet' : 'Dry'}</span>
            <span className="chip">{race.style < 0 ? 'Stable' : race.style > 0 ? 'Agile' : 'Balanced'} handling</span>
          </div>
        </div>
        <div className="sheet-track">
          <TrackMap track={track} animate strokeWidth={14} />
          <div>
            <strong>{track.name}</strong>
            <small><Flag code={track.country} title={track.countryName} /> {track.region} · {fmtKm(track.length)} · {track.turns} turns · {s.profile.speedClass}</small>
          </div>
        </div>
      </div>

      <div className="sheet-actions">
        <button type="button" className="btn" onClick={onBack}><IconBack /> Edit event</button>
        <div className="spacer" />
        <button type="button" className="btn" onClick={save}><IconSave /> Save</button>
        <button type="button" className="btn" onClick={() => copy(sheetText(car, track, race, s, u), 'Setup copied')}><IconCopy /> Copy</button>
        <button type="button" className="btn" onClick={() => copy(location.href, 'Link copied')}><IconLink /> Share</button>
        <button type="button" className="btn" onClick={() => window.print()}><IconPrint /> Print</button>
        <button type="button" className="btn btn-primary" onClick={onRestart}>New setup</button>
      </div>

      {s.warnings.length > 0 && (
        <div className="warnings">
          {s.warnings.map((w) => <p key={w}><IconWarn /> {w}</p>)}
        </div>
      )}

      <div className="sheet-grid">
        {(s.ppPlan || race.event.ppLimit === undefined) && <PPPanel s={s} u={u} />}
        {s.strategy && <StrategyPanel s={s} laps={race.event.laps!} />}

        <Panel title="Suspension" subtitle="Fully Customisable Suspension" wide locked={L}>
          <Table>
            <Row label="Body height" unit="mm above min." f={s.rideHeight.front} r={s.rideHeight.rear} min={0} max={60} />
            <Row label="Anti-roll bar" f={s.arb.front} r={s.arb.rear} min={1} max={10} />
            <Row label="Damping ratio (compression)" unit="%" f={s.compression.front} r={s.compression.rear} min={20} max={40} />
            <Row label="Damping ratio (expansion)" unit="%" f={s.expansion.front} r={s.expansion.rear} min={30} max={50} />
            <Row label="Natural frequency" unit="Hz" f={s.frequency.front.toFixed(2)} r={s.frequency.rear.toFixed(2)} min={1} max={6} raw={[s.frequency.front, s.frequency.rear]} />
            <Row label="Negative camber angle" unit="°" f={s.camber.front.toFixed(1)} r={s.camber.rear.toFixed(1)} min={0} max={6} raw={[s.camber.front, s.camber.rear]} />
            <Row label="Toe angle" f={fmtToe(s.toe.front)} r={fmtToe(s.toe.rear)} />
          </Table>
        </Panel>

        <Panel title="Differential" subtitle={s.torqueSplit !== null ? 'LSD + torque-vectoring centre diff' : 'Fully Customisable LSD'} locked={L}>
          <Table>
            <Row label="Initial torque" f={lsd(s.lsdFront, 'initial')} r={lsd(s.lsdRear, 'initial')} />
            <Row label="Acceleration sensitivity" f={lsd(s.lsdFront, 'accel')} r={lsd(s.lsdRear, 'accel')} />
            <Row label="Braking sensitivity" f={lsd(s.lsdFront, 'braking')} r={lsd(s.lsdRear, 'braking')} />
          </Table>
          {s.torqueSplit !== null && (
            <div className="split">
              <div className="split-label"><span>Front : rear torque</span><b>{s.torqueSplit} : {100 - s.torqueSplit}</b></div>
              <div className="split-bar"><i style={{ width: `${s.torqueSplit}%` }} /></div>
            </div>
          )}
        </Panel>

        <Panel title="Aerodynamics" subtitle={s.aero ? 'Share of the car’s downforce range' : undefined} locked={L}>
          {s.aero ? (
            <Table>
              <Row label="Downforce" unit="%" f={s.aero.front} r={s.aero.rear} min={0} max={100} />
            </Table>
          ) : (
            <p className="muted">No adjustable aero on this car.</p>
          )}
          {s.aero && <p className="hint">Downforce adds PP — trim it first if you are a few PP over a limit.</p>}
        </Panel>

        <Panel title="ECU & performance adjustment" locked={L}>
          <Table head={false}>
            <Row label="ECU output" single="100%" />
            <Row label="Power restrictor" single={s.restrictor < 100 ? `${s.restrictor}%` : '100% (off)'} />
            <Row label="Ballast" single={s.ballast ? u.weight(s.ballast) : 'None'} />
            {s.ballast > 0 && <Row label="Ballast position" single={fmtPos(s.ballastPos)} />}
          </Table>
        </Panel>

        <Panel title="Transmission" subtitle={s.topSpeed ? 'Fully Customisable Transmission' : undefined} locked={L}>
          {s.topSpeed ? (
            <div className="big-stat">
              <span>Top speed (auto-adjusts the gears)</span>
              <b>{u.speedNum(s.topSpeed)}<small> {u.speedUnit}</small></b>
              <em>≈ {u.speed(s.straightSpeed)} at the end of {race.type === 'drag' ? 'the run' : 'the longest straight'}. Hitting the limiter early? Add 5–10. Gears too long out of slow corners? Take 5 off.</em>
            </div>
          ) : (
            <p className="muted">Single-speed electric drive — nothing to gear.</p>
          )}
        </Panel>

        <Panel title="Tyres, brakes & assists" locked={false}>
          <Table>
            <Row label="Tyres" f={TYRE_NAME[s.tyreFront]} r={TYRE_NAME[s.tyreRear]} />
          </Table>
          <div className="brake">
            <div className="split-label"><span>Brake balance</span><b>{fmtBrake(s.brakeBalance)}</b></div>
            <div className="brake-scale">
              {Array.from({ length: 11 }, (_, i) => i - 5).map((v) => <i key={v} className={v === s.brakeBalance ? 'on' : v === 0 ? 'mid' : ''} />)}
            </div>
            <div className="range-labels"><span>Front</span><span>Rear</span></div>
          </div>
          <Table head={false}>
            <Row label="Traction control (TCS)" single={String(s.tcs)} />
            <Row label="Active stability (ASM)" single={race.type === 'drift' ? 'Off' : 'Off (On while learning)'} />
            <Row label="ABS" single="Default" />
          </Table>
        </Panel>

        <Panel title="Track profile">
          <Gauge label="Downforce demand" value={s.profile.downforce} text={s.profile.speedClass} />
          <Gauge label="Bumpiness" value={s.profile.bumps} text={s.profile.bumps > 0.6 ? 'Rough' : s.profile.bumps > 0.35 ? 'Moderate' : 'Smooth'} />
          <Gauge label="Corner density" value={Math.min(1, s.profile.cornersPerKm / 6)} text={`${s.profile.cornersPerKm} per km`} />
          <p className="hint">Longest straight {track.straight.toLocaleString()} m · elevation change {track.elevation} m</p>
        </Panel>

        {s.parts.length > 0 && <PartsPanel parts={s.parts} />}

        <Panel title="Engineer's notes" wide>
          <ul className="notes">
            {s.notes.map((n, i) => <li key={n.area + i}><b>{n.area}</b>{n.text}</li>)}
          </ul>
        </Panel>

        <Panel title="Fine-tuning guide" wide>
          <div className="guide">
            {GUIDE.map(([symptom, fix]) => (
              <div key={symptom} className="guide-row"><b>{symptom}</b><span>{fix}</span></div>
            ))}
          </div>
        </Panel>
      </div>

      <p className="disclaimer">
        A starting point calculated from the car's drivetrain, weight balance, power-to-weight, the track's layout and the event's rules. “Above min.” and “%”
        values are relative to each car's own range on the GT7 Settings screen. Apply it, run three laps, then refine with the guide.
      </p>

      {toast && <div className="toast" role="status">{toast}</div>}
    </section>
  );
}

/* ------------------------------------------------------------------ panels */

function PPPanel({ s, u }: { s: Setup; u: Units }) {
  const p = s.ppPlan;
  const est = s.ppEstimate;
  const srcText = est.source === 'user' ? 'as entered from the game' : est.source === 'measured' ? 'measured stock value' : est.source === 'scaled' ? 'stock value scaled for your upgrades' : 'estimated';
  if (!p) {
    return (
      <Panel title="Performance Points" subtitle={`On ${TYRE_NAME[s.ppTyre]}`} wide>
        <div className="pp-wrap">
          <div className="pp-big"><b>{est.source === 'user' ? '' : '≈ '}{est.value}</b><span>PP · {srcText}</span></div>
          <p className="hint pp-hint">No PP limit set. If the event has one, add it on the Event step and you'll get the exact power-restrictor or ballast setting to fit under it — plus how to use any spare PP.</p>
        </div>
      </Panel>
    );
  }
  const max = Math.max(p.limit, p.current) * 1.06;
  return (
    <Panel title="Performance Points" subtitle={`Limit ${p.limit} PP · current figure on ${TYRE_NAME[s.ppTyre]}`} wide>
      <div className="pp-wrap">
        <div>
          <div className="pp-big">
            <b>{est.source === 'user' ? '' : '≈ '}{p.current}</b>
            <span>PP · {srcText}</span>
          </div>
          <div className="pp-bar" aria-hidden="true">
            <i className={p.delta > 0 ? 'over' : ''} style={{ width: `${(p.current / max) * 100}%` }} />
            <em style={{ left: `${(p.limit / max) * 100}%` }} />
          </div>
          <p className={`pp-status ${p.delta > 0 ? 'over' : 'under'}`}>
            {p.delta > 0 ? `${p.delta} PP over the limit` : p.delta === 0 ? 'Exactly on the limit' : `${-p.delta} PP under the limit`}
          </p>
        </div>
        <ul className="pp-options">
          {p.options.map((o) => (
            <li key={o.title} className={o.recommended ? 'rec' : ''}>
              <div>
                <b>{o.title}{o.kind === 'ballast' && s.ballastPos !== 0 && o.recommended ? ` · position ${fmtPos(s.ballastPos)}` : ''}</b>
                <span>{o.detail}</span>
              </div>
              <em>{o.kind === 'power' ? `→ ${o.resultPP}` : `≈ ${o.resultPP}`} PP{o.recommended ? <i>Recommended</i> : null}</em>
            </li>
          ))}
          {p.options.length === 0 && <li><div><b>Out of reach</b><span>Restrictor and ballast cannot remove this much PP — choose a slower car.</span></div></li>}
        </ul>
      </div>
      {(s.restrictor < 100 || s.ballast > 0 || s.ppPlan?.tyre) && (
        <p className="hint">The rest of this sheet assumes the recommended option: {u.power(s.effHp)}, {u.weight(s.effKg)}{s.ppPlan?.tyre ? `, ${TYRE_NAME[s.ppPlan.tyre]}` : ''}. PP moves live on the GT7 settings screen — fine-tune the restrictor 1% at a time.</p>
      )}
    </Panel>
  );
}

function StrategyPanel({ s, laps }: { s: Setup; laps: number }) {
  const st = s.strategy!;
  return (
    <Panel title="Race strategy" subtitle={`${laps} laps`} wide>
      <div className="strategy">
        <dl className="strategy-stats">
          <div><dt>Fuel per lap</dt><dd>{st.fuelPerLap ? `${st.fuelPerLap.toFixed(1)} %` : 'Off'}</dd></div>
          <div><dt>Laps per tank</dt><dd>{Number.isFinite(st.fuelLaps) ? st.fuelLaps : '∞'}</dd></div>
          <div><dt>Tyre life</dt><dd>{Number.isFinite(st.tyreLaps) ? `${st.tyreLaps} laps` : 'No wear'}</dd></div>
          <div><dt>Pit stops</dt><dd>{st.stops}</dd></div>
        </dl>
        <ol className="stints">
          {st.stints.map((x, i) => (
            <li key={i}>
              <span className="stint-n">Stint {i + 1}</span>
              <span className="stint-laps">Laps {x.from}–{x.to}</span>
              <span className="stint-detail">{i === 0 ? `Start with ${x.fuel}% fuel` : `Pit: ${x.fuel}% fuel + fresh ${TYRE_NAME[x.tyre]}`}</span>
            </li>
          ))}
        </ol>
      </div>
      {st.fuelMapTip && <p className="hint">{st.fuelMapTip}</p>}
      <p className="hint">{st.fuelEstimated ? 'Fuel use is estimated — after one lap, check the fuel gauge and adjust. ' : ''}Tyre life is a rule of thumb for this compound and wear rate; watch the tyre temperature/wear display and pit before it turns red.</p>
    </Panel>
  );
}

function PartsPanel({ parts }: { parts: Setup['parts'] }) {
  const [have, setHave] = useState<Set<string>>(new Set());
  return (
    <Panel title="Parts checklist" subtitle="Buy these in the Tuning Shop before applying the sheet" wide>
      <ul className="parts">
        {parts.map((p) => {
          const on = have.has(p.name);
          return (
            <li key={p.name}>
              <label>
                <input type="checkbox" checked={on} onChange={() => setHave((h) => { const n = new Set(h); if (on) n.delete(p.name); else n.add(p.name); return n; })} />
                <span className="check">{on && <IconCheck />}</span>
                <span><b>{p.name}</b><small>{p.why}</small></span>
              </label>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

const lsd = (x: LsdUnit | null, k: keyof LsdUnit) => (x ? x[k] : '—');

function Panel({ title, subtitle, wide, locked, children }: { title: string; subtitle?: string; wide?: boolean; locked?: boolean; children: ReactNode }) {
  return (
    <section className={`panel ${wide ? 'wide' : ''} ${locked ? 'locked' : ''}`}>
      <header>
        <h3>{title}</h3>
        {locked ? <span className="lock"><IconLock /> Locked by BoP</span> : subtitle && <span>{subtitle}</span>}
      </header>
      {children}
    </section>
  );
}

function Table({ children, head = true }: { children: ReactNode; head?: boolean }) {
  return (
    <div className="tbl">
      {head && <div className="tbl-head"><span /><span>Front</span><span>Rear</span></div>}
      {children}
    </div>
  );
}

function Row({
  label, unit, f, r, min, max, raw, single,
}: {
  label: string; unit?: string; f?: ReactNode; r?: ReactNode; min?: number; max?: number;
  raw?: [number | undefined, number | undefined]; single?: string;
}) {
  const pos = (v: unknown) => (min === undefined || max === undefined || typeof v !== 'number' ? null : Math.max(0, Math.min(1, (v - min) / (max - min))));
  if (single !== undefined) {
    return (
      <div className="tbl-row single">
        <span className="tbl-label">{label}</span>
        <span className="val">{single}</span>
      </div>
    );
  }
  return (
    <div className="tbl-row">
      <span className="tbl-label">{label}{unit && <small> {unit}</small>}</span>
      <Cell v={f} p={pos(raw ? raw[0] : f)} />
      <Cell v={r} p={pos(raw ? raw[1] : r)} />
    </div>
  );
}

function Cell({ v, p }: { v: ReactNode; p: number | null }) {
  return (
    <span className="val">
      {v}
      {p !== null && <i className="meter"><i style={{ width: `${p * 100}%` }} /></i>}
    </span>
  );
}

function Gauge({ label, value, text }: { label: string; value: number; text: string }) {
  return (
    <div className="gauge">
      <div className="split-label"><span>{label}</span><b>{text}</b></div>
      <div className="gauge-bar"><i style={{ width: `${Math.round(value * 100)}%` }} /></div>
    </div>
  );
}

const GUIDE: [string, string][] = [
  ['Understeer on corner entry', 'Soften the front anti-roll bar 1 step, or lower front LSD braking sensitivity by 5.'],
  ['Understeer mid-corner', 'Add 0.2–0.3° front camber, or 5% more front downforce.'],
  ['Understeer on exit (power on)', 'Lower acceleration sensitivity by 5; on 4WD shift torque 5% rearward.'],
  ['Oversteer on entry / under braking', 'Raise LSD braking sensitivity by 5, or move brake balance 1 step forward.'],
  ['Snap oversteer on exit', 'Soften the rear anti-roll bar 1 step, add 0.05° rear toe-in, or 1 more TCS.'],
  ['Bottoming out / unsettled on kerbs', 'Raise body height 5 mm and drop compression damping 2–3%.'],
  ['Lazy direction changes', 'Raise natural frequency 0.2 Hz at both ends and expansion damping 2–3%.'],
  ['Limiter before the braking zone', 'Raise the top-speed setting 5–10 km/h.'],
  ['A few PP over the limit', 'Trim downforce or 1% restrictor at a time — the PP figure updates live.'],
  ['Tyres overheating late in a stint', 'Remove 0.3° camber, soften the anti-roll bars 1 step, or step to a harder compound.'],
];

function sheetText(car: Car, track: Track, race: RaceOptions, s: Setup, u: Units): string {
  const fr = (a: unknown, b: unknown) => `F ${a} | R ${b}`;
  const series = race.event.series ? SERIES_BY_ID.get(race.event.series)?.name : undefined;
  const lines = [
    `GT7 Tuning Lab — ${car.maker} ${car.name}`,
    `${track.name} · ${series ?? RACE_LABEL[race.type]}${race.event.ppLimit ? ` · ≤${race.event.ppLimit} PP` : ''}${race.event.laps ? ` · ${race.event.laps} laps` : ''} · ${race.weather}`,
    '',
    `Tyres: ${fr(TYRE_NAME[s.tyreFront], TYRE_NAME[s.tyreRear])}`,
    `Body height (mm above min): ${fr(s.rideHeight.front, s.rideHeight.rear)}`,
    `Anti-roll bar: ${fr(s.arb.front, s.arb.rear)}`,
    `Damping compression %: ${fr(s.compression.front, s.compression.rear)}`,
    `Damping expansion %: ${fr(s.expansion.front, s.expansion.rear)}`,
    `Natural frequency Hz: ${fr(s.frequency.front.toFixed(2), s.frequency.rear.toFixed(2))}`,
    `Negative camber °: ${fr(s.camber.front.toFixed(1), s.camber.rear.toFixed(1))}`,
    `Toe: ${fr(fmtToe(s.toe.front), fmtToe(s.toe.rear))}`,
    `LSD initial: ${fr(lsd(s.lsdFront, 'initial'), lsd(s.lsdRear, 'initial'))}`,
    `LSD acceleration: ${fr(lsd(s.lsdFront, 'accel'), lsd(s.lsdRear, 'accel'))}`,
    `LSD braking: ${fr(lsd(s.lsdFront, 'braking'), lsd(s.lsdRear, 'braking'))}`,
  ];
  if (s.torqueSplit !== null) lines.push(`Torque distribution: ${s.torqueSplit}:${100 - s.torqueSplit}`);
  if (s.aero) lines.push(`Downforce (% of range): ${fr(s.aero.front, s.aero.rear)}`);
  if (s.restrictor < 100) lines.push(`Power restrictor: ${s.restrictor}%`);
  if (s.ballast) lines.push(`Ballast: ${u.weight(s.ballast)} at ${fmtPos(s.ballastPos)}`);
  if (s.topSpeed) lines.push(`Transmission top speed: ${u.speed(s.topSpeed)}`);
  lines.push(`Brake balance: ${fmtBrake(s.brakeBalance)}`, `TCS: ${s.tcs}`);
  if (s.strategy && s.strategy.stops > 0) lines.push(`Strategy: ${s.strategy.stops} stop(s) — ${s.strategy.stints.map((x) => `L${x.from}-${x.to}`).join(', ')}`);
  lines.push('', location.href);
  return lines.join('\n');
}
