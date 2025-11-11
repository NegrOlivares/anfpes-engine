import type { RawPlayer, ShopTagIndex } from '@anfpes/data-ingest';

export type DerivedFieldValue = string | number | boolean | null | undefined;

export interface DerivedPlayer extends Record<string, DerivedFieldValue> {
  ID: string;
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
