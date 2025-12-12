import type { DerivedPlayer } from '@anfpes/engine';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { RadarChart } from './RadarChart';
import {
  PositionBadges,
  getPlayerPositions,
  getPositionLine,
  getPositionFullName,
} from './PositionBadges';
import { PositionMap, getActivePositionCells } from './PositionMap';
import { useCacheStore } from '../store/cacheStore';
import { formatPlayerValue, ensureNumber } from '../utils/format';
import goalStatsData from '../../../../data/processed/player-goal-stats.json';
import {
  applyFormMultiplier,
  DEFAULT_FORM_STATE,
  FORM_STATES,
  type FormStateId,
} from '../data/formModifiers';
import profileAddons, { type ProfileAddon } from '../data/profileAddons';
import { openPlayerActionsMenu } from './PlayerActionsOverlay';
import {
  formatClub,
  formatFoot,
  formatNationality,
  formatSelectionDisplay,
  formatSkinTone,
  getFieldLabel,
  SPECIAL_SKILL_FIELDS,
  getFieldDisplayValue,
} from '../utils/playerDisplay';
import { ANFPES_CLUBS, LEGEND_PLAYERS, ML_PLAYERS } from '../data/playerStatus';
import { getFlagImagePath, getClubShieldPath } from '../utils/imageHelpers';
import { getStatColor, getInjuryColor } from '../types/table';
import { getNationalityInfo } from '../data/nationalities';

const NATIONAL_SELECTION_FIELD = 'nro selección' as keyof DerivedPlayer;
const CLASSIC_SELECTION_FIELD = 'nro clasico' as keyof DerivedPlayer;

