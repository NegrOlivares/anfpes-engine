import type { RawPlayer, RawValue } from '@anfpes/data-ingest';
import type { CalculationContext, DerivedFieldValue, DerivedPlayer } from './types';
import { deriveClub } from './club';
import {
  deriveDemarcationColumns,
  orientedWingFlags,
  positionFlags,
  getFavSide,
} from './positions';

type FieldMapping = {
  target: string;
  sources: string[];
  numeric?: boolean;
};

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
  { target: 'ATAQUE', sources: ['ATTACK'], numeric: true },
  { target: 'DEFENSA', sources: ['DEFENSE'], numeric: true },
  { target: 'ESTABILIDAD', sources: ['BALANCE'], numeric: true },
  { target: 'RESISTENCIA', sources: ['STAMINA'], numeric: true },
  { target: 'VELOCIDAD MÁXIMA', sources: ['TOP SPEED'], numeric: true },
  { target: 'ACELERACIÓN', sources: ['ACCELERATION'], numeric: true },
  { target: 'REPUESTA', sources: ['RESPONSE'], numeric: true },
  { target: 'AGILIDAD', sources: ['AGILITY'], numeric: true },
  { target: 'PRECISIÓN DRIBBLE', sources: ['DRIBBLE ACCURACY'], numeric: true },
  { target: 'VELOCIDAD DRIBBLE', sources: ['DRIBBLE SPEED'], numeric: true },
  { target: 'PRECISIÓN   P CORTO', sources: ['SHORT PASS ACCURACY'], numeric: true },
  { target: 'VELOCIDAD  P CORTO', sources: ['SHORT PASS SPEED'], numeric: true },
  { target: 'PRECISIÓN       P LARGO', sources: ['LONG PASS ACCURACY'], numeric: true },
  { target: 'VELOCIDAD     P LARGO', sources: ['LONG PASS SPEED'], numeric: true },
  { target: 'PRECISIÓN DISPARO', sources: ['SHOT ACCURACY'], numeric: true },
  { target: 'POTENCIA DISPARO', sources: ['SHOT POWER'], numeric: true },
  { target: 'TÉCNICA DISPARO', sources: ['SHOT TECHNIQUE'], numeric: true },
  { target: 'PRECISIÓN TIRO LIBRE', sources: ['FREE KICK ACCURACY'], numeric: true },
  { target: 'EFECTO', sources: ['SWERVE'], numeric: true },
  { target: 'CABEZAZO', sources: ['HEADING'], numeric: true },
  { target: 'SALTO', sources: ['JUMP'], numeric: true },
  { target: 'TÉCNICA', sources: ['TECHNIQUE'], numeric: true },
  { target: 'AGRESIVIDAD', sources: ['AGGRESSION'], numeric: true },
  { target: 'MENTALIDAD', sources: ['MENTALITY'], numeric: true },
  { target: 'ARQUERO', sources: ['GOALKEEPING'], numeric: true },
  { target: 'TRABAJO EN EQUIPO', sources: ['TEAMWORK'], numeric: true },
  { target: 'TOLERANCIA LESIONES', sources: ['INJURY TOLERANCE'] },
  { target: 'CONSISTENCIA', sources: ['CONSISTENCY'], numeric: true },
  { target: 'CONDICIÓN FITNESS', sources: ['CONDITION'], numeric: true },
  { target: 'PRECICIÓN PIE MALO', sources: ['WEAK FOOT ACCURACY'], numeric: true },
  { target: 'FRECUENCIA PIE MALO', sources: ['WEAK FOOT FREQUENCY'], numeric: true },
];

