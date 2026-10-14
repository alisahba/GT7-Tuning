import { memo, useDeferredValue, useMemo, useState } from 'react';
import type { Track } from '../types';
import { TRACKS } from '../lib/data';
import { profileTrack } from '../lib/tuning';
import { TrackMap } from './TrackMap';
import { Chips, Flag, SearchBox, fmtKm, useProgressive } from './common';
import { IconCheck, IconRain, IconReverse } from './Icons';

type Kind = 'all' | 'real' | 'original' | 'offroad';
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const VENUES = new Set(TRACKS.map((t) => t.venue)).size;

export function TrackPicker({ selected, onPick }: { selected?: string; onPick: (t: Track) => void }) {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<Kind>('all');
  const [reverse, setReverse] = useState(false);
  const query = useDeferredValue(q);

  const list = useMemo(() => {
    const words = norm(query).split(/\s+/).filter(Boolean);
    return TRACKS.filter((t) => {
      if (!reverse && t.reverse && t.id !== selected) return false;
      if (kind === 'real' && t.kind !== 'real') return false;
      if (kind === 'original' && t.kind !== 'original') return false;
      if (kind === 'offroad' && t.surface === 'tarmac') return false;
      const hay = norm(`${t.name} ${t.venue} ${t.countryName}`);
      return words.every((w) => hay.includes(w));
    });
  }, [query, kind, reverse, selected]);

  const { visible, sentinel, done } = useProgressive(list, 36);

  return (
    <section className="picker">
      <div className="picker-head">
        <div>
          <h2 className="step-title"><span>02</span> Choose your track</h2>
          <p className="step-sub">{TRACKS.length} layouts across {VENUES} locations — maps traced from in-game laps.</p>
        </div>
        <SearchBox value={q} onChange={setQ} placeholder="Search tracks, e.g. “Suzuka”, “Nürburgring”" />
      </div>
      <div className="filters">
        <Chips
          label="Track type"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'all', label: 'All' },
            { value: 'real', label: 'Real circuits' },
            { value: 'original', label: 'GT originals' },
            { value: 'offroad', label: 'Dirt & snow' },
          ]}
        />
        <label className="toggle">
          <input type="checkbox" checked={reverse} onChange={(e) => setReverse(e.target.checked)} />
          <span className="toggle-ui" />
          Show reverse layouts
        </label>
      </div>
      <p className="result-count">{list.length} layouts</p>
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
  return (
    <button type="button" className={`track-card ${active ? 'active' : ''}`} onClick={() => onPick(track)}>
      <div className="track-visual">
        <TrackMap track={track} animate />
        {active && <span className="picked"><IconCheck /></span>}
        <div className="track-tags">
          {track.surface !== 'tarmac' && <span className={`tag surface-${track.surface}`}>{track.surface === 'mixed' ? 'Tarmac & dirt' : track.surface}</span>}
          {track.rain && <span className="tag" title="Rain possible"><IconRain /></span>}
          {track.reverse && <span className="tag" title="Reverse layout"><IconReverse /></span>}
        </div>
        {!track.mapExact && <span className="map-note">Venue map</span>}
      </div>
      <div className="track-body">
        <div className="track-venue"><Flag code={track.country} title={track.countryName} /> {track.venue}</div>
        <div className="track-layout">{track.layout}</div>
        <div className="track-stats">
          <span><b>{fmtKm(track.length)}</b></span>
          <span><b>{track.turns}</b> turns</span>
          <span className={`speed speed-${p.speedClass.toLowerCase()}`}>{p.speedClass}</span>
        </div>
      </div>
    </button>
  );
});
