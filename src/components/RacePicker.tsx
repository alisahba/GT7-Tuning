import type { ReactNode } from 'react';
import type { Car, RaceType, Track, Weather } from '../types';
import { CarImage } from './CarImage';
import { TrackMap } from './TrackMap';
import { fmtKm } from './common';
import { IconArrow, IconBolt, IconDrift, IconFlag, IconFuel, IconRain, IconReset, IconStopwatch, IconSun } from './Icons';

const RACES: { type: RaceType; title: string; text: string; icon: ReactNode }[] = [
  { type: 'time-trial', title: 'Time Trial', text: 'One perfect lap. Softest tyres, maximum grip, no compromise.', icon: <IconStopwatch /> },
  { type: 'sprint', title: 'Sprint Race', text: 'Short race in traffic. Fast but forgiving and consistent.', icon: <IconFlag /> },
  { type: 'endurance', title: 'Endurance', text: 'Long stints. Kind to tyres and fuel, stable over many laps.', icon: <IconFuel /> },
  { type: 'drift', title: 'Drift', text: 'Angle and smoke. Locked diff, steering lock and slide control.', icon: <IconDrift /> },
  { type: 'drag', title: 'Drag', text: 'Straight-line launch. Weight transfer and traction off the line.', icon: <IconBolt /> },
];

export interface RaceForm {
  race: RaceType;
  weather: Weather;
  style: number;
  hp: number;
  kg: number;
  drag: number;
}

interface Props {
  car: Car;
  track: Track;
  value: RaceForm;
  onChange: (patch: Partial<RaceForm>) => void;
  onSubmit: () => void;
  onChangeCar: () => void;
  onChangeTrack: () => void;
}

export function RacePicker({ car, track, value, onChange, onSubmit, onChangeCar, onChangeTrack }: Props) {
  const styleLabel = value.style <= -0.5 ? 'Stable' : value.style >= 0.5 ? 'Agile' : value.style < 0 ? 'Leaning stable' : value.style > 0 ? 'Leaning agile' : 'Balanced';
  const modified = value.hp !== car.hp || value.kg !== car.kg;
  return (
    <section className="picker race-step">
      <h2 className="step-title"><span>03</span> Set up the race</h2>
      <p className="step-sub">Tell us what you're entering and how the car is built — the setup adapts to all of it.</p>

      <div className="matchup">
        <button type="button" className="matchup-card" onClick={onChangeCar}>
          <CarImage car={car} />
          <div>
            <small>{car.maker}</small>
            <strong>{car.name}</strong>
            <em>Change car</em>
          </div>
        </button>
        <div className="vs">×</div>
        <button type="button" className="matchup-card track" onClick={onChangeTrack}>
          <div className="matchup-map"><TrackMap track={track} /></div>
          <div>
            <small>{track.venue}</small>
            <strong>{track.layout}</strong>
            <em>{fmtKm(track.length)} · {track.turns} turns · Change track</em>
          </div>
        </button>
      </div>

      <h3 className="group-title">Race type</h3>
      <div className="race-grid">
        {RACES.map((r) => (
          <button key={r.type} type="button" className={`race-card ${value.race === r.type ? 'active' : ''}`} onClick={() => onChange({ race: r.type })} aria-pressed={value.race === r.type}>
            <span className="race-icon">{r.icon}</span>
            <strong>{r.title}</strong>
            <span>{r.text}</span>
          </button>
        ))}
      </div>

      <div className="option-grid">
        <div className="option">
          <h3 className="group-title">Conditions</h3>
          <div className="seg">
            <button type="button" className={value.weather === 'dry' ? 'on' : ''} onClick={() => onChange({ weather: 'dry' })}><IconSun /> Dry</button>
            <button type="button" className={value.weather === 'wet' ? 'on' : ''} onClick={() => onChange({ weather: 'wet' })}><IconRain /> Wet</button>
          </div>
          {!track.rain && value.weather === 'wet' && <p className="hint warn">GT7 has no rain at this track.</p>}
          {track.surface !== 'tarmac' && <p className="hint">Surface: <b>{track.surface === 'mixed' ? 'tarmac & dirt' : track.surface}</b> — a rally setup is applied automatically.</p>}
        </div>

        <div className="option">
          <h3 className="group-title">Handling preference <b className="pill">{styleLabel}</b></h3>
          <input
            className="range"
            type="range"
            min={-1}
            max={1}
            step={0.5}
            value={value.style}
            onChange={(e) => onChange({ style: Number(e.target.value) })}
            aria-label="Handling preference"
          />
          <div className="range-labels"><span>Stable / safe</span><span>Balanced</span><span>Agile / pointy</span></div>
        </div>

        <div className="option">
          <h3 className="group-title">
            Your car's current spec
            {modified && (
              <button type="button" className="link-btn" onClick={() => onChange({ hp: car.hp, kg: car.kg })}><IconReset /> Stock</button>
            )}
          </h3>
          <div className="spec-inputs">
            <label>
              <span>Power</span>
              <input type="number" min={10} max={3000} value={value.hp} onChange={(e) => onChange({ hp: Math.max(10, Number(e.target.value) || car.hp) })} />
              <em>hp</em>
            </label>
            <label>
              <span>Weight</span>
              <input type="number" min={100} max={4000} value={value.kg} onChange={(e) => onChange({ kg: Math.max(100, Number(e.target.value) || car.kg) })} />
              <em>kg</em>
            </label>
          </div>
          <p className="hint">Stock: {car.hp} hp · {car.kg} kg · {car.dt} · {car.front}:{100 - car.front} weight split. Update after engine or weight-reduction upgrades.</p>
        </div>

        {value.race === 'drag' && (
          <div className="option">
            <h3 className="group-title">Drag distance</h3>
            <div className="seg">
              {[402, 1000].map((d) => (
                <button key={d} type="button" className={value.drag === d ? 'on' : ''} onClick={() => onChange({ drag: d })}>{d === 402 ? '¼ mile' : '1,000 m'}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="cta-row">
        <button type="button" className="btn-primary big" onClick={onSubmit}>
          Generate tuning setup <IconArrow />
        </button>
      </div>
    </section>
  );
}