const ADDITIONAL_LOOKUPS: FieldMapping[] = [
  { target: 'REGATE', sources: ['DRIBBLING'], numeric: true },
  { target: 'HAB REGATE', sources: ['TACTICAL DRIBBLE'], numeric: true },
  { target: 'POSICION', sources: ['POSITIONING'], numeric: true },
  { target: 'REACCION', sources: ['REACTION'], numeric: true },
  { target: 'CAP MANDO', sources: ['PLAYMAKING'], numeric: true },
  { target: 'PASES', sources: ['PASSING'], numeric: true },
  { target: 'GOLEADOR', sources: ['SCORING'], numeric: true },
  { target: '1-1 GOL', sources: ['1-1 SCORING'], numeric: true },
  { target: 'JUG POSTE', sources: ['POST PLAYER'], numeric: true },
  { target: 'NO OFFSIDE', sources: ['LINES'], numeric: true },
  { target: 'MID SHOOT', sources: ['MIDDLE SHOOTING'], numeric: true },
  { target: 'LADO', sources: ['SIDE'], numeric: true },
  { target: 'CENTRO', sources: ['CENTRE'], numeric: true },
  { target: 'PENALES', sources: ['PENALTIES'], numeric: true },
  { target: 'PASE 1 TOQ', sources: ['1-TOUCH PASS'], numeric: true },
  { target: 'EXTERIOR', sources: ['OUTSIDE'], numeric: true },
  { target: 'MARCA MAN', sources: ['MARKING'], numeric: true },
  { target: 'ENTRADAS', sources: ['SLIDING'], numeric: true },
  { target: 'COBERTURA', sources: ['COVERING'], numeric: true },
  { target: 'SI OFFSIDE', sources: ['D-LINE CONTROL'], numeric: true },
  { target: 'PARAPENAL', sources: ['PENALTY STOPPER'], numeric: true },
  { target: 'ACHIQUE 1-1', sources: ['1-ON-1 STOPPER'], numeric: true },
  { target: 'SAQUE LARG', sources: ['LONG THROW'], numeric: true },
  { target: 'DORSAL_1', sources: ['SHIRT NAME'] },
  { target: 'nro selección', sources: ['INTERNATIONAL NUMBER'], numeric: true },
  { target: 'nro clasico', sources: ['CLASSIC NUMBER'], numeric: true },
  { target: 'SKIN COLOR', sources: ['SKIN COLOR'], numeric: true },
  { target: 'CLUB TEAM', sources: ['CLUB TEAM'] },
];

const POSITION_FLAG_KEYS = [
  { target: 'GK  0', source: 'GK' },
  { target: 'CWP  2', source: 'SWP' },
  { target: 'CBT  3', source: 'CB' },
  { target: 'SB  4', source: 'SB' },
  { target: 'DMF  5', source: 'DMF' },
  { target: 'WB  6', source: 'WB' },
  { target: 'CMF  7', source: 'CMF' },
  { target: 'SMF  8', source: 'SMF' },
  { target: 'AMF  9', source: 'AMF' },
  { target: 'WF 10', source: 'WF' },
  { target: 'SS  11', source: 'SS' },
  { target: 'CF  12', source: 'CF' },
] as const;

const WING_COLUMNS = ['RB', 'LB', 'RWB', 'LWB', 'RMF', 'LMF', 'RWF', 'LWF'] as const;

const REGISTERED_LABEL_TO_CODE: Record<string, number> = {
  GK: 0,
  SWP: 2,
  CB: 3,
  SB: 4,
  RB: 4,
  LB: 4,
  DMF: 5,
  WB: 6,
  RWB: 6,
  LWB: 6,
  CMF: 7,
  SMF: 8,
  RMF: 8,
  LMF: 8,
  AMF: 9,
  WF: 10,
  RWF: 10,
  LWF: 10,
  SS: 11,
  CF: 12,
};

type PromedioPositionEntry = {
  codes: number[];
  key: keyof RatingsByPosition;
};

const PROMEDIO_POSITION_MAP: PromedioPositionEntry[] = [
  { codes: [0, 1], key: 'PT' },
  { codes: [2, 3], key: 'CT/LIB' },
  { codes: [4], key: 'SA' },
  { codes: [6], key: 'LA' },
  { codes: [5], key: 'CCD' },
  { codes: [7], key: 'CC' },
  { codes: [8], key: 'VOL' },
  { codes: [9], key: 'MP' },
  { codes: [10], key: 'EX' },
  { codes: [11], key: 'SD' },
  { codes: [12], key: 'DC' },
];

const SPEED_FACTOR = (1 / 1.3 + 0.5) / 2;

type NormalizedRaw = Record<string, DerivedFieldValue>;

