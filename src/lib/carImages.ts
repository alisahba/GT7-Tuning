import type { Car } from '../types';

/**
 * Car pictures are resolved in this order:
 *  1. The official GT7 car-list render on gran-turismo.com (by internal car ID).
 *     Edit OFFICIAL_IMAGE_URL if Polyphony moves the files, or set it to '' to skip.
 *  2. The lead photo of the matching Wikipedia article (fetched once, cached).
 *  3. A generated illustration (see CarArt).
 */
export const OFFICIAL_IMAGE_URL = (id: number) =>
  `https://www.gran-turismo.com/common/dist/gt7/carlist/car_thumbnails/car${id}.png`;

const CACHE_KEY = 'gt7tl:wikiimg:v1';
let cache: Record<string, string> = {};
try {
  cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
} catch {
  cache = {};
}
let saveTimer: number | undefined;
function remember(id: number, url: string) {
  cache[id] = url;
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
      /* storage full or blocked – the cache is only an optimisation */
    }
  }, 500);
}

/** Turn a GT7 car name into something Wikipedia's search understands. */
export function wikiQuery(car: Car): string {
  let name = car.name
    .replace(/'\d\d\b/g, '')
    .replace(/\b(Gr\.[1234B]|Road Car|Safety Car|Rally Car|Race Car|Touring Car)\b/gi, '')
    .replace(/\bVGT\b/g, 'Vision Gran Turismo')
    .replace(/\(([^)]*)\)/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim();
  const maker = car.maker === 'AMG' || car.maker === 'Gran Turismo' ? '' : car.maker;
  if (maker && !name.toLowerCase().includes(maker.toLowerCase())) name = `${maker} ${name}`;
  return name;
}

const inflight = new Map<number, Promise<string>>();
const queue: (() => void)[] = [];
let running = 0;
const MAX_PARALLEL = 4;

function schedule<T>(task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = () => {
      running++;
      task().then(resolve, reject).finally(() => {
        running--;
        queue.shift()?.();
      });
    };
    if (running < MAX_PARALLEL) run();
    else queue.push(run);
  });
}

/** Resolves to an image URL or '' when Wikipedia has nothing suitable. */
export function wikiImage(car: Car): Promise<string> {
  if (car.id in cache) return Promise.resolve(cache[car.id]);
  const pending = inflight.get(car.id);
  if (pending) return pending;
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: wikiQuery(car),
    gsrlimit: '4',
    gsrnamespace: '0',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '800',
  });
  const p = schedule(async () => {
    try {
      const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
      const json = await res.json();
      const pages: { index: number; thumbnail?: { source: string } }[] = Object.values(json?.query?.pages ?? {});
      pages.sort((a, b) => a.index - b.index);
      const hit = pages.find((pg) => pg.thumbnail && !/\.svg/i.test(pg.thumbnail.source));
      const url = hit?.thumbnail?.source ?? '';
      remember(car.id, url);
      return url;
    } catch {
      return ''; // offline or blocked – don't cache, try again next visit
    } finally {
      inflight.delete(car.id);
    }
  });
  inflight.set(car.id, p);
  return p;
}
