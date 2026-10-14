import { memo, useDeferredValue, useMemo, useState } from 'react';
import type { Car, CarGroup, Drivetrain, TyreCode } from '../types';
import { CAR_BY_ID, CARS, MAKERS } from '../lib/data';
import { estimatePP } from '../lib/pp';
import { actions, useStore, useUnits, type Units } from '../lib/store';
import { TYRE_NAME } from '../lib/tyres';
import { CarImage } from './CarImage';
import { Chips, Flag, SearchBox, useProgressive } from './common';
import { IconCheck, IconStar } from './Icons';

type Sort = 'maker' | 'power' | 'pw' | 'weight' | 'year' | 'pp';
type GroupFilter = 'all' | 'fav' | CarGroup;

export const GROUP_LABEL: Record<CarGroup, string> = { N: 'Road', '4': 'Gr.4', '3': 'Gr.3', '2': 'Gr.2', '1': 'Gr.1', B: 'Gr.B', X: 'Gr.X' };
const GROUPS: CarGroup[] = ['N', '4', '3', '2', '1', 'B', 'X'];
const DTS: ('all' | Drivetrain)[] = ['all', 'FF', 'FR', 'MR', 'RR', '4WD'];

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Typical tyre a car is listed on, used for the PP shown on cards. */
export const listTyre = (c: Car): TyreCode => (c.group === 'N' ? 'SM' : c.group === 'B' ? 'D' : 'RH');
const PP_CACHE = new Map<number, number>();
export const cardPP = (c: Car) => {
  if (!PP_CACHE.has(c.id)) PP_CACHE.set(c.id, estimatePP(c, c.hp, c.kg, listTyre(c)).value);
  return PP_CACHE.get(c.id)!;
};

