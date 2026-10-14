import { useMemo, useState, type ReactNode } from 'react';
import type { Car, RaceOptions, Track } from '../types';
import { CATEGORY_LABEL, computeSetup, type LsdUnit, type Setup } from '../lib/tuning';
import { CarImage } from './CarImage';
import { TrackMap } from './TrackMap';
import { Flag, fmtKm } from './common';
import { IconBack, IconCopy, IconLink, IconPrint, IconWarn } from './Icons';

const RACE_LABEL: Record<RaceOptions['type'], string> = {
  'time-trial': 'Time Trial', sprint: 'Sprint Race', endurance: 'Endurance', drift: 'Drift', drag: 'Drag',
};

export const fmtToe = (v: number) => (v === 0 ? '0.00°' : `${Math.abs(v).toFixed(2)}° ${v > 0 ? 'in' : 'out'}`);
export const fmtBrake = (v: number) => (v === 0 ? 'Neutral' : `${Math.abs(v)} step${Math.abs(v) > 1 ? 's' : ''} → ${v < 0 ? 'front' : 'rear'}`);

interface Props {
  car: Car;
  track: Track;
  race: RaceOptions;
  onBack: () => void;
  onRestart: () => void;
}

export function SetupSheet({ car, track, race, onBack, onRestart }: Props) {
  const s = useMemo(() => computeSetup(car, track, race), [car, track, race]);
  const [toast, setToast] = useState('');
  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 1800);
  };
  const copy = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(msg);
    } catch {
      flash('Copy failed — select and copy manually');
    }
  };

  return (
    <section className="sheet">
      <div className="sheet-hero">
        <div className="sheet-car">
          <CarImage car={car} />
        </div>
        <div className="sheet-title">
          <p className="eyebrow">Recommended setup</p>
          <h2>{car.name}</h2>
          <p className="sheet-maker"><Flag code={car.country} /> {car.maker} · {CATEGORY_LABEL[car.cat]} · {car.dt} · {race.hp} hp · {race.kg} kg</p>
          <div className="sheet-chips">
            <span className="chip on">{RACE_LABEL[race.type]}</span>
            <span className="chip">{race.weather === 'wet' ? 'Wet' : 'Dry'}</span>
            <span className="chip">{race.style < 0 ? 'Stable' : race.style > 0 ? 'Agile' : 'Balanced'} handling</span>
          </div>
        </div>
        <div className="sheet-track">
          <TrackMap track={track} animate />
          <div>
            <strong>{track.name}</strong>
            <small><Flag code={track.country} title={track.countryName} /> {fmtKm(track.length)} · {track.turns} turns · {s.profile.speedClass}</small>
          </div>
        </div>
      </div>

      <div className="sheet-actions">
        <button type="button" className="btn-ghost" onClick={onBack}><IconBack /> Race options</button>
        <div className="spacer" />
        <button type="button" className="btn-ghost" onClick={() => copy(sheetText(car, track, race, s), 'Setup copied to clipboard')}><IconCopy /> Copy</button>
        <button type="button" className="btn-ghost" onClick={() => copy(location.href, 'Link copied')}><IconLink /> Share link</button>
        <button type="button" className="btn-ghost" onClick={() => window.print()}><IconPrint /> Print</button>
        <button type="button" className="btn-primary" onClick={onRestart}>New setup</button>
      </div>

      {s.warnings.length > 0 && (
        <div className="warnings">
          {s.warnings.map((w) => <p key={w}><IconWarn /> {w}</p>)}
        </div>
      )}

      <div className="sheet-grid">
        <Panel title="Suspension" subtitle="Fully Customisable Suspension" wide>
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

        <Panel title="Differential" subtitle={s.torqueSplit !== null ? 'Fully Customisable LSD + Torque-Vectoring Centre Diff' : 'Fully Customisable LSD'}>
          <Table>
            <Row label="Initial torque" f={lsd(s.lsdFront, 'initial')} r={lsd(s.lsdRear, 'initial')} min={5} max={60} raw={[s.lsdFront?.initial, s.lsdRear?.initial]} />
            <Row label="Acceleration sensitivity" f={lsd(s.lsdFront, 'accel')} r={lsd(s.lsdRear, 'accel')} min={5} max={60} raw={[s.lsdFront?.accel, s.lsdRear?.accel]} />
            <Row label="Braking sensitivity" f={lsd(s.lsdFront, 'braking')} r={lsd(s.lsdRear, 'braking')} min={5} max={60} raw={[s.lsdFront?.braking, s.lsdRear?.braking]} />
          </Table>
          {s.torqueSplit !== null && (
            <div className="split">
              <div className="split-label"><span>Front/rear torque distribution</span><b>{s.torqueSplit} : {100 - s.torqueSplit}</b></div>
              <div className="split-bar"><i style={{ width: `${s.torqueSplit}%` }} /></div>
            </div>
          )}
        </Panel>

        <Panel title="Aerodynamics" subtitle={s.aero ? 'Share of the car’s downforce range' : undefined}>
          {s.aero ? (
            <Table>
              <Row label="Downforce" unit="%" f={s.aero.front} r={s.aero.rear} min={0} max={100} />
            </Table>
          ) : (
            <p className="muted">No adjustable aero on this car.</p>
          )}
        </Panel>

        <Panel title="Transmission" subtitle={s.topSpeed ? 'Fully Customisable Transmission' : undefined}>
          {s.topSpeed ? (
            <div className="big-stat">
              <span>Top speed setting</span>
              <b>{s.topSpeed}<small> km/h</small></b>
              <em>≈ {s.straightSpeed} km/h at the end of {race.type === 'drag' ? 'the run' : 'the longest straight'}. If you hit the limiter early, add 5–10 km/h; if a gear feels too long out of slow corners, take 5 off.</em>
            </div>
          ) : (
            <p className="muted">Single-speed electric drive — nothing to gear.</p>
          )}
        </Panel>

        <Panel title="Tyres">
          <Table>
            <Row label="Compound" f={s.tyreFront} r={s.tyreRear} />
          </Table>
        </Panel>

        <Panel title="Brakes, power & assists">
          <div className="brake">
            <div className="split-label"><span>Brake balance</span><b>{fmtBrake(s.brakeBalance)}</b></div>
            <div className="brake-scale">
              {Array.from({ length: 11 }, (_, i) => i - 5).map((v) => (
                <i key={v} className={v === s.brakeBalance ? 'on' : v === 0 ? 'mid' : ''} />
              ))}
            </div>
            <div className="range-labels"><span>Front</span><span>Rear</span></div>
          </div>
          <Table head={false}>
            <Row label="Power restrictor / ECU output" single={`${s.ecu}%`} />
            <Row label="Ballast" single="0 kg" />
            <Row label="Traction control (TCS)" single={String(s.tcs)} />
            <Row label="Active stability (ASM)" single={race.type === 'drift' ? 'Off' : 'Off (On while learning)'} />
          </Table>
        </Panel>

        <Panel title="Track profile">
          <Gauge label="Downforce demand" value={s.profile.downforce} text={s.profile.speedClass} />
          <Gauge label="Bumpiness" value={s.profile.bumps} text={s.profile.bumps > 0.6 ? 'Rough' : s.profile.bumps > 0.35 ? 'Moderate' : 'Smooth'} />
          <Gauge label="Corner density" value={Math.min(1, s.profile.cornersPerKm / 6)} text={`${s.profile.cornersPerKm} / km`} />
          <p className="muted small">Longest straight {track.straight.toLocaleString()} m · elevation change {track.elevation} m</p>
        </Panel>

        <Panel title="Engineer's notes" wide>
          <ul className="notes">
            {s.notes.map((n) => <li key={n.area}><b>{n.area}</b>{n.text}</li>)}
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
        Starting point generated from the car's drivetrain, weight balance, power-to-weight and the track's layout data. Values marked “above min.” and “%” are relative to each car's own range in the GT7 Settings screen. Apply, run 3 laps, then refine with the guide above.
      </p>

      {toast && <div className="toast" role="status">{toast}</div>}
    </section>
  );
}

