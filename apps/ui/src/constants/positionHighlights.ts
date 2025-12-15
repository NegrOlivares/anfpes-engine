import type { DerivedPlayer } from '@anfpes/engine';

export type PositionHighlightId =
  | 'PT'
  | 'LIB'
  | 'CT'
  | 'SA'
  | 'CCD'
  | 'LA'
  | 'CC'
  | 'VOL'
  | 'MP'
  | 'SD'
  | 'EX'
  | 'DC'
  | 'PTL'
  | 'LAI'
  | 'MCI'
  | 'BTB'
  | 'F9';

export type PositionHighlight = {
  id: PositionHighlightId;
  label: string;
  color: string;
  stats: Array<keyof DerivedPlayer>;
};

export const POSITION_HIGHLIGHTS: PositionHighlight[] = [
  {
    id: 'PT',
    label: 'PT',
    color: '#e9b407',
    stats: ['DEFENSA', 'ESTABILIDAD', 'REPUESTA', 'SALTO', 'ARQUERO'],
  },
  {
    id: 'LIB',
    label: 'LIB',
    color: '#1975d2',
    stats: ['DEFENSA', 'ESTABILIDAD', 'REPUESTA', 'CABEZAZO', 'SALTO'],
  },
  {
    id: 'CT',
    label: 'CT',
    color: '#1975d2',
    stats: ['DEFENSA', 'ESTABILIDAD', 'REPUESTA', 'CABEZAZO', 'SALTO'],
  },
  {
    id: 'SA',
    label: 'SA',
    color: '#1975d2',
    stats: [
      'DEFENSA',
      'VELOCIDAD MÁXIMA',
      'PRECISIÓN DRIBBLE',
      'VELOCIDAD DRIBBLE',
      'PRECISIÓN       P LARGO',
    ],
  },
  {
    id: 'CCD',
    label: 'CCD',
    color: '#09a959',
    stats: [
      'DEFENSA',
      'ESTABILIDAD',
      'PRECISIÓN   P CORTO',
      'PRECISIÓN       P LARGO',
      'TÉCNICA',
    ],
  },
  {
    id: 'LA',
    label: 'LA',
    color: '#09a959',
    stats: [
      'DEFENSA',
      'VELOCIDAD MÁXIMA',
      'PRECISIÓN DRIBBLE',
      'VELOCIDAD DRIBBLE',
      'PRECISIÓN       P LARGO',
    ],
  },
  {
    id: 'CC',
    label: 'CC',
    color: '#09a959',
    stats: [
      'RESISTENCIA',
      'PRECISIÓN DRIBBLE',
      'PRECISIÓN   P CORTO',
      'PRECISIÓN       P LARGO',
      'TÉCNICA',
    ],
  },
  {
    id: 'VOL',
    label: 'VOL',
    color: '#09a959',
    stats: [
      'VELOCIDAD MÁXIMA',
      'PRECISIÓN DRIBBLE',
      'VELOCIDAD DRIBBLE',
      'PRECISIÓN       P LARGO',
      'TÉCNICA',
    ],
  },
  {
    id: 'MP',
    label: 'MP',
    color: '#09a959',
    stats: [
      'PRECISIÓN DRIBBLE',
      'PRECISIÓN   P CORTO',
      'PRECISIÓN       P LARGO',
      'PRECISIÓN DISPARO',
      'TÉCNICA',
    ],
  },
  {
    id: 'SD',
    label: 'SD',
    color: '#fc2626',
    stats: ['ATAQUE', 'AGILIDAD', 'PRECISIÓN DRIBBLE', 'PRECISIÓN DISPARO', 'TÉCNICA'],
  },
  {
    id: 'EX',
    label: 'EX',
    color: '#fc2626',
    stats: [
      'ATAQUE',
      'VELOCIDAD MÁXIMA',
      'PRECISIÓN DRIBBLE',
      'VELOCIDAD DRIBBLE',
      'TÉCNICA',
    ],
  },
  {
    id: 'DC',
    label: 'DC',
    color: '#fc2626',
    stats: ['ATAQUE', 'ESTABILIDAD', 'REPUESTA', 'PRECISIÓN DISPARO', 'TÉCNICA'],
  },
  {
    id: 'PTL',
    label: 'PTL',
    color: '#e9b407',
    stats: [
      'ACELERACIÓN',
      'REPUESTA',
      'AGILIDAD',
      'PRECISIÓN   P CORTO',
      'PRECISIÓN       P LARGO',
      'TÉCNICA',
      'AGRESIVIDAD',
      'ARQUERO',
    ],
  },
  {
    id: 'LAI',
    label: 'LAI',
    color: '#1975d2',
    stats: [
      'DEFENSA',
      'ESTABILIDAD',
      'REPUESTA',
      'PRECISIÓN   P CORTO',
      'PRECISIÓN       P LARGO',
      'TÉCNICA',
      'TRABAJO EN EQUIPO',
    ],
  },
  {
    id: 'MCI',
    label: 'MCI',
    color: '#09a959',
    stats: ['DEFENSA', 'ESTABILIDAD', 'RESISTENCIA', 'ACELERACIÓN', 'REPUESTA', 'SALTO'],
  },
  {
    id: 'BTB',
    label: 'BTB',
    color: '#09a959',
    stats: [
      'ATAQUE',
      'DEFENSA',
      'ESTABILIDAD',
      'RESISTENCIA',
      'ACELERACIÓN',
      'REPUESTA',
      'POTENCIA DISPARO',
      'AGRESIVIDAD',
    ],
  },
  {
    id: 'F9',
    label: 'F9',
    color: '#fc2626',
    stats: [
      'ATAQUE',
      'AGILIDAD',
      'PRECISIÓN DRIBBLE',
      'PRECISIÓN   P CORTO',
      'PRECISIÓN DISPARO',
      'TÉCNICA DISPARO',
      'TÉCNICA',
      'TRABAJO EN EQUIPO',
    ],
  },
];
