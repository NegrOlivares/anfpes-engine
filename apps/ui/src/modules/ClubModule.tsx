import type { DerivedPlayer } from '@anfpes/engine';
import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ANFPES_CLUBS, LEGEND_PLAYERS, ML_PLAYERS } from '../data/playerStatus';
import { CLUB_IDENTITIES } from '../data/clubIdentities';
import {
  CLUBS_BY_DIVISION,
  TXXIII_SHORT_TERM_PLAYER_NAMES,
  getClubCompetitionDetail,
  sortClubsAlphabetically,
} from '../data/clubCompetition';
import { useCacheStore } from '../store/cacheStore';
import { MODULE_IDS, useModuleStore } from '../store/moduleStore';
import { useClubViewStore } from '../store/clubViewStore';
import { createEmptyClubLineup, useClubLineupStore } from '../store/clubLineupStore';
import type { ClubLineupConfig } from '../store/clubLineupStore';
import { useActivityHistoryStore } from '../store/activityHistoryStore';
import { useIdentityStore } from '../store/identityStore';
import { usePlayerProfileStore } from '../store/playerProfileStore';
import { FORMATIONS } from '../store/tacticsStore';
import type { FormationSlot } from '../types/tactics';
import { TacticalPitch } from '../components/TacticalPitch';
import { EnhancedTooltip } from '../components/EnhancedTooltip';
import { getShirtStyle } from '../components/PlayerProfile';
import {
  getClubFrontKitImages,
  getClubKitImage,
  getClubShieldPath,
  getFlagImagePath,
  getPlayerFacePath,
  getPlayerThumbPath,
} from '../utils/imageHelpers';
import { ensureNumber, formatPlayerValue } from '../utils/format';
import { getStatColor } from '../types/table';
import {
  PositionBadges,
  getPositionFullName,
  getPlayerPositions,
  getPositionLine,
} from '../components/PositionBadges';
import { formatNationality, formatSelectionDisplay } from '../utils/playerDisplay';

type MacroField = 'ATK' | 'TEC' | 'RES' | 'DEF' | 'FUE' | 'VEL';
type SortDirection = 'asc' | 'desc';
type SortKey =
  | 'DORSAL'
  | 'NOMBRE'
  | 'POSICIONES'
  | 'EDAD'
  | 'NACIONALIDAD'
  | MacroField
  | 'PROMEDIO';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

interface ClubSummary {
  club: string;
  division?: string;
  manager?: string;
  shortTermPlayer?: string;
  roster: DerivedPlayer[];
  rosterCount: number;
  average: number | undefined;
  averageAge: number | undefined;
  averageHeight: number | undefined;
  averageWeight: number | undefined;
  nationalCount: number;
  legendCount: number;
  mlCount: number;
}

interface StatusBadge {
  key: string;
  label: string;
  className: string;
  title: string;
}

interface PositionDepthEntry {
  position: string;
  players: Array<{
    player: DerivedPlayer;
    rating: number;
  }>;
}

interface ClubAnalysisProfile {
  summary: ClubSummary;
  roster: DerivedPlayer[];
  overall: number;
  macros: Record<MacroField, number>;
  lines: Record<PositionLineKey, number>;
  dimensions: Record<AnalysisDimensionKey, number>;
  attackIndex: number;
  defenceIndex: number;
  balanceIndex: number;
}

interface FormationAssignment {
  slot: FormationSlot;
  player: DerivedPlayer;
  rating: number;
  score: number;
  fit: 'natural' | 'compatible' | 'adapted' | 'forced';
}

interface FormationRecommendation {
  formationName: string;
  score: number;
  assignments: FormationAssignment[];
}

interface ResolvedLineupPlayer {
  slot: FormationSlot;
  player: DerivedPlayer;
  rating: number;
}

interface LineupDuel {
  own: ResolvedLineupPlayer;
  opponent: ResolvedLineupPlayer;
  context: VsDuelContext;
  stats: VsDuelStat[];
  ownScore: number;
  opponentScore: number;
  difference: number;
  distance: number;
}

type VsProfileKey =
  | 'carrying'
  | 'creation'
  | 'finishing'
  | 'containment'
  | 'pressing'
  | 'aerial'
  | 'keeper';

interface VsDuelContext {
  type: 'wide' | 'central' | 'midfield' | 'aerial' | 'keeper' | 'default';
  label: string;
  ownLabel: string;
  opponentLabel: string;
  contests: VsDuelStatDefinition[];
}

interface VsDuelStatDefinition {
  label: string;
  ownKey: AnalysisDimensionKey;
  opponentKey: AnalysisDimensionKey;
}

interface VsDuelStat {
  label: string;
  ownLabel: string;
  opponentLabel: string;
  ownValue: number;
  opponentValue: number;
  difference: number;
}

interface VsFocusItem {
  key: string;
  kind: 'advantage' | 'risk' | 'control';
  title: string;
  detail: string;
  value: number;
}

type VsTerritorySide = 'own' | 'opponent';

interface VsTerritoryPoint {
  id: string;
  side: VsTerritorySide;
  sideLabel: string;
  entry: ResolvedLineupPlayer;
  point: ChartPoint;
  influenceScore: number;
  influenceWeight: number;
  influenceContext: VsDuelContext | null;
  influenceStats: VsDuelStat[];
  influenceOpponent: ResolvedLineupPlayer | null;
}

interface VsTerritoryCell {
  point: VsTerritoryPoint;
  polygon: ChartPoint[];
  area: number;
}

interface VsTerritoryQuadrant {
  key: string;
  label: string;
  shortLabel: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface VsQuadrantSummary extends VsTerritoryQuadrant {
  winner: VsTerritorySide | 'even';
  winnerLabel: string;
  ownShare: number;
  opponentShare: number;
  ownQuality: number;
  opponentQuality: number;
  ownControl: number;
  opponentControl: number;
  dominantPoint: VsTerritoryPoint | null;
  reason: string;
}

interface VsVisualTerritoryPoint {
  point: VsTerritoryPoint;
  visualPoint: ChartPoint;
  labelPoint: ChartPoint;
  textAnchor: 'start' | 'middle' | 'end';
}

type PositionLineKey = 'PT' | 'DEF' | 'MED' | 'ATA';
type AnalysisDimensionGroup =
  | 'gameReading'
  | 'physical'
  | 'dribbling'
  | 'passing'
  | 'finishing'
  | 'goalkeeping';
type AnalysisDimensionKey =
  | 'attack'
  | 'defense'
  | 'balance'
  | 'stamina'
  | 'topSpeed'
  | 'acceleration'
  | 'response'
  | 'agility'
  | 'dribbleAccuracy'
  | 'dribbleSpeed'
  | 'shortPassAccuracy'
  | 'shortPassSpeed'
  | 'longPassAccuracy'
  | 'longPassSpeed'
  | 'shotAccuracy'
  | 'shotPower'
  | 'shotTechnique'
  | 'freeKickAccuracy'
  | 'swerve'
  | 'heading'
  | 'jump'
  | 'technique'
  | 'aggression'
  | 'mentality'
  | 'goalkeeping'
  | 'teamwork';

interface AnalysisDimensionDefinition {
  key: AnalysisDimensionKey;
  field: keyof DerivedPlayer;
  label: string;
  shortLabel: string;
  group: AnalysisDimensionGroup;
  description: string;
}

interface ChartPoint {
  x: number;
  y: number;
}

interface ChartTooltipState {
  x: number;
  y: number;
  content: ReactNode;
}

const MACRO_FIELDS: MacroField[] = ['ATK', 'TEC', 'RES', 'DEF', 'FUE', 'VEL'];
const ANALYSIS_LINE_ORDER: PositionLineKey[] = ['PT', 'DEF', 'MED', 'ATA'];
const DEFAULT_FORMATION = '4-4-2';
const CLUB_CURRENT_SEASON_LABEL = 'T-XXIII';
const SHORT_TERM_BADGE_LABEL = '⏳';

const POSITION_DEPTH_ORDER = [
  'PT',
  'LIB',
  'CT',
  'SA',
  'DD',
  'DI',
  'CCD',
  'LA',
  'DLD',
  'DLI',
  'CC',
  'VOL',
  'CDR',
  'CIZ',
  'MP',
  'EX',
  'ED',
  'EI',
  'SD',
  'DC',
];

const CRITICAL_DEPTH_ORDER = POSITION_DEPTH_ORDER.filter(
  (position) => !['DD', 'DI', 'DLD', 'DLI', 'CDR', 'CIZ', 'ED', 'EI'].includes(position),
);

const POSITION_AVERAGE_FIELD: Record<string, keyof DerivedPlayer> = {
  PT: 'PT',
  LIB: 'LIB',
  CT: 'CT',
  SA: 'SA',
  DD: 'SA',
  DI: 'SA',
  CCD: 'CCD',
  LA: 'LA',
  DLD: 'LA',
  DLI: 'LA',
  CC: 'CC',
  VOL: 'VOL',
  CDR: 'VOL',
  CIZ: 'VOL',
  MP: 'MP',
  EX: 'EX',
  ED: 'EX',
  EI: 'EX',
  SD: 'SD',
  DC: 'DC',
};

const POSITION_DEPTH_COVERAGE: Record<string, string[]> = {
  SA: ['SA', 'DD', 'DI'],
  LA: ['LA', 'DLD', 'DLI'],
  VOL: ['VOL', 'CDR', 'CIZ'],
  EX: ['EX', 'ED', 'EI'],
};

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
  {
    key: 'shortTerm',
    label: SHORT_TERM_BADGE_LABEL,
    className: 'badge short-term',
    title: 'Contratado por una temporada en T-XXIII',
  },
];

const MACRO_LABELS: Record<MacroField, string> = {
  ATK: 'ATK',
  TEC: 'TEC',
  RES: 'RES',
  DEF: 'DEF',
  FUE: 'FUE',
  VEL: 'VEL',
};

const LINE_ROLES: Record<PositionLineKey, string[]> = {
  PT: ['PT'],
  DEF: ['LIB', 'CT', 'SA', 'DD', 'DI'],
  MED: ['CCD', 'LA', 'DLD', 'DLI', 'CC', 'VOL', 'CDR', 'CIZ', 'MP'],
  ATA: ['EX', 'ED', 'EI', 'SD', 'DC'],
};

const LINE_LABELS: Record<PositionLineKey, string> = {
  PT: 'Porteria',
  DEF: 'Defensa',
  MED: 'Mediocampo',
  ATA: 'Ataque',
};

const LINE_COLORS: Record<PositionLineKey, string> = {
  PT: '#ffd166',
  DEF: '#4ea8de',
  MED: '#06d6a0',
  ATA: '#ff5c5c',
};

const ANALYSIS_DIMENSIONS: AnalysisDimensionDefinition[] = [
  {
    key: 'attack',
    field: 'ATAQUE',
    label: 'Ataque',
    shortLabel: 'ATQ',
    group: 'gameReading',
    description: 'Lectura ofensiva, disponibilidad y aparicion en zonas de dano.',
  },
  {
    key: 'defense',
    field: 'DEFENSA',
    label: 'Defensa',
    shortLabel: 'DEF',
    group: 'gameReading',
    description: 'Lectura defensiva, cierre de espacios, anticipacion y recuperacion.',
  },
  {
    key: 'balance',
    field: 'ESTABILIDAD',
    label: 'Estabilidad',
    shortLabel: 'EST',
    group: 'physical',
    description: 'Firmeza al contacto y control corporal.',
  },
  {
    key: 'stamina',
    field: 'RESISTENCIA',
    label: 'Resistencia',
    shortLabel: 'RES',
    group: 'physical',
    description: 'Capacidad de sostener esfuerzo durante el partido.',
  },
  {
    key: 'topSpeed',
    field: 'VELOCIDAD M\u00c1XIMA',
    label: 'Velocidad Maxima',
    shortLabel: 'VMX',
    group: 'physical',
    description: 'Velocidad maxima en carrera larga.',
  },
  {
    key: 'acceleration',
    field: 'ACELERACI\u00d3N',
    label: 'Aceleracion',
    shortLabel: 'ACE',
    group: 'physical',
    description: 'Arranque y ganancia de velocidad en los primeros metros.',
  },
  {
    key: 'response',
    field: 'REPUESTA',
    label: 'Respuesta',
    shortLabel: 'RSP',
    group: 'gameReading',
    description: 'Reaccion mental y fisica ante la jugada.',
  },
  {
    key: 'agility',
    field: 'AGILIDAD',
    label: 'Agilidad',
    shortLabel: 'AGI',
    group: 'physical',
    description: 'Giro, cambio de direccion y soltura corporal.',
  },
  {
    key: 'dribbleAccuracy',
    field: 'PRECISI\u00d3N DRIBBLE',
    label: 'Precision de Conduccion',
    shortLabel: 'PCD',
    group: 'dribbling',
    description: 'Limpieza y control tecnico al llevar la pelota.',
  },
  {
    key: 'dribbleSpeed',
    field: 'VELOCIDAD DRIBBLE',
    label: 'Velocidad de Conduccion',
    shortLabel: 'VCD',
    group: 'dribbling',
    description: 'Rapidez para conducir sin romper la accion.',
  },
  {
    key: 'shortPassAccuracy',
    field: 'PRECISI\u00d3N   P CORTO',
    label: 'Precision Pase Corto',
    shortLabel: 'PPC',
    group: 'passing',
    description: 'Precision en pases cortos y combinaciones cercanas.',
  },
  {
    key: 'shortPassSpeed',
    field: 'VELOCIDAD  P CORTO',
    label: 'Velocidad Pase Corto',
    shortLabel: 'VPC',
    group: 'passing',
    description: 'Fuerza y ritmo del pase corto.',
  },
  {
    key: 'longPassAccuracy',
    field: 'PRECISI\u00d3N       P LARGO',
    label: 'Precision Pase Largo',
    shortLabel: 'PPL',
    group: 'passing',
    description: 'Precision para cambios de frente, filtros y envios largos.',
  },
  {
    key: 'longPassSpeed',
    field: 'VELOCIDAD     P LARGO',
    label: 'Velocidad Pase Largo',
    shortLabel: 'VPL',
    group: 'passing',
    description: 'Fuerza y velocidad del envio largo.',
  },
  {
    key: 'shotAccuracy',
    field: 'PRECISI\u00d3N DISPARO',
    label: 'Precision Disparo',
    shortLabel: 'PDI',
    group: 'finishing',
    description: 'Capacidad de dirigir el remate.',
  },
  {
    key: 'shotPower',
    field: 'POTENCIA DISPARO',
    label: 'Potencia Disparo',
    shortLabel: 'POT',
    group: 'finishing',
    description: 'Potencia del disparo.',
  },
  {
    key: 'shotTechnique',
    field: 'T\u00c9CNICA DISPARO',
    label: 'Tecnica Disparo',
    shortLabel: 'TDI',
    group: 'finishing',
    description: 'Calidad tecnica del golpeo en situaciones dificiles.',
  },
  {
    key: 'freeKickAccuracy',
    field: 'PRECISI\u00d3N TIRO LIBRE',
    label: 'Precision Tiro Libre',
    shortLabel: 'TL',
    group: 'passing',
    description: 'Precision especifica en tiros libres directos.',
  },
  {
    key: 'swerve',
    field: 'EFECTO',
    label: 'Efecto',
    shortLabel: 'EFE',
    group: 'passing',
    description: 'Curvatura y efecto aplicado a la pelota.',
  },
  {
    key: 'heading',
    field: 'CABEZAZO',
    label: 'Cabezazo',
    shortLabel: 'CAB',
    group: 'finishing',
    description: 'Direccion y limpieza tecnica del cabezazo.',
  },
  {
    key: 'jump',
    field: 'SALTO',
    label: 'Salto',
    shortLabel: 'SAL',
    group: 'physical',
    description: 'Capacidad de elevarse y ganar altura.',
  },
  {
    key: 'technique',
    field: 'T\u00c9CNICA',
    label: 'Tecnica',
    shortLabel: 'TEC',
    group: 'dribbling',
    description: 'Calidad tecnica general con la pelota.',
  },
  {
    key: 'aggression',
    field: 'AGRESIVIDAD',
    label: 'Agresividad',
    shortLabel: 'AGR',
    group: 'gameReading',
    description: 'Impulso para atacar espacios, disputar fuerte e ir a la accion.',
  },
  {
    key: 'mentality',
    field: 'MENTALIDAD',
    label: 'Mentalidad',
    shortLabel: 'MEN',
    group: 'gameReading',
    description: 'Protagonismo competitivo y persistencia durante el partido.',
  },
  {
    key: 'goalkeeping',
    field: 'ARQUERO',
    label: 'Cualidades de Portero',
    shortLabel: 'POR',
    group: 'goalkeeping',
    description: 'Calidad especifica de arquero.',
  },
  {
    key: 'teamwork',
    field: 'TRABAJO EN EQUIPO',
    label: 'Trabajo en Equipo',
    shortLabel: 'TEQ',
    group: 'gameReading',
    description: 'Coordinacion colectiva, estructura y continuidad.',
  },
];

const ANALYSIS_GROUP_ORDER: AnalysisDimensionGroup[] = [
  'gameReading',
  'physical',
  'dribbling',
  'passing',
  'finishing',
  'goalkeeping',
];

const ANALYSIS_GROUP_LABELS: Record<AnalysisDimensionGroup, string> = {
  gameReading: 'Lectura',
  physical: 'Fisico',
  dribbling: 'Conduccion',
  passing: 'Pase',
  finishing: 'Finalizacion',
  goalkeeping: 'Porteria',
};

const ANALYSIS_GROUP_COLORS: Record<AnalysisDimensionGroup, string> = {
  gameReading: '#169ad7',
  physical: '#f04e4e',
  dribbling: '#00b688',
  passing: '#ceb004',
  finishing: '#d300c8',
  goalkeeping: '#b95c04',
};

const ANALYSIS_TOP_STAT_COUNT = 8;
const VS_PITCH_WIDTH = 82;
const VS_PITCH_HEIGHT = 100;
const VS_PITCH_SIDE_LANE_WIDTH = 26;
const VS_PITCH_CENTER_LANE_WIDTH = VS_PITCH_WIDTH - VS_PITCH_SIDE_LANE_WIDTH * 2;
const VS_PITCH_RIGHT_LANE_X = VS_PITCH_SIDE_LANE_WIDTH + VS_PITCH_CENTER_LANE_WIDTH;

const ATTACK_INDEX_KEYS: AnalysisDimensionKey[] = [
  'attack',
  'dribbleAccuracy',
  'dribbleSpeed',
  'shortPassAccuracy',
  'longPassAccuracy',
  'shotAccuracy',
  'shotPower',
  'shotTechnique',
  'heading',
  'technique',
  'aggression',
];

const DEFENCE_INDEX_KEYS: AnalysisDimensionKey[] = [
  'defense',
  'balance',
  'stamina',
  'response',
  'jump',
  'mentality',
  'goalkeeping',
  'teamwork',
];