export function computeDerivedPlayer(context: CalculationContext): DerivedPlayer {
  const normalizedRaw = normalizeRawValues(context.raw);
  const player: DerivedPlayer = { ID: ensureId(normalizedRaw.ID) };

  assignFromMappings(player, normalizedRaw, BASIC_MAPPINGS);
  player.CLUB = deriveClub(context);

  const favSide = getFavSide(context.raw);
  player['FAVOURED SIDE'] = favSide;

  const demarcations = deriveDemarcationColumns(context.raw);
  Object.entries(demarcations).forEach(([key, value]) => {
    player[key] = value;
  });

  const registeredCode = deriveRegisteredPositionCode(demarcations);
  player['REGISTERED POSITION'] = registeredCode;

  assignFromMappings(player, normalizedRaw, STAT_MAPPINGS);
  assignFromMappings(player, normalizedRaw, ADDITIONAL_LOOKUPS);

  const positionMap = positionFlags(context.raw);
  POSITION_FLAG_KEYS.forEach(({ target, source }) => {
    player[target] = positionMap[source] ?? 0;
  });

  const wings = orientedWingFlags(context.raw);
  WING_COLUMNS.forEach((key) => {
    player[key] = wings[key] ?? 0;
  });

  const composites = computeCompositeMetrics(player);
  Object.entries(composites).forEach(([key, value]) => {
    player[key] = value;
  });

  const ratings = computePositionRatings(player);
  Object.entries(ratings).forEach(([key, value]) => {
    player[key] = value;
  });

  player.PROMEDIO = computePromedio(player, ratings, registeredCode);

  const mejorPromedio = computeMejorPromedio(ratings);
  player['MEJOR PROMEDIO'] = mejorPromedio;
  player['PROMEDIO CENSANTE'] = computePromedioCensante(player, mejorPromedio);

  const finales = computeFinalAttributes(player);
  Object.entries(finales).forEach(([key, value]) => {
    player[key] = value;
  });

  return player;
}

export function computeDerivedPlayers(rows: CalculationContext[]): DerivedPlayer[] {
  return rows.map((context) => computeDerivedPlayer(context));
}

function normalizeRawValues(raw: RawPlayer): NormalizedRaw {
  const normalized: NormalizedRaw = {};
  Object.entries(raw).forEach(([key, value]) => {
    normalized[key] = normalizeRawValue(value);
  });
  return normalized;
}

function normalizeRawValue(value: RawValue): DerivedFieldValue {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value === undefined) {
    return null;
  }
  return value;
}

function assignFromMappings(
  target: Record<string, DerivedFieldValue>,
  raw: NormalizedRaw,
  mappings: FieldMapping[],
) {
  mappings.forEach(({ target: column, sources, numeric }) => {
    const value = pickFirst(raw, sources, Boolean(numeric));
    target[column] = value ?? null;
  });
}

function pickFirst(
  raw: NormalizedRaw,
  sources: string[],
  numeric: boolean,
): DerivedFieldValue | undefined {
  for (const source of sources) {
    const value = raw[source];
    if (value !== undefined && value !== null && value !== '') {
      if (numeric) {
        const parsed = toNumber(value);
        if (parsed !== null) {
          return parsed;
        }
      } else {
        return value;
      }
    }
  }
  return undefined;
}

function deriveRegisteredPositionCode(
  demarcations: Record<string, string | null>,
): number | null {
  const primary = demarcations.D ?? null;
  if (!primary) {
    return null;
  }
  return REGISTERED_LABEL_TO_CODE[primary] ?? null;
}

