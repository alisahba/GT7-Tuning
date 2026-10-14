import type { Track } from '../types';

interface Props {
  track: Track;
  className?: string;
  animate?: boolean;
  strokeWidth?: number;
}

export function TrackMap({ track, className = '', animate = false, strokeWidth = 18 }: Props) {
  const m = track.map;
  if (!m) return <div className={`track-map empty ${className}`} />;
  const pad = 50;
  const vb = `${-pad} ${-pad} ${m.w + pad * 2} ${m.h + pad * 2}`;
  const [sx, sy] = m.start;
  const sw = strokeWidth;
  return (
    <svg className={`track-map ${animate ? 'animate' : ''} ${className}`} viewBox={vb} role="img" aria-label={`${track.name} layout`}>
      <path d={m.d} className="tm-casing" strokeWidth={sw * 2.4} />
      <path d={m.d} className="tm-line" strokeWidth={sw} pathLength={1} />
      <g transform={`translate(${sx} ${sy}) rotate(${m.dir})`} className="tm-start">
        <rect x={-sw * 0.35} y={-sw * 1.5} width={sw * 0.7} height={sw * 3} rx={sw * 0.2} />
        <path d={`M${sw * 1.7} ${-sw * 0.85} L${sw * 3} 0 L${sw * 1.7} ${sw * 0.85}`} className="tm-arrow" strokeWidth={sw * 0.45} />
      </g>
    </svg>
  );
}
