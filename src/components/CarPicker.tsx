import { memo, useDeferredValue, useMemo, useState } from 'react';
import type { Car, CarCategory, Drivetrain } from '../types';
import { CARS, MAKERS } from '../lib/data';
import { CATEGORY_LABEL } from '../lib/tuning';
import { CarImage } from './CarImage';
import { Chips, Flag, SearchBox, useProgressive } from './common';
import { IconCheck } from './Icons';

type Sort = 'maker' | 'power' | 'pw' | 'weight' | 'year';
const CATS: ('all' | CarCategory)[] = ['all', 'road', 'race', 'gr4', 'gr3', 'gr2', 'gr1', 'grb', 'formula'];
const DTS: ('all' | Drivetrain)[] = ['all', 'FF', 'FR', 'MR', 'RR', '4WD'];

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function CarPicker({ selected, onPick }: { selected?: number; onPick: (car: Car) => void }) {
  const [q, setQ] = useState('');
  const [maker, setMaker] = useState('all');
  const [cat, setCat] = useState<'all' | CarCategory>('all');
  const [dt, setDt] = useState<'all' | Drivetrain>('all');
  const [sort, setSort] = useState<Sort>('maker');
  const query = useDeferredValue(q);

  const list = useMemo(() => {
    const words = norm(query).split(/\s+/).filter(Boolean);
    const out = CARS.filter((c) => {
      if (maker !== 'all' && c.maker !== maker) return false;
      if (cat !== 'all' && c.cat !== cat) return false;
      if (dt !== 'all' && c.dt !== dt) return false;
      const hay = norm(`${c.maker} ${c.name} ${CATEGORY_LABEL[c.cat]} ${c.dt}`);
      return words.every((w) => hay.includes(w));
    });
    const by: Record<Sort, (a: Car, b: Car) => number> = {
      maker: () => 0,
      power: (a, b) => b.hp - a.hp,
      pw: (a, b) => b.hp / b.kg - a.hp / a.kg,
      weight: (a, b) => a.kg - b.kg,
      year: (a, b) => (b.year ?? 0) - (a.year ?? 0),
    };
    return sort === 'maker' ? out : out.slice().sort(by[sort]);
  }, [query, maker, cat, dt, sort]);

  const { visible, sentinel, done } = useProgressive(list);

  return (
    <section className="picker">
      <div className="picker-head">
        <div>
          <h2 className="step-title"><span>01</span> Choose your car</h2>
          <p className="step-sub">{CARS.length} cars from the GT7 garage, Brand Central and Legend Cars.</p>
        </div>
        <SearchBox value={q} onChange={setQ} placeholder="Search cars, e.g. “RX-7”, “GT3”, “Porsche 911”" />
      </div>

      <div className="filters">
        <Chips label="Category" value={cat} onChange={setCat} options={CATS.map((c) => ({ value: c, label: c === 'all' ? 'All' : CATEGORY_LABEL[c] }))} />
        <Chips label="Drivetrain" value={dt} onChange={setDt} options={DTS.map((d) => ({ value: d, label: d === 'all' ? 'Any drive' : d }))} />
        <div className="selects">
          <select value={maker} onChange={(e) => setMaker(e.target.value)} aria-label="Manufacturer">
            <option value="all">All manufacturers</option>
            {MAKERS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort by">
            <option value="maker">Sort: Manufacturer</option>
            <option value="power">Sort: Power</option>
            <option value="pw">Sort: Power-to-weight</option>
            <option value="weight">Sort: Lightest</option>
            <option value="year">Sort: Newest</option>
          </select>
        </div>
      </div>

      <p className="result-count">{list.length} {list.length === 1 ? 'car' : 'cars'}</p>

      {list.length === 0 ? (
        <div className="empty-state">No car matches those filters.</div>
      ) : (
        <div className="car-grid">
          {visible.map((c) => <CarCard key={c.id} car={c} active={c.id === selected} onPick={onPick} />)}
        </div>
      )}
      {!done && <div ref={sentinel} className="sentinel" />}
    </section>
  );
}

const CarCard = memo(function CarCard({ car, active, onPick }: { car: Car; active: boolean; onPick: (c: Car) => void }) {
  return (
    <button type="button" className={`car-card ${active ? 'active' : ''}`} onClick={() => onPick(car)}>
      <CarImage car={car} />
      <span className={`cat-badge cat-${car.cat}`}>{CATEGORY_LABEL[car.cat]}</span>
      {active && <span className="picked"><IconCheck /></span>}
      <div className="car-card-body">
        <div className="car-maker"><Flag code={car.country} /> {car.maker}</div>
        <div className="car-name">{car.name}</div>
        <div className="car-stats">
          <span><b>{car.hp}</b> hp</span>
          <span><b>{car.kg.toLocaleString()}</b> kg</span>
          <span className="dt">{car.dt}</span>
        </div>
      </div>
    </button>
  );
});