function computeCompositeMetrics(player: DerivedPlayer): Record<string, number> {
  const attack = num(player.ATAQUE);
  const defensa = num(player.DEFENSA);
  const respuesta = num(player.REPUESTA);
  const agresividad = num(player.AGRESIVIDAD);
  const precisionDisparo = num(player['PRECISIÓN DISPARO']);
  const tecnicaDisparo = num(player['TÉCNICA DISPARO']);
  const tecnica = num(player['TÉCNICA']);
  const precisionDribble = num(player['PRECISIÓN DRIBBLE']);
  const precisionPaseCorto = num(player['PRECISIÓN   P CORTO']);
  const precisionPaseLargo = num(player['PRECISIÓN       P LARGO']);
  const precisionTiroLibre = num(player['PRECISIÓN TIRO LIBRE']);
  const efecto = num(player.EFECTO);
  const velocidadDribble = num(player['VELOCIDAD DRIBBLE']);
  const velocidadMax = num(player['VELOCIDAD MÁXIMA']);
  const aceleracion = num(player.ACELERACIÓN);
  const agilidad = num(player.AGILIDAD);
  const velocidadPaseCorto = num(player['VELOCIDAD  P CORTO']);
  const velocidadPaseLargo = num(player['VELOCIDAD     P LARGO']);
  const potenciaDisparo = num(player['POTENCIA DISPARO']);
  const trabajoEquipo = num(player['TRABAJO EN EQUIPO']);
  const mentalidad = num(player.MENTALIDAD);
  const estabilidad = num(player.ESTABILIDAD);
  const resistencia = num(player.RESISTENCIA);
  const salto = num(player.SALTO);
  const cabezazo = num(player.CABEZAZO);
  const reaccion = num(player.REACCION);
  const jugPoste = num(player['JUG POSTE']);

  const destrezaAtaque = Math.max(
    (2 / 3) * attack + (1 / 3) * respuesta,
    (2 / 3) * attack + (1 / 3) * agresividad,
  );

  const finiquito = precisionDisparo * 0.84 + tecnicaDisparo * 0.16;
  const velocidad = velocidadDribble * (1 - SPEED_FACTOR) + velocidadMax * SPEED_FACTOR;
  const explosividad = (2 * agilidad + aceleracion) / 3;
  const promedioAgilidades = (velocidad + explosividad) / 2;
  const potenciaPatada =
    Math.max(potenciaDisparo, velocidadPaseLargo, velocidadPaseCorto) * 0.4 +
    (0.6 / 3) * (potenciaDisparo + velocidadPaseLargo + velocidadPaseCorto);
  const destrezaDefensa = Math.max(
    (2 / 3) * defensa + (1 / 3) * respuesta,
    (2 / 3) * defensa + (1 / 3) * trabajoEquipo,
  );
  const recuperacionBalon = Math.max(
    (2 / 3) * defensa + (1 / 3) * estabilidad,
    (2 / 3) * defensa + (1 / 3) * mentalidad,
  );

  const alturaFactor = (num(player.ALTURA) * 99) / 203;
  const juegoAereo =
    ((alturaFactor + salto) / 2) * 0.35 +
    cabezazo * 0.45 +
    respuesta * 0.1 +
    estabilidad * 0.1 +
    reaccion;

  const aletismo =
    estabilidad * 0.3 +
    respuesta * 0.2 +
    resistencia * 0.1 +
    potenciaPatada * 0.1 +
    promedioAgilidades * 0.2 +
    juegoAereo * 0.1 +
    reaccion +
    jugPoste;

  const creatividad =
    tecnica * 0.1 +
    precisionTiroLibre * 0.025 +
    efecto * 0.025 +
    precisionPaseLargo * 0.25 +
    precisionPaseCorto * 0.25 +
    precisionDribble * 0.2 +
    respuesta * 0.05 +
    precisionDisparo * 0.05 +
    trabajoEquipo * 0.05 +
    num(player.REGATE) +
    num(player['HAB REGATE']) * 0.5 +
    num(player['CAP MANDO']) +
    num(player.PASES) +
    num(player['PASE 1 TOQ']) * 0.5;

  return {
    'DESTREZA ATAQUE': destrezaAtaque,
    FINIQUITO: finiquito,
    VELOCIDAD: velocidad,
    EXPLOSIVIDAD: explosividad,
    'PROMEDIO AGILIDADES': promedioAgilidades,
    'POTENCIA DE PATADA': potenciaPatada,
    'DESTREZA DEFENSA': destrezaDefensa,
    'RECUPERACION DE BALÓN': recuperacionBalon,
    ALETISMO: aletismo,
    'JUEGO AEREO': juegoAereo,
    CREATIVIDAD: creatividad,
  };
}

type RatingsByPosition = Record<
  'PT' | 'CT/LIB' | 'SA' | 'LA' | 'CCD' | 'CC' | 'VOL' | 'MP' | 'EX' | 'SD' | 'DC',
  number | null
>;

