import type { RawPlayer, ShopTagIndex } from '@anfpes/data-ingest';

export type DerivedFieldValue = string | number | boolean | null;

export interface DerivedPlayer extends Record<string, DerivedFieldValue> {
  ID: string;
  NOMBRE?: DerivedFieldValue;
  NACIONALIDAD?: DerivedFieldValue;
  DORSAL?: DerivedFieldValue;
  CLUB?: DerivedFieldValue;
}

export interface CalculationContext {
  raw: RawPlayer;
  shopTags?: ShopTagIndex;
}

export type ColumnCalculator = (context: CalculationContext) => DerivedFieldValue;

export interface ColumnDefinition {
  target: string;
  compute: ColumnCalculator;
}
