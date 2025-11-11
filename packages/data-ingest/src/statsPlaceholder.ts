import { ExtraStatsBundle } from './types';

export interface CreateStatsPlaceholderOptions {
  version?: string;
  notes?: string;
}

export function createStatsPlaceholder(
  options: CreateStatsPlaceholderOptions = {},
): ExtraStatsBundle {
  const { version = '0.0.0', notes } = options;
  return {
    version,
    updatedAt: new Date().toISOString(),
    records: [],
    ...(notes ? { notes } : {}),
  };
}
