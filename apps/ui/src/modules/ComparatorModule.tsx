import {
  useMemo,
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
} from 'react';
import type { CSSProperties } from 'react';
import type { DerivedPlayer } from '@anfpes/engine';
import { useCacheStore } from '../store/cacheStore';
import { RadarChart } from '../components/RadarChart';
import { GlossaryTooltip } from '../components/GlossaryTooltip';
import { EnhancedTooltip } from '../components/EnhancedTooltip';
import { GLOSSARY_DATA } from '../data/glossary';
import type { RadarChartDataset } from '../components/RadarChart';
import { FAV_SIDE_FIELD, INJURY_FIELD, FITNESS_FIELD } from '../constants/playerFields';
import {
  formatClub,
  formatFoot,
  formatNationality,
  formatSelectionDisplay,
  getFieldLabel,
  SPECIAL_SKILL_FIELDS,
} from '../utils/playerDisplay';
import { ensureNumber, formatPlayerValue } from '../utils/format';
import {
  getPlayerPositions,
  getPositionLine,
  getPositionFullName,
} from '../components/PositionBadges';
import { ANFPES_CLUBS, LEGEND_PLAYERS, ML_PLAYERS } from '../data/playerStatus';
import {
  getFlagImagePath,
  getClubShieldPath,
  getPlayerThumbPath,
} from '../utils/imageHelpers';
import { getNationalityInfo } from '../data/nationalities';
import profileAddons from '../data/profileAddons';
import type { ProfileAddon } from '../data/profileAddons';
import { getStatColor, getInjuryColor } from '../types/table';
import { useComparatorLaunchStore } from '../store/comparatorLaunchStore';
import { openPlayerActionsMenu } from '../components/PlayerActionsOverlay';
import {
  POSITION_HIGHLIGHTS,
  type PositionHighlightId,
} from '../constants/positionHighlights';
import {
  applyFormMultiplier,
  DEFAULT_FORM_STATE,
  FORM_MULTIPLIERS,
  FORM_STATES,
  type FormStateId,
} from '../data/formModifiers';

const MAX_PLAYERS = 4;
const COLOR_PALETTE = ['#04b7d6ff', '#fc2626ff', '#f78c00ff', '#16c450ff'];
const MACRO_FIELDS: Array<keyof DerivedPlayer> = [
  'ATK',
  'TEC',
  'RES',
  'DEF',
  'FUE',
  'VEL',
];
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

const NATIONAL_SELECTION_FIELD = 'nro selección' as keyof DerivedPlayer;