function computePositionRatings(player: DerivedPlayer): RatingsByPosition {
  const formulas: Record<keyof RatingsByPosition, { terms: number[]; constant: number }> =
    {
      PT: {
        terms: [
          ((2 * num(player.ARQUERO) + num(player.DEFENSA)) / 3 - 25) * 0.52,
          (num(player.REPUESTA) - 25) * 0.52,
          (num(player.ESTABILIDAD) - 25) * 0.12,
          (num(player.SALTO) - 25) * 0.12,
        ],
        constant: 7,
      },
      'CT/LIB': {
        terms: [
          (num(player.CABEZAZO) - 25) * 0.2,
          (num(player['DESTREZA DEFENSA']) - 25) * 0.27,
          (num(player['RECUPERACION DE BALÓN']) - 25) * 0.27,
          (num(player.VELOCIDAD) - 25) * 0.11,
          (num(player.ESTABILIDAD) - 25) * 0.21,
          (num(player.SALTO) - 25) * 0.21,
          (num(player.RESISTENCIA) - 25) * 0.1,
        ],
        constant: 7,
      },
      SA: {
        terms: [
          (num(player['DESTREZA ATAQUE']) - 25) * 0.06,
          (num(player['TÉCNICA']) - 25) * 0.1,
          (num(player['PRECISIÓN DRIBBLE']) - 25) * 0.15,
          (num(player['PRECISIÓN       P LARGO']) - 25) * 0.15,
          (num(player['DESTREZA DEFENSA']) - 25) * 0.15,
          (num(player['RECUPERACION DE BALÓN']) - 25) * 0.14,
          (num(player.VELOCIDAD) - 25) * 0.15,
          (num(player.EXPLOSIVIDAD) - 25) * 0.15,
          (num(player.ESTABILIDAD) - 25) * 0.12,
          (num(player.SALTO) - 25) * 0.12,
          (num(player.RESISTENCIA) - 25) * 0.13,
        ],
        constant: 8,
      },
      LA: {
        terms: [
          (num(player['DESTREZA ATAQUE']) - 25) * 0.06,
          (num(player['TÉCNICA']) - 25) * 0.1,
          (num(player['PRECISIÓN DRIBBLE']) - 25) * 0.15,
          (num(player['PRECISIÓN       P LARGO']) - 25) * 0.15,
          (num(player['DESTREZA DEFENSA']) - 25) * 0.15,
          (num(player['RECUPERACION DE BALÓN']) - 25) * 0.14,
          (num(player.VELOCIDAD) - 25) * 0.15,
          (num(player.EXPLOSIVIDAD) - 25) * 0.15,
          (num(player.ESTABILIDAD) - 25) * 0.12,
          (num(player.SALTO) - 25) * 0.12,
          (num(player.RESISTENCIA) - 25) * 0.13,
        ],
        constant: 8,
      },
      CCD: {
        terms: [
          (num(player['DESTREZA ATAQUE']) - 25) * 0.07,
          (num(player['TÉCNICA']) - 25) * 0.19,
          (num(player['PRECISIÓN DRIBBLE']) - 25) * 0.16,
          (num(player['PRECISIÓN   P CORTO']) - 25) * 0.19,
          (num(player['PRECISIÓN       P LARGO']) - 25) * 0.2,
          (num(player.EFECTO) - 25) * 0.13,
          (num(player['DESTREZA DEFENSA']) - 25) * 0.07,
          (num(player['RECUPERACION DE BALÓN']) - 25) * 0.03,
          (num(player.VELOCIDAD) - 25) * 0.03,
          (num(player.EXPLOSIVIDAD) - 25) * 0.03,
          (num(player.ESTABILIDAD) - 25) * 0.14,
          (num(player.SALTO) - 25) * 0.05,
          (num(player.RESISTENCIA) - 25) * 0.15,
        ],
        constant: 8,
      },
      CC: {
        terms: [
          (num(player['DESTREZA ATAQUE']) - 25) * 0.05,
          (num(player['TÉCNICA']) - 25) * 0.25,
          (num(player['PRECISIÓN DRIBBLE']) - 25) * 0.25,
          (num(player['PRECISIÓN   P CORTO']) - 25) * 0.25,
          (num(player['PRECISIÓN       P LARGO']) - 25) * 0.22,
          (num(player['DESTREZA DEFENSA']) - 25) * 0.03,
          (num(player.VELOCIDAD) - 25) * 0.04,
          (num(player.EXPLOSIVIDAD) - 25) * 0.06,
          (num(player.ESTABILIDAD) - 25) * 0.05,
          (num(player.RESISTENCIA) - 25) * 0.18,
        ],
        constant: 7,
      },
      VOL: {
        terms: [
          (num(player['DESTREZA ATAQUE']) - 25) * 0.07,
          (num(player['TÉCNICA']) - 25) * 0.16,
          (num(player['PRECISIÓN DRIBBLE']) - 25) * 0.26,
          (num(player['PRECISIÓN   P CORTO']) - 25) * 0.07,
          (num(player['PRECISIÓN       P LARGO']) - 25) * 0.13,
          (num(player.EFECTO) - 25) * 0.04,
          (num(player.VELOCIDAD) - 25) * 0.26,
          (num(player.EXPLOSIVIDAD) - 25) * 0.23,
          (num(player.RESISTENCIA) - 25) * 0.14,
        ],
        constant: 7,
      },
      MP: {
        terms: [
          (num(player['DESTREZA ATAQUE']) - 25) * 0.15,
          (num(player['TÉCNICA']) - 25) * 0.23,
          (num(player['PRECISIÓN DRIBBLE']) - 25) * 0.23,
          (num(player['PRECISIÓN   P CORTO']) - 25) * 0.23,
          (num(player['PRECISIÓN       P LARGO']) - 25) * 0.15,
          (num(player.FINIQUITO) - 25) * 0.18,
          (num(player.VELOCIDAD) - 25) * 0.05,
          (num(player.EXPLOSIVIDAD) - 25) * 0.07,
          (num(player.ESTABILIDAD) - 25) * 0.05,
          (num(player.RESISTENCIA) - 25) * 0.03,
        ],
        constant: 7,
      },
      EX: {
        terms: [
          (num(player['DESTREZA ATAQUE']) - 25) * 0.18,
          (num(player['TÉCNICA']) - 25) * 0.22,
          (num(player['PRECISIÓN DRIBBLE']) - 25) * 0.22,
          (num(player['PRECISIÓN   P CORTO']) - 25) * 0.05,
          (num(player['PRECISIÓN       P LARGO']) - 25) * 0.1,
          (num(player.FINIQUITO) - 25) * 0.12,
          (num(player['POTENCIA DE PATADA']) - 25) * 0.05,
          (num(player.VELOCIDAD) - 25) * 0.16,
          (num(player.EXPLOSIVIDAD) - 25) * 0.16,
          (num(player.ESTABILIDAD) - 25) * 0.06,
          (num(player.RESISTENCIA) - 25) * 0.06,
        ],
        constant: 9,
      },
      SD: {
        terms: [
          (num(player['DESTREZA ATAQUE']) - 25) * 0.16,
          (num(player['TÉCNICA']) - 25) * 0.2,
          (num(player['PRECISIÓN DRIBBLE']) - 25) * 0.2,
          (num(player['PRECISIÓN   P CORTO']) - 25) * 0.1,
          (num(player['PRECISIÓN       P LARGO']) - 25) * 0.1,
          (num(player.FINIQUITO) - 25) * 0.15,
          (num(player['POTENCIA DE PATADA']) - 25) * 0.06,
          (num(player.VELOCIDAD) - 25) * 0.1,
          (num(player.EXPLOSIVIDAD) - 25) * 0.2,
          (num(player.ESTABILIDAD) - 25) * 0.07,
          (num(player.RESISTENCIA) - 25) * 0.04,
        ],
        constant: 7,
      },
      DC: {
        terms: [
          (num(player['DESTREZA ATAQUE']) - 25) * 0.33,
          (num(player['TÉCNICA']) - 25) * 0.25,
          (num(player['PRECISIÓN DRIBBLE']) - 25) * 0.15,
          (num(player.FINIQUITO) - 25) * 0.38,
          (num(player.CABEZAZO) - 25) * 0.03,
          (num(player.VELOCIDAD) - 25) * 0.05,
          (num(player.EXPLOSIVIDAD) - 25) * 0.05,
          (num(player.ESTABILIDAD) - 25) * 0.1,
          (num(player.SALTO) - 25) * 0.03,
        ],
        constant: 7,
      },
    };

  const ratings = Object.entries(formulas).reduce<RatingsByPosition>(
    (acc, [key, { terms, constant }]) => {
      acc[key as keyof RatingsByPosition] = computeRating(terms, constant);
      return acc;
    },
    {
      PT: null,
      'CT/LIB': null,
      SA: null,
      LA: null,
      CCD: null,
      CC: null,
      VOL: null,
      MP: null,
      EX: null,
      SD: null,
      DC: null,
    },
  );

  if (String(player.ID) === '1436') {
    const maradona = formulas.EX;
    ratings.EX = computeRating(maradona.terms, maradona.constant, 105);
  }

  return ratings;
}