const VS_PROFILE_KEYS: Record<VsProfileKey, AnalysisDimensionKey[]> = {
  carrying: [
    'attack',
    'dribbleAccuracy',
    'dribbleSpeed',
    'topSpeed',
    'acceleration',
    'agility',
    'technique',
  ],
  creation: [
    'attack',
    'shortPassAccuracy',
    'shortPassSpeed',
    'longPassAccuracy',
    'longPassSpeed',
    'technique',
    'teamwork',
  ],
  finishing: [
    'attack',
    'shotAccuracy',
    'shotPower',
    'shotTechnique',
    'heading',
    'aggression',
    'technique',
  ],
  containment: [
    'defense',
    'response',
    'balance',
    'topSpeed',
    'acceleration',
    'agility',
    'mentality',
  ],
  pressing: ['defense', 'response', 'aggression', 'stamina', 'teamwork', 'mentality'],
  aerial: ['heading', 'jump', 'balance', 'aggression', 'mentality'],
  keeper: ['goalkeeping', 'response', 'jump', 'balance', 'mentality'],
};

const VS_TERRITORY_QUADRANTS: VsTerritoryQuadrant[] = [
  {
    key: 'rival-box',
    label: 'Area Rival',
    shortLabel: 'AREA RIVAL',
    rect: { x: 0, y: 0, width: VS_PITCH_WIDTH, height: 18 },
  },
  {
    key: 'high-block',
    label: 'Bloque Alto',
    shortLabel: 'BLOQUE ALTO',
    rect: { x: 0, y: 18, width: VS_PITCH_WIDTH, height: 20 },
  },
  {
    key: 'middle-block',
    label: 'Bloque Medio',
    shortLabel: 'BLOQUE MEDIO',
    rect: { x: 0, y: 38, width: VS_PITCH_WIDTH, height: 24 },
  },
  {
    key: 'low-block',
    label: 'Bloque Bajo',
    shortLabel: 'BLOQUE BAJO',
    rect: { x: 0, y: 62, width: VS_PITCH_WIDTH, height: 20 },
  },
  {
    key: 'own-box',
    label: 'Area Propia',
    shortLabel: 'AREA PROPIA',
    rect: { x: 0, y: 82, width: VS_PITCH_WIDTH, height: 18 },
  },
];

const CLUB_DETAILS: Record<string, { fullName: string; country: string }> = {
  'A.C. Milan': {
    fullName: 'Associazione Calcio Milan',
    country: 'Italy',
  },
  'A.S. Roma': {
    fullName: 'Associazione Sportiva Roma',
    country: 'Italy',
  },
  Ajax: {
    fullName: 'Amsterdamsche Football Club Ajax',
    country: 'Netherlands',
  },
  Arsenal: {
    fullName: 'Arsenal Football Club',
    country: 'England',
  },
  'Athletic Club': {
    fullName: 'Athletic Club',
    country: 'Spain',
  },
  'Bayern München': {
    fullName: 'Fußball-Club Bayern München',
    country: 'Germany',
  },
  'Boca Juniors': {
    fullName: 'Club Atlético Boca Juniors',
    country: 'Argentina',
  },
  Celtic: {
    fullName: 'Celtic Football Club',
    country: 'Scotland',
  },
  'Chelsea FC': {
    fullName: 'Chelsea Football Club',
    country: 'England',
  },
  'Chievo Verona': {
    fullName: 'Associazione Calcio Chievo Verona',
    country: 'Italy',
  },
  'Dynamo Kiev': {
    fullName: 'Football Club Dynamo Kyiv',
    country: 'Ukraine',
  },
  'F.C. Barcelona': {
    fullName: 'Futbol Club Barcelona',
    country: 'Spain',
  },
  'Girondins de Bordeaux': {
    fullName: 'Football Club des Girondins de Bordeaux',
    country: 'France',
  },
  Inter: {
    fullName: 'Football Club Internazionale Milano',
    country: 'Italy',
  },
  Juventus: {
    fullName: 'Juventus Football Club',
    country: 'Italy',
  },
  Lazio: {
    fullName: 'Società Sportiva Lazio',
    country: 'Italy',
  },
  'Liverpool FC': {
    fullName: 'Liverpool Football Club',
    country: 'England',
  },
  Livorno: {
    fullName: 'Associazione Sportiva Livorno Calcio',
    country: 'Italy',
  },
  'Manchester City': {
    fullName: 'Manchester City Football Club',
    country: 'England',
  },
  'Manchester United': {
    fullName: 'Manchester United Football Club',
    country: 'England',
  },
  'Newcastle United FC': {
    fullName: 'Newcastle United Football Club',
    country: 'England',
  },
  'Olympique de Marseille': {
    fullName: 'Olympique de Marseille',
    country: 'France',
  },
  'Olympique Lyonnais': {
    fullName: 'Olympique Lyonnais',
    country: 'France',
  },
  'Paris Saint-Germain': {
    fullName: 'Paris Saint-Germain Football Club',
    country: 'France',
  },
  Parma: {
    fullName: 'Parma Calcio',
    country: 'Italy',
  },
  'R. Madrid': {
    fullName: 'Real Madrid Club de Fútbol',
    country: 'Spain',
  },
  'R. Sociedad': {
    fullName: 'Real Sociedad de Fútbol',
    country: 'Spain',
  },
  'R.C. Celta': {
    fullName: 'Real Club Celta de Vigo',
    country: 'Spain',
  },
  'Roda JC': {
    fullName: 'Sportvereniging Roda Juliana Combinatie Kerkrade',
    country: 'Netherlands',
  },
  'Sevilla F.C.': {
    fullName: 'Sevilla Fútbol Club',
    country: 'Spain',
  },
  'Sporting Lisbon': {
    fullName: 'Sporting Clube de Portugal',
    country: 'Portugal',
  },
  'Villarreal C.F.': {
    fullName: 'Villarreal Club de Fútbol',
    country: 'Spain',
  },
};

function normalizeText(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const TXXIII_SHORT_TERM_PLAYERS = new Set(
  TXXIII_SHORT_TERM_PLAYER_NAMES.map(normalizeText),
);

function formatNumber(value: number | undefined, digits = 1): string {
  if (value === undefined || Number.isNaN(value)) return '-';
  return value.toLocaleString('es-CL', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function getAverage(
  players: DerivedPlayer[],
  field: keyof DerivedPlayer,
): number | undefined {
  const values = players
    .map((player) => ensureNumber(player[field]))
    .filter((value): value is number => value !== undefined);

  if (!values.length) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isNationalPlayer(player: DerivedPlayer): boolean {
  return formatSelectionDisplay(player['nro selección']).toLowerCase() !== 'no';
}

function isLegendPlayer(player: DerivedPlayer): boolean {
  const classicValue = formatSelectionDisplay(player['nro clasico']);
  const playerName = String(player.NOMBRE ?? '').trim();
  return classicValue.toLowerCase() !== 'no' || LEGEND_PLAYERS.has(playerName);
}

function isMlPlayer(player: DerivedPlayer): boolean {
  return ML_PLAYERS.has(String(player.NOMBRE ?? '').trim());
}

function isShortTermPlayer(player: DerivedPlayer): boolean {
  return TXXIII_SHORT_TERM_PLAYERS.has(normalizeText(String(player.NOMBRE ?? '')));
}

function getStatusBadges(player: DerivedPlayer): StatusBadge[] {
  const selectionValue = formatSelectionDisplay(player['nro selección'] as string);
  const classicValue = formatSelectionDisplay(player['nro clasico'] as string);
  const playerName = String(player.NOMBRE ?? '').trim();
  const rawClub = String(player.CLUB ?? '').trim();

  return STATUS_BADGES.filter((badge) => {
    if (badge.key === 'national') return selectionValue.toLowerCase() !== 'no';
    if (badge.key === 'legend') {
      return classicValue.toLowerCase() !== 'no' || LEGEND_PLAYERS.has(playerName);
    }
    if (badge.key === 'ml') return ML_PLAYERS.has(playerName);
    if (badge.key === 'anfpes') return ANFPES_CLUBS.has(rawClub);
    if (badge.key === 'shortTerm') return isShortTermPlayer(player);
    return false;
  });
}

function getPositionAverage(player: DerivedPlayer, position: string): number {
  const field = POSITION_AVERAGE_FIELD[position];
  return (
    ensureNumber(field ? player[field] : undefined) ?? ensureNumber(player.PROMEDIO) ?? 0
  );
}

function getCoveredDepthPositions(position: string): string[] {
  return POSITION_DEPTH_COVERAGE[position] ?? [position];
}

function playerCanCoverDepthPosition(player: DerivedPlayer, position: string): boolean {
  return getPlayerPositions(player).some((playerPosition) =>
    getCoveredDepthPositions(playerPosition).includes(position),
  );
}

function playerCanCoverRole(player: DerivedPlayer, role: string): boolean {
  return getPlayerPositions(player).some((playerPosition) =>
    getCoveredDepthPositions(playerPosition).includes(role),
  );
}

function getRosterShortTermPlayers(roster: DerivedPlayer[]): DerivedPlayer[] {
  return roster.filter(isShortTermPlayer);
}

function mean(values: number[]): number {
  const validValues = values.filter((value) => Number.isFinite(value) && value > 0);
  if (!validValues.length) return 0;
  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}

function getPlayerStatValue(
  player: DerivedPlayer,
  field: keyof DerivedPlayer,
): number | undefined {
  const directValue = ensureNumber(player[field]);
  if (directValue !== undefined) return directValue;

  const normalizedField = normalizeText(String(field));
  const matchingKey = Object.keys(player).find(
    (key) => normalizeText(key) === normalizedField,
  );
  return matchingKey ? ensureNumber(player[matchingKey]) : undefined;
}

function getTopStatAverage(
  players: DerivedPlayer[],
  field: keyof DerivedPlayer,
  takeCount = ANALYSIS_TOP_STAT_COUNT,
): number {
  const values = players
    .map((player) => getPlayerStatValue(player, field) ?? 0)
    .filter((value) => value > 0)
    .sort((a, b) => b - a)
    .slice(0, takeCount);

  return mean(values);
}

function getBestLineValue(player: DerivedPlayer, line: PositionLineKey): number {
  const values = LINE_ROLES[line]
    .map((role) => getPositionAverage(player, role))
    .filter((value) => value > 0);

  if (!values.length) return ensureNumber(player.PROMEDIO) ?? 0;
  return Math.max(...values);
}

function getLineStrength(roster: DerivedPlayer[], line: PositionLineKey): number {
  const takeCount: Record<PositionLineKey, number> = {
    PT: 1,
    DEF: 5,
    MED: 5,
    ATA: 3,
  };
  const values = roster
    .map((player) => getBestLineValue(player, line))
    .sort((a, b) => b - a)
    .slice(0, takeCount[line]);

  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getAnalysisDimensionValue(
  roster: DerivedPlayer[],
  dimension: AnalysisDimensionDefinition,
): number {
  const sourceRoster =
    dimension.key === 'goalkeeping'
      ? roster.filter((player) => playerCanCoverRole(player, 'PT'))
      : roster;
  return getTopStatAverage(sourceRoster, dimension.field);
}

function getFamilyValue(
  dimensions: Record<AnalysisDimensionKey, number>,
  group: AnalysisDimensionGroup,
): number {
  return mean(
    ANALYSIS_DIMENSIONS.filter((dimension) => dimension.group === group).map(
      (dimension) => dimensions[dimension.key],
    ),
  );
}

function getDimensionKeyAverage(
  dimensions: Record<AnalysisDimensionKey, number>,
  keys: AnalysisDimensionKey[],
): number {
  return mean(keys.map((key) => dimensions[key]));
}

function buildAnalysisProfile(summary: ClubSummary): ClubAnalysisProfile {
  const roster = summary.roster;
  const macros = Object.fromEntries(
    MACRO_FIELDS.map((field) => [field, getAverage(roster, field) ?? 0]),
  ) as Record<MacroField, number>;
  const lines = Object.fromEntries(
    ANALYSIS_LINE_ORDER.map((line) => [line, getLineStrength(roster, line)]),
  ) as Record<PositionLineKey, number>;
  const dimensions = Object.fromEntries(
    ANALYSIS_DIMENSIONS.map((dimension) => [
      dimension.key,
      getAnalysisDimensionValue(roster, dimension),
    ]),
  ) as Record<AnalysisDimensionKey, number>;
  const overall = getAverage(roster, 'PROMEDIO') ?? 0;
  const attackIndex = getDimensionKeyAverage(dimensions, ATTACK_INDEX_KEYS);
  const defenceIndex = getDimensionKeyAverage(dimensions, DEFENCE_INDEX_KEYS);
  const balanceIndex = mean(Object.values(dimensions));

  return {
    summary,
    roster,
    overall,
    macros,
    lines,
    dimensions,
    attackIndex,
    defenceIndex,
    balanceIndex,
  };
}

function getRank(
  profiles: ClubAnalysisProfile[],
  activeClub: string,
  getValue: (profile: ClubAnalysisProfile) => number,
): number {
  return (
    [...profiles]
      .sort((a, b) => getValue(b) - getValue(a))
      .findIndex((profile) => profile.summary.club === activeClub) + 1
  );
}

function getPercentile(values: number[], value: number): number {
  if (!values.length) return 0;
  const belowOrEqual = values.filter((item) => item <= value).length;
  return Math.round((belowOrEqual / values.length) * 100);
}

function formatSignedNumber(value: number, digits = 1): string {
  return `${value >= 0 ? '+' : ''}${formatNumber(value, digits)}`;
}

function getRankingContext(rank: number): string {
  if (rank <= 4) return 'elite ANFPES';
  if (rank <= 8) return 'zona alta';
  if (rank <= 16) return 'mitad superior';
  if (rank <= 24) return 'mitad baja';
  return 'zona baja';
}

function getSquadIdentity(attackDelta: number, defenceDelta: number): string {
  if (attackDelta >= 1.5 && defenceDelta >= 1.5) return 'dominante y equilibrado';
  if (attackDelta - defenceDelta >= 1.5) return 'perfil ofensivo';
  if (defenceDelta - attackDelta >= 1.5) return 'perfil defensivo';
  if (attackDelta < -1.5 && defenceDelta < -1.5) return 'bajo promedio en ambos indices';
  return 'equilibrado';
}

function getRoleFit(player: DerivedPlayer, role: string): FormationAssignment['fit'] {
  const positions = getPlayerPositions(player);
  const primary = positions[0];

  if (primary && getCoveredDepthPositions(primary).includes(role)) return 'natural';
  if (playerCanCoverRole(player, role)) return 'compatible';
  if (positions.some((position) => getPositionLine(position) === getPositionLine(role))) {
    return 'adapted';
  }
  return 'forced';
}

function getRoleFitBonus(fit: FormationAssignment['fit']): number {
  if (fit === 'natural') return 4;
  if (fit === 'compatible') return 2;
  if (fit === 'adapted') return -5;
  return -14;
}

function scorePlayerForSlot(player: DerivedPlayer, slot: FormationSlot) {
  const rating = getPositionAverage(player, slot.role);
  const fit = getRoleFit(player, slot.role);
  const score = rating + getRoleFitBonus(fit);
  return { rating, fit, score };
}

function buildFormationRecommendation(
  formationName: string,
  slots: FormationSlot[],
  roster: DerivedPlayer[],
): FormationRecommendation | null {
  if (roster.length < slots.length) return null;

  const orderedSlots = slots
    .map((slot, originalIndex) => {
      const candidates = roster
        .map((player, playerIndex) => ({
          player,
          playerIndex,
          ...scorePlayerForSlot(player, slot),
        }))
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return String(a.player.NOMBRE ?? '').localeCompare(
            String(b.player.NOMBRE ?? ''),
            'es',
            { sensitivity: 'base' },
          );
        });

      return { slot, originalIndex, candidates };
    })
    .sort((a, b) => {
      const aNaturalCount = a.candidates.filter(
        (candidate) => candidate.fit === 'natural' || candidate.fit === 'compatible',
      ).length;
      const bNaturalCount = b.candidates.filter(
        (candidate) => candidate.fit === 'natural' || candidate.fit === 'compatible',
      ).length;
      if (aNaturalCount !== bNaturalCount) return aNaturalCount - bNaturalCount;

      const aTopScore = a.candidates[0]?.score ?? 0;
      const bTopScore = b.candidates[0]?.score ?? 0;
      return bTopScore - aTopScore;
    });

  const usedPlayerIds = new Set<string>();
  const assignments = orderedSlots
    .map((slotEntry) => {
      const pick = slotEntry.candidates.find(
        (candidate) => !usedPlayerIds.has(String(candidate.player.ID)),
      );
      if (!pick) return null;
      usedPlayerIds.add(String(pick.player.ID));
      return {
        slot: slotEntry.slot,
        originalIndex: slotEntry.originalIndex,
        player: pick.player,
        rating: pick.rating,
        score: pick.score,
        fit: pick.fit,
      };
    })
    .filter((assignment): assignment is FormationAssignment & { originalIndex: number } =>
      Boolean(assignment),
    )
    .sort((a, b) => a.originalIndex - b.originalIndex)
    .map(({ slot, player, rating, score, fit }) => ({
      slot,
      player,
      rating,
      score,
      fit,
    }));

  if (assignments.length !== slots.length) return null;
  const totalScore = assignments.reduce((sum, assignment) => sum + assignment.score, 0);

  return {
    formationName,
    score: totalScore / slots.length,
    assignments,
  };
}

function buildFormationRecommendations(
  roster: DerivedPlayer[],
): FormationRecommendation[] {
  return Object.entries(FORMATIONS)
    .map(([formationName, slots]) =>
      buildFormationRecommendation(formationName, slots, roster),
    )
    .filter((recommendation): recommendation is FormationRecommendation =>
      Boolean(recommendation),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function buildPositionDepth(roster: DerivedPlayer[]): PositionDepthEntry[] {
  return POSITION_DEPTH_ORDER.map((position) => {
    const players = roster
      .filter((player) => playerCanCoverDepthPosition(player, position))
      .map((player) => ({
        player,
        rating: getPositionAverage(player, position),
      }))
      .sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return String(a.player.NOMBRE ?? '').localeCompare(
          String(b.player.NOMBRE ?? ''),
          'es',
          { sensitivity: 'base' },
        );
      });

    return { position, players };
  });
}

function getCriticalDepthRoles(position: string): string[] {
  return POSITION_DEPTH_COVERAGE[position] ?? [position];
}

function playerCanCoverCriticalDepthPosition(
  player: DerivedPlayer,
  position: string,
): boolean {
  const targetRoles = getCriticalDepthRoles(position);
  return getPlayerPositions(player).some((playerPosition) => {
    if (targetRoles.includes(playerPosition)) return true;
    return getCoveredDepthPositions(playerPosition).some((coveredPosition) =>
      targetRoles.includes(coveredPosition),
    );
  });
}

function getCriticalDepthRating(player: DerivedPlayer, position: string): number {
  const targetRoles = getCriticalDepthRoles(position);
  const ratings = targetRoles.map((role) => getPositionAverage(player, role));
  return Math.max(...ratings);
}

function buildCriticalDepth(roster: DerivedPlayer[]): PositionDepthEntry[] {
  return CRITICAL_DEPTH_ORDER.map((position) => {
    const players = roster
      .filter((player) => playerCanCoverCriticalDepthPosition(player, position))
      .map((player) => ({
        player,
        rating: getCriticalDepthRating(player, position),
      }))
      .sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return String(a.player.NOMBRE ?? '').localeCompare(
          String(b.player.NOMBRE ?? ''),
          'es',
          { sensitivity: 'base' },
        );
      });

    return { position, players };
  });
}

function findRosterPlayer(roster: DerivedPlayer[], playerId: string | undefined) {
  if (!playerId) return undefined;
  return roster.find((player) => String(player.ID) === playerId);
}

function getPrimaryPosition(player: DerivedPlayer): string {
  return getPlayerPositions(player)[0] ?? '';
}

function sortByNumberField(
  players: DerivedPlayer[],
  field: keyof DerivedPlayer,
): DerivedPlayer[] {
  return [...players].sort(
    (a, b) => (ensureNumber(b[field]) ?? -1) - (ensureNumber(a[field]) ?? -1),
  );
}

function buildClubSummary(club: string, players: DerivedPlayer[]): ClubSummary {
  const roster = players.filter((player) => String(player.CLUB ?? '') === club);
  const competitionDetails = getClubCompetitionDetail(club);

  return {
    club,
    division: competitionDetails?.division,
    manager: competitionDetails?.manager,
    shortTermPlayer: getRosterShortTermPlayers(roster)
      .map((player) => String(player.NOMBRE ?? ''))
      .join(', '),
    roster,
    rosterCount: roster.length,
    average: getAverage(roster, 'PROMEDIO'),
    averageAge: getAverage(roster, 'EDAD'),
    averageHeight: getAverage(roster, 'ALTURA'),
    averageWeight: getAverage(roster, 'PESO'),
    nationalCount: roster.filter(isNationalPlayer).length,
    legendCount: roster.filter(isLegendPlayer).length,
    mlCount: roster.filter(isMlPlayer).length,
  };
}

function getClubColors(club: string) {
  const normalized = normalizeText(club);
  const identity = CLUB_IDENTITIES.find(
    (item) => normalizeText(item.name) === normalized,
  );
  return {
    primary: identity?.primary ?? '#7ac9ff',
    secondary: identity?.secondary ?? '#ffffff',
  };
}

function getClubDetails(club: string) {
  return (
    CLUB_DETAILS[club] ?? {
      fullName: club,
      country: '',
    }
  );
}

function getInitials(club: string): string {
  return club
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function getSortValue(player: DerivedPlayer, key: SortKey): string | number {
  if (key === 'POSICIONES') return getPrimaryPosition(player);
  if (key === 'NACIONALIDAD') return formatNationality(player.NACIONALIDAD as string);
  if (key === 'NOMBRE') return String(player.NOMBRE ?? '');

  const numeric = ensureNumber(player[key as keyof DerivedPlayer]);
  if (numeric !== undefined) return numeric;
  return String(player[key as keyof DerivedPlayer] ?? '');
}

function sortRoster(roster: DerivedPlayer[], sortConfig: SortConfig): DerivedPlayer[] {
  const direction = sortConfig.direction === 'asc' ? 1 : -1;

  return [...roster].sort((a, b) => {
    const aValue = getSortValue(a, sortConfig.key);
    const bValue = getSortValue(b, sortConfig.key);

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) * direction;
    }

    const textResult = String(aValue).localeCompare(String(bValue), 'es', {
      numeric: true,
      sensitivity: 'base',
    });

    if (textResult !== 0) return textResult * direction;
    return String(a.NOMBRE ?? '').localeCompare(String(b.NOMBRE ?? ''), 'es');
  });
}