const lsd = (u: LsdUnit | null, k: keyof LsdUnit) => (u ? u[k] : '—');

function Panel({ title, subtitle, wide, children }: { title: string; subtitle?: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`panel ${wide ? 'wide' : ''}`}>
      <header>
        <h3>{title}</h3>
        {subtitle && <span>{subtitle}</span>}
      </header>
      {children}
    </div>
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
  const pf = pos(raw ? raw[0] : f);
  const pr = pos(raw ? raw[1] : r);
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
      <Cell v={f} p={pf} />
      <Cell v={r} p={pr} />
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
  ['Understeer on corner entry', 'Soften front anti-roll bar 1 step, or lower front LSD braking sensitivity by 5.'],
  ['Understeer mid-corner', 'Add 0.2–0.3° front camber, or add 5% front downforce.'],
  ['Understeer on exit (power on)', 'Lower acceleration sensitivity by 5, or (4WD) shift torque 5% rearward.'],
  ['Oversteer on entry / under braking', 'Raise LSD braking sensitivity by 5, or move brake balance 1 step to the front.'],
  ['Snap oversteer on exit', 'Soften rear anti-roll bar 1 step, add 0.05° rear toe-in, or add 1 TCS level.'],
  ['Car bottoms out / unsettled on kerbs', 'Raise body height 5 mm and drop compression damping 2–3%.'],
  ['Lazy, slow direction changes', 'Raise natural frequency 0.2 Hz both ends and expansion damping 2–3%.'],
  ['Hitting the rev limiter before braking', 'Raise top speed setting by 5–10 km/h.'],
];

function sheetText(car: Car, track: Track, race: RaceOptions, s: Setup): string {
  const fr = (a: unknown, b: unknown) => `F ${a} | R ${b}`;
  const lines = [
    `GT7 Tuning Lab — ${car.maker} ${car.name}`,
    `${track.name} · ${RACE_LABEL[race.type]} · ${race.weather} · ${race.hp} hp / ${race.kg} kg`,
    '',
    `Tyres: ${fr(s.tyreFront, s.tyreRear)}`,
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
  if (s.topSpeed) lines.push(`Transmission top speed: ${s.topSpeed} km/h`);
  lines.push(`Brake balance: ${fmtBrake(s.brakeBalance)}`, `ECU output: ${s.ecu}%`, `TCS: ${s.tcs}`, '', location.href);
  return lines.join('\n');
}
