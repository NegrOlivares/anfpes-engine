export interface CacheMeta {
  generatedAt: string;
  dataVersion: string;
  sources: {
    table: string;
    shop: string;
  };
  counts: {
    players: number;
    clubs: number;
  };
  hashes: Record<string, string>;
}

export interface CacheClub {
  name: string;
  playerIds: string[];
}