function StatValue({
  value,
  digits = 1,
}: {
  value: DerivedPlayer[keyof DerivedPlayer];
  digits?: number;
}) {
  const color = getStatColor(value as number | string | null | undefined);
  return (
    <span className="club-stat-value" style={{ color: color ?? undefined }}>
      {formatPlayerValue(value, digits)}
    </span>
  );
}

function RatingValue({ value, digits = 0 }: { value: number; digits?: number }) {
  const color = getStatColor(value);
  return (
    <span className="club-stat-value" style={{ color: color ?? undefined }}>
      {formatNumber(value, digits)}
    </span>
  );
}

function PlayerStatusBadges({ player }: { player: DerivedPlayer }) {
  const badges = getStatusBadges(player);
  if (!badges.length) return null;

  return (
    <span className="player-badges club-player-badges">
      {badges.map((badge) => (
        <EnhancedTooltip key={badge.key} content={badge.title}>
          <span className={badge.className}>{badge.label}</span>
        </EnhancedTooltip>
      ))}
    </span>
  );
}

function PlayerPrimaryPositionRating({ player }: { player: DerivedPlayer }) {
  const primaryPosition = getPrimaryPosition(player);
  const line = primaryPosition ? getPositionLine(primaryPosition) : 'DEF';
  const average = ensureNumber(player.PROMEDIO) ?? 0;

  return (
    <div className="club-feature-meta">
      {primaryPosition && (
        <EnhancedTooltip content={getPositionFullName(primaryPosition)} placement="top">
          <span className={`position-badge primary position-${line}`}>
            {primaryPosition}
          </span>
        </EnhancedTooltip>
      )}
      <EnhancedTooltip
        content={`Promedio principal: ${formatNumber(average, 0)}`}
        placement="top"
      >
        <span>
          <RatingValue value={average} />
        </span>
      </EnhancedTooltip>
    </div>
  );
}

function ClubFeatureShirt({
  player,
  club,
  dorsal,
  shirtStyle,
  onOpenPlayer,
}: {
  player: DerivedPlayer;
  club: string;
  dorsal: string;
  shirtStyle: ReturnType<typeof getShirtStyle> | undefined;
  onOpenPlayer: (player: DerivedPlayer) => void;
}) {
  const [failedClubKitPath, setFailedClubKitPath] = useState<string | null>(null);
  const clubKitCandidate = getClubKitImage(club);
  const clubKitImage =
    clubKitCandidate && clubKitCandidate.path !== failedClubKitPath
      ? clubKitCandidate
      : null;

  useEffect(() => {
    setFailedClubKitPath(null);
  }, [clubKitCandidate?.path]);

  return (
    <button
      type="button"
      className="club-feature-shirt"
      onClick={() => onOpenPlayer(player)}
      aria-label={`Abrir perfil de ${String(player.NOMBRE ?? '')}`}
    >
      <span
        className={`tactical-shirt-display${clubKitImage ? ' has-kit-image' : ''}`}
        style={
          {
            color: shirtStyle?.color,
            '--shirt-overlay': shirtStyle?.background || '#0f2238',
            '--kit-scale': clubKitImage?.scale ?? 1,
            '--kit-x': clubKitImage?.x ?? '0%',
            '--kit-y': clubKitImage?.y ?? '0%',
          } as CSSProperties
        }
      >
        {clubKitImage && (
          <img
            className="tactical-shirt-kit"
            src={clubKitImage.path}
            alt=""
            aria-hidden="true"
            onError={() => setFailedClubKitPath(clubKitImage.path)}
          />
        )}
        {dorsal !== '-' && (
          <span className="tactical-dorsal" style={{ color: shirtStyle?.color }}>
            {dorsal}
          </span>
        )}
      </span>
    </button>
  );
}

