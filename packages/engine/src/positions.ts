import type { RawPlayer } from '@anfpes/data-ingest';

export type FavSide = 'B' | 'R' | 'L';

type SideLabelMap = {
  default: string;
  R?: string;
  L?: string;
};

interface PositionEntry {
  source: string;
  labels: SideLabelMap;
  normalized: string;
}

const POSITION_ENTRIES: PositionEntry[] = [
  { source: 'GK', normalized: 'GK', labels: { default: 'GK' } },
  { source: 'SW', normalized: 'SWP', labels: { default: 'SWP' } },
  { source: 'CB', normalized: 'CB', labels: { default: 'CB' } },
  { source: 'SB', normalized: 'SB', labels: { default: 'SB', R: 'RB', L: 'LB' } },
  { source: 'DM', normalized: 'DMF', labels: { default: 'DMF' } },
  { source: 'WB', normalized: 'WB', labels: { default: 'WB', R: 'RWB', L: 'LWB' } },
  { source: 'CM', normalized: 'CMF', labels: { default: 'CMF' } },
  { source: 'SM', normalized: 'SMF', labels: { default: 'SMF', R: 'RMF', L: 'LMF' } },
  { source: 'AM', normalized: 'AMF', labels: { default: 'AMF' } },
  { source: 'WF', normalized: 'WF', labels: { default: 'WF', R: 'RWF', L: 'LWF' } },
  { source: 'SS', normalized: 'SS', labels: { default: 'SS' } },
  { source: 'CF', normalized: 'CF', labels: { default: 'CF' } },
];

export const DEMARCATION_HEADERS = [
  'D',
  'E',
  'M',
  'A',
  'R',
  'C',
  'A_1',
  'C_1',
  'I',
  'O',
  'N',
] as const;

const REGISTERED_POSITION_MAP: Record<number, number> = {
  0: 0,
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 6,
  8: 7,
  9: 8,
  10: 9,
  11: 10,
  12: 11,
};

export function deriveDemarcationColumns(
  raw: RawPlayer,
): Record<(typeof DEMARCATION_HEADERS)[number], string | null> {
  const fav = getFavSide(raw);
  const registeredLabel = deriveRegisteredLabel(raw, fav);
  const list: string[] = [];
  if (registeredLabel) {
    list.push(registeredLabel);
  }

  POSITION_ENTRIES.forEach((entry) => {
    const flag = getFlag(raw, entry.source);
    if (flag === 1) {
      const label = resolveLabel(entry, fav);
      if (label && !list.includes(label)) {
        list.push(label);
      }
    }
  });

  const result: Record<(typeof DEMARCATION_HEADERS)[number], string | null> = {
    D: null,
    E: null,
    M: null,
    A: null,
    R: null,
    C: null,
    A_1: null,
    C_1: null,
    I: null,
    O: null,
    N: null,
  };
  DEMARCATION_HEADERS.forEach((header, index) => {
    result[header] = list[index] ?? null;
  });
  return result;
}

export function deriveRegisteredPositionCode(raw: RawPlayer): number | null {
  const label = deriveRegisteredLabel(raw, getFavSide(raw));
  if (!label) {
    return null;
  }
  const rawCode = toNumber(raw['REGISTERED POSITION']);
  if (rawCode !== null && REGISTERED_POSITION_MAP[rawCode] !== undefined) {
    return REGISTERED_POSITION_MAP[rawCode];
  }
  const mapped = Object.entries(REGISTERED_POSITION_MAP).find(([, index]) => {
    const entry = POSITION_ENTRIES[index];
    if (!entry) return false;
    return resolveLabel(entry, getFavSide(raw)) === label;
  });
  return mapped ? Number(mapped[0]) : null;
}

export function positionFlags(raw: RawPlayer): Record<string, number> {
  return POSITION_ENTRIES.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.normalized] = getFlag(raw, entry.source);
    return acc;
  }, {});
}

export function orientedWingFlags(raw: RawPlayer): Record<string, number> {
  const fav = getFavSide(raw);
  const flags = positionFlags(raw);
  const sb = flags.SB;
  const wb = flags.WB;
  const sm = flags.SM;
  const wf = flags.WF;
  return {
    RB: sb && (fav === 'B' || fav === 'R') ? 1 : 0,
    LB: sb && (fav === 'B' || fav === 'L') ? 1 : 0,
    RWB: wb && (fav === 'B' || fav === 'R') ? 1 : 0,
    LWB: wb && (fav === 'B' || fav === 'L') ? 1 : 0,
    RMF: sm && (fav === 'B' || fav === 'R') ? 1 : 0,
    LMF: sm && (fav === 'B' || fav === 'L') ? 1 : 0,
    RWF: wf && (fav === 'B' || fav === 'R') ? 1 : 0,
    LWF: wf && (fav === 'B' || fav === 'L') ? 1 : 0,
  };
}

export function getFavSide(raw: RawPlayer): FavSide {
  const value = String(raw['FAVOURED SIDE'] ?? '')
    .trim()
    .toUpperCase();
  if (value === 'R') return 'R';
  if (value === 'L') return 'L';
  return 'B';
}

function deriveRegisteredLabel(raw: RawPlayer, fav: FavSide): string | null {
  const registered = String(raw['REGISTERED POSITION'] ?? '').trim();
  if (!registered) {
    return null;
  }
  const entry = POSITION_ENTRIES.find(
    (item) => item.normalized === registered || item.source === registered,
  );
  return resolveLabel(entry, fav);
}

function resolveLabel(entry: PositionEntry | undefined, fav: FavSide): string | null {
  if (!entry) {
    return null;
  }
  if (fav === 'R' && entry.labels.R) {
    return entry.labels.R;
  }
  if (fav === 'L' && entry.labels.L) {
    return entry.labels.L;
  }
  return entry.labels.default ?? null;
}

function getFlag(raw: RawPlayer, key: string): number {
  const value = raw[key];
  if (typeof value === 'number') {
    return Math.round(value);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const num = Number(value);
    if (!Number.isNaN(num)) {
      return Math.round(num);
    }
  }
  return 0;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
}
