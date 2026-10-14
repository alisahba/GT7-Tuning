import { memo, useDeferredValue, useMemo, useState } from 'react';
import type { Car, Region, Track } from '../types';
import { TRACKS } from '../lib/data';
import { seriesForTrack } from '../lib/events';
import { profileTrack } from '../lib/tuning';
import { TrackMap } from './TrackMap';
import { Chips, Flag, SearchBox, Seg, fmtKm, useProgressive } from './common';
import { IconCheck, IconRain, IconReverse, IconTrophy } from './Icons';

type Kind = 'all' | 'real' | 'original' | 'offroad';
type RegionFilter = 'all' | Region;
const REGIONS: Region[] = ['Europe', 'America', 'Asia-Oceania'];
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const EVENT_COUNT = new Map(TRACKS.map((t) => [t.id, seriesForTrack(t.id).length]));

interface Props {
  car: Car;
  selected?: string;
  onPick: (t: Track) => void;
  onChangeCar: () => void;
}

export function TrackPicker({ car, selected, onPick, onChangeCar }: Props) {
  const [q, setQ] = useState('');
  const [region, setRegion] = useState<RegionFilter>('all');
  const [kind, setKind] = useState<Kind>('all');
  const [reverse, setReverse] = useState(false);
  const query = useDeferredValue(q);

  const base = useMemo(() => TRACKS.filter((t) => reverse || !t.reverse || t.id === selected), [reverse, selected]);
  const regionCount = useMemo(() => {
    const c: Record<string, number> = { all: base.length };
    for (const t of base) c[t.region] = (c[t.region] ?? 0) + 1;
    return c;
  }, [base]);

  const list = useMemo(() => {
    const words = norm(query).split(/\s+/).filter(Boolean);
    return base.filter((t) => {
      if (region !== 'all' && t.region !== region) return false;
      if (kind === 'real' && t.kind !== 'real') return false;
      if (kind === 'original' && t.kind !== 'original') return false;
      if (kind === 'offroad' && t.surface === 'tarmac') return false;
      const hay = norm(`${t.name} ${t.venue} ${t.countryName} ${t.region}`);
      return words.every((w) => hay.includes(w));
    });
  }, [base, query, region, kind]);

  const { visible, sentinel, done } = useProgressive(list, 36);
  const venues = new Set(list.map((t) => t.venue)).size;

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Step 2 of 4 · <button type="button" className="text-btn" onClick={onChangeCar}>{car.maker} {car.name}</button></p>
          <h2 className="page-title">Choose your track</h2>
          <p className="page-sub">World Circuits, grouped by region as in the game. Maps are traced from in-game laps.</p>
        </div>
        <SearchBox value={q} onChange={setQ} placeholder="Search tracks — “Suzuka”, “Nürburgring”" />
      </header>

      <div className="region-tabs">
        <Seg
          label="Region"
          value={region}
          onChange={setRegion}
          options={[
            { value: 'all', label: <>All regions <span className="seg-count">{regionCount.all}</span></> },
            ...REGIONS.map((r) => ({ value: r, label: <>{r} <span className="seg-count">{regionCount[r] ?? 0}</span></> })),
          ]}
        />
      </div>

      <div className="toolbar">
        <div className="toolbar-row">
          <Chips
            label="Track type"
            value={kind}
            onChange={setKind}
            options={[
              { value: 'all', label: 'All types' },
              { value: 'real', label: 'Real circuits' },
              { value: 'original', label: 'GT originals' },
              { value: 'offroad', label: 'Dirt & snow' },
            ]}
          />
          <label className="toggle">
            <input type="checkbox" checked={reverse} onChange={(e) => setReverse(e.target.checked)} />
            <span className="toggle-ui" />
            Include reverse layouts
          </label>
        </div>
      </div>

      <p className="result-count">{list.length} layouts · {venues} locations</p>
      {list.length === 0 ? (
        <div className="empty-state">No track matches that search.</div>
      ) : (
        <div className="track-grid">
          {visible.map((t) => <TrackCard key={t.id} track={t} active={t.id === selected} onPick={onPick} />)}
        </div>
      )}
      {!done && <div ref={sentinel} className="sentinel" />}
    </section>
  );
}

const TrackCard = memo(function TrackCard({ track, active, onPick }: { track: Track; active: boolean; onPick: (t: Track) => void }) {
  const p = profileTrack(track);
  const events = EVENT_COUNT.get(track.id) ?? 0;
  return (
    <button type="button" className={`track-card ${active ? 'active' : ''}`} onClick={() => onPick(track)}>
      <div className="track-visual">
        <TrackMap track={track} animate />
        {active && <span className="picked"><IconCheck /></span>}
        <div className="track-tags">
          {track.surface !== 'tarmac' && <span className="tag">{track.surface === 'mixed' ? 'Tarmac & dirt' : track.surface}</span>}
          {track.rain && <span className="tag icon" title="Rain possible"><IconRain /></span>}
          {track.reverse && <span className="tag icon" title="Reverse layout"><IconReverse /></span>}
          {events > 0 && <span className="tag" title="World Circuits events in the catalogue"><IconTrophy /> {events}</span>}
        </div>
        {!track.mapExact && <span className="map-note">Venue map</span>}
      </div>
      <div className="track-body">
        <div className="track-venue"><Flag code={track.country} title={track.countryName} /> <span>{track.venue}</span></div>
        <div className="track-layout">{track.layout}</div>
        <div className="track-stats">
          <span>{fmtKm(track.length)}</span>
          <span>{track.turns} turns</span>
          <span className={`speed speed-${p.speedClass.toLowerCase()}`}>{p.speedClass}</span>
        </div>
      </div>
    </button>
  );
});