function computeRating(terms: number[], constant: number, divisor = 103): number {
  const sum = terms.reduce((acc, value) => acc + value, 0);
  const rounded = Math.round(sum + constant);
  return (rounded * 99) / divisor;
}

function computePromedio(
  player: DerivedPlayer,
  ratings: RatingsByPosition,
  registeredCode: number | null,
): number | null {
  if (registeredCode === null) {
    return null;
  }
  const entry = PROMEDIO_POSITION_MAP.find(({ codes }) => codes.includes(registeredCode));
  if (!entry) {
    return null;
  }
  const value = ratings[entry.key];
  if (typeof value !== 'number') {
    return null;
  }
  return Math.round(value);
}

function computeMejorPromedio(ratings: RatingsByPosition): number | null {
  const numeric = Object.values(ratings).filter(
    (value): value is number => typeof value === 'number',
  );
  if (!numeric.length) {
    return null;
  }
  return Math.max(...numeric);
}

function computePromedioCensante(
  player: DerivedPlayer,
  mejorPromedio: number | null,
): number | null {
  const promedio = toNumber(player.PROMEDIO);
  if (promedio === null || mejorPromedio === null) {
    return null;
  }

  const destrezaAtaque = num(player['DESTREZA ATAQUE']);
  const destrezaDefensa = num(player['DESTREZA DEFENSA']);
  const aletismo = num(player.ALETISMO);
  const creatividad = num(player.CREATIVIDAD);
  const promedioAgilidades = num(player['PROMEDIO AGILIDADES']);
  const consistencia = num(player.CONSISTENCIA);
  const condicion = num(player['CONDICIÓN FITNESS']);
  const tolerancia = convertTolerancia(player['TOLERANCIA LESIONES']);
  const estabilidad = num(player.ESTABILIDAD);
  const respuesta = num(player.REPUESTA);
  const agilidad = num(player.AGILIDAD);

  const base =
    Math.max(destrezaAtaque, destrezaDefensa) * 0.2 +
    ((destrezaAtaque + destrezaDefensa) / 2) * 0.1 +
    aletismo * 0.1 +
    creatividad * 0.1 +
    promedioAgilidades * 0.1 +
    promedio * 0.2 +
    mejorPromedio * 0.1 +
    ((consistencia * 99) / 8) * 0.02 +
    ((condicion * 99) / 8) * 0.03 +
    tolerancia * 0.02 +
    estabilidad * 0.1 +
    respuesta * 0.05 +
    agilidad * 0.05;

  const rounded = Math.round(base);
  return (rounded * 99) / 106;
}

