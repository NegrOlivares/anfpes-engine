import { Fragment, useMemo, useState } from 'react';
import type { DerivedPlayer } from '@anfpes/engine';
import { useCacheStore } from '../store/cacheStore';
import { useSimilarPlayersStore } from '../store/similarPlayersStore';
import {
  DEFAULT_TABLE_COLUMNS,
  FIELD_GROUPS,
  getSortedColumns,
  getTableHeaderLabel,
} from '../constants/playerFields';
import { TableCell } from '../components/TableCell';
import {
  PositionBadges,
  getPlayerPositions,
  getPositionLine,
} from '../components/PositionBadges';
import {
  formatClub,
  formatSelectionDisplay,
  getFieldLabel,
  shouldDisplayField,
} from '../utils/playerDisplay';
import { getFlagImagePath, getClubShieldPath } from '../utils/imageHelpers';
import { getNationalityInfo } from '../data/nationalities';
import { openPlayerActionsMenu } from '../components/PlayerActionsOverlay';
import { getStatColor } from '../types/table';
import { ANFPES_CLUBS, LEGEND_PLAYERS, ML_PLAYERS } from '../data/playerStatus';

const MACRO_KEYS = ['ATK', 'TEC', 'RES', 'DEF', 'FUE', 'VEL'] as const;
const POSITION_RATING_KEYS = [
  'PT',
  'LIB',
  'CT',
  'SA',
  'LA',
  'CCD',
  'CC',
  'VOL',
  'MP',
  'EX',
  'SD',
  'DC',
] as const;

type MacroKey = (typeof MACRO_KEYS)[number];

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
  const selectionValue = formatSelectionDisplay(player['nro selecci��n'] as string);
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

function getPrimaryPositionBadge(player: DerivedPlayer) {
  const positions = getPlayerPositions(player);
  if (!positions.length) return null;
  const primary = positions[0];
  const line = getPositionLine(primary);
  return { position: primary, line };
}

interface SimilarEntry {
  player: DerivedPlayer;
  similarity: number;
  macroDistance: number;
  positionDistance: number | null;
  isBase?: boolean;
}

