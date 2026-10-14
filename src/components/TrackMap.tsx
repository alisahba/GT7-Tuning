import type { Track } from '../types';

interface Props {
  track: Track;
  className?: string;
  animate?: boolean;
  strokeWidth?: number;
}

export function TrackMap({ track, className = '', animate = false, strokeWidth = 22 }: Props) {
  const m = track.map;
  if (!m) return <div className={`track-map empty ${className}`} />;
  const pad = 60;
  const vb = `${-pad} ${-pad} ${m.w + pad * 2} ${m.h + pad * 2}`;
  const gid = `tg-${track.id}`;
  const [sx, sy] = m.start;
  return (
    <svg className={`track-map ${animate ? 'animate' : ''} ${className}`} viewBox={vb} role="img" aria-label={`${track.name} layout`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--map-a)" />
          <stop offset="1" stopColor="var(--map-b)" />
        </linearGradient>
      </defs>
      <path d={m.d} className="tm-casing" strokeWidth={strokeWidth * 2.2} />
      <path d={m.d} className="tm-glow" stroke={`url(#${gid})`} strokeWidth={strokeWidth * 1.6} />
      <path d={m.d} className="tm-line" stroke={`url(#${gid})`} strokeWidth={strokeWidth} pathLength={1} />
      <g transform={`translate(${sx} ${sy}) rotate(${m.dir})`} className="tm-start">
        <rect x={-6} y={-strokeWidth * 1.4} width={12} height={strokeWidth * 2.8} rx={3} />
        <path d={`M${strokeWidth * 1.6} ${-strokeWidth * 0.9} L${strokeWidth * 3.1} 0 L${strokeWidth * 1.6} ${strokeWidth * 0.9}`} className="tm-arrow" strokeWidth={strokeWidth * 0.5} />
      </g>
    </svg>
  );
}