function ClubFeaturedPlayerCard({
  label,
  player,
  club,
  selector,
  onOpenPlayer,
}: {
  label: string;
  player: DerivedPlayer | undefined;
  club: string;
  selector?: ReactNode;
  onOpenPlayer: (player: DerivedPlayer) => void;
}) {
  const shirtStyle = player
    ? getShirtStyle('club', club, player.NACIONALIDAD as string)
    : undefined;
  const dorsal = player ? formatPlayerValue(player.DORSAL, 0) : '';
  const legend = player ? isLegendPlayer(player) : false;
  const rawFacePath = player ? getPlayerFacePath(player.ID) : '';
  const facePath =
    player && rawFacePath === '/images/faces/missing.png' && legend
      ? '/images/faces/Legend.png'
      : rawFacePath;

  return (
    <article className={`club-feature-card${player ? '' : ' empty'}`}>
      <header>
        <span>{label}</span>
        {selector}
      </header>
      {player ? (
        <>
          <div className="club-feature-visuals">
            <button
              type="button"
              className="club-feature-face"
              onClick={() => onOpenPlayer(player)}
            >
              <img
                src={facePath}
                alt=""
                onError={(event) => {
                  event.currentTarget.src = legend
                    ? '/images/faces/Legend.png'
                    : '/images/faces/missing.png';
                }}
              />
            </button>
            <ClubFeatureShirt
              player={player}
              club={club}
              dorsal={dorsal}
              shirtStyle={shirtStyle}
              onOpenPlayer={onOpenPlayer}
            />
          </div>
          <button
            type="button"
            className="club-feature-name"
            onClick={() => onOpenPlayer(player)}
          >
            {player.NOMBRE as string}
          </button>
          <PlayerPrimaryPositionRating player={player} />
          <div className="club-feature-macros">
            {MACRO_FIELDS.map((field) => (
              <div key={field}>
                <span>{MACRO_LABELS[field]}</span>
                <StatValue value={player[field]} digits={0} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="club-feature-empty">Sin jugador seleccionado</div>
      )}
    </article>
  );
}

function PositionDepthPanel({
  summary,
  onOpenPlayer,
}: {
  summary: ClubSummary;
  onOpenPlayer: (player: DerivedPlayer) => void;
}) {
  const depthRows = useMemo(() => buildPositionDepth(summary.roster), [summary.roster]);

  return (
    <article className="club-panel club-depth-panel">
      <header>
        <h3>Profundidad por posicion</h3>
        <span>Top 5 + restantes</span>
      </header>
      <div className="club-depth-list">
        {depthRows.map((row) => {
          const visiblePlayers = row.players.slice(0, 5);
          const remainingPlayers = row.players.slice(5);
          const line = getPositionLine(row.position);

          return (
            <div key={row.position} className="club-depth-row">
              <span className={`position-badge primary position-${line}`}>
                {row.position}
              </span>
              <div className="club-depth-players">
                {visiblePlayers.length ? (
                  visiblePlayers.map(({ player, rating }) => (
                    <button
                      key={String(player.ID)}
                      type="button"
                      className="club-depth-player"
                      onClick={() => onOpenPlayer(player)}
                    >
                      <span>{player.NOMBRE as string}</span>
                      <RatingValue value={rating} />
                    </button>
                  ))
                ) : (
                  <span className="club-depth-empty">-</span>
                )}
                {remainingPlayers.length > 0 && (
                  <EnhancedTooltip
                    placement="left"
                    content={
                      <div className="club-depth-tooltip-list">
                        {remainingPlayers.map(({ player, rating }) => (
                          <div key={String(player.ID)}>
                            <span>{player.NOMBRE as string}</span>
                            <RatingValue value={rating} />
                          </div>
                        ))}
                      </div>
                    }
                  >
                    <span className="club-depth-more">+{remainingPlayers.length}</span>
                  </EnhancedTooltip>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

interface OpponentLineupPitchProps {
  summary: ClubSummary;
  lineup: ClubLineupConfig;
  onFormationChange: (formationName: string | null) => void;
  onSlotPlayerChange: (slotId: string, playerId: string) => void;
  onClear: () => void;
  canOpenVsAnalysis?: boolean;
  onOpenVsAnalysis?: () => void;
  vsClub?: string;
}

function OpponentLineupPitch({
  summary,
  lineup,
  onFormationChange,
  onSlotPlayerChange,
  onClear,
  canOpenVsAnalysis = false,
  onOpenVsAnalysis,
  vsClub,
}: OpponentLineupPitchProps) {
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const selectedFormation = lineup.formationName
    ? FORMATIONS[lineup.formationName]
    : null;
  const displaySlots: FormationSlot[] =
    selectedFormation ?? FORMATIONS[DEFAULT_FORMATION];
  const tacticalSlots: FormationSlot[] = displaySlots.map((slot) => ({
    ...slot,
    playerId: lineup.formationName
      ? lineup.playersBySlot[slot.slotId] || undefined
      : undefined,
  }));
  const selectedIds = new Set(Object.values(lineup.playersBySlot).filter(Boolean));
  const assignedCount = selectedIds.size;
  const showOverlay = !lineup.formationName;
  const activeSlot = displaySlots.find((slot) => slot.slotId === activeSlotId);
  const vsClubShield = vsClub ? getClubShieldPath(vsClub) : null;

  const rosterOptions = useMemo(
    () =>
      [...summary.roster].sort((a, b) =>
        String(a.NOMBRE ?? '').localeCompare(String(b.NOMBRE ?? ''), 'es'),
      ),
    [summary.roster],
  );
  const getAvailablePlayersForSlot = (slotId: string) => {
    const slot = displaySlots.find((item) => item.slotId === slotId);
    const slotRole = slot?.role ?? '';
    const selectedPlayerId = lineup.playersBySlot[slotId] ?? '';
    return rosterOptions
      .filter((player) => {
        const playerId = String(player.ID);
        return playerId === selectedPlayerId || !selectedIds.has(playerId);
      })
      .sort((a, b) => {
        const ratingA = getPositionAverage(a, slotRole);
        const ratingB = getPositionAverage(b, slotRole);
        if (ratingB !== ratingA) return ratingB - ratingA;
        return String(a.NOMBRE ?? '').localeCompare(String(b.NOMBRE ?? ''), 'es', {
          sensitivity: 'base',
        });
      });
  };

  const renderSlotPlayerMenu = () => {
    if (!lineup.formationName || !activeSlot) return null;

    const selectedPlayerId = lineup.playersBySlot[activeSlot.slotId] ?? '';
    const availablePlayers = getAvailablePlayersForSlot(activeSlot.slotId);

    return (
      <div className="club-slot-player-menu" onClick={(event) => event.stopPropagation()}>
        <div className="club-slot-player-menu-header">
          <strong>{activeSlot.role}</strong>
          <button
            type="button"
            aria-label="Cerrar selector"
            onClick={() => setActiveSlotId(null)}
          >
            x
          </button>
        </div>
        <button
          type="button"
          className={!selectedPlayerId ? 'active' : undefined}
          onClick={() => {
            onSlotPlayerChange(activeSlot.slotId, '');
            setActiveSlotId(null);
          }}
        >
          Sin jugador
        </button>
        <div className="club-slot-player-menu-list">
          {availablePlayers.map((player) => {
            const playerId = String(player.ID);
            return (
              <button
                key={playerId}
                type="button"
                className={playerId === selectedPlayerId ? 'active' : undefined}
                onClick={() => {
                  onSlotPlayerChange(activeSlot.slotId, playerId);
                  setActiveSlotId(null);
                }}
              >
                <span>{player.NOMBRE as string}</span>
                <RatingValue value={getPositionAverage(player, activeSlot.role)} />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <article className="club-panel club-lineup-panel">
      <header className="club-lineup-header">
        <div className="club-lineup-title">
          <h3>Once Titular Probable</h3>
          <select
            value={lineup.formationName ?? ''}
            onChange={(event) => {
              onFormationChange(event.target.value || null);
              setActiveSlotId(null);
            }}
          >
            <option value="">Sin formacion</option>
            {Object.keys(FORMATIONS).map((formationName) => (
              <option key={formationName} value={formationName}>
                {formationName}
              </option>
            ))}
          </select>
        </div>
        <div className="club-lineup-actions">
          <span>{assignedCount}/11</span>
          <button type="button" onClick={onClear}>
            Limpiar
          </button>
        </div>
      </header>
      <div className={`club-tactical-pitch-wrap${showOverlay ? ' empty' : ''}`}>
        {canOpenVsAnalysis && (
          <button
            type="button"
            className="club-vs-pitch-button"
            onClick={onOpenVsAnalysis}
          >
            <span>VS</span>
            {vsClubShield ? (
              <img src={vsClubShield} alt="" />
            ) : vsClub ? (
              <em>{getInitials(vsClub)}</em>
            ) : null}
          </button>
        )}
        <TacticalPitch
          slots={tacticalSlots}
          players={summary.roster}
          clubId={summary.club}
          candidateInIds={[]}
          candidateOutIds={[]}
          planLabel={lineup.formationName ?? 'Sin formacion'}
          hideHeader
          useClubKitImages
          onSlotClick={(slotId) => setActiveSlotId(slotId)}
          onPlayerDrop={(slotId, playerId) => onSlotPlayerChange(slotId, playerId)}
          offsideTrap="C"
        />
        {renderSlotPlayerMenu()}
        {showOverlay && (
          <div className="club-lineup-overlay">
            <strong>Configurar Once Titular</strong>
          </div>
        )}
      </div>
    </article>
  );
}

function getLineupFormationSlots(lineup: ClubLineupConfig | undefined): FormationSlot[] {
  if (!lineup?.formationName) return [];
  return FORMATIONS[lineup.formationName] ?? [];
}

function resolveLineupPlayers(
  summary: ClubSummary,
  lineup: ClubLineupConfig,
): ResolvedLineupPlayer[] {
  return getLineupFormationSlots(lineup)
    .map((slot) => {
      const playerId = lineup.playersBySlot[slot.slotId];
      const player = findRosterPlayer(summary.roster, playerId);
      if (!player) return null;
      return {
        slot,
        player,
        rating: getPositionAverage(player, slot.role),
      };
    })
    .filter((entry): entry is ResolvedLineupPlayer => Boolean(entry));
}

function isResolvedLineupConfigured(
  summary: ClubSummary,
  lineup: ClubLineupConfig | undefined,
): boolean {
  const slots = getLineupFormationSlots(lineup);
  if (!lineup || slots.length === 0) return false;
  return (
    slots.every((slot) => Boolean(lineup.playersBySlot[slot.slotId])) &&
    resolveLineupPlayers(summary, lineup).length === slots.length
  );
}

function getResolvedLineupAverage(players: ResolvedLineupPlayer[]): number {
  return mean(players.map((entry) => entry.rating));
}

function getVsDimensionValue(player: DerivedPlayer, key: AnalysisDimensionKey): number {
  const dimension = ANALYSIS_DIMENSIONS.find((item) => item.key === key);
  if (!dimension) return 0;
  return getPlayerStatValue(player, dimension.field) ?? 0;
}

function getVsDimensionLabel(key: AnalysisDimensionKey): string {
  return ANALYSIS_DIMENSIONS.find((item) => item.key === key)?.label ?? key;
}

function buildVsDuelStats(
  own: ResolvedLineupPlayer,
  opponent: ResolvedLineupPlayer,
  context: VsDuelContext,
): VsDuelStat[] {
  return context.contests.map((contest) => {
    const ownValue = getVsDimensionValue(own.player, contest.ownKey);
    const opponentValue = getVsDimensionValue(opponent.player, contest.opponentKey);
    return {
      label: contest.label,
      ownLabel: getVsDimensionLabel(contest.ownKey),
      opponentLabel: getVsDimensionLabel(contest.opponentKey),
      ownValue,
      opponentValue,
      difference: ownValue - opponentValue,
    };
  });
}

function getVsStatsScore(stats: VsDuelStat[], side: 'own' | 'opponent'): number {
  return mean(stats.map((stat) => (side === 'own' ? stat.ownValue : stat.opponentValue)));
}

function formatVsStatSummary(stats: VsDuelStat[], limit = 3): string {
  return stats
    .slice(0, limit)
    .map(
      (stat) =>
        `${stat.ownLabel} ${formatNumber(stat.ownValue, 0)} vs ${stat.opponentLabel} ${formatNumber(
          stat.opponentValue,
          0,
        )}`,
    )
    .join('; ');
}

function getVsProfileScore(player: DerivedPlayer, profile: VsProfileKey): number {
  return mean(VS_PROFILE_KEYS[profile].map((key) => getVsDimensionValue(player, key)));
}

function getLineupProfileScore(
  players: ResolvedLineupPlayer[],
  profile: VsProfileKey,
  predicate: (entry: ResolvedLineupPlayer) => boolean,
): number {
  return mean(
    players.filter(predicate).map((entry) => getVsProfileScore(entry.player, profile)),
  );
}

function roleIsWide(role: string): boolean {
  return [
    'DD',
    'DI',
    'SA',
    'DLD',
    'DLI',
    'LA',
    'CDR',
    'CIZ',
    'VOL',
    'ED',
    'EI',
    'EX',
  ].includes(role);
}

function roleIsCentralAerial(role: string): boolean {
  return ['CT', 'LIB', 'DC', 'SD'].includes(role);
}

function roleIsKeeper(role: string): boolean {
  return role === 'PT';
}

function getVsDuelContext(
  own: ResolvedLineupPlayer,
  opponent: ResolvedLineupPlayer,
): VsDuelContext {
  const ownLine = getPositionLine(own.slot.role);
  const opponentLine = getPositionLine(opponent.slot.role);

  if (roleIsKeeper(own.slot.role) || roleIsKeeper(opponent.slot.role)) {
    return roleIsKeeper(own.slot.role)
      ? {
          type: 'keeper',
          label: 'Arquero vs remate',
          ownLabel: 'respuesta de arquero',
          opponentLabel: 'definicion',
          contests: [
            { label: 'Intervencion', ownKey: 'goalkeeping', opponentKey: 'shotAccuracy' },
            { label: 'Reaccion', ownKey: 'response', opponentKey: 'shotTechnique' },
            { label: 'Juego aereo', ownKey: 'jump', opponentKey: 'heading' },
          ],
        }
      : {
          type: 'keeper',
          label: 'Remate vs arquero',
          ownLabel: 'definicion',
          opponentLabel: 'respuesta de arquero',
          contests: [
            {
              label: 'Direccion del remate',
              ownKey: 'shotAccuracy',
              opponentKey: 'goalkeeping',
            },
            { label: 'Golpeo dificil', ownKey: 'shotTechnique', opponentKey: 'response' },
            { label: 'Remate aereo', ownKey: 'heading', opponentKey: 'jump' },
          ],
        };
  }

  if (roleIsCentralAerial(own.slot.role) && roleIsCentralAerial(opponent.slot.role)) {
    return {
      type: 'aerial',
      label: 'Juego aereo',
      ownLabel: 'duelo aereo',
      opponentLabel: 'duelo aereo',
      contests: [
        { label: 'Cabezazo', ownKey: 'heading', opponentKey: 'heading' },
        { label: 'Salto', ownKey: 'jump', opponentKey: 'jump' },
        { label: 'Contacto', ownKey: 'balance', opponentKey: 'balance' },
      ],
    };
  }

  if (roleIsWide(own.slot.role) || roleIsWide(opponent.slot.role)) {
    if (ownLine === 'DEF') {
      return {
        type: 'wide',
        label: 'Cierre lateral vs desborde',
        ownLabel: 'cierre lateral',
        opponentLabel: 'desborde',
        contests: [
          { label: 'Cierre', ownKey: 'defense', opponentKey: 'dribbleAccuracy' },
          { label: 'Reaccion', ownKey: 'response', opponentKey: 'acceleration' },
          { label: 'Carrera', ownKey: 'topSpeed', opponentKey: 'dribbleSpeed' },
        ],
      };
    }

    return {
      type: 'wide',
      label: 'Desborde vs cierre lateral',
      ownLabel: 'desborde',
      opponentLabel: 'cierre lateral',
      contests: [
        { label: 'Control en banda', ownKey: 'dribbleAccuracy', opponentKey: 'defense' },
        { label: 'Arranque', ownKey: 'acceleration', opponentKey: 'response' },
        { label: 'Carrera con balon', ownKey: 'dribbleSpeed', opponentKey: 'topSpeed' },
      ],
    };
  }

  if (ownLine === 'MED' && opponentLine === 'MED') {
    return {
      type: 'midfield',
      label: 'Salida vs presion',
      ownLabel: 'salida y pase',
      opponentLabel: 'presion',
      contests: [
        { label: 'Primer pase', ownKey: 'shortPassAccuracy', opponentKey: 'defense' },
        { label: 'Control bajo marca', ownKey: 'technique', opponentKey: 'response' },
        { label: 'Continuidad', ownKey: 'teamwork', opponentKey: 'aggression' },
      ],
    };
  }

  if (ownLine === 'ATA') {
    return {
      type: 'central',
      label: 'Definicion vs contencion',
      ownLabel: 'definicion',
      opponentLabel: 'contencion',
      contests: [
        { label: 'Remate', ownKey: 'shotAccuracy', opponentKey: 'defense' },
        { label: 'Golpeo', ownKey: 'shotTechnique', opponentKey: 'response' },
        { label: 'Choque final', ownKey: 'balance', opponentKey: 'balance' },
      ],
    };
  }

  if (ownLine === 'DEF') {
    return {
      type: 'central',
      label: 'Contencion vs amenaza',
      ownLabel: 'contencion',
      opponentLabel: 'amenaza ofensiva',
      contests: [
        { label: 'Marca', ownKey: 'defense', opponentKey: 'shotAccuracy' },
        { label: 'Anticipo', ownKey: 'response', opponentKey: 'shotTechnique' },
        { label: 'Juego aereo', ownKey: 'jump', opponentKey: 'heading' },
      ],
    };
  }

  return {
    type: 'default',
    label: 'Control vs presion',
    ownLabel: 'control',
    opponentLabel: 'presion',
    contests: [
      { label: 'Control tecnico', ownKey: 'technique', opponentKey: 'defense' },
      { label: 'Pase corto', ownKey: 'shortPassAccuracy', opponentKey: 'response' },
      { label: 'Juego colectivo', ownKey: 'teamwork', opponentKey: 'aggression' },
    ],
  };
}

function getMirroredSlotPosition(slot: FormationSlot) {
  return {
    x: 100 - slot.x,
    y: 100 - slot.y,
  };
}

function getSlotDistance(ownSlot: FormationSlot, opponentSlot: FormationSlot): number {
  const mirroredOpponent = getMirroredSlotPosition(opponentSlot);
  return Math.hypot(ownSlot.x - mirroredOpponent.x, ownSlot.y - mirroredOpponent.y);
}

function buildLineupDuels(
  ownPlayers: ResolvedLineupPlayer[],
  opponentPlayers: ResolvedLineupPlayer[],
): LineupDuel[] {
  return opponentPlayers
    .map((opponent) => {
      const own = ownPlayers
        .map((candidate) => ({
          candidate,
          distance: getSlotDistance(candidate.slot, opponent.slot),
        }))
        .sort((a, b) => a.distance - b.distance)[0];

      if (!own) return null;
      const context = getVsDuelContext(own.candidate, opponent);
      const stats = buildVsDuelStats(own.candidate, opponent, context);
      const ownScore = getVsStatsScore(stats, 'own');
      const opponentScore = getVsStatsScore(stats, 'opponent');

      return {
        own: own.candidate,
        opponent,
        context,
        stats,
        ownScore,
        opponentScore,
        difference: ownScore - opponentScore,
        distance: own.distance,
      };
    })
    .filter((duel): duel is LineupDuel => Boolean(duel))
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
}

function getLineupOffensiveEdge(
  attackingPlayers: ResolvedLineupPlayer[],
  defendingPlayers: ResolvedLineupPlayer[],
): number {
  const attackScore = getLineupProfileScore(
    attackingPlayers,
    'finishing',
    (entry) => getPositionLine(entry.slot.role) === 'ATA',
  );
  const carryScore = getLineupProfileScore(attackingPlayers, 'carrying', (entry) =>
    ['MED', 'ATA'].includes(getPositionLine(entry.slot.role)),
  );
  const defenseScore = getLineupProfileScore(defendingPlayers, 'containment', (entry) =>
    ['DEF', 'MED'].includes(getPositionLine(entry.slot.role)),
  );

  return mean([attackScore, carryScore]) - defenseScore;
}

function getLineupMidfieldEdge(
  ownPlayers: ResolvedLineupPlayer[],
  opponentPlayers: ResolvedLineupPlayer[],
): number {
  const ownCreation = getLineupProfileScore(
    ownPlayers,
    'creation',
    (entry) => getPositionLine(entry.slot.role) === 'MED',
  );
  const opponentPressing = getLineupProfileScore(
    opponentPlayers,
    'pressing',
    (entry) => getPositionLine(entry.slot.role) === 'MED',
  );
  return ownCreation - opponentPressing;
}

function getLineupAerialEdge(
  ownPlayers: ResolvedLineupPlayer[],
  opponentPlayers: ResolvedLineupPlayer[],
): number {
  const ownAerial = getLineupProfileScore(ownPlayers, 'aerial', (entry) =>
    roleIsCentralAerial(entry.slot.role),
  );
  const opponentAerial = getLineupProfileScore(opponentPlayers, 'aerial', (entry) =>
    roleIsCentralAerial(entry.slot.role),
  );
  return ownAerial - opponentAerial;
}

function buildVsFocusItems(
  duels: LineupDuel[],
  ownPlayers: ResolvedLineupPlayer[],
  opponentPlayers: ResolvedLineupPlayer[],
): VsFocusItem[] {
  const focusItems: VsFocusItem[] = [];
  const advantages = duels
    .filter((duel) => duel.difference >= 2)
    .sort((a, b) => b.difference - a.difference);
  const risks = duels
    .filter((duel) => duel.difference <= -2)
    .sort((a, b) => a.difference - b.difference);

  advantages.slice(0, 2).forEach((duel, index) => {
    focusItems.push({
      key: `advantage-${index}`,
      kind: 'advantage',
      title: `Explotar ${duel.context.ownLabel}`,
      detail: `${String(duel.own.player.NOMBRE ?? '-')} supera a ${String(
        duel.opponent.player.NOMBRE ?? '-',
      )} en ${duel.context.label.toLowerCase()} (+${formatNumber(
        duel.difference,
        1,
      )}): ${formatVsStatSummary(duel.stats, 2)}.`,
      value: duel.difference,
    });
  });

  risks.slice(0, 2).forEach((duel, index) => {
    focusItems.push({
      key: `risk-${index}`,
      kind: 'risk',
      title: `Cubrir ${duel.context.opponentLabel}`,
      detail: `${String(duel.opponent.player.NOMBRE ?? '-')} le saca ${formatNumber(
        Math.abs(duel.difference),
        1,
      )} a ${String(
        duel.own.player.NOMBRE ?? '-',
      )} en ${duel.context.label.toLowerCase()}: ${formatVsStatSummary(duel.stats, 2)}.`,
      value: duel.difference,
    });
  });

  const midfieldEdge = getLineupMidfieldEdge(ownPlayers, opponentPlayers);
  focusItems.push({
    key: 'midfield-edge',
    kind: midfieldEdge >= 0 ? 'control' : 'risk',
    title: midfieldEdge >= 0 ? 'Salida interior viable' : 'Salida interior bajo presion',
    detail:
      midfieldEdge >= 0
        ? `El bloque medio propio tiene +${formatNumber(
            midfieldEdge,
            1,
          )} ante la presion rival.`
        : `La presion rival supera la salida propia por ${formatNumber(
            Math.abs(midfieldEdge),
            1,
          )}; conviene descargar antes o abrir bandas.`,
    value: midfieldEdge,
  });

  const aerialEdge = getLineupAerialEdge(ownPlayers, opponentPlayers);
  focusItems.push({
    key: 'aerial-edge',
    kind: aerialEdge >= 0 ? 'advantage' : 'risk',
    title: aerialEdge >= 0 ? 'Balon aereo favorable' : 'Cuidar balon aereo',
    detail:
      aerialEdge >= 0
        ? `Los duelos centrales/aereos favorecen por +${formatNumber(aerialEdge, 1)}.`
        : `El rival tiene +${formatNumber(
            Math.abs(aerialEdge),
            1,
          )} en juego aereo central.`,
    value: aerialEdge,
  });

  return focusItems.slice(0, 5);
}

function buildVsTerritoryPoints(
  ownPlayers: ResolvedLineupPlayer[],
  opponentPlayers: ResolvedLineupPlayer[],
  ownLabel: string,
  opponentLabel: string,
): VsTerritoryPoint[] {
  const ownPoints = ownPlayers.map((entry) => ({
    id: `own-${entry.slot.slotId}-${String(entry.player.ID)}`,
    side: 'own' as const,
    sideLabel: ownLabel,
    entry,
    point: transformSlotToVsVoronoiPoint(entry.slot),
    influenceScore: 0,
    influenceWeight: 0,
    influenceContext: null,
    influenceStats: [],
    influenceOpponent: null,
  }));
  const opponentPoints = opponentPlayers.map((entry) => {
    const mirrored = {
      ...entry.slot,
      ...getMirroredSlotPosition(entry.slot),
    };
    return {
      id: `opponent-${entry.slot.slotId}-${String(entry.player.ID)}`,
      side: 'opponent' as const,
      sideLabel: opponentLabel,
      entry,
      point: transformSlotToVsVoronoiPoint(mirrored),
      influenceScore: 0,
      influenceWeight: 0,
      influenceContext: null,
      influenceStats: [],
      influenceOpponent: null,
    };
  });

  const rawPoints = [...ownPoints, ...opponentPoints];
  return rawPoints.map((point) => {
    const nearestOpponent = rawPoints
      .filter((candidate) => candidate.side !== point.side)
      .map((candidate) => ({
        candidate,
        distance: Math.hypot(
          candidate.point.x - point.point.x,
          candidate.point.y - point.point.y,
        ),
      }))
      .sort((a, b) => a.distance - b.distance)[0]?.candidate;

    if (!nearestOpponent) return point;

    const context = getVsDuelContext(point.entry, nearestOpponent.entry);
    const stats = buildVsDuelStats(point.entry, nearestOpponent.entry, context);
    const score = getVsStatsScore(stats, 'own') - getVsStatsScore(stats, 'opponent');

    return {
      ...point,
      influenceScore: score,
      influenceWeight: Math.max(-430, Math.min(430, score * 34)),
      influenceContext: context,
      influenceStats: stats,
      influenceOpponent: nearestOpponent.entry,
    };
  });
}

function clipWeightedPolygonForPoint(
  polygon: ChartPoint[],
  point: ChartPoint,
  otherPoint: ChartPoint,
  pointWeight: number,
  otherWeight: number,
): ChartPoint[] {
  const a = otherPoint.x - point.x;
  const b = otherPoint.y - point.y;
  const c =
    (otherPoint.x * otherPoint.x +
      otherPoint.y * otherPoint.y -
      point.x * point.x -
      point.y * point.y +
      pointWeight -
      otherWeight) /
    2;

  const distance = (candidate: ChartPoint) => a * candidate.x + b * candidate.y - c;
  const clipped: ChartPoint[] = [];

  polygon.forEach((current, index) => {
    const previous = polygon[(index + polygon.length - 1) % polygon.length];
    const currentDistance = distance(current);
    const previousDistance = distance(previous);
    const currentInside = currentDistance <= 0.001;
    const previousInside = previousDistance <= 0.001;

    if (currentInside !== previousInside) {
      const ratio = previousDistance / (previousDistance - currentDistance);
      clipped.push({
        x: previous.x + (current.x - previous.x) * ratio,
        y: previous.y + (current.y - previous.y) * ratio,
      });
    }

    if (currentInside) clipped.push(current);
  });

  return clipped;
}

function buildVsTerritoryCells(points: VsTerritoryPoint[]): VsTerritoryCell[] {
  return points.map((entry) => {
    let polygon: ChartPoint[] = [
      { x: 0, y: 0 },
      { x: VS_PITCH_WIDTH, y: 0 },
      { x: VS_PITCH_WIDTH, y: VS_PITCH_HEIGHT },
      { x: 0, y: VS_PITCH_HEIGHT },
    ];

    points.forEach((otherEntry) => {
      if (otherEntry.id === entry.id) return;
      polygon = clipWeightedPolygonForPoint(
        polygon,
        entry.point,
        otherEntry.point,
        entry.influenceWeight,
        otherEntry.influenceWeight,
      );
    });

    return {
      point: entry,
      polygon,
      area: polygonArea(polygon),
    };
  });
}

function findDominantVsTerritoryPoint(
  points: VsTerritoryPoint[],
  sample: ChartPoint,
): VsTerritoryPoint | null {
  if (!points.length) return null;
  return points.reduce((best, point) => {
    const bestDistance =
      (best.point.x - sample.x) ** 2 +
      (best.point.y - sample.y) ** 2 -
      best.influenceWeight;
    const pointDistance =
      (point.point.x - sample.x) ** 2 +
      (point.point.y - sample.y) ** 2 -
      point.influenceWeight;
    return pointDistance < bestDistance ? point : best;
  }, points[0]);
}

function buildVsQuadrantSummaries(
  points: VsTerritoryPoint[],
  ownLabel: string,
  opponentLabel: string,
): VsQuadrantSummary[] {
  return VS_TERRITORY_QUADRANTS.map((quadrant) => {
    const contributions = new Map<
      string,
      { point: VsTerritoryPoint; count: number; qualityTotal: number }
    >();
    let ownSamples = 0;
    let opponentSamples = 0;
    let ownQualityTotal = 0;
    let opponentQualityTotal = 0;
    const sampleColumns = 14;
    const sampleRows = 9;

    for (let column = 0; column < sampleColumns; column += 1) {
      for (let row = 0; row < sampleRows; row += 1) {
        const sample = {
          x: quadrant.rect.x + ((column + 0.5) / sampleColumns) * quadrant.rect.width,
          y: quadrant.rect.y + ((row + 0.5) / sampleRows) * quadrant.rect.height,
        };
        const nearest = findDominantVsTerritoryPoint(points, sample);
        if (!nearest) continue;

        const quality = nearest.influenceScore;
        const current = contributions.get(nearest.id) ?? {
          point: nearest,
          count: 0,
          qualityTotal: 0,
        };
        current.count += 1;
        current.qualityTotal += quality;
        contributions.set(nearest.id, current);

        if (nearest.side === 'own') {
          ownSamples += 1;
          ownQualityTotal += quality;
        } else {
          opponentSamples += 1;
          opponentQualityTotal += quality;
        }
      }
    }

    const totalSamples = ownSamples + opponentSamples;
    const ownShare = totalSamples ? (ownSamples / totalSamples) * 100 : 0;
    const opponentShare = totalSamples ? (opponentSamples / totalSamples) * 100 : 0;
    const ownQuality = ownSamples ? ownQualityTotal / ownSamples : 0;
    const opponentQuality = opponentSamples ? opponentQualityTotal / opponentSamples : 0;
    const ownControl = ownShare;
    const opponentControl = opponentShare;
    const winner: VsQuadrantSummary['winner'] =
      Math.abs(ownControl - opponentControl) < 2.5
        ? 'even'
        : ownControl > opponentControl
          ? 'own'
          : 'opponent';
    const dominantPoint =
      [...contributions.values()]
        .filter((entry) => winner === 'even' || entry.point.side === winner)
        .sort((a, b) => b.count - a.count || b.qualityTotal - a.qualityTotal)[0]?.point ??
      null;
    const winnerLabel =
      winner === 'even' ? 'Zona pareja' : winner === 'own' ? ownLabel : opponentLabel;
    const winnerShare =
      winner === 'opponent'
        ? opponentShare
        : winner === 'own'
          ? ownShare
          : Math.max(ownShare, opponentShare);
    const loserShare =
      winner === 'opponent'
        ? ownShare
        : winner === 'own'
          ? opponentShare
          : Math.min(ownShare, opponentShare);
    const reason =
      winner === 'even'
        ? `Nadie toma una ventaja clara: ${ownLabel} controla ${formatNumber(
            ownShare,
            0,
          )}% y ${opponentLabel} ${formatNumber(opponentShare, 0)}% de la zona.`
        : `${String(
            dominantPoint?.entry.player.NOMBRE ?? winnerLabel,
          )} inclina la zona por territorio ponderado (${formatNumber(
            winnerShare,
            0,
          )}% vs ${formatNumber(loserShare, 0)}%)${
            dominantPoint?.influenceStats.length
              ? `: ${formatVsStatSummary(dominantPoint.influenceStats, 2)}.`
              : '.'
          }`;

    return {
      ...quadrant,
      winner,
      winnerLabel,
      ownShare,
      opponentShare,
      ownQuality,
      opponentQuality,
      ownControl,
      opponentControl,
      dominantPoint,
      reason,
    };
  });
}

function clampChartPoint(point: ChartPoint): ChartPoint {
  return {
    x: Math.max(2, Math.min(VS_PITCH_WIDTH - 2, point.x)),
    y: Math.max(3, Math.min(VS_PITCH_HEIGHT - 3, point.y)),
  };
}

function buildVsVisualTerritoryPoints(
  points: VsTerritoryPoint[],
): VsVisualTerritoryPoint[] {
  const ungrouped = new Set(points.map((point) => point.id));
  const groups: VsTerritoryPoint[][] = [];

  points.forEach((point) => {
    if (!ungrouped.has(point.id)) return;
    const group = points.filter(
      (candidate) =>
        ungrouped.has(candidate.id) &&
        Math.hypot(candidate.point.x - point.point.x, candidate.point.y - point.point.y) <
          8.8,
    );
    group.forEach((entry) => ungrouped.delete(entry.id));
    groups.push(group);
  });

  return groups.flatMap((group) =>
    group.map((point, index) => {
      const angle =
        group.length > 1
          ? -Math.PI / 2 + (Math.PI * 2 * index) / group.length
          : -Math.PI / 2;
      const pointRadius = group.length > 1 ? 2.75 : 0;
      const labelRadius = group.length > 1 ? 7.6 : 3.7;
      const pointOffset = {
        x: Math.cos(angle) * pointRadius,
        y: Math.sin(angle) * pointRadius,
      };
      const labelOffset = {
        x: Math.cos(angle) * labelRadius,
        y: Math.sin(angle) * labelRadius,
      };
      const visualPoint = clampChartPoint({
        x: point.point.x + pointOffset.x,
        y: point.point.y + pointOffset.y,
      });
      const labelPoint = clampChartPoint({
        x: point.point.x + labelOffset.x,
        y: point.point.y + labelOffset.y,
      });
      const textAnchor =
        Math.abs(Math.cos(angle)) < 0.25
          ? 'middle'
          : Math.cos(angle) > 0
            ? 'start'
            : 'end';
      return {
        point,
        visualPoint,
        labelPoint,
        textAnchor,
      };
    }),
  );
}

function VsStatsTooltipContent({
  title,
  subtitle,
  stats,
  ownName,
  opponentName,
  ownScore,
  opponentScore,
  difference,
  note,
}: {
  title: string;
  subtitle: string;
  stats: VsDuelStat[];
  ownName: string;
  opponentName: string;
  ownScore: number;
  opponentScore: number;
  difference: number;
  note?: string;
}) {
  return (
    <div className="club-vs-tooltip-content">
      <strong>{title}</strong>
      <span>{subtitle}</span>
      <div className="club-vs-tooltip-score">
        <em>{ownName}</em>
        <b className={difference >= 0 ? 'positive' : 'negative'}>
          {formatNumber(ownScore, 0)} / {formatNumber(opponentScore, 0)}
        </b>
        <em>{opponentName}</em>
      </div>
      <div className="club-vs-tooltip-stats">
        {stats.map((stat) => (
          <div key={stat.label}>
            <span>{stat.label}</span>
            <p>
              <em>
                {stat.ownLabel}: {formatNumber(stat.ownValue, 0)}
              </em>
              <b className={stat.difference >= 0 ? 'positive' : 'negative'}>
                {stat.difference >= 0 ? '+' : ''}
                {formatNumber(stat.difference, 0)}
              </b>
              <em>
                {stat.opponentLabel}: {formatNumber(stat.opponentValue, 0)}
              </em>
            </p>
          </div>
        ))}
      </div>
      {note && <small>{note}</small>}
    </div>
  );
}

function VsTerritoryVoronoi({
  ownSummary,
  opponentSummary,
  ownPlayers,
  opponentPlayers,
}: {
  ownSummary: ClubSummary;
  opponentSummary: ClubSummary;
  ownPlayers: ResolvedLineupPlayer[];
  opponentPlayers: ResolvedLineupPlayer[];
}) {
  const [tooltipContent, setTooltipContent] = useState<ReactNode | null>(null);
  const points = buildVsTerritoryPoints(
    ownPlayers,
    opponentPlayers,
    ownSummary.club,
    opponentSummary.club,
  );
  const cells = buildVsTerritoryCells(points);
  const totalArea = cells.reduce((sum, cell) => sum + cell.area, 0);
  const quadrants = buildVsQuadrantSummaries(
    points,
    ownSummary.club,
    opponentSummary.club,
  );
  const visualPoints = buildVsVisualTerritoryPoints(points);

  return (
    <article className="club-vs-card club-vs-territory">
      <header>
        <h3>Analisis territorial</h3>
        <span>quien gana cada zona</span>
      </header>
      <div className="club-vs-territory-layout">
        <div className="club-vs-territory-map">
          <svg
            className="club-vs-voronoi-pitch"
            viewBox={`0 0 ${VS_PITCH_WIDTH} ${VS_PITCH_HEIGHT}`}
            role="img"
          >
            <defs>
              <linearGradient id="club-vs-grass" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#183d20" />
                <stop offset="0.5" stopColor="#0f2f18" />
                <stop offset="1" stopColor="#082311" />
              </linearGradient>
            </defs>
            <rect
              x="0"
              y="0"
              width={VS_PITCH_WIDTH}
              height={VS_PITCH_HEIGHT}
              className="club-vs-pitch-bg"
            />
            {cells.map((cell) => {
              const areaShare = totalArea ? (cell.area / totalArea) * 100 : 0;
              const playerName = String(cell.point.entry.player.NOMBRE ?? '-');
              const rivalName = String(
                cell.point.influenceOpponent?.player.NOMBRE ?? 'Rival cercano',
              );
              const ownScore = getVsStatsScore(cell.point.influenceStats, 'own');
              const opponentScore = getVsStatsScore(
                cell.point.influenceStats,
                'opponent',
              );
              const winnerFirstTitle =
                ownScore >= opponentScore
                  ? `${playerName} vs ${rivalName}`
                  : `${rivalName} vs ${playerName}`;
              const tooltipContent = (
                <VsStatsTooltipContent
                  title={winnerFirstTitle}
                  subtitle={`${cell.point.sideLabel} - ${getPositionFullName(
                    cell.point.entry.slot.role,
                  )} - territorio ${formatNumber(areaShare, 0)}%`}
                  stats={cell.point.influenceStats}
                  ownName={playerName}
                  opponentName={rivalName}
                  ownScore={ownScore}
                  opponentScore={opponentScore}
                  difference={cell.point.influenceScore}
                  note={`La zona crece o se achica por cercania ponderada: distancia territorial + diferencia de estos stats (${cell.point.influenceScore >= 0 ? '+' : ''}${formatNumber(
                    cell.point.influenceScore,
                    1,
                  )}).`}
                />
              );

              return (
                <polygon
                  key={cell.point.id}
                  points={polygonPoints(cell.polygon)}
                  className={`club-vs-voronoi-cell ${cell.point.side}`}
                  onMouseEnter={() => setTooltipContent(tooltipContent)}
                  onMouseMove={() => setTooltipContent(tooltipContent)}
                  onMouseLeave={() => setTooltipContent(null)}
                />
              );
            })}
            <line
              x1="0"
              y1="50"
              x2={VS_PITCH_WIDTH}
              y2="50"
              className="club-vs-pitch-line"
            />
            <line
              x1={VS_PITCH_SIDE_LANE_WIDTH}
              y1="0"
              x2={VS_PITCH_SIDE_LANE_WIDTH}
              y2="100"
              className="club-vs-pitch-line soft"
            />
            <line
              x1={VS_PITCH_RIGHT_LANE_X}
              y1="0"
              x2={VS_PITCH_RIGHT_LANE_X}
              y2="100"
              className="club-vs-pitch-line soft"
            />
            <circle
              cx={VS_PITCH_WIDTH / 2}
              cy="50"
              r="8.4"
              className="club-vs-pitch-line-fill"
            />
            <rect
              x={(VS_PITCH_WIDTH - 46) / 2}
              y="0.7"
              width="46"
              height="14"
              className="club-vs-pitch-box"
            />
            <rect
              x={(VS_PITCH_WIDTH - 46) / 2}
              y="85.3"
              width="46"
              height="14"
              className="club-vs-pitch-box"
            />
            {quadrants.map((quadrant) => (
              <g
                key={quadrant.key}
                className={`club-vs-quadrant-mark ${quadrant.winner}`}
              >
                <rect
                  x={quadrant.rect.x}
                  y={quadrant.rect.y}
                  width={quadrant.rect.width}
                  height={quadrant.rect.height}
                />
              </g>
            ))}
            {visualPoints.map(({ point, visualPoint, labelPoint, textAnchor }) => {
              const playerTooltipContent = (
                <VsStatsTooltipContent
                  title={String(point.entry.player.NOMBRE ?? '-')}
                  subtitle={`${point.sideLabel} - ${getPositionFullName(
                    point.entry.slot.role,
                  )} - rating ${formatNumber(point.entry.rating, 0)}`}
                  stats={point.influenceStats}
                  ownName={String(point.entry.player.NOMBRE ?? '-')}
                  opponentName={String(
                    point.influenceOpponent?.player.NOMBRE ?? 'Rival cercano',
                  )}
                  ownScore={getVsStatsScore(point.influenceStats, 'own')}
                  opponentScore={getVsStatsScore(point.influenceStats, 'opponent')}
                  difference={point.influenceScore}
                  note="Estos stats son los que ponderan su influencia territorial frente al rival cercano."
                />
              );

              return (
                <g
                  key={point.id}
                  className={`club-vs-voronoi-player ${point.side}`}
                  onMouseEnter={() => setTooltipContent(playerTooltipContent)}
                  onMouseMove={() => setTooltipContent(playerTooltipContent)}
                  onMouseLeave={() => setTooltipContent(null)}
                >
                  {(visualPoint.x !== point.point.x ||
                    visualPoint.y !== point.point.y) && (
                    <line
                      x1={point.point.x}
                      y1={point.point.y}
                      x2={visualPoint.x}
                      y2={visualPoint.y}
                      className="offset-link"
                    />
                  )}
                  <circle
                    className="halo"
                    cx={visualPoint.x}
                    cy={visualPoint.y}
                    r="2.25"
                  />
                  <circle cx={visualPoint.x} cy={visualPoint.y} r="1.45" />
                  <line
                    x1={visualPoint.x}
                    y1={visualPoint.y}
                    x2={labelPoint.x}
                    y2={labelPoint.y}
                    className="label-link"
                  />
                  <text
                    x={labelPoint.x}
                    y={labelPoint.y}
                    className="name"
                    textAnchor={textAnchor}
                  >
                    {formatVoronoiPlayerName(point.entry.player.NOMBRE)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div
          className={`club-vs-quadrant-panel ${
            tooltipContent ? 'is-tooltip-visible' : ''
          }`}
        >
          <div className="club-vs-quadrant-list">
            {quadrants.map((quadrant) => (
              <div
                key={quadrant.key}
                className={`club-vs-quadrant-card ${quadrant.winner}`}
              >
                <div>
                  <span>{quadrant.label}</span>
                  <strong>{quadrant.winnerLabel}</strong>
                </div>
                <div className="club-vs-quadrant-meter">
                  <span style={{ width: `${Math.max(4, quadrant.ownShare)}%` }} />
                  <em style={{ width: `${Math.max(4, quadrant.opponentShare)}%` }} />
                </div>
                <small>
                  {ownSummary.club}: {formatNumber(quadrant.ownControl, 0)} -{' '}
                  {opponentSummary.club}: {formatNumber(quadrant.opponentControl, 0)}
                </small>
                <p>{quadrant.reason}</p>
              </div>
            ))}
          </div>
          <ClubInlineTooltip
            content={tooltipContent}
            className="club-vs-chart-tooltip club-vs-zone-panel-tooltip"
          />
        </div>
      </div>
    </article>
  );
}

function ClubVsAnalysisOverlay({
  ownSummary,
  opponentSummary,
  ownLineup,
  opponentLineup,
  onClose,
}: {
  ownSummary: ClubSummary;
  opponentSummary: ClubSummary;
  ownLineup: ClubLineupConfig;
  opponentLineup: ClubLineupConfig;
  onClose: () => void;
}) {
  const ownPlayers = resolveLineupPlayers(ownSummary, ownLineup);
  const opponentPlayers = resolveLineupPlayers(opponentSummary, opponentLineup);
  const ownAverage = getResolvedLineupAverage(ownPlayers);
  const opponentAverage = getResolvedLineupAverage(opponentPlayers);
  const duels = buildLineupDuels(ownPlayers, opponentPlayers).slice(0, 8);
  const balance = ownAverage - opponentAverage;
  const ownOffensiveEdge = getLineupOffensiveEdge(ownPlayers, opponentPlayers);
  const opponentOffensiveEdge = getLineupOffensiveEdge(opponentPlayers, ownPlayers);
  const midfieldEdge = getLineupMidfieldEdge(ownPlayers, opponentPlayers);
  const focusItems = buildVsFocusItems(duels, ownPlayers, opponentPlayers);
  const mainAdvantage = focusItems.find((item) => item.kind === 'advantage');
  const mainRisk = focusItems.find((item) => item.kind === 'risk');

  return (
    <div className="club-vs-overlay" role="dialog" aria-modal="true">
      <section className="club-vs-hub">
        <header className="club-vs-header">
          <div>
            <span>Analisis VS</span>
            <h2>
              {ownSummary.club} vs {opponentSummary.club}
            </h2>
            <p>
              Comparacion basada en los onces titulares probables configurados en el
              modulo Clubes.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar analisis VS">
            x
          </button>
        </header>

        <div className="club-vs-kpis">
          <article>
            <span>Ataque propio</span>
            <strong className={ownOffensiveEdge >= 0 ? 'positive' : 'negative'}>
              {ownOffensiveEdge >= 0 ? '+' : ''}
              {formatNumber(ownOffensiveEdge, 1)}
            </strong>
            <small>vs contencion rival - {ownLineup.formationName}</small>
          </article>
          <article>
            <span>Amenaza rival</span>
            <strong className={opponentOffensiveEdge <= 0 ? 'positive' : 'negative'}>
              {opponentOffensiveEdge >= 0 ? '+' : ''}
              {formatNumber(opponentOffensiveEdge, 1)}
            </strong>
            <small>vs defensa propia - {opponentLineup.formationName}</small>
          </article>
          <article>
            <span>Control medio</span>
            <strong className={midfieldEdge >= 0 ? 'positive' : 'negative'}>
              {midfieldEdge >= 0 ? '+' : ''}
              {formatNumber(midfieldEdge, 1)}
            </strong>
            <small>salida propia vs presion rival</small>
          </article>
        </div>

        <div className="club-vs-grid">
          <article className="club-vs-card club-vs-reading">
            <header>
              <h3>Lectura rapida</h3>
            </header>
            <p>
              Promedio del once: <strong>{ownSummary.club}</strong>{' '}
              {formatNumber(ownAverage, 1)} / <strong>{opponentSummary.club}</strong>{' '}
              {formatNumber(opponentAverage, 1)} ({balance >= 0 ? '+' : ''}
              {formatNumber(balance, 1)}).
            </p>
            {mainAdvantage && (
              <p>
                Mejor ruta: <strong>{mainAdvantage.title}</strong>. {mainAdvantage.detail}
              </p>
            )}
            {mainRisk && (
              <p>
                Alerta: <strong>{mainRisk.title}</strong>. {mainRisk.detail}
              </p>
            )}
            <p>
              El dato util no es la linea completa, sino donde el perfil del jugador
              propio supera o queda expuesto ante el perfil que lo enfrenta.
            </p>
          </article>

          <article className="club-vs-card club-vs-focus">
            <header>
              <h3>Focos del partido</h3>
              <span>acciones sugeridas</span>
            </header>
            <div className="club-vs-focus-list">
              {focusItems.map((item) => (
                <div key={item.key} className={`club-vs-focus-item ${item.kind}`}>
                  <span>
                    {item.kind === 'risk'
                      ? 'Riesgo'
                      : item.kind === 'advantage'
                        ? 'Ventaja'
                        : 'Control'}
                  </span>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="club-vs-card club-vs-duels">
            <header>
              <h3>Duelos probables</h3>
              <span>por cercania en cancha</span>
            </header>
            <div className="club-vs-duel-list">
              {duels.map((duel) => {
                const duelTooltip = (
                  <VsStatsTooltipContent
                    title={duel.context.label}
                    subtitle={`${duel.context.ownLabel} vs ${duel.context.opponentLabel}`}
                    stats={duel.stats}
                    ownName={String(duel.own.player.NOMBRE ?? '-')}
                    opponentName={String(duel.opponent.player.NOMBRE ?? '-')}
                    ownScore={duel.ownScore}
                    opponentScore={duel.opponentScore}
                    difference={duel.difference}
                    note={`Diferencia del duelo: ${duel.difference >= 0 ? '+' : ''}${formatNumber(
                      duel.difference,
                      1,
                    )}. Distancia posicional: ${formatNumber(duel.distance, 1)}.`}
                  />
                );

                return (
                  <EnhancedTooltip
                    key={`${duel.opponent.slot.slotId}-${duel.own.slot.slotId}`}
                    content={duelTooltip}
                    placement="left"
                    className="club-vs-duel-tooltip-wrapper"
                    popupClassName="club-vs-enhanced-tooltip"
                  >
                    <div className="club-vs-duel-row">
                      <div>
                        <span className="position-badge">{duel.own.slot.role}</span>
                        <strong>{String(duel.own.player.NOMBRE ?? '-')}</strong>
                        <RatingValue value={duel.ownScore} />
                      </div>
                      <span className={duel.difference >= 0 ? 'positive' : 'negative'}>
                        {duel.difference >= 0 ? '+' : ''}
                        {formatNumber(duel.difference, 0)}
                      </span>
                      <div>
                        <span className="position-badge">{duel.opponent.slot.role}</span>
                        <strong>{String(duel.opponent.player.NOMBRE ?? '-')}</strong>
                        <RatingValue value={duel.opponentScore} />
                      </div>
                      <small>
                        {duel.context.label} - {formatVsStatSummary(duel.stats, 1)}
                      </small>
                    </div>
                  </EnhancedTooltip>
                );
              })}
            </div>
          </article>
        </div>
        <VsTerritoryVoronoi
          ownSummary={ownSummary}
          opponentSummary={opponentSummary}
          ownPlayers={ownPlayers}
          opponentPlayers={opponentPlayers}
        />
      </section>
    </div>
  );
}

function getChartTooltipPosition(event: ReactMouseEvent<Element>) {
  const estimatedWidth = 440;
  const estimatedHeight = 140;
  const margin = 10;
  return {
    x: Math.min(event.clientX + 14, window.innerWidth - estimatedWidth - margin),
    y: Math.min(event.clientY + 14, window.innerHeight - estimatedHeight - margin),
  };
}

function ClubChartTooltip({
  tooltip,
  className = '',
}: {
  tooltip: ChartTooltipState | null;
  className?: string;
}) {
  if (!tooltip) return null;

  return (
    <div
      className={`glossary-tooltip-popup club-chart-tooltip ${className}`}
      style={{
        position: 'fixed',
        left: `${Math.max(10, tooltip.x)}px`,
        top: `${Math.max(10, tooltip.y)}px`,
        transform: 'none',
      }}
    >
      <div className="glossary-tooltip-definition club-chart-tooltip-body">
        {tooltip.content}
      </div>
    </div>
  );
}

function ClubInlineTooltip({
  content,
  className = '',
}: {
  content: ReactNode | null;
  className?: string;
}) {
  if (!content) return null;

  return (
    <div className={`glossary-tooltip-popup club-chart-tooltip ${className}`}>
      <div className="glossary-tooltip-definition club-chart-tooltip-body">{content}</div>
    </div>
  );
}

function AnalysisKpi({
  label,
  value,
  detail,
  description,
}: {
  label: string;
  value: string;
  detail: string;
  description: string;
}) {
  return (
    <article className="club-analysis-kpi">
      <span>{label}</span>
      <EnhancedTooltip
        content={
          <div className="club-enhanced-tooltip-content">
            <strong>{label}</strong>
            <span>{description}</span>
            <small>
              {value} · {detail}
            </small>
          </div>
        }
        placement="top"
      >
        <strong>{value}</strong>
      </EnhancedTooltip>
      <small>{detail}</small>
    </article>
  );
}

function getLeagueDimensionAverage(
  profiles: ClubAnalysisProfile[],
  key: AnalysisDimensionKey,
): number {
  return mean(profiles.map((profile) => profile.dimensions[key]));
}

function getLeagueFamilyAverage(
  profiles: ClubAnalysisProfile[],
  group: AnalysisDimensionGroup,
): number {
  return mean(profiles.map((profile) => getFamilyValue(profile.dimensions, group)));
}

function polarPoint(
  centerX: number,
  centerY: number,
  radius: number,
  angleDegrees: number,
): ChartPoint {
  const radians = ((angleDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + Math.cos(radians) * radius,
    y: centerY + Math.sin(radians) * radius,
  };
}

function describeDonutSegment(
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const outerStart = polarPoint(centerX, centerY, outerRadius, startAngle);
  const outerEnd = polarPoint(centerX, centerY, outerRadius, endAngle);
  const innerEnd = polarPoint(centerX, centerY, innerRadius, endAngle);
  const innerStart = polarPoint(centerX, centerY, innerRadius, startAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

function describeArcLine(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const start = polarPoint(centerX, centerY, radius, startAngle);
  const end = polarPoint(centerX, centerY, radius, endAngle);

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function describeRadialLine(
  centerX: number,
  centerY: number,
  startRadius: number,
  endRadius: number,
  angleDegrees: number,
): string {
  const start = polarPoint(centerX, centerY, startRadius, angleDegrees);
  const end = polarPoint(centerX, centerY, endRadius, angleDegrees);

  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

function ClubAttributeRoseChart({
  activeProfile,
  profiles,
}: {
  activeProfile: ClubAnalysisProfile;
  profiles: ClubAnalysisProfile[];
}) {
  const center = 170;
  const innerRadius = 32;
  const maxOuterRadius = 164;
  const orderedDimensions = ANALYSIS_GROUP_ORDER.flatMap((group) =>
    ANALYSIS_DIMENSIONS.filter((dimension) => dimension.group === group),
  );
  const segmentAngle = 360 / orderedDimensions.length;
  const minValue = 45;
  const maxValue = 95;
  const [tooltip, setTooltip] = useState<ChartTooltipState | null>(null);

  return (
    <div className="club-analysis-chart-card club-attribute-rose-card">
      <header>
        <h3>Radar de Stats</h3>
        <span>Top {ANALYSIS_TOP_STAT_COUNT} Jugadores por stat</span>
      </header>
      <div className="club-attribute-visual">
        <svg className="club-attribute-rose-chart" viewBox="0 0 340 340" role="img">
          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            className="club-attribute-core"
          />
          {[0.25, 0.5, 0.75, 1].map((ring) => (
            <circle
              key={ring}
              cx={center}
              cy={center}
              r={innerRadius + (maxOuterRadius - innerRadius) * ring}
              className="club-attribute-ring"
            />
          ))}
          {orderedDimensions.map((dimension, index) => {
            const startAngle = index * segmentAngle + 1.2;
            const endAngle = (index + 1) * segmentAngle - 1.2;
            const midAngle = (startAngle + endAngle) / 2;
            const value = activeProfile.dimensions[dimension.key];
            const leagueValue = getLeagueDimensionAverage(profiles, dimension.key);
            const normalized = Math.max(
              0.04,
              Math.min(1, (value - minValue) / (maxValue - minValue)),
            );
            const leagueNormalized = Math.max(
              0.04,
              Math.min(1, (leagueValue - minValue) / (maxValue - minValue)),
            );
            const outerRadius = innerRadius + (maxOuterRadius - innerRadius) * normalized;
            const leagueRadius =
              innerRadius + (maxOuterRadius - innerRadius) * leagueNormalized;
            const labelPathId = `club-attribute-label-${dimension.key}`;
            const isLeftSideLabel = midAngle > 180 && midAngle < 360;
            const labelInnerRadius = innerRadius + 8;
            const labelOuterRadius = Math.min(
              maxOuterRadius - 8,
              Math.max(labelInnerRadius + 70, outerRadius - 10),
            );
            const labelStartRadius = isLeftSideLabel
              ? labelOuterRadius
              : labelInnerRadius;
            const labelEndRadius = isLeftSideLabel ? labelInnerRadius : labelOuterRadius;
            const labelAnchor = isLeftSideLabel ? 'end' : 'start';
            const labelOffset = isLeftSideLabel ? '92%' : '8%';
            const tooltipContent = (
              <div className="club-chart-tooltip-content">
                <strong>{dimension.label}</strong>
                <span>{ANALYSIS_GROUP_LABELS[dimension.group]}</span>
                <small>
                  Club {formatNumber(value, 1)} · Liga {formatNumber(leagueValue, 1)}
                </small>
                <p>{dimension.description}</p>
              </div>
            );
            return (
              <g key={dimension.key} className="club-attribute-segment">
                <path
                  d={describeDonutSegment(
                    center,
                    center,
                    innerRadius,
                    outerRadius,
                    startAngle,
                    endAngle,
                  )}
                  fill={ANALYSIS_GROUP_COLORS[dimension.group]}
                  className="club-attribute-slice"
                  onMouseEnter={(event) =>
                    setTooltip({
                      ...getChartTooltipPosition(event),
                      content: tooltipContent,
                    })
                  }
                  onMouseMove={(event) =>
                    setTooltip({
                      ...getChartTooltipPosition(event),
                      content: tooltipContent,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                />
                <path
                  id={labelPathId}
                  d={describeRadialLine(
                    center,
                    center,
                    labelStartRadius,
                    labelEndRadius,
                    midAngle,
                  )}
                  className="club-attribute-label-guide"
                />
                <text
                  className="club-attribute-stat-label"
                  textAnchor={labelAnchor}
                  dominantBaseline="middle"
                >
                  <textPath href={`#${labelPathId}`} startOffset={labelOffset}>
                    {dimension.label}
                  </textPath>
                </text>
                <path
                  d={describeArcLine(
                    center,
                    center,
                    leagueRadius,
                    startAngle + 1.2,
                    endAngle - 1.2,
                  )}
                  className="club-attribute-league-marker"
                />
              </g>
            );
          })}
        </svg>
        <ClubChartTooltip tooltip={tooltip} />
      </div>
    </div>
  );
}

function FamilyComparisonPanel({
  activeProfile,
  profiles,
}: {
  activeProfile: ClubAnalysisProfile;
  profiles: ClubAnalysisProfile[];
}) {
  const activeValues = Object.fromEntries(
    ANALYSIS_GROUP_ORDER.map((group) => [
      group,
      getFamilyValue(activeProfile.dimensions, group),
    ]),
  ) as Record<AnalysisDimensionGroup, number>;
  const leagueValues = Object.fromEntries(
    ANALYSIS_GROUP_ORDER.map((group) => [group, getLeagueFamilyAverage(profiles, group)]),
  ) as Record<AnalysisDimensionGroup, number>;

  return (
    <article className="club-analysis-chart-card club-family-comparison-card">
      <header>
        <h3>Familia de Stats</h3>
        <span>Club vs promedio ANFPES</span>
      </header>
      <div className="club-family-bars">
        {ANALYSIS_GROUP_ORDER.map((group) => {
          const value = activeValues[group];
          const leagueValue = leagueValues[group];
          const delta = value - leagueValue;
          return (
            <div key={group} className="club-family-row">
              <div className="club-family-row-head">
                <strong>{ANALYSIS_GROUP_LABELS[group]}</strong>
                <span className={delta >= 0 ? 'positive' : 'negative'}>
                  {delta >= 0 ? '+' : ''}
                  {formatNumber(delta, 1)}
                </span>
              </div>
              <EnhancedTooltip
                content={`${ANALYSIS_GROUP_LABELS[group]} | Club: ${formatNumber(
                  value,
                  1,
                )} | Liga: ${formatNumber(leagueValue, 1)}`}
                placement="top"
                className="club-family-track-tooltip"
              >
                <span className="club-family-track">
                  <span
                    className="club-family-league-marker"
                    style={{ left: `${Math.max(0, Math.min(100, leagueValue))}%` }}
                  />
                  <span
                    className="club-family-fill"
                    style={{
                      width: `${Math.max(0, Math.min(100, value))}%`,
                      background: ANALYSIS_GROUP_COLORS[group],
                    }}
                  />
                </span>
              </EnhancedTooltip>
              <div className="club-family-values">
                <span>Club {formatNumber(value, 1)}</span>
                <span>Liga {formatNumber(leagueValue, 1)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function ClubScatterPlot({
  activeProfile,
  profiles,
}: {
  activeProfile: ClubAnalysisProfile;
  profiles: ClubAnalysisProfile[];
}) {
  const width = 420;
  const height = 280;
  const padding = 38;
  const xValues = profiles.map((profile) => profile.attackIndex);
  const yValues = profiles.map((profile) => profile.defenceIndex);
  const xMin = Math.min(...xValues) - 1;
  const xMax = Math.max(...xValues) + 1;
  const yMin = Math.min(...yValues) - 1;
  const yMax = Math.max(...yValues) + 1;
  const xAverage = xValues.reduce((sum, value) => sum + value, 0) / xValues.length;
  const yAverage = yValues.reduce((sum, value) => sum + value, 0) / yValues.length;
  const isHighAttack = activeProfile.attackIndex >= xAverage;
  const isHighDefence = activeProfile.defenceIndex >= yAverage;
  const reading =
    isHighAttack && isHighDefence
      ? 'Cuadrante superior derecho: plantel fuerte y equilibrado para competir arriba.'
      : isHighAttack
        ? 'Cuadrante inferior derecho: plantel con mas peso ofensivo que defensivo.'
        : isHighDefence
          ? 'Cuadrante superior izquierdo: plantel mas solido defendiendo que atacando.'
          : 'Cuadrante inferior izquierdo: plantel bajo el promedio en ambos indices.';

  const xScale = (value: number) =>
    padding + ((value - xMin) / (xMax - xMin || 1)) * (width - padding * 2);
  const yScale = (value: number) =>
    height - padding - ((value - yMin) / (yMax - yMin || 1)) * (height - padding * 2);
  const [tooltip, setTooltip] = useState<ChartTooltipState | null>(null);

  return (
    <div className="club-analysis-chart-card club-scatter-card">
      <header>
        <h3>Ataque vs defensa</h3>
        <span>Comparacion con los otros 31</span>
      </header>
      <svg className="club-scatter-chart" viewBox={`0 0 ${width} ${height}`} role="img">
        <text x={padding + 4} y={padding - 12} className="club-scatter-quadrant">
          defensa alta / ataque bajo
        </text>
        <text
          x={width - padding - 4}
          y={padding - 12}
          textAnchor="end"
          className="club-scatter-quadrant"
        >
          ataque y defensa altos
        </text>
        <text
          x={width - padding - 4}
          y={height - padding + 22}
          textAnchor="end"
          className="club-scatter-quadrant"
        >
          ataque alto / defensa baja
        </text>
        <line
          x1={xScale(xAverage)}
          x2={xScale(xAverage)}
          y1={padding}
          y2={height - padding}
          className="club-scatter-axis"
        />
        <line
          x1={padding}
          x2={width - padding}
          y1={yScale(yAverage)}
          y2={yScale(yAverage)}
          className="club-scatter-axis"
        />
        {profiles.map((profile) => {
          const active = profile.summary.club === activeProfile.summary.club;
          const tooltipContent = (
            <div className="club-chart-tooltip-content">
              <strong>{profile.summary.club}</strong>
              <span>{active ? 'Club analizado' : 'Comparacion ANFPES'}</span>
              <small>
                Ataque {formatNumber(profile.attackIndex, 1)} · Defensa{' '}
                {formatNumber(profile.defenceIndex, 1)}
              </small>
              <p>Promedio general {formatNumber(profile.overall, 1)}</p>
            </div>
          );
          return (
            <g
              key={profile.summary.club}
              className="club-scatter-point-group"
              onMouseEnter={(event) =>
                setTooltip({
                  ...getChartTooltipPosition(event),
                  content: tooltipContent,
                })
              }
              onMouseMove={(event) =>
                setTooltip({
                  ...getChartTooltipPosition(event),
                  content: tooltipContent,
                })
              }
              onMouseLeave={() => setTooltip(null)}
            >
              <circle
                cx={xScale(profile.attackIndex)}
                cy={yScale(profile.defenceIndex)}
                r={active ? 7 : 4}
                className={active ? 'club-scatter-point active' : 'club-scatter-point'}
              />
              {active && (
                <text
                  x={xScale(profile.attackIndex) + 10}
                  y={yScale(profile.defenceIndex) - 8}
                >
                  {profile.summary.club}
                </text>
              )}
            </g>
          );
        })}
        <text x={width / 2} y={height - 6} textAnchor="middle">
          Indice ofensivo
        </text>
        <text
          x={12}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90 12 ${height / 2})`}
        >
          Indice defensivo
        </text>
      </svg>
      <ClubChartTooltip tooltip={tooltip} />
      <p className="club-scatter-reading">
        Las lineas marcan el promedio ANFPES. {reading}
      </p>
    </div>
  );
}

function AnalysisLineupPitch({
  recommendation,
  club,
  onOpenPlayer,
}: {
  recommendation: FormationRecommendation;
  club: string;
  onOpenPlayer: (player: DerivedPlayer) => void;
}) {
  const slots = recommendation.assignments.map((assignment) => ({
    ...assignment.slot,
    playerId: String(assignment.player.ID),
  }));
  const players = recommendation.assignments.map((assignment) => assignment.player);

  return (
    <div className="analysis-tactical-pitch-wrap">
      <TacticalPitch
        slots={slots}
        players={players}
        clubId={club}
        candidateInIds={[]}
        candidateOutIds={[]}
        planLabel={recommendation.formationName}
        hideHeader
        useClubKitImages
        offsideTrap="C"
        onSlotClick={(slotId) => {
          const assignment = recommendation.assignments.find(
            (item) => item.slot.slotId === slotId,
          );
          if (assignment) onOpenPlayer(assignment.player);
        }}
      />
    </div>
  );
}

function formatVoronoiPlayerName(value: unknown): string {
  const name = String(value ?? '').trim();
  if (name.length <= 11) return name;
  return `${name.slice(0, 10)}.`;
}

function transformSlotToVoronoiPoint(slot: FormationSlot): ChartPoint {
  return {
    x: 100 - slot.y,
    y: slot.x * 0.64,
  };
}

function transformSlotToVsVoronoiPoint(slot: FormationSlot): ChartPoint {
  return {
    x: slot.x * (VS_PITCH_WIDTH / 100),
    y: slot.y,
  };
}

function clipPolygonForPoint(
  polygon: ChartPoint[],
  point: ChartPoint,
  otherPoint: ChartPoint,
): ChartPoint[] {
  const a = otherPoint.x - point.x;
  const b = otherPoint.y - point.y;
  const c =
    (otherPoint.x * otherPoint.x +
      otherPoint.y * otherPoint.y -
      point.x * point.x -
      point.y * point.y) /
    2;

  const distance = (candidate: ChartPoint) => a * candidate.x + b * candidate.y - c;
  const clipped: ChartPoint[] = [];

  polygon.forEach((current, index) => {
    const previous = polygon[(index + polygon.length - 1) % polygon.length];
    const currentDistance = distance(current);
    const previousDistance = distance(previous);
    const currentInside = currentDistance <= 0.001;
    const previousInside = previousDistance <= 0.001;

    if (currentInside !== previousInside) {
      const ratio = previousDistance / (previousDistance - currentDistance);
      clipped.push({
        x: previous.x + (current.x - previous.x) * ratio,
        y: previous.y + (current.y - previous.y) * ratio,
      });
    }

    if (currentInside) clipped.push(current);
  });

  return clipped;
}

function polygonPoints(points: ChartPoint[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

function polygonArea(points: ChartPoint[]): number {
  if (points.length < 3) return 0;
  const doubledArea = points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0);
  return Math.abs(doubledArea / 2);
}

function getVoronoiSide(point: ChartPoint): string {
  if (point.y < 64 / 3) return 'Izquierda';
  if (point.y > (64 / 3) * 2) return 'Derecha';
  return 'Centro';
}

function VoronoiPitch({ recommendation }: { recommendation: FormationRecommendation }) {
  const points = recommendation.assignments.map((assignment) => ({
    assignment,
    point: transformSlotToVoronoiPoint(assignment.slot),
  }));
  const cells = points.map((entry) => {
    let polygon: ChartPoint[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 64 },
      { x: 0, y: 64 },
    ];

    points.forEach((otherEntry) => {
      if (otherEntry.assignment.slot.slotId === entry.assignment.slot.slotId) return;
      polygon = clipPolygonForPoint(polygon, entry.point, otherEntry.point);
    });

    return {
      ...entry,
      polygon,
      area: polygonArea(polygon),
    };
  });
  const totalArea = cells.reduce((sum, cell) => sum + cell.area, 0);
  const largestCell = cells.reduce((best, cell) => (cell.area > best.area ? cell : best));
  const smallestCell = cells.reduce((best, cell) =>
    cell.area < best.area ? cell : best,
  );
  const lineShares = ANALYSIS_LINE_ORDER.map((line) => {
    const lineCells = cells.filter(
      (cell) => getPositionLine(cell.assignment.slot.role) === line,
    );
    const area = lineCells.reduce((sum, cell) => sum + cell.area, 0);
    return {
      line,
      area,
      percentage: totalArea ? (area / totalArea) * 100 : 0,
      rating: mean(lineCells.map((cell) => cell.assignment.rating)),
    };
  }).filter((line) => line.area > 0);
  const dominantLine = lineShares.reduce((best, line) =>
    line.area > best.area ? line : best,
  );
  const sideShares = ['Izquierda', 'Centro', 'Derecha'].map((side) => {
    const area = cells
      .filter((cell) => getVoronoiSide(cell.point) === side)
      .reduce((sum, cell) => sum + cell.area, 0);
    return {
      side,
      area,
      percentage: totalArea ? (area / totalArea) * 100 : 0,
    };
  });
  const dominantSide = sideShares.reduce((best, side) =>
    side.area > best.area ? side : best,
  );
  const lineCenters = ANALYSIS_LINE_ORDER.map((line) =>
    mean(
      cells
        .filter((cell) => getPositionLine(cell.assignment.slot.role) === line)
        .map((cell) => cell.point.x),
    ),
  ).filter((value) => value > 0);
  const lineSpread = lineCenters.length
    ? Math.max(...lineCenters) - Math.min(...lineCenters)
    : 0;
  const compactness =
    lineSpread <= 48 ? 'compacto' : lineSpread <= 62 ? 'medio' : 'largo';
  const riskyCell = [...cells].sort((a, b) => {
    const riskA = (a.area / (totalArea || 1)) * Math.max(0, 88 - a.assignment.rating);
    const riskB = (b.area / (totalArea || 1)) * Math.max(0, 88 - b.assignment.rating);
    return riskB - riskA;
  })[0];
  const [tooltip, setTooltip] = useState<ChartTooltipState | null>(null);

  return (
    <div className="club-analysis-chart-card club-voronoi-card">
      <header>
        <h3>Analisis territorial</h3>
        <span>Zonas del once sugerido</span>
      </header>
      <div className="club-voronoi-layout">
        <div className="club-voronoi-visual">
          <svg className="analysis-voronoi-pitch" viewBox="0 0 100 64" role="img">
            <rect x="0" y="0" width="100" height="64" className="voronoi-pitch-bg" />
            {cells.map((cell) => {
              const line = getPositionLine(cell.assignment.slot.role);
              const territoryShare = totalArea ? (cell.area / totalArea) * 100 : 0;
              const tooltipContent = (
                <div className="club-chart-tooltip-content">
                  <strong>{cell.assignment.player.NOMBRE as string}</strong>
                  <span>{cell.assignment.slot.role}</span>
                  <small>
                    Rating {formatNumber(cell.assignment.rating, 0)} · Territorio{' '}
                    {formatNumber(territoryShare, 0)}%
                  </small>
                  <p>
                    {LINE_LABELS[line]} · {cell.assignment.fit}
                  </p>
                </div>
              );
              return (
                <polygon
                  key={cell.assignment.slot.slotId}
                  points={polygonPoints(cell.polygon)}
                  fill={LINE_COLORS[line]}
                  opacity={
                    0.18 +
                    Math.max(0, Math.min(1, (cell.assignment.rating - 65) / 25)) * 0.16
                  }
                  className="voronoi-cell"
                  onMouseEnter={(event) =>
                    setTooltip({
                      ...getChartTooltipPosition(event),
                      content: tooltipContent,
                    })
                  }
                  onMouseMove={(event) =>
                    setTooltip({
                      ...getChartTooltipPosition(event),
                      content: tooltipContent,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
            <rect x="1" y="1" width="98" height="62" className="voronoi-line" />
            <line x1="50" y1="1" x2="50" y2="63" className="voronoi-line" />
            <circle cx="50" cy="32" r="8" className="voronoi-line-fill" />
            <rect x="1" y="14" width="16" height="36" className="voronoi-line-fill" />
            <rect x="1" y="23.5" width="6.5" height="17" className="voronoi-line-fill" />
            <rect x="83" y="14" width="16" height="36" className="voronoi-line-fill" />
            <rect
              x="92.5"
              y="23.5"
              width="6.5"
              height="17"
              className="voronoi-line-fill"
            />
            {points.map((entry) => {
              const matchingCell = cells.find(
                (cell) => cell.assignment.slot.slotId === entry.assignment.slot.slotId,
              );
              const territoryShare =
                matchingCell && totalArea ? (matchingCell.area / totalArea) * 100 : 0;
              const tooltipContent = (
                <div className="club-chart-tooltip-content">
                  <strong>{entry.assignment.player.NOMBRE as string}</strong>
                  <span>{entry.assignment.slot.role}</span>
                  <small>
                    Rating {formatNumber(entry.assignment.rating, 0)} · Territorio{' '}
                    {formatNumber(territoryShare, 0)}%
                  </small>
                </div>
              );
              return (
                <g
                  key={entry.assignment.slot.slotId}
                  className="voronoi-player-label"
                  onMouseEnter={(event) =>
                    setTooltip({
                      ...getChartTooltipPosition(event),
                      content: tooltipContent,
                    })
                  }
                  onMouseMove={(event) =>
                    setTooltip({
                      ...getChartTooltipPosition(event),
                      content: tooltipContent,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                >
                  <rect
                    x={entry.point.x - 4.4}
                    y={entry.point.y - 4.5}
                    width="8.8"
                    height="3.9"
                    rx="0.9"
                    fill={LINE_COLORS[getPositionLine(entry.assignment.slot.role)]}
                    className="voronoi-position-badge"
                  />
                  <text
                    x={entry.point.x}
                    y={entry.point.y - 2.55}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="voronoi-position-text"
                  >
                    {entry.assignment.slot.role}
                  </text>
                  <text
                    x={entry.point.x}
                    y={entry.point.y + 3}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="voronoi-player-name"
                  >
                    {formatVoronoiPlayerName(entry.assignment.player.NOMBRE)}
                  </text>
                </g>
              );
            })}
            <line x1="0" y1="0" x2="100" y2="64" className="voronoi-shadow-diagonal" />
            <line x1="0" y1="64" x2="100" y2="0" className="voronoi-shadow-diagonal" />
          </svg>
          <ClubChartTooltip tooltip={tooltip} />
        </div>
        <aside className="club-voronoi-insights">
          <h4>Lectura territorial</h4>
          <div className="club-territory-grid">
            <div>
              <span>Mayor zona</span>
              <strong>{largestCell.assignment.player.NOMBRE as string}</strong>
              <small>
                {formatNumber((largestCell.area / (totalArea || 1)) * 100, 0)}% del mapa
              </small>
            </div>
            <div>
              <span>Menor zona</span>
              <strong>{smallestCell.assignment.player.NOMBRE as string}</strong>
              <small>
                {formatNumber((smallestCell.area / (totalArea || 1)) * 100, 0)}% del mapa
              </small>
            </div>
            <div>
              <span>Carril dominante</span>
              <strong>{dominantSide.side}</strong>
              <small>{formatNumber(dominantSide.percentage, 0)}% territorial</small>
            </div>
            <div>
              <span>Compactacion</span>
              <strong>{compactness}</strong>
              <small>distancia entre bloques {formatNumber(lineSpread, 0)}</small>
            </div>
          </div>
          <div className="club-territory-lines">
            {lineShares.map((share) => (
              <div key={share.line} className="club-territory-line-row">
                <span>{LINE_LABELS[share.line]}</span>
                <div className="club-territory-track">
                  <em
                    style={{
                      width: `${Math.max(0, Math.min(100, share.percentage))}%`,
                      background: LINE_COLORS[share.line],
                    }}
                  />
                </div>
                <strong>{formatNumber(share.percentage, 0)}%</strong>
              </div>
            ))}
          </div>
          <p className="club-voronoi-reading">
            Bloque territorial principal:{' '}
            <strong>{LINE_LABELS[dominantLine.line]}</strong>. Carga sensible:{' '}
            <strong>{riskyCell.assignment.player.NOMBRE as string}</strong> (
            {riskyCell.assignment.slot.role}{' '}
            {formatNumber(riskyCell.assignment.rating, 0)}).
          </p>
        </aside>
      </div>
    </div>
  );
}

function ClubAnalysisHub({
  summary,
  summaries,
  onClose,
  onOpenPlayer,
}: {
  summary: ClubSummary;
  summaries: ClubSummary[];
  onClose: () => void;
  onOpenPlayer: (player: DerivedPlayer) => void;
}) {
  const [selectedRecommendationIndex, setSelectedRecommendationIndex] = useState(0);
  const profiles = useMemo(
    () => summaries.map((item) => buildAnalysisProfile(item)),
    [summaries],
  );
  const activeProfile =
    profiles.find((profile) => profile.summary.club === summary.club) ??
    buildAnalysisProfile(summary);
  const recommendations = useMemo(
    () => buildFormationRecommendations(activeProfile.roster),
    [activeProfile.roster],
  );
  const selectedRecommendation =
    recommendations[selectedRecommendationIndex] ?? recommendations[0];
  const overallRank = getRank(profiles, summary.club, (profile) => profile.overall);
  const attackRank = getRank(profiles, summary.club, (profile) => profile.attackIndex);
  const defenceRank = getRank(profiles, summary.club, (profile) => profile.defenceIndex);
  const balanceRank = getRank(profiles, summary.club, (profile) => profile.balanceIndex);
  const leagueBoard = [...profiles].sort((a, b) => b.overall - a.overall);
  const bestDimension = ANALYSIS_DIMENSIONS.reduce((best, dimension) =>
    activeProfile.dimensions[dimension.key] > activeProfile.dimensions[best.key]
      ? dimension
      : best,
  );
  const weakestDimension = ANALYSIS_DIMENSIONS.reduce((weakest, dimension) =>
    activeProfile.dimensions[dimension.key] < activeProfile.dimensions[weakest.key]
      ? dimension
      : weakest,
  );
  const shortTermPlayers = getRosterShortTermPlayers(activeProfile.roster);
  const percentile = getPercentile(
    profiles.map((profile) => profile.overall),
    activeProfile.overall,
  );
  const leagueAttackAverage = mean(profiles.map((profile) => profile.attackIndex));
  const leagueDefenceAverage = mean(profiles.map((profile) => profile.defenceIndex));
  const attackDelta = activeProfile.attackIndex - leagueAttackAverage;
  const defenceDelta = activeProfile.defenceIndex - leagueDefenceAverage;
  const familyComparisons = ANALYSIS_GROUP_ORDER.map((group) => {
    const value = getFamilyValue(activeProfile.dimensions, group);
    const leagueValue = getLeagueFamilyAverage(profiles, group);
    return {
      group,
      value,
      leagueValue,
      delta: value - leagueValue,
    };
  });
  const strongestFamily = familyComparisons.reduce((best, family) =>
    family.value > best.value ? family : best,
  );
  const bestFamilyDelta = familyComparisons.reduce((best, family) =>
    family.delta > best.delta ? family : best,
  );
  const weakestFamilyDelta = familyComparisons.reduce((weakest, family) =>
    family.delta < weakest.delta ? family : weakest,
  );
  const weakestFamily = familyComparisons.reduce((weakest, family) =>
    family.value < weakest.value ? family : weakest,
  );
  const rankingContext = getRankingContext(overallRank);
  const squadIdentity = getSquadIdentity(attackDelta, defenceDelta);
  const viableDepth = buildCriticalDepth(activeProfile.roster)
    .map((entry) => {
      const viablePlayers = entry.players.filter((item) => item.rating >= 75);
      return {
        position: entry.position,
        count: viablePlayers.length,
        bestRating: entry.players[0]?.rating ?? 0,
      };
    })
    .filter((entry) => entry.count < 2)
    .sort((a, b) => {
      if (a.count !== b.count) return a.count - b.count;
      return a.bestRating - b.bestRating;
    })
    .slice(0, 4);
  const criticalDepthText = viableDepth.length
    ? viableDepth
        .map((entry) => `${entry.position}: ${entry.count} jugadores +75`)
        .join(', ')
    : 'sin alertas con criterio +75';
  const topFivePlayerIds = new Set(
    sortByNumberField(activeProfile.roster, 'PROMEDIO')
      .slice(0, 5)
      .map((player) => String(player.ID)),
  );
  const selectedShortTermAssignments =
    selectedRecommendation?.assignments.filter((assignment) =>
      isShortTermPlayer(assignment.player),
    ) ?? [];
  const shortTermTopPlayers = shortTermPlayers.filter((player) =>
    topFivePlayerIds.has(String(player.ID)),
  );
  const dependencyText = selectedShortTermAssignments.length
    ? selectedShortTermAssignments
        .map(
          (assignment) =>
            `${assignment.player.NOMBRE as string} (${assignment.slot.role})`,
        )
        .join(', ')
    : shortTermTopPlayers.length
      ? `${shortTermTopPlayers
          .map((player) => String(player.NOMBRE ?? ''))
          .join(', ')} entre los mejores 5`
      : shortTermPlayers.length
        ? `${shortTermPlayers.map((player) => String(player.NOMBRE ?? '')).join(', ')} fuera del once sugerido`
        : 'sin contrato de una temporada detectado';
  const secondRecommendation = recommendations[1];
  const recommendationGap =
    selectedRecommendation && secondRecommendation
      ? selectedRecommendation.score - secondRecommendation.score
      : undefined;

  useEffect(() => {
    setSelectedRecommendationIndex(0);
  }, [summary.club]);

  return (
    <div className="club-analysis-overlay" role="dialog" aria-modal="true">
      <section className="club-analysis-hub">
        <header className="club-analysis-header">
          <div>
            <span>{CLUB_CURRENT_SEASON_LABEL}</span>
            <h2>Analisis - {summary.club}</h2>
            <p>Plantel analizado: {activeProfile.roster.length} jugadores</p>
          </div>
          <div className="club-analysis-kpi-grid">
            <AnalysisKpi
              label="Ranking ANFPES"
              value={`${overallRank}/32`}
              detail={`Percentil ${percentile}`}
              description="Posicion del club entre los 32 planteles segun promedio general del plantel actual."
            />
            <AnalysisKpi
              label="Indice ofensivo"
              value={`${attackRank}/32`}
              detail={formatNumber(activeProfile.attackIndex, 1)}
              description="Ranking por indice ofensivo, calculado desde dimensiones de ataque, conduccion, pase, remate y agresividad."
            />
            <AnalysisKpi
              label="Indice defensivo"
              value={`${defenceRank}/32`}
              detail={formatNumber(activeProfile.defenceIndex, 1)}
              description="Ranking por indice defensivo, calculado desde lectura defensiva, fisico, respuesta, mentalidad, porteria y trabajo colectivo."
            />
            <AnalysisKpi
              label="Balance"
              value={`${balanceRank}/32`}
              detail={formatNumber(activeProfile.balanceIndex, 1)}
              description="Ranking por promedio de todas las dimensiones usadas en el Radar de Stats."
            />
          </div>
          <EnhancedTooltip content="Cerrar analisis" placement="left">
            <button type="button" onClick={onClose} aria-label="Cerrar analisis">
              x
            </button>
          </EnhancedTooltip>
        </header>

        <div className="club-analysis-grid">
          <article className="club-analysis-card club-analysis-insights">
            <header>
              <h3>Lectura rapida</h3>
            </header>
            <p>
              Identidad: <strong>{squadIdentity}</strong>. Ranking{' '}
              <strong>{overallRank}/32</strong> ({rankingContext}, percentil{' '}
              <strong>{percentile}</strong>).
            </p>
            <p>
              Ataque <strong>{attackRank}/32</strong> ({formatSignedNumber(attackDelta)}{' '}
              vs liga). Defensa <strong>{defenceRank}/32</strong> (
              {formatSignedNumber(defenceDelta)} vs liga).
            </p>
            <p>
              Ventaja real:{' '}
              <strong>{ANALYSIS_GROUP_LABELS[bestFamilyDelta.group]}</strong>{' '}
              <strong>{formatSignedNumber(bestFamilyDelta.delta)}</strong>. Debilidad
              real: <strong>{ANALYSIS_GROUP_LABELS[weakestFamilyDelta.group]}</strong>{' '}
              <strong>{formatSignedNumber(weakestFamilyDelta.delta)}</strong>.
            </p>
            <p>
              Punto alto: <strong>{bestDimension.label}</strong>{' '}
              <strong>
                {formatNumber(activeProfile.dimensions[bestDimension.key], 1)}
              </strong>
              . Punto bajo: <strong>{weakestDimension.label}</strong>{' '}
              <strong>
                {formatNumber(activeProfile.dimensions[weakestDimension.key], 1)}
              </strong>
              .
            </p>
            <p>
              Familia mas alta:{' '}
              <strong>{ANALYSIS_GROUP_LABELS[strongestFamily.group]}</strong>{' '}
              <strong>{formatNumber(strongestFamily.value, 1)}</strong>. Familia mas baja:{' '}
              <strong>{ANALYSIS_GROUP_LABELS[weakestFamily.group]}</strong>{' '}
              <strong>{formatNumber(weakestFamily.value, 1)}</strong>.
            </p>
            {selectedRecommendation && (
              <p>
                Once sugerido: <strong>{selectedRecommendation.formationName}</strong>{' '}
                <strong>{formatNumber(selectedRecommendation.score, 1)}</strong>.
                {recommendationGap !== undefined && (
                  <>
                    {' '}
                    Margen sobre segunda opcion:{' '}
                    <strong>{formatSignedNumber(recommendationGap)}</strong>.
                  </>
                )}
              </p>
            )}
            <p>
              Profundidad critica: <strong>{criticalDepthText}</strong>.
            </p>
            <p>
              Contrato por 1 temporada: <strong>{dependencyText}</strong>.
            </p>
          </article>

          <article className="club-analysis-card club-formation-card">
            <header>
              <h3>Formaciones sugeridas</h3>
              <div className="club-formation-tabs">
                {recommendations.map((recommendation, index) => (
                  <EnhancedTooltip
                    key={recommendation.formationName}
                    content={`${recommendation.formationName} | Score ${formatNumber(
                      recommendation.score,
                      1,
                    )}`}
                    placement="top"
                  >
                    <button
                      type="button"
                      className={
                        index === selectedRecommendationIndex ? 'active' : undefined
                      }
                      onClick={() => setSelectedRecommendationIndex(index)}
                    >
                      <strong>{recommendation.formationName}</strong>
                      <span>{formatNumber(recommendation.score, 1)}</span>
                    </button>
                  </EnhancedTooltip>
                ))}
              </div>
            </header>
            {selectedRecommendation ? (
              <>
                <div className="club-formation-title">
                  <strong>{selectedRecommendation.formationName}</strong>
                  <span>Seleccion recomendada por encaje puesto/jugador</span>
                </div>
                <AnalysisLineupPitch
                  recommendation={selectedRecommendation}
                  club={summary.club}
                  onOpenPlayer={onOpenPlayer}
                />
              </>
            ) : (
              <p>No hay jugadores suficientes para sugerir una formacion.</p>
            )}
          </article>

          <article className="club-analysis-card club-ranking-card">
            <header>
              <h3>Promedios</h3>
              <span>Ranking general ANFPES</span>
            </header>
            <div className="club-ranking-list">
              {leagueBoard.map((profile, index) => (
                <div
                  key={profile.summary.club}
                  className={profile.summary.club === summary.club ? 'active' : undefined}
                >
                  <span>{index + 1}</span>
                  <strong>{profile.summary.club}</strong>
                  <RatingValue value={profile.overall} digits={1} />
                </div>
              ))}
            </div>
          </article>
          <FamilyComparisonPanel activeProfile={activeProfile} profiles={profiles} />
          <ClubAttributeRoseChart activeProfile={activeProfile} profiles={profiles} />
          <ClubScatterPlot activeProfile={activeProfile} profiles={profiles} />
          {selectedRecommendation && (
            <VoronoiPitch recommendation={selectedRecommendation} />
          )}
        </div>
      </section>
    </div>
  );
}

export function ClubModule() {
  const players = useCacheStore((state) => state.players);
  const status = useCacheStore((state) => state.status);
  const error = useCacheStore((state) => state.error);
  const selectedClub = useClubViewStore((state) => state.selectedClub);
  const setSelectedClub = useClubViewStore((state) => state.setSelectedClub);
  const addActivity = useActivityHistoryStore((state) => state.addActivity);
  const lineupsByClub = useClubLineupStore((state) => state.lineupsByClub);
  const captainsByClub = useClubLineupStore((state) => state.captainsByClub);
  const updateClubLineup = useClubLineupStore((state) => state.updateClubLineup);
  const setClubCaptain = useClubLineupStore((state) => state.setClubCaptain);
  const identity = useIdentityStore((state) => state.profile);
  const setActiveModule = useModuleStore((state) => state.setActiveModuleId);
  const setProfilePlayerId = usePlayerProfileStore((state) => state.setSelectedPlayerId);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'PROMEDIO',
    direction: 'desc',
  });
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [vsAnalysisOpen, setVsAnalysisOpen] = useState(false);

  const clubNames = useMemo(() => sortClubsAlphabetically(Array.from(ANFPES_CLUBS)), []);

  const summaries = useMemo(() => {
    if (!players) return [];
    return clubNames.map((club) => buildClubSummary(club, players));
  }, [clubNames, players]);

  const summariesByDivision = useMemo(
    () =>
      CLUBS_BY_DIVISION.map(({ division, clubs }) => ({
        division,
        summaries: clubs
          .map((club) => summaries.find((summary) => summary.club === club))
          .filter((summary): summary is ClubSummary => Boolean(summary)),
      })).filter((group) => group.summaries.length > 0),
    [summaries],
  );

  const activeSummary =
    selectedClub && ANFPES_CLUBS.has(selectedClub)
      ? summaries.find((summary) => summary.club === selectedClub)
      : undefined;

  const sortedRoster = useMemo(() => {
    if (!activeSummary) return [];
    return sortRoster(activeSummary.roster, sortConfig);
  }, [activeSummary, sortConfig]);

  const macroLeaders = useMemo(() => {
    if (!activeSummary) return [];
    return MACRO_FIELDS.map((field) => ({
      field,
      label: MACRO_LABELS[field],
      player: sortByNumberField(activeSummary.roster, field)[0],
    })).filter((entry) => entry.player);
  }, [activeSummary]);

  const bestPlayer = useMemo(() => {
    if (!activeSummary) return undefined;
    return sortByNumberField(activeSummary.roster, 'PROMEDIO')[0];
  }, [activeSummary]);

  const rosterByName = useMemo(() => {
    if (!activeSummary) return [];
    return [...activeSummary.roster].sort((a, b) =>
      String(a.NOMBRE ?? '').localeCompare(String(b.NOMBRE ?? ''), 'es', {
        sensitivity: 'base',
      }),
    );
  }, [activeSummary]);

  const activeCaptainId = activeSummary ? captainsByClub[activeSummary.club] : undefined;
  const activeCaptain = activeSummary
    ? findRosterPlayer(activeSummary.roster, activeCaptainId)
    : undefined;

  const setActiveCaptain = (playerId: string) => {
    if (!activeSummary) return;
    setClubCaptain(activeSummary.club, playerId || null);
  };

  const chooseClub = (club: string) => {
    setSelectedClub(club);
    setSelectorOpen(false);
    setAnalysisOpen(false);
    setVsAnalysisOpen(false);
  };

  const openPlayerProfile = (player: DerivedPlayer) => {
    setProfilePlayerId(String(player.ID));
    setActiveModule(MODULE_IDS.profile);
  };

  const handleSort = (key: SortKey) => {
    setSortConfig((current) => {
      if (current.key !== key) {
        return { key, direction: key === 'NOMBRE' ? 'asc' : 'desc' };
      }
      return {
        key,
        direction: current.direction === 'asc' ? 'desc' : 'asc',
      };
    });
  };

  const sortIndicator = (key: SortKey) => {
    if (sortConfig.key !== key) return '';
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  const activeLineup: ClubLineupConfig = activeSummary
    ? (lineupsByClub[activeSummary.club] ?? createEmptyClubLineup())
    : createEmptyClubLineup();

  const identityClub = identity?.club;
  const identitySummary =
    typeof identityClub === 'string'
      ? summaries.find((summary) => summary.club === identityClub)
      : undefined;
  const identityLineup =
    typeof identityClub === 'string' ? lineupsByClub[identityClub] : undefined;
  const canOpenVsAnalysis = Boolean(
    activeSummary &&
      identitySummary &&
      identityClub !== activeSummary.club &&
      isResolvedLineupConfigured(identitySummary, identityLineup) &&
      isResolvedLineupConfigured(activeSummary, activeLineup),
  );

  useEffect(() => {
    if (!canOpenVsAnalysis && vsAnalysisOpen) {
      setVsAnalysisOpen(false);
    }
  }, [canOpenVsAnalysis, vsAnalysisOpen]);

  useEffect(() => {
    if (!activeSummary) return;
    addActivity({
      type: 'club',
      clubName: activeSummary.club,
      details: activeSummary.manager
        ? `DT: ${activeSummary.manager}`
        : activeSummary.division,
      metadata: {
        club: activeSummary.club,
        division: activeSummary.division,
        manager: activeSummary.manager,
      },
    });
  }, [activeSummary?.club, activeSummary?.division, activeSummary?.manager, addActivity]);

  const updateActiveLineup = (
    updater: (lineup: ClubLineupConfig) => ClubLineupConfig,
  ) => {
    if (!activeSummary) return;
    updateClubLineup(activeSummary.club, updater);
  };

  const handleFormationChange = (formationName: string | null) => {
    updateActiveLineup((lineup) => {
      const validSlotIds = new Set(
        formationName ? FORMATIONS[formationName]?.map((slot) => slot.slotId) : [],
      );
      const nextPlayersBySlot = Object.fromEntries(
        Object.entries(lineup.playersBySlot).filter(([slotId]) =>
          validSlotIds.has(slotId),
        ),
      );

      return {
        formationName,
        playersBySlot: formationName ? nextPlayersBySlot : {},
      };
    });
  };

  const handleSlotPlayerChange = (slotId: string, playerId: string) => {
    updateActiveLineup((lineup) => ({
      ...lineup,
      playersBySlot: {
        ...lineup.playersBySlot,
        [slotId]: playerId,
      },
    }));
  };

  const clearActiveLineup = () => {
    updateActiveLineup(() => ({
      formationName: null,
      playersBySlot: {},
    }));
  };

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="club-module">
        <div className="club-module-state">Cargando clubes...</div>
      </div>
    );
  }

  if (error || !players) {
    return (
      <div className="club-module">
        <div className="club-module-state error">
          {error
            ? `Error al cargar clubes: ${error}`
            : 'No hay datos de clubes disponibles.'}
        </div>
      </div>
    );
  }

  if (!activeSummary) {
    return (
      <div className="club-module">
        <section className="club-selector-screen">
          {summariesByDivision.map(({ division, summaries: divisionSummaries }) => (
            <section key={division} className="club-selector-division">
              <header>
                <h2>{division}</h2>
                <span>{divisionSummaries.length} clubes</span>
              </header>
              <div className="club-selector-grid">
                {divisionSummaries.map((summary) => {
                  const shield = getClubShieldPath(summary.club);
                  const colors = getClubColors(summary.club);
                  const details = getClubDetails(summary.club);
                  return (
                    <button
                      key={summary.club}
                      type="button"
                      className="club-selector-card"
                      onClick={() => chooseClub(summary.club)}
                      style={
                        {
                          '--club-primary': colors.primary,
                          '--club-secondary': colors.secondary,
                        } as CSSProperties
                      }
                    >
                      <span className="club-selector-shield">
                        {shield ? <img src={shield} alt="" /> : getInitials(summary.club)}
                      </span>
                      <strong>{summary.club}</strong>
                      <em>{details.fullName}</em>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </section>
      </div>
    );
  }

  const clubColors = getClubColors(activeSummary.club);
  const clubShield = getClubShieldPath(activeSummary.club);
  const clubDetails = getClubDetails(activeSummary.club);
  const countryFlag = getFlagImagePath(clubDetails.country);
  const frontKits = getClubFrontKitImages(activeSummary.club);
  const averageColor = getStatColor(activeSummary.average);

  return (
    <div className="club-module">
      <main className="club-content">
        <section
          className="club-hero"
          style={
            {
              '--club-primary': clubColors.primary,
              '--club-secondary': clubColors.secondary,
            } as CSSProperties
          }
        >
          <div className="club-hero-identity">
            <button
              type="button"
              className="club-title-button"
              onClick={() => setSelectorOpen((value) => !value)}
            >
              <span className="club-hero-shield">
                {clubShield ? (
                  <img src={clubShield} alt="" />
                ) : (
                  getInitials(activeSummary.club)
                )}
              </span>
              <span className="club-title-text">
                <span className="club-season-label">{CLUB_CURRENT_SEASON_LABEL}</span>
                <span className="club-game-name">{activeSummary.club}</span>
                <em>{clubDetails.fullName}</em>
                <span className="club-title-metrics">
                  <span>{formatNumber(activeSummary.averageAge, 1)} Edad Promedio</span>
                  <span>{activeSummary.nationalCount} Seleccionados</span>
                  <span>{activeSummary.legendCount} Leyendas</span>
                  <span>{activeSummary.mlCount} ML</span>
                </span>
              </span>
            </button>

            {selectorOpen && (
              <div className="club-switcher-menu">
                {summaries.map((summary) => {
                  const shield = getClubShieldPath(summary.club);
                  return (
                    <button
                      key={summary.club}
                      type="button"
                      className={
                        summary.club === activeSummary.club ? 'active' : undefined
                      }
                      onClick={() => chooseClub(summary.club)}
                    >
                      <span>
                        {shield ? <img src={shield} alt="" /> : getInitials(summary.club)}
                      </span>
                      <strong>{summary.club}</strong>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="club-competition-chips">
            {activeSummary.division && (
              <span className="club-division-chip">{activeSummary.division}</span>
            )}
            {activeSummary.manager && (
              <span className="club-manager-chip">
                <small>DT</small>
                {activeSummary.manager}
              </span>
            )}
            <button
              type="button"
              className="club-analysis-button"
              onClick={() => setAnalysisOpen(true)}
            >
              Analisis
            </button>
          </div>

          <div className="club-hero-rating">
            <EnhancedTooltip
              content={`Promedio del plantel: ${formatNumber(activeSummary.average, 1)}`}
              placement="top"
            >
              <div
                className="player-average club-average"
                style={{ color: averageColor ?? '#ffd166' }}
              >
                {formatNumber(activeSummary.average, 1)}
              </div>
            </EnhancedTooltip>
            {countryFlag && (
              <EnhancedTooltip content={clubDetails.country} placement="top">
                <img
                  src={countryFlag}
                  alt={clubDetails.country}
                  className="flag club-country-flag"
                />
              </EnhancedTooltip>
            )}
          </div>

          <div className="club-front-kit-slot">
            {frontKits ? (
              <div className="club-front-kit-pair">
                <figure>
                  <img src={frontKits.home.path} alt={`${activeSummary.club} local`} />
                </figure>
                <figure>
                  <img src={frontKits.away.path} alt={`${activeSummary.club} visita`} />
                </figure>
              </div>
            ) : (
              <>
                <div className="club-front-kit-shape">
                  <span>{getInitials(activeSummary.club)}</span>
                </div>
                <small>Camiseta frontal pendiente</small>
              </>
            )}
          </div>

          <EnhancedTooltip
            content="Cerrar club"
            placement="left"
            className="club-clear-tooltip"
          >
            <button
              type="button"
              className="club-clear-button"
              aria-label="Cerrar club"
              onClick={() => {
                setSelectedClub(null);
                setSelectorOpen(false);
                setAnalysisOpen(false);
                setVsAnalysisOpen(false);
              }}
            >
              ×
            </button>
          </EnhancedTooltip>
        </section>

        <section className="club-main-grid">
          <OpponentLineupPitch
            summary={activeSummary}
            lineup={activeLineup}
            onFormationChange={handleFormationChange}
            onSlotPlayerChange={handleSlotPlayerChange}
            onClear={clearActiveLineup}
            canOpenVsAnalysis={canOpenVsAnalysis}
            onOpenVsAnalysis={() => setVsAnalysisOpen(true)}
            vsClub={identitySummary?.club}
          />

          <PositionDepthPanel summary={activeSummary} onOpenPlayer={openPlayerProfile} />

          <article className="club-panel club-leaders-panel">
            <header>
              <h3>Lideres del plantel</h3>
            </header>
            <div className="club-featured-grid">
              <ClubFeaturedPlayerCard
                label="Mejor jugador"
                player={bestPlayer}
                club={activeSummary.club}
                onOpenPlayer={openPlayerProfile}
              />
              <ClubFeaturedPlayerCard
                label="Capitan"
                player={activeCaptain}
                club={activeSummary.club}
                onOpenPlayer={openPlayerProfile}
                selector={
                  <select
                    value={activeCaptainId ?? ''}
                    onChange={(event) => setActiveCaptain(event.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    {rosterByName.map((player) => (
                      <option key={String(player.ID)} value={String(player.ID)}>
                        {player.NOMBRE as string}
                      </option>
                    ))}
                  </select>
                }
              />
            </div>
            <div className="club-leaders-list">
              {macroLeaders.map(({ field, label, player }) => (
                <button
                  key={field}
                  type="button"
                  className="club-leader-row"
                  onClick={() => openPlayerProfile(player)}
                >
                  <span>{label}</span>
                  <strong>{player.NOMBRE}</strong>
                  <StatValue value={player[field]} />
                </button>
              ))}
            </div>
          </article>
        </section>

        <section className="club-panel club-roster-panel">
          <header>
            <h3>Plantel actual</h3>
            <span>{activeSummary.rosterCount} jugadores</span>
          </header>
          <div className="club-roster-table-wrap">
            <table className="club-roster-table">
              <thead>
                <tr>
                  <th>
                    <button type="button" onClick={() => handleSort('DORSAL')}>
                      <EnhancedTooltip content="Ordenar por dorsal" placement="top">
                        <span>#{sortIndicator('DORSAL')}</span>
                      </EnhancedTooltip>
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('NOMBRE')}>
                      <EnhancedTooltip content="Ordenar por jugador" placement="top">
                        <span>Jugador{sortIndicator('NOMBRE')}</span>
                      </EnhancedTooltip>
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('POSICIONES')}>
                      <EnhancedTooltip
                        content="Ordenar por posicion principal"
                        placement="top"
                      >
                        <span>Posiciones{sortIndicator('POSICIONES')}</span>
                      </EnhancedTooltip>
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('EDAD')}>
                      <EnhancedTooltip content="Ordenar por edad" placement="top">
                        <span>Edad{sortIndicator('EDAD')}</span>
                      </EnhancedTooltip>
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('NACIONALIDAD')}>
                      <EnhancedTooltip content="Ordenar por nacionalidad" placement="top">
                        <span>Nac.{sortIndicator('NACIONALIDAD')}</span>
                      </EnhancedTooltip>
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('PROMEDIO')}>
                      <EnhancedTooltip content="Ordenar por promedio" placement="top">
                        <span>Prom.{sortIndicator('PROMEDIO')}</span>
                      </EnhancedTooltip>
                    </button>
                  </th>
                  {MACRO_FIELDS.map((field) => (
                    <th key={field}>
                      <button type="button" onClick={() => handleSort(field)}>
                        <EnhancedTooltip
                          content={`Ordenar por ${MACRO_LABELS[field]}`}
                          placement="top"
                        >
                          <span>
                            {field}
                            {sortIndicator(field)}
                          </span>
                        </EnhancedTooltip>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRoster.map((player) => {
                  const rawNationality = player.NACIONALIDAD as string;
                  const flagPath = getFlagImagePath(rawNationality);
                  const thumbPath = getPlayerThumbPath(player.ID);
                  const legend = isLegendPlayer(player);
                  return (
                    <tr key={String(player.ID)} onClick={() => openPlayerProfile(player)}>
                      <td>{formatPlayerValue(player.DORSAL, 0)}</td>
                      <td>
                        <div className="club-player-cell">
                          <img
                            src={thumbPath}
                            alt=""
                            className="player-thumb"
                            onError={(event) => {
                              event.currentTarget.src = legend
                                ? '/images/thumbs/Legend.png'
                                : '/images/thumbs/missing.png';
                            }}
                          />
                          <span className="club-player-name-wrap">
                            <EnhancedTooltip
                              content={String(player.NOMBRE ?? '')}
                              placement="top"
                            >
                              <strong>{player.NOMBRE}</strong>
                            </EnhancedTooltip>
                            <PlayerStatusBadges player={player} />
                          </span>
                        </div>
                      </td>
                      <td>
                        <PositionBadges player={player} maxVisible={3} />
                      </td>
                      <td>{formatPlayerValue(player.EDAD, 0)}</td>
                      <td>
                        {flagPath ? (
                          <EnhancedTooltip
                            content={formatNationality(rawNationality)}
                            placement="top"
                          >
                            <img
                              src={flagPath}
                              alt={formatNationality(rawNationality)}
                              className="flag-icon"
                            />
                          </EnhancedTooltip>
                        ) : (
                          formatNationality(rawNationality)
                        )}
                      </td>
                      <td>
                        <StatValue value={player.PROMEDIO} />
                      </td>
                      {MACRO_FIELDS.map((field) => (
                        <td key={field}>
                          <StatValue value={player[field]} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {analysisOpen && (
          <ClubAnalysisHub
            summary={activeSummary}
            summaries={summaries}
            onClose={() => setAnalysisOpen(false)}
            onOpenPlayer={openPlayerProfile}
          />
        )}
        {vsAnalysisOpen && canOpenVsAnalysis && identitySummary && identityLineup && (
          <ClubVsAnalysisOverlay
            ownSummary={identitySummary}
            opponentSummary={activeSummary}
            ownLineup={identityLineup}
            opponentLineup={activeLineup}
            onClose={() => setVsAnalysisOpen(false)}
          />
        )}
      </main>
    </div>
  );
}
