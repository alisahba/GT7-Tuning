import { useState } from 'react';
import { CAR_BY_ID, TRACK_BY_ID } from '../lib/data';
import { actions, useStore, useUnits } from '../lib/store';
import { CarImage } from './CarImage';
import { TrackMap } from './TrackMap';
import { IconArrow, IconEdit, IconStar, IconTrash } from './Icons';

export function Garage({ onOpen, onPickCar }: { onOpen: (hash: string) => void; onPickCar: (id: number) => void }) {
  const saved = useStore((s) => s.saved);
  const favourites = useStore((s) => s.favourites);
  const u = useUnits();
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <section className="page garage">
      <header className="page-head">
        <div>
          <p className="eyebrow">My garage</p>
          <h2 className="page-title">Saved setups & favourites</h2>
          <p className="page-sub">Everything here is stored in this browser only.</p>
        </div>
      </header>

      <h3 className="section-title">Saved setups <span className="count">{saved.length}</span></h3>
      {saved.length === 0 ? (
        <div className="empty-state">No saved setups yet. Generate a setup and press <b>Save</b> to keep it here.</div>
      ) : (
        <div className="saved-list">
          {saved.map((s) => {
            const car = CAR_BY_ID.get(s.carId);
            const track = TRACK_BY_ID.get(s.trackId);
            return (
              <article key={s.id} className="saved-card">
                {car && <CarImage car={car} className="saved-car" />}
                <div className="saved-body">
                  {editing === s.id ? (
                    <input
                      className="inline-input"
                      autoFocus
                      defaultValue={s.name}
                      onBlur={(e) => { actions.renameSetup(s.id, e.target.value.trim() || s.name); setEditing(null); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditing(null); }}
                    />
                  ) : (
                    <h4>{s.name}</h4>
                  )}
                  <p>{s.summary}</p>
                  <small>Saved {new Date(s.savedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</small>
                </div>
                {track && <div className="saved-map"><TrackMap track={track} strokeWidth={14} /></div>}
                <div className="saved-actions">
                  <button type="button" className="btn btn-primary" onClick={() => onOpen(s.hash)}>Open <IconArrow /></button>
                  <button type="button" className="icon-btn" onClick={() => setEditing(s.id)} aria-label="Rename" title="Rename"><IconEdit /></button>
                  <button type="button" className="icon-btn" onClick={() => confirm(`Delete “${s.name}”?`) && actions.deleteSetup(s.id)} aria-label="Delete" title="Delete"><IconTrash /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <h3 className="section-title">Favourite cars <span className="count">{favourites.length}</span></h3>
      {favourites.length === 0 ? (
        <div className="empty-state">Tap the <IconStar /> on any car to keep it here.</div>
      ) : (
        <div className="fav-grid">
          {favourites.map((id) => {
            const car = CAR_BY_ID.get(id);
            if (!car) return null;
            return (
              <button key={id} type="button" className="fav-card" onClick={() => onPickCar(id)}>
                <CarImage car={car} />
                <span className="fav-maker">{car.maker}</span>
                <strong>{car.name}</strong>
                <small>{u.power(car.hp)} · {u.weight(car.kg)} · {car.dt}</small>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
