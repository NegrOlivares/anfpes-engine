import { useMemo, useState } from 'react';
import type { DerivedPlayer } from '@anfpes/engine';
import { useCacheStore } from '../store/cacheStore';
import { ANFPES_CLUBS } from '../data/playerStatus';
import { ensureNumber } from '../utils/format';
import { formatNationality } from '../utils/playerDisplay';
import {
  getPlayerPositions,
  getPositionLine,
  type PositionLine,
} from '../components/PositionBadges';
import { useSearchPresetStore } from '../store/searchPresetStore';
import { MODULE_IDS, useModuleStore } from '../store/moduleStore';

const MACRO_FIELDS: Array<keyof DerivedPlayer> = [
  'ATK',
  'TEC',
  'RES',
  'DEF',
  'FUE',
  'VEL',
];
const LINE_LABELS: Record<PositionLine, string> = {
  PT: 'Portero',
  DEF: 'Defensa',
  MED: 'Mediocampo',
  ATA: 'Ataque',
};

function average(values: Array<number | undefined>): number | undefined {
  const valid = values.filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value),
  );
  if (!valid.length) {
    return undefined;
  }
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function deviation(values: number[], mean: number | undefined): number | undefined {
  if (!values.length || mean === undefined) {
    return undefined;
  }
  const variance =
    values.reduce((sum, value) => {
      const diff = value - mean;
      return sum + diff * diff;
    }, 0) / values.length;
  return Math.sqrt(variance);
}

