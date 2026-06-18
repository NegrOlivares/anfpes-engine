import type { DerivedPlayer } from '@anfpes/engine';
import type { CSSProperties, ReactNode } from 'react';
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

interface ClubLineupConfig {
  formationName: string | null;
  playersBySlot: Record<string, string>;
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

const MACRO_FIELDS: MacroField[] = ['ATK', 'TEC', 'RES', 'DEF', 'FUE', 'VEL'];
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
    shortTermPlayer: competitionDetails?.shortTermPlayer,
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
        <span className={`position-badge primary position-${line}`}>
          {primaryPosition}
        </span>
      )}
      <RatingValue value={average} />
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
}

function OpponentLineupPitch({
  summary,
  lineup,
  onFormationChange,
  onSlotPlayerChange,
  onClear,
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

export function ClubModule() {
  const players = useCacheStore((state) => state.players);
  const status = useCacheStore((state) => state.status);
  const error = useCacheStore((state) => state.error);
  const selectedClub = useClubViewStore((state) => state.selectedClub);
  const setSelectedClub = useClubViewStore((state) => state.setSelectedClub);
  const setActiveModule = useModuleStore((state) => state.setActiveModuleId);
  const setProfilePlayerId = usePlayerProfileStore((state) => state.setSelectedPlayerId);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'PROMEDIO',
    direction: 'desc',
  });
  const [lineupsByClub, setLineupsByClub] = useState<Record<string, ClubLineupConfig>>(
    {},
  );
  const [captainsByClub, setCaptainsByClub] = useState<Record<string, string>>({});

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
    setCaptainsByClub((current) => ({
      ...current,
      [activeSummary.club]: playerId,
    }));
  };

  const chooseClub = (club: string) => {
    setSelectedClub(club);
    setSelectorOpen(false);
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
    ? (lineupsByClub[activeSummary.club] ?? {
        formationName: null,
        playersBySlot: {},
      })
    : {
        formationName: null,
        playersBySlot: {},
      };

  const updateActiveLineup = (
    updater: (lineup: ClubLineupConfig) => ClubLineupConfig,
  ) => {
    if (!activeSummary) return;
    setLineupsByClub((current) => {
      const previous = current[activeSummary.club] ?? {
        formationName: null,
        playersBySlot: {},
      };
      return {
        ...current,
        [activeSummary.club]: updater(previous),
      };
    });
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
                  <span>Edad media {formatNumber(activeSummary.averageAge, 1)}</span>
                  <span>Seleccionados {activeSummary.nationalCount}</span>
                  <span>Leyendas {activeSummary.legendCount}</span>
                  <span>ML {activeSummary.mlCount}</span>
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
          </div>

          <div className="club-hero-rating">
            <div
              className="player-average club-average"
              style={{ color: averageColor ?? '#ffd166' }}
            >
              {formatNumber(activeSummary.average, 1)}
            </div>
            {countryFlag && (
              <img
                src={countryFlag}
                alt={clubDetails.country}
                className="flag club-country-flag"
              />
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

          <button
            type="button"
            className="club-clear-button"
            aria-label="Cerrar club"
            onClick={() => {
              setSelectedClub(null);
              setSelectorOpen(false);
            }}
          >
            ×
          </button>
        </section>

        <section className="club-main-grid">
          <OpponentLineupPitch
            summary={activeSummary}
            lineup={activeLineup}
            onFormationChange={handleFormationChange}
            onSlotPlayerChange={handleSlotPlayerChange}
            onClear={clearActiveLineup}
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
                      #{sortIndicator('DORSAL')}
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('NOMBRE')}>
                      Jugador{sortIndicator('NOMBRE')}
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('POSICIONES')}>
                      Posiciones{sortIndicator('POSICIONES')}
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('EDAD')}>
                      Edad{sortIndicator('EDAD')}
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('NACIONALIDAD')}>
                      Nac.{sortIndicator('NACIONALIDAD')}
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('PROMEDIO')}>
                      Prom.{sortIndicator('PROMEDIO')}
                    </button>
                  </th>
                  {MACRO_FIELDS.map((field) => (
                    <th key={field}>
                      <button type="button" onClick={() => handleSort(field)}>
                        {field}
                        {sortIndicator(field)}
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
                            <strong>{player.NOMBRE}</strong>
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
                          <img
                            src={flagPath}
                            alt={formatNationality(rawNationality)}
                            className="flag-icon"
                            title={formatNationality(rawNationality)}
                          />
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
      </main>
    </div>
  );
}
