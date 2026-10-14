import { useEffect, useRef, useState, type ReactNode } from 'react';

export function Flag({ code, title }: { code: string; title?: string }) {
  const [broken, setBroken] = useState(false);
  if (!code || code === 'pdi' || code === 'xx') {
    return <span className="flag flag-text" title={title ?? 'Polyphony Digital original'}>GT</span>;
  }
  if (broken) return <span className="flag flag-text" title={title}>{code.toUpperCase()}</span>;
  return (
    <img
      className="flag"
      src={`https://flagcdn.com/w40/${code}.png`}
      alt={title ?? code.toUpperCase()}
      title={title}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}

export function Seg<T extends string | number>({
  options,
  value,
  onChange,
  label,
  size = 'md',
}: {
  options: { value: T; label: ReactNode; title?: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={`seg seg-${size}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          title={o.title}
          aria-checked={value === o.value}
          className={value === o.value ? 'on' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: ReactNode; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="chips" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={`chip ${value === o.value ? 'on' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
          {o.count !== undefined && <span className="chip-count">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Renders `items` in growing pages as the user scrolls. */
export function useProgressive<T>(items: T[], page = 48) {
  const [count, setCount] = useState(page);
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => setCount(page), [items, page]);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (e) => e[0].isIntersecting && setCount((c) => Math.min(items.length, c + page)),
      { rootMargin: '800px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [items, page]);
  return { visible: items.slice(0, count), sentinel, done: count >= items.length };
}

/** Focus the page's search box with "/" (like most sites). */
export function useSlashFocus(ref: React.RefObject<HTMLInputElement>) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(t.tagName)) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [ref]);
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useSlashFocus(ref);
  return (
    <label className="search">
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input ref={ref} type="search" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} aria-label={placeholder} />
      <kbd aria-hidden="true">/</kbd>
    </label>
  );
}

export function NumberField({
  label, value, onChange, unit, min, max, step = 1, placeholder, hint,
}: {
  label: string; value: number | undefined; onChange: (v: number | undefined) => void;
  unit?: string; min?: number; max?: number; step?: number; placeholder?: string; hint?: string;
}) {
  const [text, setText] = useState(value === undefined ? '' : String(value));
  useEffect(() => setText(value === undefined ? '' : String(value)), [value]);
  return (
    <label className="field" title={hint}>
      <span className="field-label">{label}</span>
      <span className="field-box">
        <input
          type="number"
          inputMode="decimal"
          value={text}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          onChange={(e) => {
            setText(e.target.value);
            const v = e.target.value === '' ? undefined : Number(e.target.value);
            if (v === undefined || Number.isFinite(v)) onChange(v);
          }}
        />
        {unit && <em>{unit}</em>}
      </span>
    </label>
  );
}

export const fmtKm = (m: number) => `${(m / 1000).toFixed(m >= 10000 ? 1 : 2)} km`;