export function CarPicker({ selected, onPick }: { selected?: number; onPick: (car: Car) => void }) {
  const [q, setQ] = useState('');
  const [maker, setMaker] = useState('all');
  const [group, setGroup] = useState<GroupFilter>('all');
  const [dt, setDt] = useState<'all' | Drivetrain>('all');
  const [sort, setSort] = useState<Sort>('maker');
  const query = useDeferredValue(q);
  const favourites = useStore((s) => s.favourites);
  const recent = useStore((s) => s.recent);
  const u = useUnits();
  const favSet = useMemo(() => new Set(favourites), [favourites]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: CARS.length, fav: favourites.length };
    for (const car of CARS) c[car.group] = (c[car.group] ?? 0) + 1;
    return c;
  }, [favourites]);

  const list = useMemo(() => {
    const words = norm(query).split(/\s+/).filter(Boolean);
    const out = CARS.filter((c) => {
      if (maker !== 'all' && c.maker !== maker) return false;
      if (group === 'fav' ? !favSet.has(c.id) : group !== 'all' && c.group !== group) return false;
      if (dt !== 'all' && c.dt !== dt) return false;
      const hay = norm(`${c.maker} ${c.name} ${GROUP_LABEL[c.group]} gr${c.group} ${c.dt}`);
      return words.every((w) => hay.includes(w));
    });
    const by: Record<Sort, (a: Car, b: Car) => number> = {
      maker: () => 0,
      power: (a, b) => b.hp - a.hp,
      pw: (a, b) => b.hp / b.kg - a.hp / a.kg,
      weight: (a, b) => a.kg - b.kg,
      year: (a, b) => (b.year ?? 0) - (a.year ?? 0),
      pp: (a, b) => cardPP(b) - cardPP(a),
    };
    return sort === 'maker' ? out : out.slice().sort(by[sort]);
  }, [query, maker, group, dt, sort, favSet]);

  const { visible, sentinel, done } = useProgressive(list);
  const recentCars = recent.map((id) => CAR_BY_ID.get(id)).filter(Boolean) as Car[];
  const filtering = q || maker !== 'all' || group !== 'all' || dt !== 'all';

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Step 1 of 4</p>
          <h2 className="page-title">Choose your car</h2>
          <p className="page-sub">{CARS.length} cars. PP shown on Sports Medium for road cars, Racing Hard for race cars.</p>
        </div>
        <SearchBox value={q} onChange={setQ} placeholder="Search cars — “RX-7”, “GT3”, “911”" />
      </header>

      {!filtering && recentCars.length > 0 && (
        <div className="recent">
          <span className="recent-label">Recent</span>
          {recentCars.map((c) => (
            <button key={c.id} type="button" className={`recent-chip ${c.id === selected ? 'on' : ''}`} onClick={() => onPick(c)}>
              {c.maker} <b>{c.name}</b>
            </button>
          ))}
        </div>
      )}

      <div className="toolbar">
        <Chips
          label="Group"
          value={group}
          onChange={setGroup}
          options={[
            { value: 'all', label: 'All', count: counts.all },
            ...GROUPS.map((g) => ({ value: g, label: GROUP_LABEL[g], count: counts[g] ?? 0 })),
            { value: 'fav', label: <><IconStar filled /> Favourites</>, count: counts.fav },
          ]}
        />
        <div className="toolbar-row">
          <Chips label="Drivetrain" value={dt} onChange={setDt} options={DTS.map((d) => ({ value: d, label: d === 'all' ? 'Any drivetrain' : d }))} />
          <div className="selects">
            <select value={maker} onChange={(e) => setMaker(e.target.value)} aria-label="Manufacturer">
              <option value="all">All manufacturers</option>
              {MAKERS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort by">
              <option value="maker">Sort by manufacturer</option>
              <option value="pp">Sort by PP</option>
              <option value="power">Sort by power</option>
              <option value="pw">Sort by power-to-weight</option>
              <option value="weight">Sort by lightest</option>
              <option value="year">Sort by newest</option>
            </select>
          </div>
        </div>
      </div>

      <p className="result-count">{list.length} {list.length === 1 ? 'car' : 'cars'}</p>

      {list.length === 0 ? (
        <div className="empty-state">{group === 'fav' ? 'No favourites yet — tap the star on any car.' : 'No car matches those filters.'}</div>
      ) : (
        <div className="car-grid">
          {visible.map((c) => <CarCard key={c.id} car={c} active={c.id === selected} fav={favSet.has(c.id)} onPick={onPick} u={u} />)}
        </div>
      )}
      {!done && <div ref={sentinel} className="sentinel" />}
    </section>
  );
}

const CarCard = memo(function CarCard({ car, active, fav, onPick, u }: { car: Car; active: boolean; fav: boolean; onPick: (c: Car) => void; u: Units }) {
  return (
    <article className={`car-card ${active ? 'active' : ''}`}>
      <button type="button" className="card-hit" onClick={() => onPick(car)} aria-label={`${car.maker} ${car.name}`}>
        <CarImage car={car} />
        <div className="car-card-body">
          <div className="car-maker"><Flag code={car.country} /> {car.maker}</div>
          <div className="car-name">{car.name}</div>
          <div className="car-stats">
            <span>{u.power(car.hp)}</span>
            <span>{u.weight(car.kg)}</span>
            <span>{car.dt}</span>
            <span className="pp" title={`${car.pp ? 'Measured' : 'Estimated'} PP on ${TYRE_NAME[listTyre(car)]}`}>
              {car.pp ? '' : '≈'}{cardPP(car)} <small>PP</small>
            </span>
          </div>
        </div>
      </button>
      <span className="group-tag">{GROUP_LABEL[car.group]}</span>
      {active && <span className="picked"><IconCheck /></span>}
      <button
        type="button"
        className={`fav-btn ${fav ? 'on' : ''}`}
        onClick={() => actions.toggleFavourite(car.id)}
        aria-pressed={fav}
        aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}
        title={fav ? 'Remove from favourites' : 'Add to favourites'}
      >
        <IconStar filled={fav} />
      </button>
    </article>
  );
});
