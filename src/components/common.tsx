import { useEffect, useRef, useState, type ReactNode } from 'react';

export function Flag({ code, title }: { code: string; title?: string }) {
  const [broken, setBroken] = useState(false);
  if (!code || code === 'pdi' || code === 'xx') {
    return <span className="flag flag-gt" title={title ?? 'Polyphony Digital original'}>GT</span>;
  }
  if (broken) return <span className="flag flag-gt" title={title}>{code.toUpperCase()}</span>;
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

export function Chips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: ReactNode }[];
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

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="search">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input type="search" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} aria-label={placeholder} />
    </label>
  );
}

export const fmtKm = (m: number) => `${(m / 1000).toFixed(m >= 10000 ? 1 : 2)} km`;