function convertTolerancia(value: DerivedFieldValue): number {
  const text = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (text === 'R' || text === 'A') return 99;
  if (text === 'B') return 67;
  if (text === 'L' || text === 'C') return 33;
  return 0;
}

function computeFinalAttributes(player: DerivedPlayer): Record<string, number> {
  return {
    ATK: num(player.ATAQUE) * 0.75 + num(player['PRECISIÓN DISPARO']) * 0.25,
    TEC:
      num(player['TÉCNICA']) * 0.4 +
      num(player['PRECISIÓN DRIBBLE']) * 0.3 +
      num(player['PRECISIÓN   P CORTO']) * 0.1 +
      num(player['PRECISIÓN       P LARGO']) * 0.05 +
      num(player['PRECISIÓN TIRO LIBRE']) * 0.1 +
      num(player.EFECTO) * 0.05,
    RES: num(player.RESISTENCIA),
    DEF: num(player.DEFENSA),
    FUE:
      num(player.ESTABILIDAD) * 0.6 +
      num(player.SALTO) * 0.3 +
      num(player['POTENCIA DISPARO']) * 0.1,
    VEL:
      num(player['VELOCIDAD MÁXIMA']) * 0.2 +
      num(player.ACELERACIÓN) * 0.3 +
      num(player.REPUESTA) * 0.2 +
      num(player['VELOCIDAD DRIBBLE']) * 0.3,
  };
}

function ensureId(value: DerivedFieldValue): string {
  if (value === null || value === undefined || value === '') {
    throw new Error('Derived player without ID');
  }
  return String(value);
}

function toNumber(value: DerivedFieldValue): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value.replace(',', '.'));
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
}

function num(value: DerivedFieldValue, fallback = 0): number {
  const parsed = toNumber(value);
  return parsed ?? fallback;
}
