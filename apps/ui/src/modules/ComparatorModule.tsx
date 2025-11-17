import { useMemo, useState } from 'react';
import type { DerivedPlayer } from '@anfpes/engine';
import { useCacheStore } from '../store/cacheStore';
import { RadarChart } from '../components/RadarChart';
import type { RadarChartDataset } from '../components/RadarChart';
import { FAV_SIDE_FIELD, INJURY_FIELD, FITNESS_FIELD } from '../constants/playerFields';
import {
  formatClub,
  formatFoot,
  formatNationality,
  formatSelectionDisplay,
  getFieldLabel,
} from '../utils/playerDisplay';
import { ensureNumber, formatPlayerValue } from '../utils/format';
import { getPlayerPositions, getPositionLine } from '../components/PositionBadges';
import { ANFPES_CLUBS, LEGEND_PLAYERS, ML_PLAYERS } from '../data/playerStatus';
import { PositionBadges } from '../components/PositionBadges';
import { getFlagImagePath, getClubShieldPath } from '../utils/imageHelpers';
import { getNationalityInfo } from '../data/nationalities';

const MAX_PLAYERS = 4;
const COLOR_PALETTE = ['#7ac9ff', '#f472b6', '#a78bfa', '#34d399'];
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
    players.find((player) => normalize(String(player.CLUB ?? '')).includes(normalized))
  );
}

