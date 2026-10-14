import carsJson from '../data/cars.json';
import tracksJson from '../data/tracks.json';
import type { Car, Track } from '../types';

export const CARS = carsJson as Car[];
export const TRACKS = tracksJson as Track[];
export const CAR_BY_ID = new Map(CARS.map((c) => [c.id, c]));
export const TRACK_BY_ID = new Map(TRACKS.map((t) => [t.id, t]));
export const MAKERS = [...new Set(CARS.map((c) => c.maker))].sort((a, b) => a.localeCompare(b));
