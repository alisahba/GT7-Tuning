// Builds the app's data files (src/data/cars.json, src/data/tracks.json) from
// the raw sources in data/. Run with `npm run data` after changing a source.
//
// Sources:
//   data/source/gt7info/*.csv              – car / maker list (ddm999/gt7info, MIT-0)
//   data/car-specs.csv                     – drivetrain, power, weight, balance (this project)
//   data/source/gt7-track-data/catalog.json    – official layout list + stats
//   data/source/gt7-track-data/signatures.json – in-game racing line per layout
//     (jbhoorasingh/gt7-datalogger-track-data, CC0; lap captures from
//      zetetos/gt-telemetry, MIT)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (...p) => join(root, 'data', ...p);
const out = (...p) => join(root, 'src', 'data', ...p);

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

const readCsv = (...p) => parseCsv(readFileSync(src(...p), 'utf8'));
const readJson = (...p) => JSON.parse(readFileSync(src(...p), 'utf8'));

/* ------------------------------------------------------------------ cars */

const countries = Object.fromEntries(readCsv('source', 'gt7info', 'country.csv').map((c) => [c.ID, c.Code]));
const makers = Object.fromEntries(
  readCsv('source', 'gt7info', 'maker.csv').map((m) => [m.ID, { name: m.Name, country: countries[m.Country] ?? 'pdi' }]),
);
const specs = Object.fromEntries(readCsv('car-specs.csv').map((s) => [s.id, s]));

function yearOf(name) {
  const m = name.match(/'(\d\d)\b/);
  if (!m) return null;
  const yy = Number(m[1]);
  return yy > 26 ? 1900 + yy : 2000 + yy;
}

const cars = readCsv('source', 'gt7info', 'cars.csv').map((c) => {
  const s = specs[c.ID];
  if (!s) throw new Error(`car ${c.ID} (${c.ShortName}) has no row in data/car-specs.csv`);
  const maker = makers[c.Maker] ?? { name: 'Unknown', country: 'pdi' };
  return {
    id: Number(c.ID),
    name: c.ShortName,
    maker: maker.name,
    country: maker.country,
    year: yearOf(c.ShortName),
    cat: s.cat,
    dt: s.dt,
    asp: s.asp,
    hp: Number(s.hp),
    kg: Number(s.kg),
    front: Number(s.front),
  };
});
cars.sort((a, b) => a.maker.localeCompare(b.maker) || a.name.localeCompare(b.name));

/* ---------------------------------------------------------------- tracks */

const catalog = readJson('source', 'gt7-track-data', 'catalog.json');
const signatures = readJson('source', 'gt7-track-data', 'signatures.json').signatures;
const sigById = new Map(signatures.filter((s) => s.path?.length).map((s) => [s.official_id, s]));
const reverseOf = new Map();
for (const s of sigById.values()) if (s.reverse?.official_id) reverseOf.set(s.reverse.official_id, s);

const ISO = {
  AUT: 'at', FRA: 'fr', GBR: 'gb', CAN: 'ca', BRA: 'br', BEL: 'be', ITA: 'it', Switzerland: 'ch',
  GER: 'de', CRO: 'hr', ESP: 'es', AUS: 'au', UAE: 'ae', JPN: 'jp', USA: 'us',
};

// Douglas–Peucker on [x, y] points.
function simplify(pts, eps) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    let max = 0, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len;
      if (d > max) { max = d; idx = i; }
    }
    if (max > eps && idx > 0) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

// GT7 world space is x (east) / z; z grows towards the viewer, so the map is
// drawn with z as screen-y unchanged (verified against real-world Monza/Suzuka).
function toMap(path, reversed) {
  let pts = path.map(([x, z]) => [x, z]);
  if (reversed) pts = pts.slice().reverse();
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  const k = 1000 / span;
  const w = Math.round((maxX - minX) * k), h = Math.round((maxY - minY) * k);
  const scaled = pts.map(([x, y]) => [(x - minX) * k, (y - minY) * k]);
  const simple = simplify(scaled, 1.6).map(([x, y]) => [Math.round(x), Math.round(y)]);
  const d = 'M' + simple.map(([x, y]) => `${x} ${y}`).join('L') + 'Z';
  // Start marker & driving direction, taken a short way along the lap.
  const start = scaled[0];
  const ahead = scaled[Math.min(scaled.length - 1, 3)];
  return { w, h, d, start: [Math.round(start[0]), Math.round(start[1])], dir: Math.round((Math.atan2(ahead[1] - start[1], ahead[0] - start[0]) * 180) / Math.PI) };
}

// Layouts without their own recording borrow the closest one at the venue.
const FALLBACK = { '8dd16b': '12ceac', '592211': '31acde', '9ec2c6': '2066d9' };

const surfaceOf = (roadway) =>
  roadway === 'Dirt' ? 'dirt' : roadway === 'Snow' ? 'snow' : roadway === 'Tarmac & Dirt' ? 'mixed' : 'tarmac';

const tracks = [];
for (const venue of catalog.tracks) {
  const fallbackSig = venue.layouts.map((l) => sigById.get(l.official_id)).find(Boolean);
  for (const l of venue.layouts) {
    const base = {
      venue: venue.name,
      venueId: venue.official_track_id,
      country: ISO[venue.country] ?? 'xx',
      countryName: venue.country_name || venue.country,
      turns: l.turns,
      length: l.length_m,
      elevation: l.elevation_m ?? 0,
      straight: l.longest_straight_m ?? 0,
      kind: l.type ?? 'real',
      rain: !!l.rain,
      surface: surfaceOf(l.roadway),
    };
    const variants = [{ id: l.official_id, name: l.official_name, layout: l.name, reverse: false, turns: l.turns }];
    if (l.reverse) variants.push({ id: l.reverse.official_id, name: `${l.official_name} Reverse`, layout: `${l.name} Reverse`, reverse: true, turns: l.reverse.turns });
    for (const v of variants) {
      let sig = sigById.get(v.id), reversed = false, mapExact = true;
      if (!sig && v.reverse) { sig = reverseOf.get(v.id) ?? sigById.get(l.official_id); reversed = true; }
      if (!sig) { sig = sigById.get(FALLBACK[v.id]) ?? fallbackSig; mapExact = false; }
      tracks.push({ ...base, ...v, mapExact, map: sig ? toMap(sig.path, reversed) : null });
    }
  }
}

mkdirSync(out(), { recursive: true });
writeFileSync(out('cars.json'), JSON.stringify(cars));
writeFileSync(out('tracks.json'), JSON.stringify(tracks));
console.log(`cars: ${cars.length}  tracks: ${tracks.length} (${tracks.filter((t) => !t.mapExact).length} using venue map, ${tracks.filter((t) => !t.map).length} without map)`);