export function ComparatorModule() {
  const players = useCacheStore((state) => state.players);
  const status = useCacheStore((state) => state.status);
  const error = useCacheStore((state) => state.error);
  const loading = status === 'idle' || status === 'loading';

  const [query, setQuery] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
        return (
          name.includes(normalized) ||
          id.includes(normalized) ||
          club.includes(normalized)
        );
      })
      .slice(0, 8);
  }, [players, query]);

  const statsRows = useMemo(() => {
    return CORE_STATS.map((field) => ({
      field,
      label: getFieldLabel(field as string),
      values: selectedPlayers.map((player) => ensureNumber(player[field])),
    }));
  }, [selectedPlayers]);

  const macroDatasets = useMemo(() => {
    return selectedPlayers.map((player, index) => ({
      id: String(player.ID),
      label: player.NOMBRE as string,
      values: MACRO_FIELDS.map((field) => ensureNumber(player[field]) ?? 0),
      color: getPlayerColor(index),
      fillOpacity: selectedPlayers.length > 2 ? 0.08 : 0.2,
    }));
  }, [selectedPlayers]);

  const duelMode = selectedPlayers.length <= 2;

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
  };

  const handleClear = () => {
    setSelectedIds([]);
    setLookupError('');
  };

  const handleSwap = () => {
    setSelectedIds((current) => {
      if (current.length !== 2) return current;
      return [current[1], current[0]];
    });
  };

  return (
    <section className="card comparator-module">
      <header className="card-header comparator-header">
        <div className="comparator-header-left">
          <h2>Comparador</h2>
          <form className="comparator-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Selecciona hasta 4 jugadores para comparar"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
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

      <div className="comparator-selector">
        {lookupError && <p className="error">{lookupError}</p>}
        {query.trim() && suggestions.length > 0 && (
          <div className="comparator-suggestions">
            {suggestions.map((player) => (
              <button
                key={player.ID as string}
                type="button"
                className="suggestion-button"
                disabled={
                  selectedIds.includes(String(player.ID)) ||
                  selectedIds.length >= MAX_PLAYERS
                }
                onClick={() => handleAddPlayer(player)}
              >
                <span className="suggestion-id">{player.ID}</span>
                <span className="suggestion-name">{player.NOMBRE}</span>
                <span className="suggestion-club">
                  {formatClub(player.CLUB as string, player.NACIONALIDAD as string)}
                </span>
              </button>
            ))}
          </div>
        )}
        {selectedPlayers.length > 0 && (
          <div className="comparator-selected-tags">
            {selectedPlayers.map((player, index) => (
              <span
                key={player.ID as string}
                className="selected-tag"
                style={{ borderColor: getPlayerColor(index) }}
              >
                <span>{player.NOMBRE}</span>
                <button
                  type="button"
                  onClick={() => handleRemovePlayer(String(player.ID))}
                  aria-label="Eliminar"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

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
            />
          ) : (
            <MultiComparison
              players={selectedPlayers}
              statsRows={statsRows}
              datasets={macroDatasets}
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
}

function DuelComparison({ players, statsRows, datasets }: ComparisonProps) {
  const [left, right] = players;
  return (
    <div className="comparator-duel">
      <ComparatorPlayerCard player={left} accentColor={getPlayerColor(0)} />
      <div className="duel-center">
        <section className="duel-stats">
          <header>
            <h3>Stats destacados</h3>
            <p className="muted">
              En verde se resalta el valor más alto por cada atributo.
            </p>
          </header>
          <div className="duel-stats-list">
            {statsRows.map((row) => (
              <DuelStatRow
                key={row.field as string}
                label={row.label}
                leftValue={row.values[0]}
                rightValue={row.values[1]}
              />
            ))}
          </div>
        </section>
        <section className="duel-radar">
          <header>
            <h3>Macrostats</h3>
          </header>
          <RadarChart
            labels={MACRO_FIELDS.map((field) => getFieldLabel(field as string))}
            datasets={datasets.slice(0, 2)}
          />
        </section>
      </div>
      {right ? (
        <ComparatorPlayerCard
          player={right}
          accentColor={getPlayerColor(1)}
          align="right"
        />
      ) : (
        <div className="comparator-player-card placeholder">
          Selecciona un segundo jugador.
        </div>
      )}
    </div>
  );
}

function MultiComparison({ players, statsRows, datasets }: ComparisonProps) {
  return (
    <div className="comparator-multi">
      <div className="multi-cards">
        {players.map((player, index) => (
          <ComparatorPlayerCard
            key={player.ID as string}
            player={player}
            accentColor={getPlayerColor(index)}
            compact
          />
        ))}
      </div>

      <section className="multi-stats-table">
        <header>
          <h3>Stats comparados</h3>
        </header>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Stat</th>
                {players.map((player) => (
                  <th key={player.ID as string}>{player.NOMBRE}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statsRows.map((row) => {
                const numericValues = row.values.map((value) => value ?? -Infinity);
                const max = Math.max(...numericValues);
                return (
                  <tr key={row.field as string}>
                    <td>{row.label}</td>
                    {row.values.map((value, index) => (
                      <td
                        key={`${row.field as string}-${players[index].ID as string}`}
                        className={
                          value !== undefined && value === max ? 'stat-winner' : undefined
                        }
                      >
                        {value !== undefined ? formatPlayerValue(value, 0) : '-'}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="multi-radars">
        <header>
          <h3>Macrostats (por jugador)</h3>
        </header>
        <div className="multi-radars-grid">
          {players.map((player, index) => (
            <RadarChart
              key={player.ID as string}
              labels={MACRO_FIELDS.map((field) => getFieldLabel(field as string))}
              datasets={[
                {
                  id: String(player.ID),
                  label: player.NOMBRE as string,
                  values: MACRO_FIELDS.map((field) => ensureNumber(player[field]) ?? 0),
                  color: getPlayerColor(index),
                  fillOpacity: 0.15,
                },
              ]}
              size={180}
              showLegend={false}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

interface DuelStatRowProps {
  label: string;
  leftValue?: number;
  rightValue?: number;
}

function DuelStatRow({ label, leftValue, rightValue }: DuelStatRowProps) {
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

  return (
    <div className="duel-stat-row">
      <div className={`player-value ${winner === 'left' ? 'winner' : ''}`}>
        {leftValue !== undefined ? formatPlayerValue(leftValue, 0) : '-'}
      </div>
      <div className="stat-label">
        <span>{label}</span>
        {diff !== undefined && (
          <span
            className={`stat-diff ${diff > 0 ? 'positive' : diff < 0 ? 'negative' : ''}`}
          >
            {diff > 0 ? `+${formatPlayerValue(diff, 0)}` : formatPlayerValue(diff, 0)}
          </span>
        )}
      </div>
      <div className={`player-value ${winner === 'right' ? 'winner' : ''}`}>
        {rightValue !== undefined ? formatPlayerValue(rightValue, 0) : '-'}
      </div>
    </div>
  );
}

interface ComparatorPlayerCardProps {
  player: DerivedPlayer;
  accentColor: string;
  compact?: boolean;
  align?: 'left' | 'right';
}

function ComparatorPlayerCard({
  player,
  accentColor,
  compact,
  align = 'left',
}: ComparatorPlayerCardProps) {
  const positions = getPlayerPositions(player);
  const badges = getStatusBadges(player);
  const nationalityInfo = getNationalityInfo(player.NACIONALIDAD as string);
  const flagPath = getFlagImagePath(player.NACIONALIDAD as string);
  const clubShield = getClubShieldPath(player.CLUB as string);

  return (
    <div
      className={`comparator-player-card ${compact ? 'compact' : ''} ${align === 'right' ? 'align-right' : ''}`}
      style={{ borderColor: accentColor }}
    >
      <header>
        <div>
          <p className="eyebrow">ID {player.ID}</p>
          <h3>{player.NOMBRE}</h3>
          <p className="muted">
            {formatClub(player.CLUB as string, player.NACIONALIDAD as string)}
          </p>
          <div className="player-badges">
            {badges.map((badge) => (
              <span key={badge.key} className={badge.className} title={badge.title}>
                {badge.label}
              </span>
            ))}
          </div>
        </div>
        <div className="player-flags">
          {flagPath && <img src={flagPath} alt="" title={nationalityInfo?.name} />}
          {clubShield && <img src={clubShield} alt="" />}
        </div>
      </header>
      <div className="player-meta-grid">
        {DETAIL_FIELDS.map((field) => (
          <div key={field as string}>
            <small>{getFieldLabel(field as string)}</small>
            <p>
              {field === 'PIE' || field === FAV_SIDE_FIELD
                ? formatFoot(player[field] as string)
                : formatPlayerValue(player[field], 0)}
            </p>
          </div>
        ))}
      </div>
      <div className="player-positions">
        <PositionBadges player={player} />
      </div>
    </div>
  );
}
