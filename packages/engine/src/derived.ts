import type { DerivedPlayer, CalculationContext, DerivedFieldValue } from './types';
import { deriveClub } from './club';
import { average } from './excel/functions';

interface FieldMapping {
  target: string;
  sources: string[];
}

const BASIC_MAPPINGS: FieldMapping[] = [
  { target: 'NOMBRE', sources: ['NOMBRE', 'NAME'] },
  { target: 'NACIONALIDAD', sources: ['NACIONALIDAD', 'NATIONALITY'] },
  { target: 'DORSAL', sources: ['DORSAL', 'CLUB NUMBER'] },
  { target: 'ALTURA', sources: ['ALTURA', 'HEIGHT'] },
  { target: 'PESO', sources: ['PESO', 'WEIGHT'] },
  { target: 'EDAD', sources: ['EDAD', 'AGE'] },
  { target: 'PIE', sources: ['PIE', 'STRONG FOOT'] },
];

const STAT_MAPPINGS: FieldMapping[] = [
  { target: 'ATAQUE', sources: ['ATTACK'] },
  { target: 'DEFENSA', sources: ['DEFENSE'] },
  { target: 'ESTABILIDAD', sources: ['BALANCE'] },
  { target: 'RESISTENCIA', sources: ['STAMINA'] },
  { target: 'VELOCIDAD MAXIMA', sources: ['TOP SPEED'] },
  { target: 'ACELERACION', sources: ['ACCELERATION'] },
  { target: 'RESPUESTA', sources: ['RESPONSE'] },
  { target: 'AGILIDAD', sources: ['AGILITY'] },
  { target: 'PRECISION DRIBBLE', sources: ['DRIBBLE ACCURACY'] },
  { target: 'VELOCIDAD DRIBBLE', sources: ['DRIBBLE SPEED'] },
  { target: 'PRECISION P CORTO', sources: ['SHORT PASS ACCURACY'] },
  { target: 'VELOCIDAD P CORTO', sources: ['SHORT PASS SPEED'] },
  { target: 'PRECISION P LARGO', sources: ['LONG PASS ACCURACY'] },
  { target: 'VELOCIDAD P LARGO', sources: ['LONG PASS SPEED'] },
  { target: 'PRECISION DISPARO', sources: ['SHOT ACCURACY'] },
  { target: 'POTENCIA DISPARO', sources: ['SHOT POWER'] },
  { target: 'TECNICA DISPARO', sources: ['SHOT TECHNIQUE'] },
  { target: 'PRECISION TIRO LIBRE', sources: ['FREE KICK ACCURACY'] },
  { target: 'EFECTO', sources: ['CURVE'] },
  { target: 'CABEZAZO', sources: ['HEADING'] },
  { target: 'SALTO', sources: ['JUMP'] },
  { target: 'TECNICA', sources: ['TECHNIQUE'] },
  { target: 'AGRESIVIDAD', sources: ['AGGRESSION'] },
  { target: 'MENTALIDAD', sources: ['MENTALITY'] },
  { target: 'ARQUERO', sources: ['GOALKEEPING'] },
  { target: 'TRABAJO EN EQUIPO', sources: ['TEAMWORK'] },
  { target: 'TOLERANCIA LESIONES', sources: ['INJURY TOLERANCE'] },
  { target: 'CONSISTENCIA', sources: ['CONSISTENCY'] },
  { target: 'CONDICION FITNESS', sources: ['FORM'] },
  { target: 'PRECISION PIE MALO', sources: ['WEAK FOOT ACCURACY'] },
  { target: 'FRECUENCIA PIE MALO', sources: ['WEAK FOOT FREQUENCY'] },
];

export function computeDerivedPlayer(context: CalculationContext): DerivedPlayer {
  const result: DerivedPlayer = {
    ID: ensureId(context.raw.ID),
  };

  assignFromMappings(result, context.raw, BASIC_MAPPINGS);
  result.CLUB = deriveClub(context);

  assignFromMappings(result, context.raw, STAT_MAPPINGS, true);

  result.PROMEDIO = average(
    STAT_MAPPINGS.map(({ target }) => {
      const value = result[target];
      return typeof value === 'number' ? value : null;
    }),
  );

  return result;
}

export function computeDerivedPlayers(rows: CalculationContext[]): DerivedPlayer[] {
  return rows.map((context) => computeDerivedPlayer(context));
}

function assignFromMappings(
  target: Record<string, DerivedFieldValue>,
  raw: Record<string, DerivedFieldValue>,
  mappings: FieldMapping[],
  numeric = false,
) {
  mappings.forEach(({ target: column, sources }) => {
    const value = pickFirst(raw, sources, numeric);
    if (value !== undefined) {
      target[column] = value;
    } else {
      target[column] = null;
    }
  });
}

function pickFirst(
  raw: Record<string, DerivedFieldValue>,
  sources: string[],
  numeric: boolean,
): DerivedFieldValue | undefined {
  for (const source of sources) {
    const value = raw[source];
    if (value !== undefined && value !== null && value !== '') {
      if (numeric) {
        const num = toNumber(value);
        if (num !== null) {
          return num;
        }
      } else {
        return value;
      }
    }
  }
  return undefined;
}

function ensureId(value: DerivedFieldValue): string {
  if (value === null || value === undefined || value === '') {
    throw new Error('Derived player without ID');
  }
  return String(value);
}

function toNumber(value: DerivedFieldValue): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
}
