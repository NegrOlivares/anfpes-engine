import type { CalculationContext } from './types';

export function deriveClub(context: CalculationContext): string | null {
  const { raw, shopTags } = context;

  const clubTeam = normalizeString(raw['CLUB TEAM']);
  if (clubTeam && clubTeam !== '0') {
    return clubTeam;
  }

  const nationality =
    normalizeString(raw.NACIONALIDAD) ??
    normalizeString(raw.NATIONALITY) ??
    'Desconocido';

  const internationalNumber = toNumber(raw['INTERNATIONAL NUMBER']);
  if (internationalNumber && internationalNumber > 0) {
    return `Selección ${nationality}`;
  }

  const classicNumber = toNumber(raw['CLASSIC NUMBER']);
  if (classicNumber && classicNumber > 0) {
    return `Classic ${nationality}`;
  }

  const name = normalizeString(raw.NAME) ?? normalizeString(raw.NOMBRE);
  if (name && shopTags) {
    const tag = shopTags.get(name.toLowerCase());
    if (tag) {
      return tag;
    }
  }

  return 'Libre';
}

function normalizeString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
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
