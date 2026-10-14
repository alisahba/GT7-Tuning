import type { Car } from '../types';

// Generated side-profile illustration, used while a photo loads or when none exists.

const PALETTE = ['#2f7bff', '#ff3b30', '#ffc940', '#21d07a', '#b46bff', '#ff8a1f', '#22c6e0', '#e8edf5', '#ff5fa2'];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

type Body = 'coupe' | 'gt' | 'proto' | 'formula' | 'suv' | 'kart';

function bodyOf(car: Car): Body {
  if (car.cat === 'kart') return 'kart';
  if (car.cat === 'formula') return 'formula';
  if (car.cat === 'gr1') return 'proto';
  if (car.cat === 'gr3' || car.cat === 'gr4' || car.cat === 'gr2' || car.cat === 'race') return 'gt';
  if (car.kg > 1900 || /Jimny|Unimog|Raptor|Tundra|Hiace|Land Cruiser|RAV4|Urus|Alphard|Ambulance|Willys|Sambabus|Carry|CR-V|C-HR|Qashqai|SUV|Captur|Kangoo/.test(car.name)) return 'suv';
  return 'coupe';
}

const SHAPES: Record<Body, { body: string; glass: string; wheels: [number, number, number] }> = {
  coupe: {
    body: 'M18 102 C20 86 38 79 70 75 L112 71 C134 52 162 42 200 44 C226 46 246 59 264 71 L292 77 C304 81 306 93 304 102 Z',
    glass: 'M122 71 C140 56 162 50 196 52 C214 54 228 62 240 71 Z',
    wheels: [80, 248, 21],
  },
  gt: {
    body: 'M14 102 C16 88 30 80 64 76 L110 72 C134 54 166 45 204 47 C232 49 252 62 270 72 L300 76 L306 70 L312 70 L310 84 C312 92 310 98 308 102 Z',
    glass: 'M124 72 C142 58 166 52 198 54 C216 56 230 64 242 72 Z',
    wheels: [78, 250, 22],
  },
  proto: {
    body: 'M10 100 C14 86 40 78 96 74 C126 56 160 48 196 52 C232 56 262 66 296 70 L312 76 L312 100 Z M236 52 L262 40 L270 40 L260 66 Z',
    glass: 'M136 66 C150 58 170 55 192 57 L196 68 Z',
    wheels: [74, 252, 21],
  },
  formula: {
    body: 'M8 98 L36 92 L120 88 L146 74 L170 72 L186 84 L270 86 L292 70 L314 70 L314 98 Z',
    glass: 'M150 76 L168 74 L178 84 L152 86 Z',
    wheels: [64, 262, 23],
  },
  suv: {
    body: 'M18 104 L20 78 C28 72 56 68 78 66 L110 40 L228 38 C248 40 262 58 272 66 L296 72 C306 76 306 92 304 104 Z',
    glass: 'M120 64 L136 46 L224 45 C238 47 248 58 254 64 Z',
    wheels: [82, 246, 24],
  },
  kart: {
    body: 'M70 100 L90 86 L140 82 L150 66 L170 66 L176 82 L230 84 L250 100 Z',
    glass: 'M150 66 L170 66 L172 74 L152 74 Z',
    wheels: [96, 226, 16],
  },
};

export function CarArt({ car }: { car: Car }) {
  const h = hash(car.maker + car.name);
  const color = PALETTE[h % PALETTE.length];
  const shape = SHAPES[bodyOf(car)];
  const id = `g${car.id}`;
  const [w1, w2, wr] = shape.wheels;
  return (
    <svg className="car-art" viewBox="0 0 320 140" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.95" />
          <stop offset="1" stopColor={color} stopOpacity="0.45" />
        </linearGradient>
        <radialGradient id={`${id}s`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <text x="160" y="58" textAnchor="middle" className="car-art-maker">
        {car.maker.toUpperCase()}
      </text>
      <ellipse cx="160" cy="118" rx="150" ry="10" fill={`url(#${id}s)`} />
      <path d={shape.body} fill={`url(#${id}b)`} />
      <path d={shape.glass} fill="#0b0f16" opacity="0.85" />
      {[w1, w2].map((x) => (
        <g key={x}>
          <circle cx={x} cy={104} r={wr} fill="#0b0f16" />
          <circle cx={x} cy={104} r={wr * 0.55} fill="none" stroke="#9aa6b8" strokeWidth="3" />
        </g>
      ))}
    </svg>
  );
}
