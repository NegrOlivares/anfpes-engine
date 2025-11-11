export type RawValue = string | number | boolean | null | Date;

export type RawPlayer = Record<string, RawValue>;

export interface ShopTag {
  name: string;
  tag: string;
}

export type ShopTagIndex = Map<string, string>;

export interface ExtraStatRecord {
  playerId: string;
  metrics: Record<string, number | null>;
}

export interface ExtraStatsBundle {
  version: string;
  updatedAt: string;
  records: ExtraStatRecord[];
  notes?: string;
}