const DEMARCATION_COLUMNS = [
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

const DEMARCATION_TRANSLATION: Record<string, string> = {
  GK: 'PT',
  SWP: 'LIB',
  CB: 'CT',
  SB: 'SA',
  RB: 'DD',
  LB: 'DI',
  DMF: 'CCD',
  WB: 'LA',
  RWB: 'DLD',
  LWB: 'DLI',
  CMF: 'CC',
  SMF: 'VOL',
  RMF: 'CDR',
  LMF: 'CIZ',
  AMF: 'MP',
  WF: 'EX',
  RWF: 'ED',
  LWF: 'EI',
  SS: 'SD',
  CF: 'DC',
};

type PositionCellConfig = {
  label: string;
  valueKey: keyof DerivedPlayer;
  row: number;
  col: number;
  rowSpan?: number;
  colSpan?: number;
};

const POSITION_FIELD_CELLS: PositionCellConfig[] = [
  { label: 'EI', valueKey: 'EX', row: 1, col: 1, rowSpan: 2 },
  { label: 'DC', valueKey: 'DC', row: 1, col: 2 },
  { label: 'SD', valueKey: 'SD', row: 2, col: 2 },
  { label: 'ED', valueKey: 'EX', row: 1, col: 3, rowSpan: 2 },
  { label: 'CIZ', valueKey: 'VOL', row: 3, col: 1, rowSpan: 2 },
  { label: 'MP', valueKey: 'MP', row: 3, col: 2 },
  { label: 'CC', valueKey: 'CC', row: 4, col: 2 },
  { label: 'CDR', valueKey: 'VOL', row: 3, col: 3, rowSpan: 2 },
  { label: 'DLI', valueKey: 'LA', row: 5, col: 1, rowSpan: 2 },
  { label: 'CCD', valueKey: 'CCD', row: 5, col: 2 },
  { label: 'CT', valueKey: 'CT', row: 6, col: 2 },
  { label: 'DLD', valueKey: 'LA', row: 5, col: 3, rowSpan: 2 },
  { label: 'DI', valueKey: 'SA', row: 7, col: 1, rowSpan: 2 },
  { label: 'LIB', valueKey: 'LIB', row: 7, col: 2 },
  { label: 'PT', valueKey: 'PT', row: 8, col: 2 },
  { label: 'DD', valueKey: 'SA', row: 7, col: 3, rowSpan: 2 },
];

const POSITION_CELL_ALIASES: Record<string, string[]> = {
  EX: ['EI', 'ED'],
  EI: ['EI'],
  ED: ['ED'],
  VOL: ['CIZ', 'CDR'],
  CIZ: ['CIZ'],
  CDR: ['CDR'],
  LA: ['DLI', 'DLD'],
  DLI: ['DLI'],
  DLD: ['DLD'],
  SA: ['DI', 'DD'],
  DI: ['DI'],
  DD: ['DD'],
  LIB: ['LIB'],
  CT: ['CT'],
  CCD: ['CCD'],
  CC: ['CC'],
  MP: ['MP'],
  SD: ['SD'],
  DC: ['DC'],
  PT: ['PT'],
};

const POSITION_CELL_SET = new Set(
  POSITION_FIELD_CELLS.map((cell) => cell.label.toUpperCase()),
);

const POSITION_NAME_MAP: Record<string, string> = {
  PT: 'Portero',
  LIB: 'Líbero',
  DI: 'Defensa Izquierdo',
  DD: 'Defensa Derecho',
  CT: 'Defensa Central',
  CCD: 'Centrocampista Defensivo',
  DLI: 'Defensa Lateral Izquierdo',
  DLD: 'Defensa Lateral Derecho',
  CC: 'Centrocampista',
  MP: 'Mediapunta',
  CIZ: 'Centrocampista Izquierdo',
  CDR: 'Centrocampista Derecho',
  SD: 'Segundo Delantero',
  DC: 'Delantero Centro',
  EI: 'Extremo Izquierdo',
  ED: 'Extremo Derecho',
};

const DETAIL_FIELDS: Array<keyof DerivedPlayer> = [
  'ALTURA',
  'PESO',
  'EDAD',
  'PIE',
  FAV_SIDE_FIELD,
  INJURY_FIELD,
  'CONSISTENCIA',
  FITNESS_FIELD,
  'PRECICIÓN PIE MALO' as keyof DerivedPlayer,
  'FRECUENCIA PIE MALO' as keyof DerivedPlayer,
];

const SCALE_DETAIL_FIELDS = new Set<keyof DerivedPlayer>([
  'CONSISTENCIA',
  FITNESS_FIELD,
  'PRECICIÓN PIE MALO' as keyof DerivedPlayer,
  'FRECUENCIA PIE MALO' as keyof DerivedPlayer,
]);

interface StatusBadge {
  key: string;
  label: string;
  className: string;
  title: string;
  glossaryId?: string;
}

const STATUS_BADGES: StatusBadge[] = [
  {
    key: 'national',
    label: '🌍',
    className: 'badge',
    title: 'Seleccionado Nacional',
    glossaryId: 'seleccionado-nacional',
  },
  {
    key: 'legend',
    label: '★',
    className: 'badge legend',
    title: 'Jugador Leyenda',
    glossaryId: 'leyenda',
  },
  {
    key: 'ml',
    label: 'ML',
    className: 'badge ml',
    title: 'Jugador ML',
    glossaryId: 'master-league',
  },
  {
    key: 'anfpes',
    label: 'ANFPES',
    className: 'badge anfpes',
    title: 'Afiliado a la ANFPES',
    glossaryId: 'anfpes',
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

function getPlayerColor(index: number): string {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
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
    players.find((player) => {
      const addon = (profileAddons as Record<string, ProfileAddon>)[String(player.ID)];
      return addon?.fullName ? normalize(addon.fullName).includes(normalized) : false;
    }) ??
    players.find((player) => normalize(String(player.CLUB ?? '')).includes(normalized))
  );
}

export function ComparatorModule() {
  const players = useCacheStore((state) => state.players);
  const status = useCacheStore((state) => state.status);
  const error = useCacheStore((state) => state.error);
  const loading = status === 'idle' || status === 'loading';
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [gridColumns, setGridColumns] = useState(1);
  const suggestionsGridRef = useRef<HTMLDivElement>(null);

  // All state from store
  const query = useComparatorLaunchStore((state) => state.query);
  const setQuery = useComparatorLaunchStore((state) => state.setQuery);
  const lookupError = useComparatorLaunchStore((state) => state.lookupError);
  const setLookupError = useComparatorLaunchStore((state) => state.setLookupError);
  const selectedIds = useComparatorLaunchStore((state) => state.selectedIds);
  const setSelectedIds = useComparatorLaunchStore((state) => state.setSelectedIds);
  const formById = useComparatorLaunchStore((state) => state.formById);
  const setFormById = useComparatorLaunchStore((state) => state.setFormById);
  const pendingComparatorId = useComparatorLaunchStore((state) => state.pendingId);
  const consumeComparatorPending = useComparatorLaunchStore(
    (state) => state.consumePending,
  );

  const selectedPlayers = useMemo(() => {
    if (!players) return [];
    return selectedIds
      .map((id) => players.find((player) => String(player.ID) === id))
      .filter((player): player is DerivedPlayer => Boolean(player));
  }, [selectedIds, players]);

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
        const addon = (profileAddons as Record<string, ProfileAddon>)[String(player.ID)];
        const fullName = addon?.fullName ? normalize(addon.fullName) : '';
        return (
          name.includes(normalized) ||
          id.includes(normalized) ||
          club.includes(normalized) ||
          fullName.includes(normalized)
        );
      })
      .slice(0, 8);
  }, [players, query]);

  useEffect(() => {
    setSelectedSuggestionIndex(-1);
  }, [query]);

  const showSuggestions = Boolean(query.trim() && suggestions.length > 0);
  const showSelector = Boolean(lookupError || showSuggestions);

  useLayoutEffect(() => {
    if (!showSuggestions || !suggestionsGridRef.current) return;

    const calculateColumns = () => {
      const grid = suggestionsGridRef.current;
      if (!grid) return;

      const buttons = grid.querySelectorAll('.suggestion-button');
      if (buttons.length === 0) return;

      // Get the top position of the first element
      const firstTop = buttons[0].getBoundingClientRect().top;

      // Count how many elements are on the same row
      let cols = 0;
      for (const button of buttons) {
        if (button.getBoundingClientRect().top === firstTop) {
          cols++;
        } else {
          break;
        }
      }

      setGridColumns(cols > 0 ? cols : 1);
    };

    calculateColumns();
    window.addEventListener('resize', calculateColumns);
    return () => window.removeEventListener('resize', calculateColumns);
  }, [showSuggestions, suggestions]);

  const statsRows = useMemo(() => {
    return CORE_STATS.map((field) => ({
      field,
      label: getFieldLabel(field as string),
      values: selectedPlayers.map((player) => {
        const formState = formById[String(player.ID)] ?? DEFAULT_FORM_STATE;
        const baseValue = ensureNumber(player[field]);
        return applyFormMultiplier(baseValue, field as any, formState);
      }),
    }));
  }, [selectedPlayers, formById]);

  useEffect(() => {
    if (!pendingComparatorId || !players) return;
    const exists = players.some((p) => String(p.ID) === String(pendingComparatorId));
    if (!exists) {
      consumeComparatorPending();
      return;
    }
    setSelectedIds((current) => {
      if (current.includes(String(pendingComparatorId))) return current;
      return [String(pendingComparatorId), ...current].slice(0, MAX_PLAYERS);
    });
    consumeComparatorPending();
  }, [pendingComparatorId, players, consumeComparatorPending]);

  const computeMacrosWithForm = useCallback(
    (player: DerivedPlayer, formState: FormStateId) => {
      const get = (key: keyof DerivedPlayer | string) =>
        applyFormMultiplier(
          ensureNumber((player as any)[key]),
          key as string,
          formState,
        ) ?? 0;
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
    },
    [],
  );

  const macroDatasets = useMemo(() => {
    return selectedPlayers.map((player, index) => {
      const formState = formById[String(player.ID)] ?? DEFAULT_FORM_STATE;
      const macros = computeMacrosWithForm(player, formState);
      return {
        id: String(player.ID),
        label: player.NOMBRE as string,
        values: MACRO_FIELDS.map((field) => (macros as any)[field] ?? 0),
        color: getPlayerColor(index),
        fillOpacity: selectedPlayers.length > 2 ? 0.08 : 0.2,
      };
    });
  }, [selectedPlayers, formById, computeMacrosWithForm]);

  const duelMode = selectedPlayers.length <= 2;

  const handleChangeForm = useCallback((playerId: string, form: FormStateId) => {
    setFormById((prev) => ({ ...prev, [playerId]: form }));
  }, []);

  // Detectar si algún header tiene wrap y aplicar clase a todos
  useLayoutEffect(() => {
    if (selectedPlayers.length === 0) return;

    const checkWrap = () => {
      const headers = document.querySelectorAll('.comparator-module .player-card-header');
      if (headers.length === 0) return;

      let anyHasWrap = false;

      headers.forEach((header) => {
        const identityHeader = header.querySelector('.player-identity-header');
        if (identityHeader && identityHeader.clientHeight > 40) {
          anyHasWrap = true;
          console.log('🔍 Wrap detectado:', {
            headerClasses: header.className,
            identityHeight: identityHeader.clientHeight,
          });
        }
      });

      console.log('🎯 anyHasWrap:', anyHasWrap, 'headers:', headers.length);

      headers.forEach((header) => {
        if (anyHasWrap) {
          header.classList.add('has-wrap');
        } else {
          header.classList.remove('has-wrap');
        }
      });
    };

    setTimeout(checkWrap, 0);

    const observer = new ResizeObserver(checkWrap);
    const headers = document.querySelectorAll('.comparator-module .player-card-header');
    headers.forEach((h) => observer.observe(h));

    return () => observer.disconnect();
  }, [selectedPlayers]);

  const handleAddPlayer = (player: DerivedPlayer | undefined) => {
    if (!player) {
      setLookupError('No encontramos un jugador con ese criterio');
      return;
    }
    setLookupError('');
    setQuery('');
    setSelectedIds((current) => {
      if (current.includes(String(player.ID)) || current.length >= MAX_PLAYERS) {
        return current;
      }
      return [...current, String(player.ID)];
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!players) return;
    const candidate = findPlayerByQuery(players, query);
    handleAddPlayer(candidate);
  };

  const handleRemovePlayer = (id: string) => {
    setSelectedIds((current) => current.filter((playerId) => playerId !== id));
    setFormById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleClear = () => {
    setSelectedIds([]);
    setLookupError('');
    setFormById({});
  };

  const handleSwap = () => {
    setSelectedIds((current) => {
      if (current.length !== 2) return current;
      return [current[1], current[0]];
    });
  };

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (suggestions.length === 0) return;

      const cols = gridColumns;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedSuggestionIndex((prev) => {
          const nextIndex = prev + cols;
          return nextIndex < suggestions.length ? nextIndex : prev;
        });
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedSuggestionIndex((prev) => {
          if (prev === -1) return suggestions.length - 1;
          const nextIndex = prev - cols;
          return nextIndex >= 0 ? nextIndex : -1;
        });
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setSelectedSuggestionIndex((prev) => {
          if (prev === -1) return 0;
          return prev < suggestions.length - 1 ? prev + 1 : prev;
        });
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setSelectedSuggestionIndex((prev) => {
          if (prev <= 0) return -1;
          return prev - 1;
        });
      } else if (event.key === 'Enter' && selectedSuggestionIndex >= 0) {
        event.preventDefault();
        const selectedPlayer = suggestions[selectedSuggestionIndex];
        if (
          selectedPlayer &&
          !selectedIds.includes(String(selectedPlayer.ID)) &&
          selectedIds.length < MAX_PLAYERS
        ) {
          handleAddPlayer(selectedPlayer);
        }
      }
    },
    [suggestions, selectedSuggestionIndex, selectedIds, handleAddPlayer, gridColumns],
  );

  return (
    <section className="card comparator-module">
      <header className="card-header comparator-header">
        <div className="comparator-header-left">
          <form className="comparator-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Selecciona hasta 4 jugadores para comparar"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="submit"
              className="secondary-button"
              disabled={!query.trim() || selectedIds.length >= MAX_PLAYERS}
            >
              Agregar
            </button>
          </form>
        </div>
        <div className="comparator-actions">
          <button
            type="button"
            className="secondary-button ghost"
            onClick={handleSwap}
            disabled={selectedIds.length !== 2}
          >
            Invertir orden
          </button>
          <button
            type="button"
            className="secondary-button ghost"
            onClick={handleClear}
            disabled={selectedIds.length === 0}
          >
            Limpiar comparador
          </button>
        </div>
      </header>

      {showSelector && (
        <div className="comparator-selector">
          {lookupError && <p className="error">{lookupError}</p>}
          {showSuggestions && (
            <div className="comparator-suggestions" ref={suggestionsGridRef}>
              {suggestions.map((player, index) => (
                <button
                  key={player.ID as string}
                  type="button"
                  className={`suggestion-button ${index === selectedSuggestionIndex ? 'active' : ''}`}
                  disabled={
                    selectedIds.includes(String(player.ID)) ||
                    selectedIds.length >= MAX_PLAYERS
                  }
                  onClick={() => handleAddPlayer(player)}
                >
                  <span className="suggestion-name">{player.NOMBRE}</span>
                  <span className="suggestion-club">
                    {formatClub(player.CLUB as string, player.NACIONALIDAD as string)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && <p className="loading">Leyendo jugadores...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && selectedPlayers.length === 0 && (
        <p className="muted">
          Agrega jugadores usando el buscador superior para iniciar la comparación.
        </p>
      )}

      {!loading && !error && selectedPlayers.length > 0 && (
        <div className="comparator-content">
          {duelMode ? (
            <DuelComparison
              players={selectedPlayers}
              statsRows={statsRows}
              datasets={macroDatasets}
              onRemovePlayer={handleRemovePlayer}
              formById={formById}
              onChangeForm={handleChangeForm}
            />
          ) : (
            <MultiComparison
              players={selectedPlayers}
              statsRows={statsRows}
              datasets={macroDatasets}
              onRemovePlayer={handleRemovePlayer}
              formById={formById}
              onChangeForm={handleChangeForm}
            />
          )}
        </div>
      )}
    </section>
  );
}

interface ComparisonProps {
  players: DerivedPlayer[];
  statsRows: Array<{
    field: keyof DerivedPlayer;
    label: string;
    values: Array<number | undefined>;
  }>;
  datasets: RadarChartDataset[];
  onRemovePlayer: (playerId: string) => void;
  formById: Record<string, FormStateId>;
  onChangeForm: (playerId: string, form: FormStateId) => void;
}

function DuelComparison({
  players,
  statsRows,
  datasets,
  onRemovePlayer,
  formById,
  onChangeForm,
}: ComparisonProps) {
  const [left, right] = players;
  const [selectedPosition, setSelectedPosition] = useState<PositionHighlightId | null>(
    null,
  );
  const [showPositions, setShowPositions] = useState(false);

  return (
    <div className="comparator-duel">
      <ComparatorPlayerCard
        player={left}
        accentColor={getPlayerColor(0)}
        headerIndex={0}
        onRemove={onRemovePlayer}
        formState={formById[String(left?.ID)] ?? DEFAULT_FORM_STATE}
        onChangeForm={onChangeForm}
      />
      <div className="duel-center">
        <section className="duel-stats">
          <header className="stats-header-with-selector">
            <h3>STATS</h3>
            <div className="position-selector">
              {(() => {
                const meta = POSITION_HIGHLIGHTS.find((p) => p.id === selectedPosition);
                const chipColor = meta?.color ?? 'rgba(0, 0, 0, 1)';
                const chipLabel = meta?.label ?? '-';
                return (
                  <button
                    type="button"
                    className={`pos-trigger ${selectedPosition ? 'active' : ''}`}
                    title="Destacar Stats para la Posición"
                    onClick={() => setShowPositions((v: boolean) => !v)}
                    style={{
                      background: chipColor,
                    }}
                  >
                    {chipLabel}
                  </button>
                );
              })()}
              {showPositions && (
                <div className="pos-menu">
                  <button
                    type="button"
                    className={`pos-option none ${!selectedPosition ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedPosition(null);
                      setShowPositions(false);
                    }}
                  >
                    -
                  </button>

                  {POSITION_HIGHLIGHTS.map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      className={`pos-option ${selectedPosition === pos.id ? 'active' : ''}`}
                      style={{
                        background: pos.color,
                      }}
                      onClick={() => {
                        setSelectedPosition(pos.id);
                        setShowPositions(false);
                      }}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </header>
          <div className="duel-stats-list">
            {statsRows.map((row) => (
              <DuelStatRow
                key={row.field as string}
                label={
                  <GlossaryTooltip
                    fieldName={row.field as string}
                    displayLabel={row.label}
                  >
                    {row.label}
                  </GlossaryTooltip>
                }
                leftValue={row.values[0]}
                rightValue={row.values[1]}
                showBars
                highlighted={
                  !!selectedPosition &&
                  POSITION_HIGHLIGHTS.find(
                    (p) => p.id === selectedPosition,
                  )?.stats.includes(row.field as any)
                }
              />
            ))}
          </div>
        </section>
        <section className="duel-radar">
          <header>RADAR</header>
          <RadarChart
            labels={MACRO_FIELDS.map((field) => getFieldLabel(field as string))}
            labelFieldNames={MACRO_FIELDS.map((field) => field as string)}
            datasets={datasets.slice(0, 2)}
          />
        </section>
      </div>
      {right ? (
        <ComparatorPlayerCard
          player={right}
          accentColor={getPlayerColor(1)}
          align="right"
          headerIndex={1}
          onRemove={onRemovePlayer}
          formState={formById[String(right?.ID)] ?? DEFAULT_FORM_STATE}
          onChangeForm={onChangeForm}
        />
      ) : (
        <div className="comparator-player-card placeholder">
          Selecciona un segundo jugador.
        </div>
      )}
    </div>
  );
}

function MultiComparison({
  players,
  statsRows,
  datasets,
  onRemovePlayer,
  formById,
  onChangeForm,
}: ComparisonProps) {
  // Calcular máximos y segundos mejores para cada stat
  const { maxValues, secondBestValues } = useMemo(() => {
    const maxes = new Map<keyof DerivedPlayer, number>();
    const secondBests = new Map<keyof DerivedPlayer, number>();

    statsRows.forEach((row) => {
      const numericValues = row.values.filter((v): v is number => v !== undefined);

      if (numericValues.length > 0) {
        // Obtener valores únicos ordenados descendentemente
        const uniqueValues = [...new Set(numericValues)].sort((a, b) => b - a);

        maxes.set(row.field, uniqueValues[0]);
        if (uniqueValues.length > 1) {
          secondBests.set(row.field, uniqueValues[1]); // Primer valor diferente
        }
      }
    });

    return { maxValues: maxes, secondBestValues: secondBests };
  }, [statsRows]);

  return (
    <div className="comparator-multi">
      <div className="multi-cards">
        {players.map((player, index) => (
          <div key={player.ID as string} className="multi-card-shell">
            <ComparatorPlayerCard
              player={player}
              accentColor={getPlayerColor(index)}
              compact
              headerIndex={index}
              onRemove={onRemovePlayer}
              statsRows={statsRows}
              maxValues={maxValues}
              secondBestValues={secondBestValues}
              radarDataset={
                datasets.find((d) => d.id === String(player.ID)) ?? datasets[index]
              }
              formState={formById[String(player.ID)] ?? DEFAULT_FORM_STATE}
              onChangeForm={onChangeForm}
              detachHeader
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface DuelStatRowProps {
  label: React.ReactNode;
  leftValue?: number;
  rightValue?: number;
  showBars?: boolean;
  highlighted?: boolean;
}

function DuelStatRow({
  label,
  leftValue,
  rightValue,
  showBars,
  highlighted,
}: DuelStatRowProps) {
  const winner =
    leftValue !== undefined && rightValue !== undefined
      ? leftValue > rightValue
        ? 'left'
        : rightValue > leftValue
          ? 'right'
          : 'tie'
      : null;
  const diff =
    leftValue !== undefined && rightValue !== undefined
      ? leftValue - rightValue
      : undefined;
  const leftDiff = diff !== undefined && diff > 0 ? diff : undefined;
  const rightDiff = diff !== undefined && diff < 0 ? Math.abs(diff) : undefined;
  const leftColor =
    leftValue !== undefined ? (getStatColor(leftValue) ?? undefined) : undefined;
  const rightColor =
    rightValue !== undefined ? (getStatColor(rightValue) ?? undefined) : undefined;
  const leftBarWidth = Math.max(0, Math.min(leftValue ?? 0, 99));
  const rightBarWidth = Math.max(0, Math.min(rightValue ?? 0, 99));

  return (
    <div className={`duel-stat-row ${highlighted ? 'highlighted' : ''}`}>
      <div className={`player-value ${winner === 'left' ? 'winner' : ''}`}>
        <span className="diff-slot left">
          {leftDiff !== undefined && (
            <span className="stat-diff positive">+{formatPlayerValue(leftDiff, 0)}</span>
          )}
        </span>
        <span
          className="stat-number"
          style={leftColor ? { color: leftColor } : undefined}
        >
          {leftValue !== undefined ? formatPlayerValue(leftValue, 0) : '-'}
        </span>
        <div className="stat-bar mini">
          <div
            className={`stat-bar-fill ${winner === 'left' ? 'left' : 'muted'}`}
            style={{ width: `${leftBarWidth}%` }}
          />
        </div>
      </div>
      <div className="stat-label">{label}</div>
      <div className={`player-value ${winner === 'right' ? 'winner' : ''}`}>
        <div className="stat-bar mini">
          <div
            className={`stat-bar-fill ${winner === 'right' ? 'right' : 'muted'}`}
            style={{ width: `${rightBarWidth}%` }}
          />
        </div>
        <span
          className="stat-number"
          style={rightColor ? { color: rightColor } : undefined}
        >
          {rightValue !== undefined ? formatPlayerValue(rightValue, 0) : '-'}
        </span>
        <span className="diff-slot right">
          {rightDiff !== undefined && (
            <span className="stat-diff positive">+{formatPlayerValue(rightDiff, 0)}</span>
          )}
        </span>
      </div>
    </div>
  );
}

interface ComparatorPlayerCardProps {
  player: DerivedPlayer;
  accentColor: string;
  compact?: boolean;
  align?: 'left' | 'right';
  headerIndex: number;
  onRemove?: (playerId: string) => void;
  formState?: FormStateId;
  onChangeForm?: (playerId: string, form: FormStateId) => void;
  statsRows?: Array<{
    field: keyof DerivedPlayer;
    label: string;
    values: Array<number | undefined>;
  }>;
  maxValues?: Map<keyof DerivedPlayer, number>;
  secondBestValues?: Map<keyof DerivedPlayer, number>;
  radarDataset?: RadarChartDataset;
  detachHeader?: boolean;
}

function ComparatorPlayerCard({
  player,
  accentColor,
  compact,
  align = 'left',
  headerIndex,
  onRemove,
  statsRows,
  maxValues,
  secondBestValues,
  radarDataset,
  formState = DEFAULT_FORM_STATE,
  onChangeForm,
  detachHeader = false,
}: ComparatorPlayerCardProps) {
  const [formOpen, setFormOpen] = useState(false);
  const positions = getPlayerPositions(player);
  const primaryPosition = positions[0];
  const badges = getStatusBadges(player);
  const nationalityInfo = getNationalityInfo(player.NACIONALIDAD as string);
  const flagPath = getFlagImagePath(player.NACIONALIDAD as string);
  const clubShield = getClubShieldPath(player.CLUB as string);
  const clubLabel = formatClub(player.CLUB as string, player.NACIONALIDAD as string);
  const promedioValue = ensureNumber(player.PROMEDIO);
  const promedio = formatPlayerValue(promedioValue, 1);
  const activePositionCells = getActivePositionCells(player);
  const promedioColor =
    promedioValue !== undefined ? (getStatColor(promedioValue) ?? '#ffd166') : '#ffd166';
  const primaryLine = primaryPosition ? getPositionLine(primaryPosition) : undefined;

  const thumbPath = getPlayerThumbPath(player.ID);

  const identityBlock = (
    <div className="player-identity">
      <div className="player-identity-header">
        <h3 className="player-name-with-thumb">
          <img
            src={thumbPath}
            alt=""
            className="player-thumb"
            onError={(e) => {
              const img = e.currentTarget;
              const isLegend = img.src.includes('/L-');
              const fallback = isLegend
                ? '/images/thumbs/Legend.png'
                : '/images/thumbs/missing.png';
              if (!img.src.endsWith(fallback)) {
                img.src = fallback;
              }
            }}
          />
          <span
            className="clickable-name"
            style={{ cursor: 'pointer' }}
            onClick={(e) => openPlayerActionsMenu(e, player, { hideCompare: true })}
          >
            {player.NOMBRE}
          </span>
        </h3>
        {onChangeForm && (
          <div className="form-dropdown" title="Forma del jugador">
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
                    onClick={() => {
                      onChangeForm(String(player.ID), state.id);
                      setFormOpen(false);
                    }}
                  >
                    <span className="form-option-icon">{state.icon}</span>
                    <span className="form-option-label">{state.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="player-badges">
          {badges.map((badge) => {
            const glossaryTerm = badge.glossaryId
              ? GLOSSARY_DATA.find((t) => t.id === badge.glossaryId)
              : null;
            const tooltipContent = glossaryTerm ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div style={{ color: '#7ac9ff', fontWeight: 600 }}>
                  {glossaryTerm.term}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 400 }}>
                  {glossaryTerm.definition}
                </div>
              </div>
            ) : (
              badge.title
            );
            return (
              <EnhancedTooltip key={badge.key} content={tooltipContent}>
                <span className={badge.className}>{badge.label}</span>
              </EnhancedTooltip>
            );
          })}
        </div>
      </div>
    </div>
  );

  const overviewBlock = (
    <div className="player-overview">
      <div className="player-average">
        <EnhancedTooltip content={`Promedio principal: ${promedio}`}>
          <strong style={{ color: promedioColor }}>{promedio}</strong>
        </EnhancedTooltip>
      </div>
      {primaryPosition && (
        <EnhancedTooltip content={getPositionFullName(primaryPosition)}>
          <span
            className={`primary-position-tag position-badge primary position-${primaryLine ?? 'DEF'}`}
          >
            {primaryPosition}
          </span>
        </EnhancedTooltip>
      )}
      <div className="player-flags">
        {clubShield && (
          <EnhancedTooltip content={clubLabel}>
            <img src={clubShield} alt={clubLabel} className="club-shield" />
          </EnhancedTooltip>
        )}
        {flagPath && (
          <EnhancedTooltip content={nationalityInfo?.name || ''}>
            <img src={flagPath} alt="" />
          </EnhancedTooltip>
        )}
      </div>
    </div>
  );

  const headerEl = (
    <header
      className={`player-card-header ${align === 'right' ? 'right' : ''} ${detachHeader ? 'detached' : ''}`}
      style={detachHeader ? { borderColor: accentColor } : undefined}
    >
      {onRemove && (
        <button
          type="button"
          className="player-card-remove"
          aria-label={`Quitar a ${player.NOMBRE}`}
          onClick={() => onRemove(String(player.ID))}
        >
          ×
        </button>
      )}
      {align === 'right' ? (
        <>
          {overviewBlock}
          {identityBlock}
        </>
      ) : (
        <>
          {identityBlock}
          {overviewBlock}
        </>
      )}
    </header>
  );

  const bodyClasses = [
    'comparator-player-card',
    compact ? 'compact' : '',
    align === 'right' ? 'align-right' : '',
    detachHeader ? 'detached-body' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {detachHeader && (
        <div className="player-card-top-wrapper" style={{ borderColor: accentColor }}>
          {headerEl}
        </div>
      )}
      <div className={bodyClasses} style={{ borderColor: accentColor }}>
        {!detachHeader && headerEl}
        <div className="player-meta-grid">
          {DETAIL_FIELDS.map((field) => (
            <DetailField
              key={field as string}
              field={field as string}
              label={getFieldLabel(field as string)}
              value={formatDetailFieldValue(field, player)}
            />
          ))}
        </div>
        <div className="player-extra">
          <PlayerSkills player={player} />
          <PositionMap
            player={player}
            activeCells={activePositionCells}
            primaryPosition={primaryPosition}
          />
        </div>
        {statsRows && maxValues && (
          <>
            <h4 className="stats-section-title">STATS</h4>
            <div className="player-stats-list">
              {statsRows.map((row) => {
                const playerValue = applyFormMultiplier(
                  ensureNumber(player[row.field]),
                  row.field as any,
                  formState,
                );
                const maxValue = maxValues.get(row.field);
                const secondBest = secondBestValues?.get(row.field);
                const isMax =
                  playerValue !== undefined &&
                  maxValue !== undefined &&
                  maxValue === playerValue;

                // Si es el máximo, comparar con el segundo mejor; si no, comparar con el máximo
                const compareValue = isMax ? secondBest : maxValue;
                const diff =
                  playerValue !== undefined && compareValue !== undefined
                    ? playerValue - compareValue
                    : undefined;
                const showDiff = diff !== undefined && diff !== 0;

                return (
                  <div key={row.field as string} className="stat-row">
                    <GlossaryTooltip fieldName={row.field as string}>
                      <span className="stat-label" style={{ pointerEvents: 'auto' }}>
                        {row.label}
                      </span>
                    </GlossaryTooltip>
                    <span
                      className={`stat-value ${isMax ? 'stat-winner' : ''}`}
                      style={
                        playerValue !== undefined
                          ? { color: getStatColor(playerValue) ?? undefined }
                          : undefined
                      }
                    >
                      <span className="stat-number">
                        {playerValue !== undefined
                          ? formatPlayerValue(playerValue, 0)
                          : '-'}
                      </span>
                      {showDiff && (
                        <span
                          className={`stat-diff ${diff > 0 ? 'positive' : 'negative'}`}
                        >
                          {diff > 0 ? '+' : ''}
                          {formatPlayerValue(diff, 0)}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {radarDataset && (
          <div className="player-radar">
            <header>RADAR</header>
            <RadarChart
              labels={MACRO_FIELDS.map((field) => getFieldLabel(field as string))}
              labelFieldNames={MACRO_FIELDS.map((field) => field as string)}
              datasets={[radarDataset]}
              size={180}
              showLegend={false}
            />
          </div>
        )}
      </div>
    </>
  );
}

type DetailValue = {
  text: string;
  color?: string;
};

function DetailField({
  field,
  label,
  value,
}: {
  field?: string;
  label: string;
  value: DetailValue;
}) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [scrollDistance, setScrollDistance] = useState(0);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return undefined;
    const update = () => {
      const diff = el.scrollWidth - el.clientWidth;
      setScrollDistance(diff > 4 ? diff : 0);
    };
    update();
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
    };
  }, [label]);

  const scrollable = scrollDistance > 0;
  const spanStyle: CSSProperties | undefined = scrollable
    ? ({
        '--scroll-distance': `${scrollDistance}px`,
        '--scroll-duration': `${Math.min(6, Math.max(3, scrollDistance / 30))}s`,
      } as CSSProperties)
    : undefined;

  return (
    <div>
      {field ? (
        <GlossaryTooltip fieldName={field}>
          <small className={`meta-label ${scrollable ? 'scrollable' : ''}`}>
            <span ref={textRef} style={spanStyle}>
              {label}
            </span>
          </small>
        </GlossaryTooltip>
      ) : (
        <small className={`meta-label ${scrollable ? 'scrollable' : ''}`}>
          <span ref={textRef} style={spanStyle}>
            {label}
          </span>
        </small>
      )}
      <p style={value.color ? ({ color: value.color } as CSSProperties) : undefined}>
        {value.text}
      </p>
    </div>
  );
}

function formatDetailFieldValue(
  field: keyof DerivedPlayer,
  player: DerivedPlayer,
): DetailValue {
  if (field === 'PIE' || field === FAV_SIDE_FIELD) {
    return { text: formatFoot(player[field] as string) };
  }
  if (field === INJURY_FIELD) {
    const text = formatInjuryLevel(player[field]);
    return { text, color: getInjuryColor(text) ?? undefined };
  }
  if (SCALE_DETAIL_FIELDS.has(field)) {
    return formatScaleDetail(field, player[field]);
  }
  return { text: formatPlayerValue(player[field], 0) };
}

function formatInjuryLevel(value: DerivedPlayer[keyof DerivedPlayer]): string {
  if (value === null || value === undefined) return '-';
  const text = String(value).trim().toUpperCase();
  if (!text) return '-';
  if (text === '1') return 'A';
  if (text === '2') return 'B';
  if (text === '3') return 'C';
  return text;
}

function formatScaleDetail(
  field: keyof DerivedPlayer,
  value: DerivedPlayer[keyof DerivedPlayer],
): DetailValue {
  const numeric = ensureNumber(value);
  if (numeric === undefined || Number.isNaN(numeric)) {
    return { text: '-' };
  }
  const text = formatPlayerValue(numeric, 0);
  const shouldColor =
    field === 'CONSISTENCIA' ||
    field === FITNESS_FIELD ||
    field === ('PRECICIÓN PIE MALO' as keyof DerivedPlayer) ||
    field === ('FRECUENCIA PIE MALO' as keyof DerivedPlayer);
  const color = shouldColor ? (getStatColor(numeric) ?? undefined) : undefined;
  return { text, color };
}

function PlayerSkills({ player }: { player: DerivedPlayer }) {
  const skillEntries = Array.from(SPECIAL_SKILL_FIELDS).map((field) => {
    const value = player[field as keyof DerivedPlayer];
    return {
      field,
      label: getFieldLabel(field),
      active: isSkillActive(value),
    };
  });
  const activeSkills = skillEntries.filter((entry) => entry.active);
  if (!activeSkills.length) {
    return null;
  }

  return (
    <div className="player-skills">
      <h4>Habilidades Especiales</h4>
      <div className="skills-grid">
        {activeSkills.map((skill) => (
          <GlossaryTooltip key={skill.field} fieldName={skill.field}>
            <span className="skill-pill active">★ {skill.label}</span>
          </GlossaryTooltip>
        ))}
      </div>
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

function PositionMap({
  player,
  activeCells,
  primaryPosition,
}: {
  player: DerivedPlayer;
  activeCells: Set<string>;
  primaryPosition?: string;
}) {
  const primaryCellTargets = resolveCellAliases(primaryPosition);
  return (
    <div className="position-map">
      <div className="position-map-header">
        <h4>Posiciones</h4>
      </div>
      <div className="position-map-inner">
        <div className="position-map-grid">
          {POSITION_FIELD_CELLS.map((cell) => {
            const isActive = activeCells.has(cell.label.toUpperCase());
            const isPrimary = primaryCellTargets.includes(cell.label.toUpperCase());
            const value = valueFromPositionField(cell.valueKey, player);
            const displayValue = value !== undefined ? formatPlayerValue(value, 0) : '-';
            const statColor =
              value !== undefined ? (getStatColor(value) ?? undefined) : undefined;
            const style = {
              gridColumn: `${cell.col} / span ${cell.colSpan ?? 1}`,
              gridRow: `${cell.row} / span ${cell.rowSpan ?? 1}`,
            };
            const positionLine = getPositionLine(cell.label);
            const positionName = POSITION_NAME_MAP[cell.label] ?? cell.label;
            return (
              <div
                key={`${cell.label}-${cell.row}-${cell.col}`}
                className={`position-node col-${cell.col} ${isActive ? 'active' : ''} ${isPrimary ? 'primary' : ''}`}
                style={style}
              >
                <span
                  className={`position-chip position-${positionLine}`}
                  aria-hidden="true"
                >
                  {cell.label}
                </span>
                <strong style={statColor ? { color: statColor } : undefined}>
                  {displayValue}
                </strong>
                <div className="position-node-tooltip">
                  <div className="position-node-tooltip-top">
                    <span className={`position-chip position-${positionLine}`}>
                      {cell.label}
                    </span>
                    <span className="position-node-tooltip-name">{positionName}</span>
                  </div>
                  <div className="position-node-tooltip-bottom">
                    <span>Promedio:</span>
                    <strong
                      className="position-node-tooltip-value"
                      style={statColor ? { color: statColor } : undefined}
                    >
                      {displayValue}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getActivePositionCells(player: DerivedPlayer): Set<string> {
  const active = new Set<string>();

  DEMARCATION_COLUMNS.forEach((column) => {
    const rawValue = player[column as keyof DerivedPlayer];
    if (!rawValue) return;
    const normalized = String(rawValue).trim().toUpperCase();
    const translated = DEMARCATION_TRANSLATION[normalized] ?? normalized;
    const targets = resolveCellAliases(translated);
    targets.forEach((cell) => active.add(cell));
  });

  return active;
}

function resolveCellAliases(code?: string): string[] {
  if (!code) return [];
  const normalized = code.trim().toUpperCase();
  if (POSITION_CELL_ALIASES[normalized]) {
    return POSITION_CELL_ALIASES[normalized].map((label) => label.toUpperCase());
  }
  if (POSITION_CELL_SET.has(normalized)) {
    return [normalized];
  }
  return [];
}

function valueFromPositionField(
  field: keyof DerivedPlayer,
  player: DerivedPlayer,
): number | undefined {
  const value = player[field];
  return typeof value === 'number' ? value : undefined;
}

export default ComparatorModule;
