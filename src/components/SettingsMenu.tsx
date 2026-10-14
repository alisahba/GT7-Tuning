import { useEffect, useRef, useState } from 'react';
import { actions, useStore } from '../lib/store';
import { Seg } from './common';
import { IconMoon, IconSettings, IconSun } from './Icons';

export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const s = useStore((st) => st.settings);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div className="menu" ref={ref}>
      <button type="button" className={`icon-btn ${open ? 'on' : ''}`} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Settings" title="Settings">
        <IconSettings />
      </button>
      {open && (
        <div className="menu-panel" role="dialog" aria-label="Settings">
          <p className="menu-title">Appearance</p>
          <Seg
            label="Theme"
            value={s.theme}
            onChange={(theme) => actions.setSettings({ theme })}
            options={[
              { value: 'system', label: 'Auto' },
              { value: 'light', label: <><IconSun /> Light</> },
              { value: 'dark', label: <><IconMoon /> Dark</> },
            ]}
          />
          <p className="menu-title">Units</p>
          <div className="menu-row"><span>Speed</span><Seg size="sm" label="Speed unit" value={s.speed} onChange={(speed) => actions.setSettings({ speed })} options={[{ value: 'kmh', label: 'km/h' }, { value: 'mph', label: 'mph' }]} /></div>
          <div className="menu-row"><span>Power</span><Seg size="sm" label="Power unit" value={s.power} onChange={(power) => actions.setSettings({ power })} options={[{ value: 'hp', label: 'hp' }, { value: 'ps', label: 'PS' }]} /></div>
          <div className="menu-row"><span>Weight</span><Seg size="sm" label="Weight unit" value={s.weight} onChange={(weight) => actions.setSettings({ weight })} options={[{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }]} /></div>
          <p className="menu-foot">Preferences, favourites and saved setups stay in this browser.</p>
        </div>
      )}
    </div>
  );
}
