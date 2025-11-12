import type { DerivedPlayer } from '@anfpes/engine';
import type { CacheClub, CacheMeta } from '../types/cache';

const FALLBACK_ENV = 'dev';
const cacheEnv = import.meta.env.VITE_CACHE_ENV ?? FALLBACK_ENV;
const cacheBase = (import.meta.env.VITE_CACHE_BASE ?? `/cache/${cacheEnv}`).replace(
  /\/$/,
  '',
);

type JsonPath =
  | 'meta.json'
  | 'clubs.json'
  | 'players.json'
  | 'indices/byId.json'
  | `indices/${string}.json`;

async function fetchJson<T>(path: JsonPath): Promise<T> {
  const normalized = path.replace(/^\//, '');
  const response = await fetch(`${cacheBase}/${normalized}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `No se pudo leer ${normalized} (${response.status} ${response.statusText})`,
    );
  }

  return (await response.json()) as T;
}

let playersPromise: Promise<DerivedPlayer[]> | null = null;

export const cacheClient = {
  env: cacheEnv,
  basePath: cacheBase,
  getMeta(): Promise<CacheMeta> {
    return fetchJson<CacheMeta>('meta.json');
  },
  getClubs(): Promise<CacheClub[]> {
    return fetchJson<CacheClub[]>('clubs.json');
  },
  getPlayers(): Promise<DerivedPlayer[]> {
    if (!playersPromise) {
      playersPromise = fetchJson<DerivedPlayer[]>('players.json');
    }
    return playersPromise;
  },
  async getPlayersPreview(limit = 25): Promise<DerivedPlayer[]> {
    const players = await this.getPlayers();
    return players.slice(0, limit);
  },
};
