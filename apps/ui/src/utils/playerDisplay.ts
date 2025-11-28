import type { DerivedPlayer } from '@anfpes/engine';
import { getNationalityInfo } from '../data/nationalities';
import { formatPlayerValue } from './format';

const CONNECTORS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'en', 'o', 'al']);

const FIELD_ALIASES: Record<string, string> = {
  'CT/LIB': 'CT',
};

const FIELD_LABEL_OVERRIDES: Record<string, string> = {
  NACIONALIDAD: 'País',
  DORSAL: 'Número Dorsal',
  'SKIN COLOR': 'Tono de Piel',
  'nro selección': 'Seleccionado Nacional',
  'nro clasico': 'Selección Clásica',
  'FAVOURED SIDE': 'Lado Preferido',
  POSICIONES: 'Posiciones',
  REPUESTA: 'Respuesta',
  'VELOCIDAD MÁXIMA': 'Velocidad Máxima',
  ACELERACIÓN: 'Aceleración',
  'VELOCIDAD DRIBBLE': 'Velocidad de Conducción',
  'PRECISIÓN DRIBBLE': 'Precisión de Conducción',
  'PRECISIÓN   P CORTO': 'Precisión de Pase Corto',
  'VELOCIDAD  P CORTO': 'Velocidad de Pase Corto',
  'PRECISIÓN       P LARGO': 'Precisión de Pase Largo',
  'VELOCIDAD     P LARGO': 'Velocidad de Pase Largo',
  'PRECISIÓN DISPARO': 'Precisión de Disparo',
  'POTENCIA DISPARO': 'Potencia de Disparo',
  'TÉCNICA DISPARO': 'Técnica de Disparo',
  'PRECISIÓN TIRO LIBRE': 'Precisión Tiro Libre',
  ARQUERO: 'Cualidades de Portero',
  'TRABAJO EN EQUIPO': 'Trabajo en Equipo',
  'TOLERANCIA LESIONES': 'Tolerancia a las Lesiones',
  'CONDICIÓN FITNESS': 'Condición Física',
  'PRECICIÓN PIE MALO': 'Precisión de Pie Malo',
  'FRECUENCIA PIE MALO': 'Frecuencia de Pie Malo',
  'RECUPERACION DE BALÓN': 'Recuperación de Balón',
  'JUEGO AEREO': 'Juego Aéreo',
  'HAB REGATE': 'Habilidad de Regate',
  'CAP MANDO': 'Capacidad de Mando',
  PIE: 'Pie Hábil',
  ALETISMO: 'Atletismo',
  REACCION: 'Reacción',

  PROMEDIO: 'Promedio Principal',
  PT: 'Promedio PT',
  LIB: 'Promedio LIB',
  CT: 'Promedio CT',
  SA: 'Promedio SA',
  LA: 'Promedio LA',
  CCD: 'Promedio CCD',
  CC: 'Promedio CC',
  VOL: 'Promedio VOL',
  MP: 'Promedio MP',
  EX: 'Promedio EX',
  SD: 'Promedio SD',
  DC: 'Promedio DC',
  '1-1 GOL': 'Definición Uno contra Uno',
  'JUG POSTE': 'Jugador Poste',
  'NO OFFSIDE': 'Evadir Offside',
  PENALES: 'Pateador de Penales',
  POSICION: 'Posicionamiento',
  'MARCA MAN': 'Marcaje al Hombre',
  PARAPENAL: 'Ataja Penales',
  'ACHIQUE 1-1': 'Achique Uno contra Uno',
  'SAQUE LARG': 'Saque de Banda Largo',
  'MID SHOOT': 'Disparo de Media Distancia',
  'PASE 1 TOQ': 'Pase a Un Toque',
  'SI OFFSIDE': 'Trampa del Offside',
  ATK: 'ATK',
  TEC: 'TEC',
  RES: 'RES',
  DEF: 'DEF',
  FUE: 'FUE',
  VEL: 'VEL',
};

export const SPECIAL_SKILL_FIELDS = new Set<string>([
  'REGATE',
  'HAB REGATE',
  'POSICION',
  'REACCION',
  'CAP MANDO',
  'PASES',
  'GOLEADOR',
  '1-1 GOL',
  'JUG POSTE',
  'NO OFFSIDE',
  'MID SHOOT',
  'LADO',
  'CENTRO',
  'PENALES',
  'PASE 1 TOQ',
  'EXTERIOR',
  'MARCA MAN',
  'ENTRADAS',
  'COBERTURA',
  'SI OFFSIDE',
  'PARAPENAL',
  'ACHIQUE 1-1',
  'SAQUE LARG',
]);

const EXCLUDED_FIELDS = new Set<string>([
  'ID',
  'NOMBRE',
  'CLUB TEAM',
  'PROMEDIO CENSANTE',
  'REGISTERED POSITION',
  'DORSAL_1',
  'GK  0',
  'CWP  2',
  'CBT  3',
  'SB  4',
  'DMF  5',
  'WB  6',
  'CMF  7',
  'SMF  8',
  'AMF  9',
  'WF 10',
  'SS  11',
  'CF  12',
  'RB',
  'LB',
  'RWB',
  'LWB',
  'RMF',
  'LMF',
  'RWF',
  'LWF',
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
  'CT/LIB',
]);

