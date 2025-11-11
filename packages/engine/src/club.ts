import type { CalculationContext } from './types';

export function deriveClub(context: CalculationContext): string | null {
  const { raw, shopTags } = context;
  const name = getString(raw.NAME) ?? getString(raw.NOMBRE);
  if (name && shopTags) {
    const tag = shopTags.get(name.toLowerCase());
    if (tag) {
      return tag;
    }
  }

  const clubTeam =
    getString(raw['CLUB TEAM']) ?? getString(raw['CLUB']) ?? getString(raw['EQUIPO']);
  if (clubTeam) {
    return clubTeam;
  }

  const nationality =
    getString(raw.NACIONALIDAD) ?? getString(raw.NATIONALITY) ?? 'Desconocido';
  const classicNumber = raw['CLASSIC NUMBER'];
  if (classicNumber !== null && classicNumber !== undefined && classicNumber !== '') {
    return `Classic ${nationality}`;
  }

  return `Selección ${nationality}`;
}

function getString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}