export function SimilarPlayersModule() {
  const players = useCacheStore((state) => state.players);
  const selectedId = useCacheStore((state) => state.selectedPlayerId);
  const setSelectedPlayer = useCacheStore((state) => state.setSelectedPlayer);

  const basePlayerId = useSimilarPlayersStore((state) => state.basePlayerId);
  const setBasePlayerId = useSimilarPlayersStore((state) => state.setBasePlayerId);

  const basePlayer = useMemo(() => {
    if (!players || !basePlayerId) return undefined;
    return players.find((player) => String(player.ID) === String(basePlayerId));
  }, [players, basePlayerId]);

  const [macroSelection, setMacroSelection] = useState<Record<MacroKey, boolean>>({
    ATK: true,
    TEC: true,
    RES: true,
    DEF: true,
    FUE: true,
    VEL: true,
  });
  const [mode, setMode] = useState<'proportional' | 'direct'>('proportional');
  const [minSimilarity, setMinSimilarity] = useState(80);
  const [includePositions, setIncludePositions] = useState(false);
  const [manualLookup, setManualLookup] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(DEFAULT_TABLE_COLUMNS),
  );

  const sortedVisibleColumns = useMemo(
    () => getSortedColumns(visibleColumns),
    [visibleColumns],
  );
  const activeMacroKeys = useMemo(
    () => MACRO_KEYS.filter((key) => macroSelection[key]),
    [macroSelection],
  );

  const similarEntries = useMemo<SimilarEntry[]>(() => {
    if (!players || !basePlayer || activeMacroKeys.length === 0) {
      return [];
    }

    const baseMacroVector = buildVector(basePlayer, activeMacroKeys);
    const basePositionVector = includePositions
      ? buildVector(basePlayer, POSITION_RATING_KEYS)
      : null;

    return players
      .filter((candidate) => candidate.ID !== basePlayer.ID)
      .map((candidate) => {
        const candidateMacroVector = buildVector(candidate, activeMacroKeys);
        const macroDistance =
          mode === 'proportional'
            ? proportionalDistance(baseMacroVector, candidateMacroVector)
            : directDistance(baseMacroVector, candidateMacroVector);

        let positionDistance: number | null = null;
        if (includePositions && basePositionVector) {
          const candidatePositionVector = buildVector(candidate, POSITION_RATING_KEYS);
          positionDistance = proportionalDistance(
            basePositionVector,
            candidatePositionVector,
          );
        }

        const combinedDistance =
          includePositions && positionDistance !== null
            ? clamp01((macroDistance + positionDistance) / 2)
            : macroDistance;

        const similarity = Math.round((1 - combinedDistance) * 100);

        return {
          player: candidate,
          similarity,
          macroDistance,
          positionDistance,
        };
      })
      .filter((entry) => entry.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 200);
  }, [players, basePlayer, activeMacroKeys, includePositions, mode, minSimilarity]);

  const tableRows = useMemo(() => {
    if (!basePlayer) return [];
    return [
      {
        player: basePlayer,
        similarity: 100,
        macroDistance: 0,
        positionDistance: 0,
        isBase: true,
      },
      ...similarEntries,
    ];
  }, [basePlayer, similarEntries]);

  const handleMacroToggle = (key: MacroKey) => {
    setMacroSelection((prev) => {
      const activeCount = Object.values(prev).filter(Boolean).length;
      if (prev[key] && activeCount === 1) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  };

  const toggleColumn = (field: string) => {
    setVisibleColumns((current) => {
      const next = new Set(current);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  const handleManualLookup = (event: React.FormEvent) => {
    event.preventDefault();
    setLookupError('');
    if (!players || !manualLookup.trim()) return;
    const query = manualLookup.trim().toLowerCase();
    const byId = players.find((player) => String(player.ID).toLowerCase() === query);
    if (byId) {
      setBasePlayerId(byId.ID as string);
      setManualLookup('');
      return;
    }
    const byName = players.find((player) =>
      String(player.NOMBRE).toLowerCase().includes(query),
    );
    if (byName) {
      setBasePlayerId(byName.ID as string);
      setManualLookup('');
      return;
    }
    setLookupError('No se encontró un jugador con esos datos');
  };

  const handleClearBase = () => {
    setBasePlayerId(null);
  };

  const baseStatusBadges = basePlayer ? getStatusBadges(basePlayer) : [];
  const basePrimaryPosition = basePlayer ? getPrimaryPositionBadge(basePlayer) : null;
  const baseFlagPath = basePlayer
    ? getFlagImagePath(basePlayer.NACIONALIDAD as string)
    : null;
  const baseShieldPath = basePlayer ? getClubShieldPath(basePlayer.CLUB as string) : null;
  const baseClubDisplay = basePlayer
    ? formatClub(basePlayer.CLUB as string, basePlayer.NACIONALIDAD as string)
    : '';
  const basePromedioValue =
    basePlayer && typeof basePlayer.PROMEDIO === 'number' ? basePlayer.PROMEDIO : null;
  const basePromedioText = basePromedioValue !== null ? basePromedioValue : '-';
  const basePromedioColor =
    basePromedioValue !== null ? getStatColor(basePromedioValue) : undefined;

  return (
    <section className="module-stack similar-module">
      <div className="card similar-setup-card">
        <div className="similar-base-grid">
          <div className="base-slot">
            {basePlayer ? (
              <div className="base-player-card">
                <div className="base-player-info">
                  <div className="base-player-row name-row">
                    <strong className="base-player-name">
                      {basePlayer.NOMBRE as string}
                    </strong>
                    <span className="player-badges">
                      {baseStatusBadges.map((badge) => (
                        <span
                          key={badge.key}
                          className={badge.className}
                          title={badge.title}
                        >
                          {badge.label}
                        </span>
                      ))}
                    </span>
                  </div>
                  <div className="base-player-row meta-row">
                    <div className="base-player-icons">
                      {baseFlagPath && (
                        <img
                          src={baseFlagPath}
                          alt=""
                          className="flag-icon"
                          title={basePlayer.NACIONALIDAD as string}
                        />
                      )}
                      {baseShieldPath && (
                        <img
                          src={baseShieldPath}
                          alt=""
                          className="club-shield"
                          title={baseClubDisplay}
                        />
                      )}
                    </div>
                    <span
                      className="base-player-rating"
                      style={{ color: basePromedioColor || undefined }}
                    >
                      {basePromedioText}
                    </span>
                    {basePrimaryPosition && (
                      <span
                        className={`position-badge position-${basePrimaryPosition.line} primary`}
                      >
                        {basePrimaryPosition.position}
                      </span>
                    )}
                  </div>
                </div>
                <div className="base-player-actions">
                  <button
                    type="button"
                    className="secondary-button ghost"
                    onClick={handleClearBase}
                  >
                    Limpiar base
                  </button>
                </div>
              </div>
            ) : (
              <div className="manual-lookup-panel compact">
                <p>Indica un jugador para establecerlo como referencia.</p>
                <form className="manual-lookup-form" onSubmit={handleManualLookup}>
                  <input
                    type="text"
                    placeholder="ID o nombre del jugador"
                    value={manualLookup}
                    onChange={(event) => setManualLookup(event.target.value)}
                  />
                  <button type="submit" className="primary-button">
                    Establecer base
                  </button>
                </form>
                {lookupError && <p className="error">{lookupError}</p>}
              </div>
            )}
          </div>

          <div className="control-block stack-block chip-panel">
            <p
              className="control-title"
              title="Activa o desactiva los macrostats que se cruzan en la comparación."
            >
              Macrostats comparados
            </p>
            <div className="macro-pill-group compact macro-pill-grid">
              {MACRO_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`macro-pill ${macroSelection[key] ? 'active' : ''}`}
                  onClick={() => handleMacroToggle(key)}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div className="control-block stack-block">
            <p
              className="control-title"
              title="Define si la similitud se basa en proporciones o en valores absolutos."
            >
              Modo
            </p>
            <div className="toggle-pill-group">
              <button
                type="button"
                className={`toggle-pill ${mode === 'proportional' ? 'active' : ''}`}
                onClick={() => setMode('proportional')}
                aria-pressed={mode === 'proportional'}
              >
                Proporcional
              </button>
              <button
                type="button"
                className={`toggle-pill ${mode === 'direct' ? 'active' : ''}`}
                onClick={() => setMode('direct')}
                aria-pressed={mode === 'direct'}
              >
                Directa
              </button>
            </div>
          </div>

          <div className="control-block stack-block">
            <p
              className="control-title"
              title="Incluye los promedios por posici�n dentro del c�lculo de similitud."
            >
              Promedios
            </p>
            <div className="toggle-pill-group">
              <button
                type="button"
                className={`toggle-pill ${includePositions ? 'active' : ''}`}
                onClick={() => setIncludePositions((prev) => !prev)}
                aria-pressed={includePositions}
              >
                Usar promedios
              </button>
            </div>
          </div>

          <div className="control-block slider-chip">
            <p
              className="control-title"
              title="Establece el porcentaje mínimo requerido para mostrar coincidencias."
            >
              Porcentaje de similitud
            </p>
            <div className="slider-row">
              <span className="slider-value">{minSimilarity}%</span>
              <input
                id="similarity-slider"
                type="range"
                min={50}
                max={100}
                step={1}
                value={minSimilarity}
                onChange={(event) => setMinSimilarity(Number(event.target.value))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <header className="card-header compact-header">
          <div>
            <h2>Resultados</h2>
            <p className="muted">
              {similarEntries.length} jugadores con al menos {minSimilarity}% de
              similitud.
            </p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setColumnsMenuOpen((prev) => !prev)}
          >
            Columnas {columnsMenuOpen ? '▲' : '▼'}
          </button>
        </header>

        {columnsMenuOpen && (
          <div className="columns-menu">
            <h4>Columnas visibles ({visibleColumns.size})</h4>
            {FIELD_GROUPS.map((group) => {
              const excluded = new Set(['ANFPES']);
              const fields = group.fields.filter(
                (field) => shouldDisplayField(field) && !excluded.has(field),
              );
              if (!fields.length) return null;
              return (
                <div key={group.label} className="column-group">
                  <div className="column-group-header">{group.label}</div>
                  {fields.map((field) => (
                    <label key={field} className="column-option">
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(field)}
                        onChange={() => toggleColumn(field)}
                      />
                      <span>{getFieldLabel(field)}</span>
                    </label>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {!basePlayer && (
          <p className="muted">Selecciona un jugador base para ver recomendaciones.</p>
        )}

        {basePlayer && (
          <div className="table-container">
            <table className="player-table similar-table">
              <thead>
                <tr>
                  <th className="similarity-column">%</th>
                  {sortedVisibleColumns.map((column) => {
                    const headerLabel = getTableHeaderLabel(column);
                    const isImageColumn = column === 'NACIONALIDAD' || column === 'CLUB';
                    const isPositionsColumn = column === 'POSICIONES';
                    const columnType = getColumnType(column);
                    const headerClasses: string[] = [];
                    if (isImageColumn) headerClasses.push('image-header');
                    if (isPositionsColumn) headerClasses.push('positions-header');
                    if (column === 'NACIONALIDAD')
                      headerClasses.push('nationality-column');
                    if (column === 'CLUB') headerClasses.push('club-column');

                    return (
                      <th
                        key={column}
                        className={headerClasses.join(' ')}
                        data-type={columnType}
                        title={headerLabel}
                      >
                        {headerLabel}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {tableRows.map(({ player, similarity, isBase }, index) => (
                  <Fragment key={`${player.ID}-${isBase ? 'base' : `similar-${index}`}`}>
                    <tr
                      data-player-id={player.ID}
                      className={`${player.ID === selectedId ? 'selected' : ''} ${
                        isBase ? 'base-player-row' : ''
                      }`}
                      onClick={() => setSelectedPlayer(player.ID as string)}
                    >
                      <td className="similarity-column">
                        <span className={`similarity-badge ${isBase ? 'base' : ''}`}>
                          {similarity}%
                        </span>
                      </td>
                      {sortedVisibleColumns.map((column) => {
                        if (column === 'NOMBRE') {
                          return (
                            <td key={column} className="player-name-cell">
                              <button
                                type="button"
                                className="player-name-button"
                                onClick={(event) => openPlayerActionsMenu(event, player)}
                              >
                                <span className="player-name-text">{player.NOMBRE}</span>
                              </button>
                            </td>
                          );
                        }

                        if (column === 'NACIONALIDAD') {
                          const rawNationality = player.NACIONALIDAD as string;
                          const flagPath = getFlagImagePath(rawNationality);
                          const nationalityInfo = getNationalityInfo(rawNationality);
                          const displayName = nationalityInfo?.name || rawNationality;

                          return (
                            <td
                              key={column}
                              className="image-cell nationality-column"
                              title={displayName}
                            >
                              {flagPath && (
                                <img src={flagPath} alt="" className="flag-icon" />
                              )}
                            </td>
                          );
                        }

                        if (column === 'CLUB') {
                          const rawClub = player.CLUB as string;
                          const shieldPath = getClubShieldPath(rawClub);
                          const rawNationality = player.NACIONALIDAD as string;
                          const clubDisplay = formatClub(rawClub, rawNationality);

                          return (
                            <td
                              key={column}
                              className="image-cell club-column"
                              title={clubDisplay}
                            >
                              {shieldPath ? (
                                <img src={shieldPath} alt="" className="club-shield" />
                              ) : (
                                <span className="club-icon">⚽</span>
                              )}
                            </td>
                          );
                        }

                        if (column === 'POSICIONES') {
                          return (
                            <td key={column}>
                              <PositionBadges player={player} />
                            </td>
                          );
                        }

                        return (
                          <td key={column} data-type={getColumnType(column)}>
                            <TableCell
                              field={column as keyof DerivedPlayer}
                              player={player}
                              type={getColumnType(column)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                    {isBase && tableRows.length > 1 && (
                      <tr className="base-divider-row">
                        <td colSpan={sortedVisibleColumns.length + 1}>
                          Resultados similares
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function buildVector(player: DerivedPlayer, keys: readonly string[]) {
  return keys.map((key) => {
    const raw = player[key as keyof DerivedPlayer];
    return typeof raw === 'number' ? raw : Number(raw) || 0;
  });
}

function normalize(values: number[]) {
  const sum = values.reduce((acc, value) => acc + value, 0);
  if (sum === 0) return values.map(() => 0);
  return values.map((value) => value / sum);
}

function proportionalDistance(a: number[], b: number[]) {
  if (!a.length || !b.length) return 1;
  const na = normalize(a);
  const nb = normalize(b);
  const delta =
    na.reduce((acc, value, index) => acc + Math.abs(value - nb[index]), 0) / na.length;
  return clamp01(delta);
}

function directDistance(a: number[], b: number[]) {
  if (!a.length || !b.length) return 1;
  const delta =
    a.reduce((acc, value, index) => acc + Math.abs(value - b[index]) / 99, 0) / a.length;
  return clamp01(delta);
}

function clamp01(value: number) {
  if (Number.isNaN(value)) return 1;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function getColumnType(column: string) {
  const ratingColumns = new Set(['PROMEDIO', 'MEJOR PROMEDIO', ...POSITION_RATING_KEYS]);
  const statColumns = new Set([
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
    'ATK',
    'TEC',
    'RES',
    'DEF',
    'FUE',
    'VEL',
  ]);

  if (ratingColumns.has(column)) return 'rating';
  if (statColumns.has(column)) return 'stat';
  if (column === 'TOLERANCIA LESIONES') return 'injury';
  return 'text';
}