const FOOT_MAP = {
  R: 'Derecho',
  L: 'Izquierdo',
  B: 'Ambos',
} as const;

const SKIN_TONES = {
  '1': 'Claro',
  '2': 'Medio',
  '3': 'Moreno',
  '4': 'Negro',
} as const;

const SELECTION_PREFIX = /^selección\s+/i;
const CLASSIC_PREFIX = /^classic\s+/i;
const STAR = '★';

function prettifyField(field: string): string {
  return field
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index > 0 && CONNECTORS.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export function normalizeFieldKey(field: string): string {
  const trimmed = field.trim();
  return FIELD_ALIASES[trimmed] ?? trimmed;
}

export function getFieldLabel(field: string): string {
  const canonical = normalizeFieldKey(field);
  return FIELD_LABEL_OVERRIDES[canonical] ?? prettifyField(canonical);
}

export function shouldDisplayField(field: string): boolean {
  const canonical = normalizeFieldKey(field);
  return !EXCLUDED_FIELDS.has(field) && !EXCLUDED_FIELDS.has(canonical);
}

export function formatNationality(value?: string | null): string {
  if (!value) {
    return '-';
  }
  const info = getNationalityInfo(value);
  return info?.name ?? value;
}

export function formatClub(club?: string | null, nationality?: string | null): string {
  if (!club) {
    return '-';
  }

  if (SELECTION_PREFIX.test(club)) {
    const rawNation = club.replace(SELECTION_PREFIX, '').trim();
    const info = getNationalityInfo(rawNation) ?? getNationalityInfo(nationality);
    const demonym = info?.demonym;
    if (demonym) {
      return `Selección ${demonym}`;
    }
    return `Selección ${rawNation}`;
  }

  if (CLASSIC_PREFIX.test(club)) {
    const rawNation = club.replace(CLASSIC_PREFIX, '').trim();
    const info = getNationalityInfo(rawNation) ?? getNationalityInfo(nationality);
    const name = info?.name ?? rawNation;
    return `${name} Clásico`;
  }

  return club;
}

export function formatFoot(value?: string | null): string {
  if (!value) {
    return '-';
  }
  return FOOT_MAP[value as keyof typeof FOOT_MAP] ?? value;
}

export function formatSkinTone(value: unknown): string {
  if (value === null || value === undefined) {
    return '-';
  }
  const key = String(value);
  return SKIN_TONES[key as keyof typeof SKIN_TONES] ?? key;
}

export function formatSelectionDisplay(value: unknown): string {
  if (value === null || value === undefined) {
    return 'No';
  }
  if (typeof value === 'number') {
    return value > 0 ? value.toString() : 'No';
  }
  const text = String(value).trim();
  if (!text || text === '0') {
    return 'No';
  }
  return text;
}

function formatSelectionFilter(value: unknown): string {
  if (value === null || value === undefined) {
    return 'No';
  }
  if (typeof value === 'number') {
    return value > 0 ? 'Si' : 'No';
  }
  const text = String(value).trim();
  if (!text || text === '0') {
    return 'No';
  }
  return 'Si';
}

export function formatDorsal(value: unknown): string {
  if (value === null || value === undefined) {
    return 'No';
  }
  const num = Number(value);
  if (!num) {
    return 'No';
  }
  return num.toString();
}

function formatSpecialSkill(value: unknown): string {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? STAR : '';
}

function formatSpecialSkillFilter(value: unknown): string {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? 'Si' : 'No';
}

export function getFieldDisplayValue(
  field: keyof DerivedPlayer,
  player: DerivedPlayer,
): string {
  const rawValue = player[field];
  const canonical = normalizeFieldKey(field as string);
  switch (canonical) {
    case 'NACIONALIDAD':
      return formatNationality(rawValue as string);
    case 'CLUB':
      return formatClub(rawValue as string, player.NACIONALIDAD as string);
    case 'PIE':
    case 'FAVOURED SIDE':
      return formatFoot(rawValue as string);
    case 'SKIN COLOR':
      return formatSkinTone(rawValue);
    case 'nro selección':
    case 'nro clasico':
      return formatSelectionDisplay(rawValue);
    case 'DORSAL':
      return formatDorsal(rawValue);
    default:
      if (SPECIAL_SKILL_FIELDS.has(canonical)) {
        return formatSpecialSkill(rawValue);
      }
      return formatPlayerValue(rawValue);
  }
}

export function getFieldFilterValue(
  field: keyof DerivedPlayer,
  player: DerivedPlayer,
): string {
  const rawValue = player[field];
  const canonical = normalizeFieldKey(field as string);
  switch (canonical) {
    case 'CLUB':
      return formatClub(rawValue as string, player.NACIONALIDAD as string);
    case 'NACIONALIDAD':
      return formatNationality(rawValue as string);
    case 'PIE':
    case 'FAVOURED SIDE':
      return formatFoot(rawValue as string);
    case 'SKIN COLOR':
      return formatSkinTone(rawValue);
    case 'nro selección':
    case 'nro clasico':
      return formatSelectionFilter(rawValue);
    default:
      if (SPECIAL_SKILL_FIELDS.has(canonical)) {
        return formatSpecialSkillFilter(rawValue);
      }
      return String(getFieldDisplayValue(field, player) ?? '').trim();
  }
}