function formatNumber(value: number | undefined, digits = 1): string {
  if (value === undefined || Number.isNaN(value)) {
    return '-';
  }
  return value.toLocaleString('es-CL', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

type SortField = 'club' | 'avg' | 'atkAvg' | 'defAvg' | 'spread';
type SortDirection = 'asc' | 'desc';

export function DashboardModule() {
  const players = useCacheStore((state) => state.players);
  const status = useCacheStore((state) => state.status);
  const error = useCacheStore((state) => state.error);
  const setSearchPreset = useSearchPresetStore((state) => state.setPreset);
  const setActiveModule = useModuleStore((state) => state.setActiveModuleId);

  const [sortField, setSortField] = useState<SortField>('avg');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [natSortField, setNatSortField] = useState<'country' | 'avg' | 'primaryLine'>(
    'avg',
  );
  const [natSortDirection, setNatSortDirection] = useState<SortDirection>('desc');
  const [injurySortField, setInjurySortField] = useState<'club' | 'consistencyAvg'>(
    'club',
  );
  const [injurySortDirection, setInjurySortDirection] = useState<SortDirection>('asc');

  const loading = status === 'idle' || status === 'loading';

  const anfpesPlayers = useMemo(() => {
    if (!players) {
      return [];
    }
    return players.filter((player) => {
      const club = String(player.CLUB ?? '').trim();
      return club && ANFPES_CLUBS.has(club);
    });
  }, [players]);

  const clubRanking = useMemo(() => {
    if (!players) return [];

    const byClub = new Map<string, DerivedPlayer[]>();
    players.forEach((player) => {
      const club = String(player.CLUB ?? '').trim();
      if (!club || !ANFPES_CLUBS.has(club)) {
        return;
      }
      const bucket = byClub.get(club);
      if (bucket) {
        bucket.push(player);
      } else {
        byClub.set(club, [player]);
      }
    });

    const entries = Array.from(byClub.entries())
      .map(([club, roster]) => {
        const ratings = roster
          .map((p) => ensureNumber(p.PROMEDIO))
          .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
        const avg = average(ratings);
        const atkAvg = average(roster.map((p) => ensureNumber(p.ATK)));
        const defAvg = average(roster.map((p) => ensureNumber(p.DEF)));
        const spread = deviation(ratings, avg);
        return {
          club,
          count: roster.length,
          avg,
          atkAvg,
          defAvg,
          spread,
        };
      })
      .filter((entry) => entry.count > 0);

    return entries;
  }, [players]);

  const sortedClubRanking = useMemo(() => {
    const sorted = [...clubRanking];
    sorted.sort((a, b) => {
      let aVal: string | number = 0;
      let bVal: string | number = 0;

      if (sortField === 'club') {
        aVal = a.club;
        bVal = b.club;
      } else {
        aVal = a[sortField] ?? 0;
        bVal = b[sortField] ?? 0;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
    return sorted;
  }, [clubRanking, sortField, sortDirection]);

  const nationalityBreakdown = useMemo(() => {
    if (!anfpesPlayers.length) {
      return [];
    }

    const map = new Map<
      string,
      {
        count: number;
        ratings: number[];
        positions: Partial<Record<PositionLine, number>>;
      }
    >();

    anfpesPlayers.forEach((player) => {
      const country = formatNationality(player.NACIONALIDAD as string);
      if (!country || country === '-') {
        return;
      }

      const bucket = map.get(country) ?? {
        count: 0,
        ratings: [],
        positions: {},
      };

      bucket.count += 1;

      const rating = ensureNumber(player.PROMEDIO);
      if (typeof rating === 'number' && Number.isFinite(rating)) {
        bucket.ratings.push(rating);
      }

      const positions = getPlayerPositions(player);
      const primary = positions.length ? getPositionLine(positions[0]) : undefined;
      if (primary) {
        bucket.positions[primary] = (bucket.positions[primary] ?? 0) + 1;
      }

      map.set(country, bucket);
    });

    const entries = Array.from(map.entries()).map(([country, info]) => {
      const avg = average(info.ratings);
      const primaryLine =
        Object.entries(info.positions).sort(
          (a, b) => (b[1] ?? 0) - (a[1] ?? 0),
        )[0]?.[0] ?? undefined;
      return {
        country,
        count: info.count,
        avg,
        primaryLine: primaryLine as PositionLine | undefined,
      };
    });

    return entries;
  }, [anfpesPlayers]);

  const sortedNationalityBreakdown = useMemo(() => {
    const sorted = [...nationalityBreakdown];
    sorted.sort((a, b) => {
      let aVal: string | number = 0;
      let bVal: string | number = 0;

      if (natSortField === 'country') {
        aVal = a.country;
        bVal = b.country;
      } else if (natSortField === 'primaryLine') {
        aVal = a.primaryLine ?? '';
        bVal = b.primaryLine ?? '';
      } else {
        aVal = a[natSortField] ?? 0;
        bVal = b[natSortField] ?? 0;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return natSortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return natSortDirection === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
    return sorted;
  }, [nationalityBreakdown, natSortField, natSortDirection]);

  const injuryConsistency = useMemo(() => {
    if (!anfpesPlayers.length) {
      return [];
    }

    const map = new Map<
      string,
      {
        injuryCounts: Record<string, number>;
        consistency: number[];
      }
    >();

    anfpesPlayers.forEach((player) => {
      const club = String(player.CLUB ?? '').trim();
      if (!club) return;

      const bucket = map.get(club) ?? {
        injuryCounts: {},
        consistency: [],
      };

      const injury = String(player['TOLERANCIA LESIONES'] ?? '')
        .trim()
        .toUpperCase();
      if (injury && injury !== '-') {
        bucket.injuryCounts[injury] = (bucket.injuryCounts[injury] ?? 0) + 1;
      }

      const consist = ensureNumber(player.CONSISTENCIA);
      if (typeof consist === 'number' && Number.isFinite(consist)) {
        bucket.consistency.push(consist);
      }

      map.set(club, bucket);
    });

    const entries = Array.from(map.entries()).map(([club, info]) => {
      const injuryStr = Object.entries(info.injuryCounts)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([grade, count]) => `${grade}: ${count}`)
        .join(', ');

      const consistencyAvg = average(info.consistency);

      return {
        club,
        injuryStr: injuryStr || '-',
        consistencyAvg,
      };
    });

    return entries;
  }, [anfpesPlayers]);

  const sortedInjuryConsistency = useMemo(() => {
    const sorted = [...injuryConsistency];
    sorted.sort((a, b) => {
      if (injurySortField === 'club') {
        return injurySortDirection === 'asc'
          ? a.club.localeCompare(b.club)
          : b.club.localeCompare(a.club);
      }
      const aVal = a.consistencyAvg ?? 0;
      const bVal = b.consistencyAvg ?? 0;
      return injurySortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  }, [injuryConsistency, injurySortField, injurySortDirection]);

  const handleOpenClub = (club: string) => {
    setSearchPreset({ query: club });
    setActiveModule(MODULE_IDS.search);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleNatSort = (field: 'country' | 'avg' | 'primaryLine') => {
    if (natSortField === field) {
      setNatSortDirection(natSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setNatSortField(field);
      setNatSortDirection('desc');
    }
  };

  const handleInjurySort = (field: 'club' | 'consistencyAvg') => {
    if (injurySortField === field) {
      setInjurySortDirection(injurySortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setInjurySortField(field);
      setInjurySortDirection(field === 'consistencyAvg' ? 'desc' : 'asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return ' ↕';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  const getNatSortIcon = (field: 'country' | 'avg' | 'primaryLine') => {
    if (natSortField !== field) return ' ↕';
    return natSortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  const getInjurySortIcon = (field: 'club' | 'consistencyAvg') => {
    if (injurySortField !== field) return ' ↕';
    return injurySortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">
        <section className="dashboard-widget">
          <header className="widget-header">
            <div>
              <h3 className="widget-title">Ranking de clubes ANFPES</h3>
              <p className="widget-subtitle">
                Todos los clubes con promedio de plantilla y macrostats ATK/DEF, con
                dispersión de promedios.
              </p>
            </div>
          </header>
          {loading && <p className="loading">Cargando datos...</p>}
          {error && <p className="error">{error}</p>}
          {!loading && !error && (
            <div className="widget-content">
              <div className="dashboard-table-wrapper scrollable">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th className="rank-header">#</th>
                      <th className="sortable" onClick={() => handleSort('club')}>
                        Club{getSortIcon('club')}
                      </th>
                      <th
                        className="sortable stat-header"
                        onClick={() => handleSort('avg')}
                      >
                        Promedio{getSortIcon('avg')}
                      </th>
                      <th
                        className="sortable stat-header"
                        onClick={() => handleSort('atkAvg')}
                      >
                        ATK{getSortIcon('atkAvg')}
                      </th>
                      <th
                        className="sortable stat-header"
                        onClick={() => handleSort('defAvg')}
                      >
                        DEF{getSortIcon('defAvg')}
                      </th>
                      <th
                        className="sortable stat-header"
                        onClick={() => handleSort('spread')}
                        title="Desviación estándar del promedio de jugadores"
                      >
                        Dispersión{getSortIcon('spread')}
                      </th>
                      <th className="action-header"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedClubRanking.map((entry, index) => (
                      <tr key={entry.club}>
                        <td className="rank-cell">{index + 1}</td>
                        <td className="club-cell">{entry.club}</td>
                        <td className="stat-cell">{formatNumber(entry.avg)}</td>
                        <td className="stat-cell">{formatNumber(entry.atkAvg)}</td>
                        <td className="stat-cell">{formatNumber(entry.defAvg)}</td>
                        <td className="stat-cell">{formatNumber(entry.spread)}</td>
                        <td className="action-cell">
                          <button
                            type="button"
                            className="widget-button"
                            onClick={() => handleOpenClub(entry.club)}
                          >
                            Ver plantilla
                          </button>
                        </td>
                      </tr>
                    ))}
                    {sortedClubRanking.length === 0 && (
                      <tr>
                        <td colSpan={7} className="empty-cell">
                          No hay datos de clubes ANFPES.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="dashboard-widget">
          <header className="widget-header">
            <div>
              <h3 className="widget-title">Mapa de nacionalidades (clubes ANFPES)</h3>
              <p className="widget-subtitle">
                Todas las nacionalidades por presencia, con promedio y línea predominante.
              </p>
            </div>
          </header>
          <div className="widget-content">
            <div className="dashboard-table-wrapper scrollable">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => handleNatSort('country')}>
                      País{getNatSortIcon('country')}
                    </th>
                    <th
                      className="sortable stat-header"
                      onClick={() => handleNatSort('avg')}
                    >
                      Promedio{getNatSortIcon('avg')}
                    </th>
                    <th className="sortable" onClick={() => handleNatSort('primaryLine')}>
                      Línea{getNatSortIcon('primaryLine')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedNationalityBreakdown.map((entry) => (
                    <tr key={entry.country}>
                      <td>{entry.country}</td>
                      <td className="stat-cell">{formatNumber(entry.avg)}</td>
                      <td>{entry.primaryLine ? LINE_LABELS[entry.primaryLine] : '-'}</td>
                    </tr>
                  ))}
                  {sortedNationalityBreakdown.length === 0 && (
                    <tr>
                      <td colSpan={3} className="empty-cell">
                        No hay jugadores ANFPES para calcular nacionalidades.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="dashboard-widget">
          <header className="widget-header">
            <div>
              <h3 className="widget-title">Termómetro lesiones / consistencia</h3>
              <p className="widget-subtitle">
                Distribución de tolerancia a lesiones y consistencia por club ANFPES
                (conteo por grado).
              </p>
            </div>
          </header>
          <div className="widget-content">
            <div className="dashboard-table-wrapper scrollable">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => handleInjurySort('club')}>
                      Club{getInjurySortIcon('club')}
                    </th>
                    <th>Tolerancia Lesiones</th>
                    <th
                      className="sortable stat-header"
                      onClick={() => handleInjurySort('consistencyAvg')}
                    >
                      Consistencia{getInjurySortIcon('consistencyAvg')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedInjuryConsistency.map((entry) => (
                    <tr key={entry.club}>
                      <td>{entry.club}</td>
                      <td className="injury-cell">{entry.injuryStr}</td>
                      <td className="stat-cell">{formatNumber(entry.consistencyAvg)}</td>
                    </tr>
                  ))}
                  {sortedInjuryConsistency.length === 0 && (
                    <tr>
                      <td colSpan={3} className="empty-cell">
                        No hay datos de clubes ANFPES para mostrar riesgos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