function normalizeName(raw: string): string {
  return (raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function aliasName(raw: string): string {
  const n = normalizeName(raw);
  const aliases: Array<{ find: RegExp; to: string }> = [
    { find: /\br m\b|\br madrid\b|\breal m\b/, to: 'real madrid' },
    { find: /\bman utd\b|\bmanchester u\b/, to: 'manchester united' },
    { find: /\bman city\b/, to: 'manchester city' },
    { find: /\batletico\b|\batletico madrid\b|\bat madrid\b/, to: 'atlético madrid' },
    { find: /\binter milan\b/, to: 'inter' },
    { find: /\bbarca\b/, to: 'barcelona' },
    { find: /\bdep la coruna\b|\bdeportivo\b/, to: 'deportivo' },
    { find: /\bsaint etienne\b/, to: 'saint-etienne' },
    { find: /\bnec nijmegen\b/, to: 'nec' },
    { find: /\bbetis\b/, to: 'betis' },
    { find: /\bnewcastle u\b/, to: 'newcastle' },
    // PSG: normalización quita el guión, así que usamos "paris saint germain"
    { find: /\bparis saint germain\b|\bpsg\b/, to: 'psg' },
  ];
  for (const a of aliases) {
    if (a.find.test(n)) return a.to;
  }
  return n;
}

/** Geometría común de la máscara */
const SHIRT_GEOM = {
  collarBottom: 4.2, // Y
  torsoLeft: 24, // X
  torsoRight: 76, // X
  dorsalTop: 45, // Y, centro aproximado dorsal
  dorsalBottom: 65, // Y
};

/** Prependemos una capa de cuello al resto del background */
function withCollar(collarColor: string, restBackground: string): string {
  const y = SHIRT_GEOM.collarBottom;
  const collarLayer = `linear-gradient(${collarColor} 0 ${y}%, transparent ${y}% 100%)`;
  return `${collarLayer},${restBackground}`;
}

/** Tipo A: camiseta lisa con cuello + puños en ambas mangas */
function solidWithCuffs(
  baseColor: string,
  collarAndCuffColor: string,
  cuffTopPct = 30, // dónde empieza el puño en Y
  cuffHeightPct = 3, // alto del puño
  cuffAngle = 27, // ángulo de la diagonal del puño
): string {
  const { torsoLeft, torsoRight } = SHIRT_GEOM;
  const cuffBottomPct = cuffTopPct + cuffHeightPct;

  // Puño manga derecha (tal como lo tenías)
  const rightCuff = `linear-gradient(${cuffAngle}deg,
    ${baseColor} 0 ${cuffTopPct}%,
    ${collarAndCuffColor} ${cuffTopPct}% ${cuffBottomPct}%,
    transparent ${cuffBottomPct}% 100%
  )`;

  // Puño manga izquierda: mismo patrón pero con ángulo espejado
  const leftCuff = `linear-gradient(${-cuffAngle}deg,
    ${baseColor} 0 ${cuffTopPct}%,
    ${collarAndCuffColor} ${cuffTopPct}% ${cuffBottomPct}%,
    ${baseColor} ${cuffBottomPct}% 100%
  )`;

  // “Borrador” de puños en el torso: repinta el torso con baseColor
  // en toda la altura, sólo entre torsoLeft–torsoRight. En las mangas
  // dejan pasar los puños diagonales.
  const torsoStripe = `linear-gradient(
    90deg,
    transparent 0 ${torsoLeft - 1.5}%,
    ${baseColor} ${torsoLeft - 1.5}% ${torsoRight + 1.5}%,
    transparent ${torsoRight + 1.5}% 100%
  )`;

  // Relleno base
  const fill = `linear-gradient(${baseColor} 0 100%)`;

  // Orden: primero limpiamos torso, luego puño der, puño izq, y por último base
  const body = [torsoStripe, rightCuff, leftCuff, fill].join(',');

  // Añadimos el cuello por encima
  return withCollar(collarAndCuffColor, body);
}

/** Tipo B: torso rayado con mangas de un color (Milan) */
function stripedTorsoWithMonoColorSleeves(
  collarColor: string, // ej: #111
  sleeveColor: string, // ej: #111
  lightColor: string, // ej: #fff
  darkColor: string, // ej: #6ec6ff
): string {
  const y = SHIRT_GEOM.collarBottom;

  return [
    // cuello (mismo color claro; para Arg es blanco)
    `linear-gradient(${collarColor} 0% ${y}%, transparent ${y}% 100%)`,
    // torso rayado entre ~23% y ~77%, mangas transparentes
    'repeating-linear-gradient(90deg,' +
      'transparent 0 23%,' +
      `${darkColor} 23% 27.5%,` +
      `${lightColor} 27.5% 36.5%,` +
      `${darkColor} 36.5% 45.5%,` +
      `${lightColor} 45.5% 54.5%,` +
      `${darkColor} 54.5% 63.5%,` +
      `${lightColor} 63.5% 72.5%,` +
      `${darkColor} 72.5% 77%,` +
      'transparent 77% 100%)',
    // mangas
    `linear-gradient(90deg, ${sleeveColor} 0 23%, transparent 23% 77%, ${sleeveColor} 77% 100%)`,
  ].join(',');
}

/** Tipo C: torso rayado con mangas diagonales (Classic Argentina) */
function stripedTorsoWithDiagonalSleeves(
  collarColor: string, // ej: #fff
  lightColor: string, // ej: #fff
  darkColor: string, // ej: #6ec6ff
): string {
  const y = SHIRT_GEOM.collarBottom;

  return [
    // cuello (mismo color claro; para Arg es blanco)
    `linear-gradient(${collarColor} 0% ${y}%, transparent ${y}% 100%)`,
    // torso rayado entre ~23% y ~77%, mangas transparentes
    'repeating-linear-gradient(90deg,' +
      'transparent 0 23%,' +
      `${darkColor} 23% 27.5%,` +
      `${lightColor} 27.5% 36.5%,` +
      `${darkColor} 36.5% 45.5%,` +
      `${lightColor} 45.5% 54.5%,` +
      `${darkColor} 54.5% 63.5%,` +
      `${lightColor} 63.5% 72.5%,` +
      `${darkColor} 72.5% 77%,` +
      'transparent 77% 100%)',
    // diagonales de mangas
    `linear-gradient(60deg, transparent 0 60%, ${lightColor} 60% 73%, ${darkColor} 73% 82%, ${lightColor} 82% 100%)`,
    `linear-gradient(300deg, transparent 0 60%, ${lightColor} 60% 73%, ${darkColor} 73% 82%, ${lightColor} 82% 100%)`,
  ].join(',');
}

/** Tipo D: banda horizontal centrada sólo en el torso (como Boca) */
function horizontalBandBody(
  bodyColor: string,
  bandColor: string,
  fromY: number,
  toY: number,
): string {
  const { torsoLeft, torsoRight } = SHIRT_GEOM;
  const bandYTop = fromY;
  const bandYBottom = toY;

  const bodyLayer = `linear-gradient(${bodyColor} 0 ${bandYTop}%, transparent ${bandYTop}% ${bandYBottom}%, ${bodyColor} ${bandYBottom}% 100%)`;
  const bandTorsoLayer = `linear-gradient(90deg,${bodyColor} 0 ${torsoLeft}%,${bandColor} ${torsoLeft}% ${torsoRight}%,${bodyColor} ${torsoRight}% 100%)`;

  return `${bodyLayer},${bandTorsoLayer}`;
}

/** Tipo E: banda diagonal (River, Perú, etc.) */
function diagonalSash(
  baseColor: string, // color fondo (mangas y base)
  sashColor: string, // color de la banda
  angleDeg: number, // 135 para hombro izq -> cintura der
  startPct: number, // inicio banda (Y)
  endPct: number, // fin banda (Y)
  sleeveColor?: string, // opcional, por defecto = baseColor
): string {
  const { collarBottom } = SHIRT_GEOM;
  const sleeves = sleeveColor ?? baseColor;

  return [
    // cuello
    `linear-gradient(${baseColor} 0 ${collarBottom}%, transparent ${collarBottom}% 100%)`,
    // mangas de color sólido y torso transparente (22.5–76)
    'linear-gradient(90deg,' +
      `${sleeves} 0 22.5%,` +
      `transparent 22.5% 76%,` +
      `${sleeves} 76% 100%)`,
    // banda diagonal
    `linear-gradient(${angleDeg}deg,` +
      `${baseColor} 0 ${startPct}%,` +
      `${sashColor} ${startPct}% ${endPct}%,` +
      `${baseColor} ${endPct}% 100%)`,
  ].join(',');
}

/** Tipo F: panel central vertical (Ajax / PSG style, genérico)
 *
 * baseColor   → color base (mangas + fondo)
 * bands       → bandas verticales (from/to en % horizontal, 0–100)
 * sleeveColor → color sólido de mangas (si se omite, usa baseColor)
 *
 * NOTA: las bandas se aplican sólo en el torso; las mangas
 * quedan lisas con sleeveColor/baseColor.
 */
function centralPanel(
  baseColor: string,
  bands: Array<{ color: string; from: number; to: number }>,
  sleeveColor?: string,
): string {
  const { torsoLeft, torsoRight } = SHIRT_GEOM;

  // 1) Construimos el gradiente vertical del torso (0–100% en X)
  const sorted = [...bands].sort((a, b) => a.from - b.from);

  const stops: string[] = [];
  let current = 0;

  for (const band of sorted) {
    if (band.from > current) {
      stops.push(`${baseColor} ${current}% ${band.from}%`);
    }
    stops.push(`${band.color} ${band.from}% ${band.to}%`);
    current = band.to;
  }
  if (current < 100) {
    stops.push(`${baseColor} ${current}% 100%`);
  }

  // torso con las bandas (en todo el ancho, luego recortamos mangas)
  const torsoLayer = `linear-gradient(90deg,${stops.join(',')})`;

  // 2) Capa de mangas sólidas por encima (como en centralMultiBands)
  const sleeveFill = sleeveColor ?? baseColor;
  const leftCut = torsoLeft - 1;
  const rightCut = torsoRight + 1;

  const sleevesLayer =
    `linear-gradient(90deg,` +
    `${sleeveFill} 0 ${leftCut}%,` +
    `transparent ${leftCut}% ${rightCut}%,` +
    `${sleeveFill} ${rightCut}% 100%)`;

  // 3) Base de seguridad por debajo
  const baseLayer = `linear-gradient(${baseColor} 0 100%)`;

  // Orden: mangas (recorte), torso con panel, base
  return `${sleevesLayer},${torsoLayer},${baseLayer}`;
}

/** Tipo G: mitad y mitad vertical (half & half) */
function halfAndHalf(leftColor: string, rightColor: string): string {
  return `linear-gradient(90deg,${leftColor} 0 50%,${rightColor} 50% 100%)`;
}

/** Tipo H: cuerpo de un color, mangas de otro */
function bodyWithSleeves(bodyColor: string, sleeveColor: string): string {
  const { torsoLeft, torsoRight } = SHIRT_GEOM;
  return `linear-gradient(90deg,${sleeveColor} 0 ${torsoLeft - 1.1}%,${bodyColor} ${torsoLeft - 1.1}% ${torsoRight + 1.1}%,${sleeveColor} ${torsoRight + 1.1}% 100%)`;
}

/** Tipo I: hoops (franjas horizontales) con opción de mangas sólidas */
function horizontalHoops(
  color1: string,
  color2: string,
  stripeHeightPct: number, // alto de cada franja en %
  sleeveColor?: string, // si viene, mangas sólidas de este color
): string {
  const { torsoLeft, torsoRight } = SHIRT_GEOM;

  const hoopsLayer =
    `repeating-linear-gradient(180deg,` +
    `${color1} 0 ${stripeHeightPct}%,` +
    `${color2} ${stripeHeightPct}% ${stripeHeightPct * 2}%)`;

  // Sin mangas especiales → todo a rayas como antes
  if (!sleeveColor) return hoopsLayer;

  // Capa superior: mangas sólidas, torso transparente
  const sleevesLayer =
    `linear-gradient(90deg,` +
    `${sleeveColor} 0 ${torsoLeft - 1.1}%,` +
    `transparent ${torsoLeft - 1.1}% ${torsoRight + 1}%,` +
    `${sleeveColor} ${torsoRight + 1}% 100%)`;

  // Mangas arriba, hoops abajo
  return `${sleevesLayer},${hoopsLayer}`;
}

/** Tipo J: bloque de varias franjas horizontales centradas */
function centralMultiBands(
  baseColor: string,
  bands: Array<{ color: string; from: number; to: number }>, // from/to en %
  sleeveColor?: string, // opcional
): string {
  const { torsoLeft, torsoRight } = SHIRT_GEOM;

  // Construimos el torso (igual que antes)
  const sorted = [...bands].sort((a, b) => a.from - b.from);

  const stops: string[] = [];
  let current = 0;

  for (const band of sorted) {
    if (band.from > current) {
      stops.push(`${baseColor} ${current}% ${band.from}%`);
    }
    stops.push(`${band.color} ${band.from}% ${band.to}%`);
    current = band.to;
  }
  if (current < 100) {
    stops.push(`${baseColor} ${current}% 100%`);
  }

  const torsoLayer = `linear-gradient(${stops.join(',')})`;

  // Si no hay color de mangas (o es igual a base), mantenemos el comportamiento viejo
  if (!sleeveColor) {
    return torsoLayer;
  }

  // Mangas sólidas por arriba, torso transparente
  const sleevesLayer =
    `linear-gradient(90deg,` +
    `${sleeveColor} 0 ${torsoLeft - 1}%,` +
    `transparent ${torsoLeft - 1}% ${torsoRight + 1}%,` +
    `${sleeveColor} ${torsoRight + 1}% 100%)`;

  return `${sleevesLayer},${torsoLayer}`;
}

/** Tipo K bruto: tablero de NxM cuadros sólidos */
/** Tablero SVG embebido como data URL */
function svgCheckerboardDataURL(
  lightColor: string,
  darkColor: string,
  cols: number,
  rows: number,
): string {
  const cellW = 100 / cols;
  const cellH = 100 / rows;
  let rects = '';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isLight = (r + c) % 2 === 0;
      const color = isLight ? lightColor : darkColor;
      const x = c * cellW;
      const y = r * cellH;
      rects += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="${color}"/>`;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${rects}</svg>`;
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');

  // Esto es lo que va directamente en background:
  return `url("data:image/svg+xml,${encoded}")`;
}

/** Tipo L: half&half diagonal (ej. Monaco) */
function diagonalHalf(
  colorTopLeft: string, // color desde la esquina sup. izq
  colorBottomRight: string, // color hacia la esquina inf. der
  angleDeg: number, // 135 = típico hombro izq → cintura der
  splitPct: number, // % donde se hace el corte
): string {
  return (
    `linear-gradient(${angleDeg}deg,` +
    `${colorTopLeft} 0 ${splitPct}%,` +
    `${colorBottomRight} ${splitPct}% 100%)`
  );
}

function getShirtStyle(
  origin: 'club' | 'seleccion' | 'clasica' | 'shop' | 'libre',
  clubName: string,
  nationality: string,
) {
  const name = aliasName(clubName || nationality || '');

  const { collarBottom, dorsalTop, dorsalBottom, torsoLeft, torsoRight } = SHIRT_GEOM;

  // Paleta por clubes/selecciones
  const patterns: Array<{ token: string; background: string; color: string }> = [
    // === Ejemplos adaptados a los nuevos tipos ===

    // Tipo A (camiseta simple)
    {
      token: 'a s roma',
      background: solidWithCuffs('#8e1f1f', '#f2e04c'),
      color: '#f2e04c',
    },
    {
      token: 'sparta praha',
      background: solidWithCuffs('#7b1b1b', '#f2f2f2'),
      color: '#f2f2f2',
    },
    {
      token: 'auxerre',
      background: solidWithCuffs('#ffffff', '#0054a6'),
      color: '#0054a6',
    },
    {
      token: 'nancy',
      background: solidWithCuffs('#ffffff', '#c00000'),
      color: '#c00000',
    },
    {
      token: 'saint-etienne',
      background: solidWithCuffs('#0b7d3c', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'az ',
      background: solidWithCuffs('#c00000', '#000000'),
      color: '#ffffff',
    },
    {
      token: 'bayern',
      background: solidWithCuffs('#c00000', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'benfica',
      background: solidWithCuffs('#c00000', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'bolton',
      background: solidWithCuffs('#ffffff', '#0b1a44'),
      color: '#0b1a44',
    },
    {
      token: 'gimnastic',
      background: solidWithCuffs('#c00000', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'osasuna',
      background: solidWithCuffs('#b00000', '#0b1a44'),
      color: '#0b1a44',
    },
    {
      token: 'charlton',
      background: solidWithCuffs('#c00000', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'chelsea',
      background: solidWithCuffs('#0033a0', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'chievo',
      background: solidWithCuffs('#ffda00', '#0b3b8c'),
      color: '#0b3b8c',
    },

    // “CLASSIC” SELECCIONES (VERSIONES TIPO A)

    {
      token: 'classic brazil',
      background: solidWithCuffs('#f6c800', '#198a43'),
      color: '#198a43',
    },
    {
      token: 'classic england',
      background: solidWithCuffs('#ffffff', '#c00000'),
      color: '#0b1a44',
    },
    {
      token: 'classic france',
      background: solidWithCuffs('#00205b', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'classic germany',
      background: solidWithCuffs('#ffffff', '#000000'),
      color: '#000000',
    },
    {
      token: 'classic italy',
      background: solidWithCuffs('#0b3b8c', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'classic netherlands',
      background: solidWithCuffs('#f58025', '#111111'),
      color: '#111111',
    },

    // MÁS CLUBES TIPO A

    {
      token: 'dynamo kiev',
      background: solidWithCuffs('#ffffff', '#0033a0'),
      color: '#0033a0',
    },
    {
      token: 'empoli',
      background: solidWithCuffs('#0b3b8c', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'troyes',
      background: solidWithCuffs('#0075c9', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'everton',
      background: solidWithCuffs('#0033a0', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'fc copenhagen',
      background: solidWithCuffs('#ffffff', '#0033a0'),
      color: '#0033a0',
    },
    {
      token: 'lorient',
      background: solidWithCuffs('#f58025', '#000000'),
      color: '#000000',
    },
    {
      token: 'nantes',
      background: solidWithCuffs('#ffda00', '#0b7d3c'),
      color: '#0b7d3c',
    },
    {
      token: 'sochaux',
      background: solidWithCuffs('#ffda00', '#0033a0'),
      color: '#0033a0',
    },
    {
      token: 'twente',
      background: solidWithCuffs('#c00000', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'fiorentina',
      background: solidWithCuffs('#5e2d8a', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'getafe',
      background: solidWithCuffs('#0033a0', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'bordeaux',
      background: solidWithCuffs('#0a1445', '#ffffff'),
      color: '#e4002b',
    },
    {
      token: 'lazio',
      background: solidWithCuffs('#7fbde9', '#ffffff'),
      color: '#111111',
    },
    {
      token: 'le mans',
      background: solidWithCuffs('#d62828', '#ffda00'),
      color: '#ffffff',
    },
    {
      token: 'libre',
      background: solidWithCuffs('#111111', '#f7f7f7'),
      color: '#f7f7f7',
    },
    {
      token: 'lille',
      background: solidWithCuffs('#c00000', '#0a1445'),
      color: '#0a1445',
    },
    {
      token: 'liverpool',
      background: solidWithCuffs('#c00000', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'livorno',
      background: solidWithCuffs('#6a1b4d', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'manchester city',
      background: solidWithCuffs('#7fbde9', '#ffffff'),
      color: '#111111',
    },
    {
      token: 'manchester united',
      background: solidWithCuffs('#c00000', '#000000'),
      color: '#000000',
    },
    {
      token: 'messina',
      background: solidWithCuffs('#ffda00', '#c00000'),
      color: '#111111',
    },
    {
      token: 'marseille',
      background: solidWithCuffs('#ffffff', '#00a3e0'),
      color: '#00a3e0',
    },
    {
      token: 'palermo',
      background: solidWithCuffs('#f5c1d1', '#000000'),
      color: '#000000',
    },
    {
      token: 'panathinaikos',
      background: solidWithCuffs('#0b7d3c', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'real zaragoza',
      background: solidWithCuffs('#ffffff', '#0033a0'),
      color: '#c00000',
    },
    {
      token: 'celta',
      background: solidWithCuffs('#7fbde9', '#ffffff'),
      color: '#111111',
    },
    {
      token: 'mallorca',
      background: solidWithCuffs('#c00000', '#000000'),
      color: '#ffda00',
    },
    {
      token: 'rangers',
      background: solidWithCuffs('#0033a0', '#ffffff'),
      color: '#c00000',
    },
    {
      token: 'reggina',
      background: solidWithCuffs('#6a1b4d', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'rosenborg',
      background: solidWithCuffs('#ffffff', '#000000'),
      color: '#000000',
    },
    {
      token: 'anderlecht',
      background: solidWithCuffs('#5e2d8a', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'sevilla',
      background: solidWithCuffs('#ffffff', '#c00000'),
      color: '#c00000',
    },
    {
      token: 'torino',
      background: solidWithCuffs('#6a1b4d', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'tottenham',
      background: solidWithCuffs('#ffffff', '#0a1445'),
      color: '#0a1445',
    },
    {
      token: 'toulouse',
      background: solidWithCuffs('#7e57c2', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'valencia',
      background: solidWithCuffs('#ffffff', '#000000'),
      color: '#f58025',
    },
    {
      token: 'valenciennes',
      background: solidWithCuffs('#c00000', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'villarreal',
      background: solidWithCuffs('#ffda00', '#0033a0'),
      color: '#0033a0',
    },
    {
      token: 'watford',
      background: solidWithCuffs('#ffda00', '#000000'),
      color: '#c00000',
    },
    // TIPO A – CLUBES PENDIENTES

    {
      token: 'real madrid',
      background: solidWithCuffs('#f7f7f7', '#5b2ba8'),
      color: '#5b2ba8',
    },
    {
      token: 'equipo ml',
      background: solidWithCuffs('#0a1445', '#ffda00'),
      color: '#ffda00',
    },
    {
      token: 'ml old',
      background: solidWithCuffs('#0a1445', '#ffda00'),
      color: '#ffda00',
    },
    {
      token: 'ml young',
      background: solidWithCuffs('#0a1445', '#ffda00'),
      color: '#ffda00',
    },

    // SELECCIONES – TIPO A (solidWithCuffs)

    {
      token: 'australia',
      background: solidWithCuffs('#f6c800', '#006437'),
      color: '#006437',
    },
    {
      token: 'austria',
      background: solidWithCuffs('#d00000', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'belgium',
      background: solidWithCuffs('#e30613', '#000000'),
      color: '#000000',
    },
    {
      token: 'brazil',
      background: solidWithCuffs('#f6c800', '#198a43'),
      color: '#198a43',
    },
    {
      token: 'bulgaria',
      background: solidWithCuffs('#ffffff', '#0b7d3c'),
      color: '#0b7d3c',
    },
    {
      token: 'cameroon',
      background: solidWithCuffs('#0b7d3c', '#d00000'),
      color: '#ffda00',
    },
    {
      token: 'chile',
      background: solidWithCuffs('#c00000', '#0033a0'),
      color: '#ffffff',
    },
    {
      token: 'colombia',
      background: solidWithCuffs('#ffda00', '#0033a0'),
      color: '#c00000',
    },
    {
      token: 'costa rica',
      background: solidWithCuffs('#c00000', '#0033a0'),
      color: '#ffffff',
    },
    {
      token: 'cote d ivoire',
      background: solidWithCuffs('#f58025', '#0b7d3c'),
      color: '#ffffff',
    },
    {
      token: 'czech republic',
      background: solidWithCuffs('#c00000', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'denmark',
      background: solidWithCuffs('#c00000', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'ecuador',
      background: solidWithCuffs('#ffda00', '#031e58ff'),
      color: '#03158ff',
    },
    {
      token: 'england',
      background: solidWithCuffs('#ffffff', '#c00000'),
      color: '#c00000',
    },
    {
      token: 'finland',
      background: solidWithCuffs('#ffffff', '#0033a0'),
      color: '#0033a0',
    },
    {
      token: 'france',
      background: solidWithCuffs('#00205b', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'germany',
      background: solidWithCuffs('#ffffff', '#000000'),
      color: '#000000',
    },
    {
      token: 'ghana',
      background: solidWithCuffs('#ffffff', '#000000ff'),
      color: '#000000ff',
    },
    {
      token: 'greece',
      background: solidWithCuffs('#0033a0', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'hungary',
      background: solidWithCuffs('#c00000', '#0b7d3c'),
      color: '#ffffff',
    },
    {
      token: 'iran',
      background: solidWithCuffs('#ffffff', '#c00000'),
      color: '#c00000',
    },
    {
      token: 'ireland',
      background: solidWithCuffs('#0b7d3c', '#ffda00'),
      color: '#ffffff',
    },
    {
      token: 'italy',
      background: solidWithCuffs('#0b3b8c', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'japan',
      background: solidWithCuffs('#0a1445', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'latvia',
      background: solidWithCuffs('#7b1b1b', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'mexico',
      background: solidWithCuffs('#0b7d3c', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'netherlands',
      background: solidWithCuffs('#f58025', '#111111'),
      color: '#111111',
    },
    {
      token: 'nigeria',
      background: solidWithCuffs('#0b7d3c', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'northern ireland',
      background: solidWithCuffs('#0b7d3c', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'norway',
      background: solidWithCuffs('#c00000', '#0033a0'),
      color: '#ffffff',
    },
    {
      token: 'poland',
      background: solidWithCuffs('#ffffff', '#c00000'),
      color: '#c00000',
    },
    {
      token: 'portugal',
      background: solidWithCuffs('#c00000', '#0b7d3c'),
      color: '#ffda00',
    },
    {
      token: 'romania',
      background: solidWithCuffs('#ffda00', '#c00000'),
      color: '#c00000',
    },
    {
      token: 'russia',
      background: solidWithCuffs('#ffffff', '#0033a0'),
      color: '#c00000',
    },
    {
      token: 'saudi arabia',
      background: solidWithCuffs('#ffffff', '#0b7d3c'),
      color: '#0b7d3c',
    },
    {
      token: 'scotland',
      background: solidWithCuffs('#00305b', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'serbia and montenegro',
      background: solidWithCuffs('#c00000', '#0033a0'),
      color: '#ffffff',
    },
    {
      token: 'slovakia',
      background: solidWithCuffs('#ffffff', '#0033a0'),
      color: '#c00000',
    },
    {
      token: 'slovenia',
      background: solidWithCuffs('#ffffff', '#0b7d3c'),
      color: '#0b7d3c',
    },
    {
      token: 'south africa',
      background: solidWithCuffs('#f6c800', '#0b7d3c'),
      color: '#0b7d3c',
    },
    {
      token: 'south korea',
      background: solidWithCuffs('#c00000', '#0033a0'),
      color: '#ffffff',
    },
    {
      token: 'spain',
      background: solidWithCuffs('#c00000', '#ffda00'),
      color: '#ffda00',
    },
    {
      token: 'sweden',
      background: solidWithCuffs('#ffda00', '#0033a0'),
      color: '#0033a0',
    },
    {
      token: 'switzerland',
      background: solidWithCuffs('#c00000', '#ffffff'),
      color: '#ffffff',
    },
    {
      token: 'togo',
      background: solidWithCuffs('#ffda00', '#0b7d3c'),
      color: '#0b7d3c',
    },
    {
      token: 'tunisia',
      background: solidWithCuffs('#ffffff', '#c00000'),
      color: '#c00000',
    },
    {
      token: 'ukraine',
      background: solidWithCuffs('#ffda00', '#0033a0'),
      color: '#0033a0',
    },
    {
      token: 'uruguay',
      background: solidWithCuffs('#7fbde9', '#000000'),
      color: '#000000',
    },
    {
      token: 'united states',
      background: solidWithCuffs('#ffffff', '#00205b'),
      color: '#00205b',
    },
    {
      token: 'wales',
      background: solidWithCuffs('#c00000', '#ffffffff'),
      color: '#ffffffff',
    },

    // Tipo B (rayas con mangas de un color)
    {
      token: 'milan',
      background: stripedTorsoWithMonoColorSleeves('#111', '#111', '#111', '#c01'),
      color: '#f2f2f2',
    },
    {
      token: 'inter',
      background: stripedTorsoWithMonoColorSleeves('#111', '#111', '#111', '#2f05c7ff'),
      color: '#f2f2f2',
    },
    {
      token: 'ado den haag',
      background: stripedTorsoWithMonoColorSleeves(
        '#0b7d3c', // cuello verde
        '#0b7d3c', // mangas verdes
        '#ffda00', // franja clara (amarillo)
        '#0b7d3c', // franja oscura (verde)
      ),
      color: '#ffffff',
    },
    {
      token: 'ascoli',
      background: stripedTorsoWithMonoColorSleeves(
        '#000000', // cuello negro
        '#000000', // mangas negras
        '#f1f1f1ff', // franja clara
        '#000000', // franja oscura
      ),
      color: '#ffffffff',
    },
    {
      token: 'athletic club',
      background: stripedTorsoWithMonoColorSleeves(
        '#111111', // cuello rojo
        '#c00000', // mangas rojas
        '#ffffff', // franja clara
        '#c00000', // franja oscura
      ),
      color: '#111111',
    },
    {
      token: 'besiktas',
      background: stripedTorsoWithMonoColorSleeves(
        '#000000', // cuello negro
        '#000000', // mangas negras
        '#e6e6e6ff', // franja clara
        '#000000', // franja oscura
      ),
      color: '#ffffffff',
    },
    {
      token: 'club brugge',
      background: stripedTorsoWithMonoColorSleeves(
        '#111111', // cuello oscuro
        '#0b3b8c', // mangas azules
        '#111111', // franja clara (azul)
        '#0b3b8c', // franja oscura (negro)
      ),
      color: '#fefefe',
    },
    {
      token: 'djurgardens',
      background: stripedTorsoWithMonoColorSleeves(
        '#003c7d', // cuello azul oscuro
        '#003c7d', // mangas azul oscuro
        '#7fbde9', // franja clara (celeste)
        '#003c7d', // franja oscura
      ),
      color: '#d4af37',
    },
    {
      token: 'porto',
      background: stripedTorsoWithMonoColorSleeves(
        '#0033a0', // cuello azul
        '#0033a0', // mangas azules
        '#ffffff', // franja clara
        '#0033a0', // franja oscura
      ),
      color: '#fefefe',
    },
    {
      token: 'levante',
      background: stripedTorsoWithMonoColorSleeves(
        '#0b3b8c', // cuello azul
        '#0b3b8c', // mangas grana
        '#6a1b28', // franja clara (azul)
        '#0b3b8c', // franja oscura (grana)
      ),
      color: '#ffd700',
    },
    {
      token: 'olympiacos',
      background: stripedTorsoWithMonoColorSleeves(
        '#c00000', // cuello rojo
        '#ffffff', // mangas rojas
        '#c00000', // franja clara
        '#ffffff', // franja oscura
      ),
      color: '#111111',
    },
    {
      token: 'psv',
      background: stripedTorsoWithMonoColorSleeves(
        '#ffffff', // cuello blanco
        '#c00000', // mangas rojas
        '#ffffff', // franja clara
        '#c00000', // franja oscura
      ),
      color: '#000000',
    },
    {
      token: 'betis',
      background: stripedTorsoWithMonoColorSleeves(
        '#0b7d3c', // cuello verde
        '#0b7d3c', // mangas verdes
        '#ffffff', // franja clara
        '#0b7d3c', // franja oscura
      ),
      color: '#111111',
    },
    {
      token: 'deportivo',
      background: stripedTorsoWithMonoColorSleeves(
        '#0033a0', // cuello azul
        '#0033a0', // mangas azules
        '#ffffff', // franja clara
        '#0033a0', // franja oscura
      ),
      color: '#111111',
    },
    {
      token: 'recreativo',
      background: stripedTorsoWithMonoColorSleeves(
        '#0033a0', // cuello azul
        '#0033a0', // mangas azules
        '#0033a0', // franja clara
        '#ffffff', // franja oscura
      ),
      color: '#000000ff',
    },
    {
      token: 'espanyol',
      background: stripedTorsoWithMonoColorSleeves(
        '#0033a0', // cuello azul
        '#ffffff', // mangas azules
        '#0033a0', // franja clara
        '#ffffff', // franja oscura
      ),
      color: '#111111',
    },
    {
      token: 'lens',
      background: stripedTorsoWithMonoColorSleeves(
        '#c00000', // cuello rojo
        '#c00000', // mangas rojas
        '#ffda00', // franja clara (amarillo)
        '#c00000', // franja oscura (rojo)
      ),
      color: '#000000',
    },
    {
      token: 'heerenveen',
      background: stripedTorsoWithMonoColorSleeves(
        '#0033a0', // cuello azul
        '#0033a0', // mangas azules
        '#ffffff', // franja clara
        '#0033a0', // franja oscura
      ),
      color: '#c00000',
    },
    {
      token: 'sheffield united',
      background: stripedTorsoWithMonoColorSleeves(
        '#000000', // cuello negro
        '#c00000', // mangas rojas
        '#ffffff', // franja clara
        '#c00000', // franja oscura
      ),
      color: '#000000',
    },
    {
      token: 'siena',
      background: stripedTorsoWithMonoColorSleeves(
        '#000000', // cuello negro
        '#000000', // mangas negras
        '#ffffff', // franja clara
        '#000000', // franja oscura
      ),
      color: '#ffffff',
    },
    {
      token: 'udinese',
      background: stripedTorsoWithMonoColorSleeves(
        '#000000', // cuello negro
        '#000000', // mangas negras (brazos oscuros)
        '#ffffff', // franja clara
        '#000000', // franja oscura
      ),
      color: '#ffffff',
    },
    {
      token: 'we united',
      background: stripedTorsoWithMonoColorSleeves(
        '#0a1445', // cuello azul marino
        '#0a1445', // mangas azul marino
        '#ffda00', // franja clara (amarillo)
        '#0a1445', // franja oscura (azul marino)
      ),
      color: '#ffffff',
    },

    // Tipo C – torso rayado + mangas diagonales (stripedTorsoWithDiagonalSleeves)
    {
      token: 'classic argentina',
      background: stripedTorsoWithDiagonalSleeves('#fff', '#fff', '#6ec6ff'),
      color: '#111',
    },
    {
      token: 'atalanta',
      background: stripedTorsoWithDiagonalSleeves(
        '#111111', // cuello azul
        '#0b3b8c', // franjas claras (azul)
        '#111111', // franjas oscuras (negro)
      ),
      color: '#fefefe',
    },
    {
      token: 'atlético madrid',
      background: stripedTorsoWithDiagonalSleeves(
        '#00205b', // cuello azul
        '#ffffff', // franjas claras (blanco)
        '#c00000', // franjas oscuras (rojo)
      ),
      color: '#043ba1ff',
    },
    {
      token: 'catania',
      background: stripedTorsoWithDiagonalSleeves(
        '#55bbee', // cuello celeste
        '#55bbee', // franjas claras (celeste)
        '#c00000', // franjas oscuras (rojo)
      ),
      color: '#ffffff',
    },
    {
      token: 'fenerbahce',
      background: stripedTorsoWithDiagonalSleeves(
        '#0a1445', // cuello azul marino
        '#ffda00', // franjas claras (amarillo)
        '#0a1445', // franjas oscuras (azul marino)
      ),
      color: '#ffffff',
    },
    {
      token: 'heracles',
      background: stripedTorsoWithDiagonalSleeves(
        '#000000', // cuello negro
        '#ffffff', // franjas claras
        '#000000', // franjas oscuras
      ),
      color: '#ffffffff',
    },
    {
      token: 'juventus',
      background: stripedTorsoWithDiagonalSleeves(
        '#ffffff', // cuello negro
        '#ffffff', // franjas claras
        '#000000', // franjas oscuras
      ),
      color: '#d3a203ff',
    },
    {
      token: 'newcastle',
      background: stripedTorsoWithDiagonalSleeves(
        '#ffffff', // cuello negro
        '#000', // franjas claras
        '#fff', // franjas oscuras
      ),
      color: '#ffca1aff',
    },
    {
      token: 'nice',
      background: stripedTorsoWithDiagonalSleeves(
        '#000000', // cuello negro
        '#c00000', // franjas claras (rojo)
        '#000000', // franjas oscuras (negro)
      ),
      color: '#ffffff',
    },
    {
      token: 'sociedad',
      background: stripedTorsoWithDiagonalSleeves(
        '#0033a0', // cuello azul
        '#ffffff', // franjas claras
        '#0033a0', // franjas oscuras (azul)
      ),
      color: '#111111',
    },
    {
      token: 'rkc',
      background: stripedTorsoWithDiagonalSleeves(
        '#0033a0', // cuello azul
        '#ffda00', // franjas claras (amarillo)
        '#0033a0', // franjas oscuras (azul)
      ),
      color: '#111111',
    },
    {
      token: 'sparta rotterdam',
      background: stripedTorsoWithDiagonalSleeves(
        '#000', // cuello negro (suele llevar negro)
        '#fff', // franjas claras
        '#c00000', // franjas oscuras (rojo)
      ),
      color: '#000000',
    },
    {
      token: 'vitesse',
      background: stripedTorsoWithDiagonalSleeves(
        '#000000', // cuello negro
        '#ffda00', // franjas claras (amarillo)
        '#000000', // franjas oscuras (negro)
      ),
      color: '#fff',
    },
    {
      token: 'wigan',
      background: stripedTorsoWithDiagonalSleeves(
        '#0033a0', // cuello azul
        '#ffffff', // franjas claras
        '#0033a0', // franjas oscuras (azul)
      ),
      color: '#000000',
    },
    {
      token: 'willem ii',
      background: stripedTorsoWithDiagonalSleeves(
        '#0033a0', // cuello azul (tercer color)
        '#ffffff', // franjas claras (blanco)
        '#c00000', // franjas oscuras (rojo)
      ),
      color: '#000000',
    },
    {
      token: 'seleccion argentina',
      background: stripedTorsoWithDiagonalSleeves(
        '#ffffff', // cuello blanco
        '#ffffff', // franjas claras (blanco)
        '#6ec6ff', // franjas oscuras (celeste)
      ),
      color: '#111111',
    },
    {
      token: 'seleccion paraguay',
      background: stripedTorsoWithDiagonalSleeves(
        '#c00000', // cuello rojo
        '#ffffff', // franjas claras
        '#c00000', // franjas oscuras (rojo)
      ),
      color: '#2b41a1ff',
    },
    {
      token: 'barcelona',
      background: stripedTorsoWithDiagonalSleeves(
        '#ffd700', // cuello amarillo
        '#00205b', // franjas claras (azul)
        '#b20032', // franjas oscuras (grana)
      ),
      color: '#ffd700', // dorsales amarillos
    },

    // Tipo D – banda horizontal centrada
    {
      token: 'boca',
      background: withCollar(
        '#0b1a44',
        horizontalBandBody('#0b1a44', '#f6c800', dorsalTop, dorsalBottom),
      ),
      color: '#fff',
    },
    {
      token: 'middlesbrough',
      background: withCollar(
        '#ffffffff', // cuello rojo
        horizontalBandBody(
          '#c00000', // fondo rojo
          '#ffffff', // banda blanca
          30,
          50,
        ),
      ),
      color: '#ffffff', // dorsales blancos
    },
    {
      token: 'turkey',
      background: withCollar(
        '#c00000', // cuello rojo
        horizontalBandBody(
          '#ffffff', // fondo rojo
          '#c00000', // banda blanca
          30,
          50,
        ),
      ),
      color: '#dd0000ff', // dorsales blancos
    },

    // Tipo E – banda diagonal
    {
      token: 'river',
      background: diagonalSash('#fff', '#d00000', 135, 40, 56),
      color: '#111',
    },
    {
      token: 'peru',
      background: diagonalSash('#fff', '#d00000', 135, 40, 56),
      color: '#111',
    },
    {
      token: 'trinidad and tobago',
      background: diagonalSash(
        '#c00000', // fondo rojo
        '#000000', // banda negra
        135, // ángulo
        40, // inicio banda (Y%)
        56, // fin banda (Y%)
      ),
      color: '#ffffff', // dorsales blancos
    },
    {
      token: 'nac breda',
      background: diagonalSash(
        '#ffda00', // fondo amarillo
        '#000000', // banda negra
        135, // ángulo
        40, // inicio banda
        56, // fin banda
      ),
      color: '#ffffffff', // dorsales negros
    },

    // Tipo F – panel central vertical con bordes
    {
      token: 'ajax',
      background: withCollar(
        '#c01',
        centralPanel('#ffffff', [{ color: '#c01', from: 33, to: 67 }]),
      ),
      color: '#f7f7f7ff',
    },
    {
      token: 'psg',
      background: withCollar(
        '#091b75ff',
        centralPanel(
          '#0a1445',
          [
            { color: '#c4c1c1ff', from: 35, to: 37 }, // borde izq
            { color: '#c00', from: 37, to: 63 }, // centro rojo
            { color: '#c4c1c1ff', from: 63, to: 65 }, // borde der
          ],
          '#0a1445', // mangas azul oscuro
        ),
      ),
      color: '#fff',
    },
    {
      token: 'fc groningen',
      background: withCollar(
        '#0b7d3c', // cuello verde
        centralPanel(
          '#ffffff', // base blanca (mangas + fondo)
          [
            { color: '#0b7d3c', from: 29, to: 42 }, // borde izq
            { color: '#fff', from: 42, to: 58 }, // centro rojo
            { color: '#0b7d3c', from: 58, to: 71 }, // borde der
          ],
          '#ffffff', // mangas blancas
        ),
      ),
      color: '#111111', // dorsales oscuros
    },
    {
      token: 'olympique lyonnais',
      background: withCollar(
        '#031e58', // cuello blanco (puedes cambiarlo a azul/rojo si quieres)
        centralPanel(
          '#ffffff', // base blanca
          [
            {
              color: '#e20505ff', // franja roja (lado izquierdo del panel)
              from: 43,
              to: 50,
            },
            {
              color: '#0206daff', // franja azul (lado derecho del panel)
              from: 50,
              to: 57,
            },
          ],
          '#ffffff', // mangas blancas
        ),
      ),
      color: '#031e58ff', // dorsales azul oscuro
    },

    // Tipo G – half & half vertical
    {
      token: 'feyenoord',
      background: withCollar('#000000ff', halfAndHalf('#c00', '#fff')),
      color: '#000',
    },
    {
      token: 'blackburn',
      background: withCollar('#fff', halfAndHalf('#0b3b8c', '#ffffff')),
      color: '#e4002b',
    },
    {
      token: 'cagliari',
      background: withCollar('#001437', halfAndHalf('#b00000', '#001437')),
      color: '#ffffff',
    },
    {
      token: 'sedan',
      background: withCollar('#000000ff', halfAndHalf('#0b7d3c', '#b00000')),
      color: '#ffffff',
    },
    {
      token: 'feyenoord',
      background: withCollar('#000000', halfAndHalf('#c00000', '#ffffff')),
      color: '#000000',
    },
    {
      token: 'galatasaray',
      background: withCollar('#000000ff', halfAndHalf('#c00000', '#f6c800')),
      color: '#000000',
    },
    {
      token: 'racing',
      background: withCollar('#0b7d3c', halfAndHalf('#ffffff', '#0b7d3c')),
      color: '#000000',
    },
    {
      token: 'roda',
      background: withCollar('#000000', halfAndHalf('#ffda00', '#000000')),
      color: '#ffffff',
    },
    {
      token: 'excelsior',
      background: withCollar('#000000', halfAndHalf('#c00000', '#000000')),
      color: '#ffffff',
    },
    {
      token: 'stade rennais',
      background: withCollar('#000000', halfAndHalf('#c00000', '#000000')),
      color: '#ffffff',
    },
    {
      token: 'n e c',
      background: withCollar(
        '#000000',
        halfAndHalf('#0b7d3c', '#c00000'), // izquierda verde, derecha roja
      ),
      color: '#ffffff',
    },
    {
      token: 'pes united',
      background: withCollar('#0a1445', halfAndHalf('#ffda00', '#0a1445')),
      color: '#ffffff',
    },

    // Tipo H – cuerpo/mangas distintos (Arsenal, Aston Villa)
    {
      token: 'arsenal',
      background: withCollar('#fff', bodyWithSleeves('#c00000', '#fff')),
      color: '#ffffffff',
    },
    {
      token: 'aston villa',
      background: withCollar('#6ec6ff', bodyWithSleeves('#6a1b4d', '#6ec6ff')),
      color: '#fff',
    },
    {
      token: 'fulham',
      background: withCollar('#000000', bodyWithSleeves('#ffffff', '#000000')),
      color: '#c00000', // números rojos como en muchos kits
    },
    {
      token: 'portsmouth',
      background: withCollar('#ffd700', bodyWithSleeves('#0033a0', '#0033a0')),
      color: '#ffd700',
    },
    {
      token: 'west ham',
      background: withCollar('#6a1b4d', bodyWithSleeves('#6a1b4d', '#7fbde9')),
      color: '#ffffff',
    },

    // Tipo I – hoops (Celtic, Reading)
    {
      token: 'celtic',
      background: withCollar('#fff', horizontalHoops('#0b7d3c', '#fff', 14, '#fff')),
      color: '#111',
    },
    {
      token: 'reading',
      background: withCollar('#fff', horizontalHoops('#0033a0', '#fff', 14, '#0033a0')),
      color: 'rgba(236, 7, 7, 1)',
    },
    {
      token: 'parma',
      background: withCollar(
        '#0033a0',
        horizontalHoops('#ffda00', '#0033a0', 14, '#0033a0'),
      ),
      color: '#ffffff',
    },
    {
      token: 'sporting lisbon',
      background: withCollar(
        '#0b7d3c',
        horizontalHoops('#0b7d3c', '#ffffff', 14, '#0b7d3c'),
      ),
      color: '#111111',
    },
    {
      token: 'shop',
      background: withCollar(
        '#ffffff',
        horizontalHoops('#0f2238', '#2e7dff', 14, '#0f2238'),
      ),
      color: '#ffffff',
    },
    // Tipo J - varias franjas horizontales centradas
    {
      token: 'sampdoria',
      background: centralMultiBands(
        '#0033a0',
        [
          { color: '#fff', from: 45, to: 51 },
          { color: '#c00', from: 51, to: 55 },
          { color: '#000', from: 55, to: 59 },
          { color: '#fff', from: 59, to: 65 },
        ],
        '#0033a0',
      ),
      color: '#fff',
    },
    {
      token: 'sao paulo',
      background: withCollar(
        '#252525ff',
        centralMultiBands(
          '#fff',
          [
            { color: '#c00', from: 45, to: 53 },
            { color: '#fff', from: 53, to: 57 },
            { color: '#111', from: 57, to: 65 },
          ],
          '#fff',
        ),
      ),
      color: '#f83737ff',
    },
    {
      token: 'seleccion angola',
      background: withCollar(
        '#000000ff',
        centralMultiBands(
          '#c00000', // base roja
          [
            { color: '#000000', from: 44, to: 47 }, // negro
            { color: '#ffda00', from: 48, to: 55 }, // amarillo
            { color: '#000000', from: 56, to: 63 }, // negro
            { color: '#ffda00', from: 64, to: 67 }, // amarillo
          ],
          '#c00000', // mangas rojas
        ),
      ),
      color: '#ffda00',
    },

    // Tipo K - patrón de cuadros (checkerboard)
    {
      token: 'croatia',
      background: withCollar(
        '#fff', // cuello blanco
        svgCheckerboardDataURL('#fff', 'rgba(255, 0, 0, 1)', 5, 4), // 8x10 cuadros (ajusta a gusto)
      ),
      color: '#0d0270ff',
    },

    // Tipo L - half&half diagonal
    {
      token: 'monaco',
      background: withCollar(
        '#fff', // cuello blanco (puedes cambiarlo a rojo si prefieres)
        diagonalHalf('#c00', '#fff', 135, 56),
      ),
      color: '#e9e9e9ff',
    },
    {
      token: 'fc utrecht',
      background: withCollar(
        '#ffffff', // cuello blanco
        diagonalHalf('#fff', '#c01', 135, 56), // rojo/blanco, mismos parámetros
      ),
      color: '#111111',
    },
  ];

  const match = patterns.find((p) => name.includes(p.token));
  if (match) return { background: match.background, color: match.color };

  // Genérico
  return { background: '#0f2238', color: '#f7f7f7' };
}

function getFootColor(player: DerivedPlayer, side: 'left' | 'right'): string {
  const strongFoot = String(player.PIE ?? '')
    .trim()
    .toUpperCase();
  const weakAcc = ensureNumber(player['PRECICIÓN PIE MALO']);

  // Paleta base
  const BRIGHT_GREEN = '#1dc40eff'; // verde brillante
  const DULL_GREEN = '#0d5811ff'; // verde opaco
  const YELLOW = '#e0ae07ff';
  const ORANGE = '#cc7a00ff';
  const RED = '#972922ff';
  const NEUTRAL = '#555555';

  // Si no hay pie declarado, devolvemos neutro
  if (!strongFoot) return NEUTRAL;

  // Ambos pies fuertes => ambos verdes brillantes
  if (strongFoot === 'B') return BRIGHT_GREEN;

  // Pie fuerte por lado
  if (side === 'left' && strongFoot === 'L') return BRIGHT_GREEN;
  if (side === 'right' && strongFoot === 'R') return BRIGHT_GREEN;

  // Desde aquí, estamos mirando el pie "débil" para ese lado
  if (weakAcc === undefined || weakAcc === null) return NEUTRAL;

  if (weakAcc >= 8) return BRIGHT_GREEN; // 8
  if (weakAcc === 7) return DULL_GREEN; // 7
  if (weakAcc === 5 || weakAcc === 6) return YELLOW; // 5–6
  if (weakAcc === 3 || weakAcc === 4) return ORANGE; // 3–4
  if (weakAcc >= 1 && weakAcc <= 2) return RED; // 1–2

  return NEUTRAL;
}

function getFootStyle(
  player: DerivedPlayer,
  side: 'left' | 'right',
): React.CSSProperties {
  const color = getFootColor(player, side);
  return {
    background: color,
  };
}

function getFootTitle(player: DerivedPlayer, side: 'left' | 'right'): string {
  const strongFoot = String(player.PIE ?? '')
    .trim()
    .toUpperCase();
  const weakAcc = ensureNumber(player['PRECICIÓN PIE MALO']);
  const weakFreq = ensureNumber(player['FRECUENCIA PIE MALO']);
  const sideName = side === 'left' ? 'Izquierdo' : 'Derecho';

  if (!strongFoot) return `Pie ${sideName}`;

  const isBoth = strongFoot === 'B';
  const isStrongSide =
    isBoth ||
    (side === 'left' && strongFoot === 'L') ||
    (side === 'right' && strongFoot === 'R');

  // Caso pie hábil
  if (isStrongSide) {
    const label = isBoth ? 'Ambidiestro' : sideName;
    return `Pie Hábil: ${label}`;
  }

  // Caso pie torpe: queremos precisión + frecuencia
  const accPart =
    weakAcc != null && !Number.isNaN(weakAcc)
      ? `Precisión de Pie Torpe: ${weakAcc}`
      : 'Precisión de Pie Torpe: -';

  const freqPart =
    weakFreq != null && !Number.isNaN(weakFreq)
      ? `Frecuencia de Pie Torpe: ${weakFreq}`
      : 'Frecuencia de Pie Torpe: -';

  return `${accPart} · ${freqPart}`;
}
function resolveDorsal(player: DerivedPlayer): {
  dorsal: string;
  dorsalName: string;
  origin: 'club' | 'seleccion' | 'clasica' | 'shop' | 'libre';
} {
  const clubDorsal = player.DORSAL;
  const seleccionDorsal = player[
    NATIONAL_SELECTION_FIELD
  ] as DerivedPlayer[keyof DerivedPlayer];
  const clasicaDorsal = player[
    CLASSIC_SELECTION_FIELD
  ] as DerivedPlayer[keyof DerivedPlayer];

  const isValidDorsal = (v: DerivedPlayer[keyof DerivedPlayer]) => {
    const num = Number(v);
    return !Number.isNaN(num) && num >= 1;
  };

  const originClub =
    player.CLUB && String(player.CLUB).trim() !== '' && isValidDorsal(clubDorsal);
  const originSel =
    player[NATIONAL_SELECTION_FIELD] &&
    String(player[NATIONAL_SELECTION_FIELD]).trim() !== '' &&
    isValidDorsal(seleccionDorsal);
  const originClasica =
    player[CLASSIC_SELECTION_FIELD] &&
    String(player[CLASSIC_SELECTION_FIELD]).trim() !== '' &&
    isValidDorsal(clasicaDorsal);

  let dorsalVal: DerivedPlayer[keyof DerivedPlayer] = undefined;
  let origin: 'club' | 'seleccion' | 'clasica' | 'shop' | 'libre' = 'libre';

  if (originClub) {
    dorsalVal = clubDorsal;
    origin = 'club';
  } else if (originSel) {
    dorsalVal = seleccionDorsal;
    origin = 'seleccion';
  } else if (originClasica) {
    dorsalVal = clasicaDorsal;
    origin = 'clasica';
  }

  const dorsal =
    dorsalVal !== undefined && dorsalVal !== null && String(dorsalVal).trim() !== ''
      ? String(dorsalVal)
      : '';
  const dorsalNameRaw = player.DORSAL_1 ?? '';
  const dorsalName =
    dorsalNameRaw !== null && dorsalNameRaw !== undefined
      ? String(dorsalNameRaw).trim()
      : '';

  if (origin === 'libre' && dorsal === '') {
    origin =
      player.CLUB && String(player.CLUB).toLowerCase().includes('shop')
        ? 'shop'
        : 'libre';
  }

  return { dorsal, dorsalName, origin };
}

const MACRO_FIELDS: (keyof DerivedPlayer)[] = ['ATK', 'TEC', 'RES', 'DEF', 'FUE', 'VEL'];
const CORE_STATS: Array<keyof DerivedPlayer> = [
  'ATAQUE',
  'DEFENSA',
  'ESTABILIDAD',
  'RESISTENCIA',
  'VELOCIDAD MÁXIMA',
  'ACELERACIÓN',
  'REPUESTA',
  'AGILIDAD',
  'PRECISIÓN DRIBBLE',
  'VELOCIDAD DRIBBLE',
  'PRECISIÓN   P CORTO',
  'VELOCIDAD  P CORTO',
  'PRECISIÓN       P LARGO',
  'VELOCIDAD     P LARGO',
  'PRECISIÓN DISPARO',
  'POTENCIA DISPARO',
  'TÉCNICA DISPARO',
  'PRECISIÓN TIRO LIBRE',
  'EFECTO',
  'CABEZAZO',
  'SALTO',
  'TÉCNICA',
  'AGRESIVIDAD',
  'MENTALIDAD',
  'ARQUERO',
  'TRABAJO EN EQUIPO',
] as Array<keyof DerivedPlayer>;

const CONDITION_STATS: Array<keyof DerivedPlayer> = [
  'DESTREZA ATAQUE',
  'FINIQUITO',
  'DESTREZA DEFENSA',
  'RECUPERACION DE BALÓN',
  'VELOCIDAD',
  'EXPLOSIVIDAD',
  'POTENCIA DE PATADA',
  'JUEGO AEREO',
  'ALETISMO',
  'CREATIVIDAD',
  'TOLERANCIA LESIONES',
  'CONSISTENCIA',
  'CONDICIÓN FITNESS',
] as Array<keyof DerivedPlayer>;

interface StatusBadge {
  key: string;
  label: string;
  className: string;
  title: string;
}

const STATUS_BADGES: StatusBadge[] = [
  { key: 'national', label: '🌍', className: 'badge', title: 'Seleccionado Nacional' },
  { key: 'legend', label: '★', className: 'badge legend', title: 'Jugador Leyenda' },
  { key: 'ml', label: 'ML', className: 'badge ml', title: 'Jugador ML' },
  {
    key: 'anfpes',
    label: 'ANFPES',
    className: 'badge anfpes',
    title: 'Afiliado a la ANFPES',
  },
];

function getStatusBadges(player: DerivedPlayer): StatusBadge[] {
  const selectionValue = formatSelectionDisplay(
    player[NATIONAL_SELECTION_FIELD] as string,
  );
  const classicValue = formatSelectionDisplay(player['nro clasico'] as string);
  const playerName = String(player.NOMBRE ?? '').trim();
  const rawClub = String(player.CLUB ?? '').trim();

  const hasNationalTeam = selectionValue !== 'No';
  const isLegend = classicValue !== 'No' || LEGEND_PLAYERS.has(playerName);
  const isMLPlayer = ML_PLAYERS.has(playerName);
  const isAnfpes = ANFPES_CLUBS.has(rawClub);

  return STATUS_BADGES.filter((badge) => {
    if (badge.key === 'national') return hasNationalTeam;
    if (badge.key === 'legend') return isLegend;
    if (badge.key === 'ml') return isMLPlayer;
    if (badge.key === 'anfpes') return isAnfpes;
    return false;
  });
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function findPlayerByQuery(players: DerivedPlayer[] | undefined, query: string) {
  if (!players) return undefined;
  const normalized = normalize(query.trim());
  if (!normalized) return undefined;

  return (
    players.find((player) => normalize(String(player.ID)) === normalized) ??
    players.find((player) =>
      normalize(String(player.NOMBRE ?? '')).includes(normalized),
    ) ??
    players.find((player) => normalize(String(player.CLUB ?? '')).includes(normalized))
  );
}

export function PlayerProfile() {
  const players = useCacheStore((state) => state.players);
  const selectedPlayerId = useCacheStore((state) => state.selectedPlayerId);
  const setSelectedPlayer = useCacheStore((state) => state.setSelectedPlayer);
  const status = useCacheStore((state) => state.status);
  const error = useCacheStore((state) => state.error);

  const [query, setQuery] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [formById, setFormById] = useState<Record<string, FormStateId>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [faceSrc, setFaceSrc] = useState<string>('/images/faces/missing.png');

  const playerKey = String(selectedPlayerId ?? '');
  const formState = formById[playerKey] ?? DEFAULT_FORM_STATE;

  useEffect(() => {
    setFormOpen(false);
  }, [playerKey]);

  const loading = status === 'idle' || status === 'loading';

  const player = useMemo(() => {
    if (!players || !selectedPlayerId) return undefined;
    return players.find((p) => String(p.ID) === String(selectedPlayerId));
  }, [players, selectedPlayerId]);

  const addon: ProfileAddon | undefined = useMemo(() => {
    if (!player) return undefined;
    const key = String(player.ID);
    return (profileAddons as Record<string, ProfileAddon>)[key];
  }, [player]);

  const isLegendPlayer = useMemo(() => {
    if (!player) return false;
    const playerName = String(player.NOMBRE ?? '').trim();
    const classicValue = formatSelectionDisplay(player['nro clasico'] as string);
    return classicValue !== 'No' || LEGEND_PLAYERS.has(playerName);
  }, [player]);

  useEffect(() => {
    const legendFallback = '/images/faces/Legend.png';
    const defaultFallback = '/images/faces/missing.png';
    const nextSrc = addon?.image || (isLegendPlayer ? legendFallback : defaultFallback);
    setFaceSrc(nextSrc);
  }, [addon, isLegendPlayer]);

  const suggestions = useMemo(() => {
    if (!players) return [];
    const normalized = normalize(query.trim());
    if (!normalized) {
      return [];
    }
    return players
      .filter((player) => {
        const name = normalize(String(player.NOMBRE ?? ''));
        const id = normalize(String(player.ID ?? ''));
        const club = normalize(String(player.CLUB ?? ''));
        return (
          name.includes(normalized) ||
          id.includes(normalized) ||
          club.includes(normalized)
        );
      })
      .slice(0, 8);
  }, [players, query]);

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (!players) return;
      const candidate = findPlayerByQuery(players, query);
      if (!candidate) {
        setLookupError('No encontramos un jugador con ese criterio');
        return;
      }
      setLookupError('');
      setQuery('');
      setSelectedPlayer(String(candidate.ID));
    },
    [players, query, setSelectedPlayer],
  );

  const handleSelectSuggestion = useCallback(
    (selectedPlayer: DerivedPlayer) => {
      setQuery('');
      setLookupError('');
      setSelectedPlayer(String(selectedPlayer.ID));
    },
    [setSelectedPlayer],
  );

  const showSuggestions = Boolean(query.trim() && suggestions.length > 0);
  const showSelector = Boolean(lookupError || showSuggestions);

  const handleChangeForm = useCallback(
    (next: FormStateId) => {
      if (!playerKey) return;
      setFormById((prev) => ({ ...prev, [playerKey]: next }));
      setFormOpen(false);
    },
    [playerKey],
  );

  // Aplicar form multipliers a los valores
  const getAdjustedValue = useCallback(
    (field: keyof DerivedPlayer) => {
      if (!player) return undefined;
      const baseValue = ensureNumber(player[field]);
      return applyFormMultiplier(baseValue, field as any, formState);
    },
    [player, formState],
  );

  const computeMacrosWithForm = useCallback(() => {
    if (!player) return { ATK: 0, TEC: 0, RES: 0, DEF: 0, FUE: 0, VEL: 0 };

    const get = (key: keyof DerivedPlayer) =>
      applyFormMultiplier(ensureNumber(player[key]), key as string, formState) ?? 0;

    const atk = get('ATAQUE') * 0.75 + get('PRECISIÓN DISPARO') * 0.25;
    const tec =
      get('TÉCNICA') * 0.4 +
      get('PRECISIÓN DRIBBLE') * 0.3 +
      get('PRECISIÓN   P CORTO') * 0.1 +
      get('PRECISIÓN       P LARGO') * 0.05 +
      get('PRECISIÓN TIRO LIBRE') * 0.1 +
      get('EFECTO') * 0.05;
    const res = get('RESISTENCIA');
    const def = get('DEFENSA');
    const fue =
      get('ESTABILIDAD') * 0.6 + get('SALTO') * 0.3 + get('POTENCIA DISPARO') * 0.1;
    const vel =
      get('VELOCIDAD MÁXIMA') * 0.2 +
      get('ACELERACIÓN') * 0.3 +
      get('REPUESTA') * 0.2 +
      get('VELOCIDAD DRIBBLE') * 0.3;

    return { ATK: atk, TEC: tec, RES: res, DEF: def, FUE: fue, VEL: vel };
  }, [player, formState]);

  if (loading) {
    return (
      <section className="profile-shell">
        <p className="muted">Leyendo jugadores ···</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="profile-shell">
        <p className="error">{error}</p>
      </section>
    );
  }

  if (!player) {
    return (
      <section className="profile-shell">
        <header className="profile-search-header">
          <form className="profile-search-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Buscar jugador por nombre, ID o club..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
            />
            <button type="submit" className="secondary-button" disabled={!query.trim()}>
              Buscar
            </button>
          </form>
        </header>

        {showSelector && (
          <div className="profile-selector">
            {lookupError && <p className="error">{lookupError}</p>}
            {showSuggestions && (
              <div className="profile-suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.ID as string}
                    type="button"
                    className="suggestion-button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    <span className="suggestion-name">{suggestion.NOMBRE}</span>
                    <span className="suggestion-club">
                      {formatClub(
                        suggestion.CLUB as string,
                        suggestion.NACIONALIDAD as string,
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!showSelector && (
          <p className="muted">Busca un jugador para ver su perfil completo.</p>
        )}
      </section>
    );
  }

  const clubShield = getClubShieldPath(player.CLUB as string);
  const flagPath = getFlagImagePath(player.NACIONALIDAD as string);
  const nationalityInfo = getNationalityInfo(player.NACIONALIDAD as string);
  const clubLabel = formatClub(player.CLUB as string, player.NACIONALIDAD as string);
  const positions = getPlayerPositions(player);
  const primaryPosition = positions[0];
  const badges = getStatusBadges(player);
  const promedioValue = ensureNumber(player.PROMEDIO);
  const promedio = formatPlayerValue(promedioValue, 1);
  const promedioColor =
    promedioValue !== undefined ? (getStatColor(promedioValue) ?? '#ffd166') : '#ffd166';
  const primaryLine = primaryPosition ? getPositionLine(primaryPosition) : undefined;

  const { dorsal, dorsalName, origin: shirtOrigin } = resolveDorsal(player);
  const shirtStyle = getShirtStyle(
    shirtOrigin,
    player.CLUB as string,
    player.NACIONALIDAD as string,
  );
  const dorsalDisplay = dorsal;
  const dorsalNameDisplay =
    dorsalName || (player.DORSAL_1 ? String(player.DORSAL_1) : '');
  const macros = computeMacrosWithForm();
  const macroDataset = {
    id: String(player.ID),
    label: player.NOMBRE as string,
    values: MACRO_FIELDS.map((field) => (macros as any)[field] ?? 0),
    color: '#7ac9ff',
    fillOpacity: 0.16,
  };

  return (
    <section className="profile-shell">
      <header className="profile-header">
        <div className="profile-identity">
          <div className="contenedor-borde">
            <div
              className="profile-shirt"
              data-shirt-origin={shirtOrigin}
              style={
                {
                  color: shirtStyle.color,
                  '--shirt-overlay': shirtStyle.background || '#0f2238',
                } as React.CSSProperties
              }
            >
              <div className="shirt-name">{dorsalNameDisplay}</div>
              <div className="shirt-number">{dorsalDisplay}</div>
            </div>
          </div>
          <div className="profile-face">
            <img
              src={faceSrc}
              alt={`${addon?.fullName ?? player?.NOMBRE ?? 'Jugador'}`}
              onError={(e) => {
                const legendFallback = '/images/faces/Legend.png';
                const defaultFallback = '/images/faces/missing.png';
                const alreadyLegend = e.currentTarget.src.endsWith(legendFallback);
                const alreadyDefault = e.currentTarget.src.endsWith(defaultFallback);
                if (
                  (isLegendPlayer && alreadyLegend) ||
                  (!isLegendPlayer && alreadyDefault)
                ) {
                  return;
                }
                e.currentTarget.src = isLegendPlayer ? legendFallback : defaultFallback;
              }}
            />
          </div>
        </div>

        <div className="profile-main-info">
          <div className="profile-name">
            <header
              className="clickable-name"
              style={{ cursor: 'pointer' }}
              onClick={(e) => openPlayerActionsMenu(e, player, { hideProfile: true })}
            >
              {player.NOMBRE}
            </header>
            <div className="player-badges">
              <div className="form-dropdown profile-form" title="Forma del jugador">
                {FORM_STATES.map(
                  (st) =>
                    st.id === formState && (
                      <button
                        key={st.id}
                        type="button"
                        className="form-trigger"
                        style={{ color: st.color, borderColor: st.color }}
                        onClick={() => setFormOpen((v) => !v)}
                      >
                        {st.icon}
                      </button>
                    ),
                )}
                {formOpen && (
                  <div className="form-menu">
                    {FORM_STATES.map((state) => (
                      <button
                        key={state.id}
                        type="button"
                        className={`form-option ${formState === state.id ? 'active' : ''}`}
                        style={{ color: state.color, borderColor: state.color }}
                        onClick={() => handleChangeForm(state.id)}
                      >
                        <span className="form-option-icon">{state.icon}</span>
                        <span className="form-option-label">{state.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {badges.map((badge) => (
                <span key={badge.key} className={badge.className} title={badge.title}>
                  {badge.label}
                </span>
              ))}
            </div>
          </div>

          <div className="profile-sub muted">
            <span>
              {addon?.fullName || player?.NOMBRE}
              {addon?.birthDate ? ` · ${addon.birthDate}` : ''}
            </span>
          </div>

          <div className="profile-main-data">
            <span>{formatPlayerValue(player.EDAD, 0)} años</span>
            <span>·</span>
            <span>{formatPlayerValue(player.ALTURA, 0)} cm</span>
            <span>·</span>
            <span>{formatPlayerValue(player.PESO, 0)} kg</span>
            <span>·</span>
            <span>Tono {formatSkinTone(player['SKIN COLOR'])} </span>
          </div>
        </div>

        <div className="profile-average-position">
          <div
            className="player-average"
            style={{ color: promedioColor }}
            title={`Promedio principal: ${promedio}`}
          >
            {promedio}
          </div>
          {primaryPosition && (
            <span
              className={`primary-position-tag position-badge primary position-${primaryLine ?? 'DEF'}`}
              title={`Posición Principal: ${getPositionFullName(primaryPosition)}`}
            >
              {primaryPosition}
            </span>
          )}
        </div>

        <div className="profile-club-flag">
          {clubShield && (
            <img src={clubShield} title={clubLabel} alt="" className="club-shield" />
          )}
          {flagPath && (
            <img src={flagPath} alt="" title={nationalityInfo?.name} className="flag" />
          )}
        </div>
        <div className="profile-foot">
          <div
            className="profile-foot-left"
            title={getFootTitle(player, 'left')}
            style={getFootStyle(player, 'left')}
          />
          <div
            className="profile-foot-right"
            title={getFootTitle(player, 'right')}
            style={getFootStyle(player, 'right')}
          />
        </div>
        <button
          type="button"
          className="profile-clear-button"
          aria-label="Limpiar jugador"
          onClick={() => setSelectedPlayer(null)}
        >
          ×
        </button>
      </header>

      <div className="profile-grid three-cols">
        <div className="profile-panel tall">
          <h3>RADAR</h3>
          <div className="profile-radar-row">
            <RadarChart
              labels={MACRO_FIELDS.map((field) => getFieldLabel(field as string))}
              datasets={[macroDataset]}
              size={220}
              showLegend={false}
            />
          </div>
          <div className="profile-special-skills">
            <h3>HABILIDADES ESPECIALES</h3>
            <PlayerSkills player={player} />
          </div>
        </div>

        <div className="profile-panel">
          <h3>STATS</h3>
          <div className="profile-stats-grid compact">
            {CORE_STATS.map((field) => {
              const value = getAdjustedValue(field) ?? 0;
              const color = getStatColor(value) ?? '#7ac9ff';
              return (
                <div key={field as string} className="stat-block row compact">
                  <span className="stat-label">{getFieldLabel(field as string)}</span>
                  <span className="stat-value" style={{ color }}>
                    {formatPlayerValue(value, 0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="profile-panel">
          <h3>MÉTRICAS</h3>
          <div className="profile-metric-grid compact">
            {CONDITION_STATS.map((field) => {
              const rawValue = player[field];
              const displayValue = getFieldDisplayValue(field as string, player);

              // Caso especial: TOLERANCIA LESIONES (usa letras A/B/C y color propio)
              if (field === 'TOLERANCIA LESIONES') {
                const injuryCode = String(rawValue ?? '').trim();
                const color = getInjuryColor(injuryCode) ?? '#7ac9ff';

                return (
                  <div key={field as string} className="stat-block row compact">
                    <span className="stat-label">{getFieldLabel(field as string)}</span>
                    <span className="stat-value" style={{ color }}>
                      {displayValue}
                    </span>
                  </div>
                );
              }

              // Resto de stats: siguen siendo numéricos
              const value = ensureNumber(rawValue) ?? 0;
              const color = getStatColor(value) ?? '#7ac9ff';

              return (
                <div key={field as string} className="stat-block row compact">
                  <span className="stat-label">{getFieldLabel(field as string)}</span>
                  <span className="stat-value" style={{ color }}>
                    {formatPlayerValue(value, 0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="profile-panel">
          <h3>POSICIONES</h3>
          <PositionMap
            player={player}
            activeCells={getActivePositionCells(player)}
            primaryPosition={positions[0]}
          />
        </div>
      </div>

      <div className="profile-panel full stats-card">
        <div className="profile-stadistics">
          <h3>HISTORIAL ESTADÍSTICO</h3>
          <PlayerStatsHistory player={player} />
        </div>
      </div>
    </section>
  );
}

interface GoalRecord {
  name: string;
  nameNormalized: string;
  user: string | null;
  team: string | null;
  goals: number;
  season: number | null;
  type: string | null;
  competition: string | null;
}

interface SeasonStats {
  user: string;
  team: string;
  season: number;
  liga: number;
  copa: number;
  seleccion: number;
  amistosa: number;
  total: number;
  competitions: Map<string, number>;
}

function PlayerStatsHistory({ player }: { player: DerivedPlayer }) {
  const playerName = normalizeName(String(player.NOMBRE || ''));
  const records = (goalStatsData.records as GoalRecord[]).filter((r) => {
    // Intentar match exacto con nameNormalized
    if (r.nameNormalized === playerName) return true;

    // Si no matchea, intentar normalizar el nombre original del JSON
    const originalNormalized = normalizeName(r.name || '');
    return originalNormalized === playerName;
  });

  if (records.length === 0) {
    return <p className="stats-empty">Sin historial de goles registrado</p>;
  }

  // Agrupar por DT + Club + Temporada
  const grouped = new Map<string, SeasonStats>();

  records.forEach((record) => {
    const key = `${record.user || 'Sin DT'}_${record.team || 'Sin club'}_${record.season || 0}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        user: record.user || 'Sin DT',
        team: record.team || 'Sin club',
        season: record.season || 0,
        liga: 0,
        copa: 0,
        seleccion: 0,
        amistosa: 0,
        total: 0,
        competitions: new Map(),
      });
    }

    const row = grouped.get(key)!;
    const goals = record.goals || 0;
    const type = (record.type || '').trim();
    const comp = record.competition || 'Sin especificar';

    // Mapeo por TYPE (más confiable que competition)
    if (type === 'Liga') {
      row.liga += goals;
    } else if (type === 'Copa') {
      row.copa += goals;
    } else if (type === 'Selección Nacional') {
      row.seleccion += goals;
    } else if (type === 'Copa Amistosa') {
      row.amistosa += goals;
    }

    row.total += goals;

    // Guardar también por competición específica para análisis
    const currentComp = row.competitions.get(comp) || 0;
    row.competitions.set(comp, currentComp + goals);
  });

  const seasons = Array.from(grouped.values()).sort(
    (a, b) => a.season - b.season || a.user.localeCompare(b.user),
  );

  // Calcular estadísticas generales
  const totals = {
    liga: seasons.reduce((sum, s) => sum + s.liga, 0),
    copa: seasons.reduce((sum, s) => sum + s.copa, 0),
    seleccion: seasons.reduce((sum, s) => sum + s.seleccion, 0),
    amistosa: seasons.reduce((sum, s) => sum + s.amistosa, 0),
    total: seasons.reduce((sum, s) => sum + s.total, 0),
  };

  const uniqueSeasons = new Set(seasons.map((s) => s.season)).size;
  const average = uniqueSeasons > 0 ? (totals.total / uniqueSeasons).toFixed(1) : '0';

  // Encontrar récords
  const bestSeason = seasons.reduce(
    (max, s) => (s.total > max.total ? s : max),
    seasons[0],
  );

  // Estadísticas por competición
  const allCompetitions = new Map<string, number>();
  seasons.forEach((s) => {
    s.competitions.forEach((goals, comp) => {
      const current = allCompetitions.get(comp) || 0;
      allCompetitions.set(comp, current + goals);
    });
  });

  const topCompetitions = Array.from(allCompetitions.entries())
    .filter(([comp, goals]) => goals > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Evolución temporal (últimas 10 temporadas)
  const recentSeasons = seasons.slice(-10);
  const maxGoalsInRecent = Math.max(...recentSeasons.map((s) => s.total), 1);

  return (
    <div className="stats-history-wrapper">
      {/* Panel de resumen compacto */}
      <div className="stats-summary-grid">
        <div className="stat-card total">
          <span className="stat-card-value">{totals.total}</span>
          <div>
            <span className="stat-card-label">Goles Totales</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-card-value">{average}</span>
          <div>
            <span className="stat-card-label">Promedio de Goles por Temporada</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-card-value">{bestSeason.total}</span>
          <div>
            <span className="stat-card-label">Mejor Temporada</span>
            <span className="stat-card-detail">
              T{bestSeason.season} · {bestSeason.team}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-card-value">{uniqueSeasons}</span>
          <div>
            <span className="stat-card-label">Temporadas</span>
          </div>
        </div>
      </div>

      {/* Tabla detallada */}
      <div className="stats-table-section">
        <div className="stats-history-scroll">
          <table className="stats-history-table">
            <thead>
              <tr>
                <th>DT</th>
                <th>Club</th>
                <th>Temporada</th>
                <th>Liga</th>
                <th>Copa</th>
                <th>Selección</th>
                <th>Amistoso</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((row, idx) => (
                <tr
                  key={idx}
                  className={row.total === bestSeason.total ? 'highlight-row' : ''}
                >
                  <td className="dt-cell" title={row.user}>
                    {row.user}
                  </td>
                  <td className="team-cell" title={row.team}>
                    {row.team}
                  </td>
                  <td className="season-cell">{row.season}</td>
                  <td className="goal-cell">{row.liga || '–'}</td>
                  <td className="goal-cell">{row.copa || '–'}</td>
                  <td className="goal-cell">{row.seleccion || '–'}</td>
                  <td className="goal-cell">{row.amistosa || '–'}</td>
                  <td className="goal-cell total">{row.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan={3} className="total-label">
                  TOTAL
                </td>
                <td className="goal-cell">{totals.liga}</td>
                <td className="goal-cell">{totals.copa}</td>
                <td className="goal-cell">{totals.seleccion}</td>
                <td className="goal-cell">{totals.amistosa}</td>
                <td className="goal-cell total">{totals.total}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Top 5 competiciones */}
      {topCompetitions.length > 0 && (
        <div className="stats-top-competitions">
          <h4>Top Competiciones</h4>
          <div className="top-comp-list">
            {topCompetitions.map(([comp, goals], idx) => (
              <div key={idx} className="top-comp-item">
                <span className="comp-rank">#{idx + 1}</span>
                <span className="comp-name">{comp}</span>
                <span className="comp-goals">{goals}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerSkills({ player }: { player: DerivedPlayer }) {
  const skillEntries = Array.from(SPECIAL_SKILL_FIELDS).map((field) => {
    const value = player[field as keyof DerivedPlayer];
    return {
      field,
      label: '★ ' + getFieldLabel(field),
      active: isSkillActive(value),
    };
  });
  const activeSkills = skillEntries.filter((entry) => entry.active);
  if (!activeSkills.length) {
    return <p className="muted">Sin habilidades activas</p>;
  }

  return (
    <div className="skills-grid">
      {activeSkills.map((skill) => (
        <span key={skill.field} className="skill-pill active">
          {skill.label}
        </span>
      ))}
    </div>
  );
}

function isSkillActive(value: DerivedPlayer[keyof DerivedPlayer]): boolean {
  if (value === null || value === undefined) return false;
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return normalized === 'si' || normalized === '1' || normalized === 'true';
}

export default PlayerProfile;
