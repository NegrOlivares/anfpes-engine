import { useMemo, useState, useEffect } from 'react';
import type { DerivedPlayer } from '@anfpes/engine';
import { cacheClient } from '../services/cacheClient';
import { useCacheStore } from '../store/cacheStore';
import { formatPlayerValue } from '../utils/format';

const SEARCH_FIELDS: Array<keyof DerivedPlayer> = [
  'NOMBRE',
  'CLUB',
  'NACIONALIDAD',
  'ID',
];

const POSITION_FIELDS: Array<keyof DerivedPlayer> = [
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
];

const KEY_STATS: Array<keyof DerivedPlayer> = [
  'PROMEDIO',
  'MEJOR PROMEDIO',
  'PROMEDIO CENSANTE',
  'PT',
  'CT/LIB',
  'SA',
  'LA',
  'CCD',
  'CC',
  'VOL',
  'MP',
  'EX',
  'SD',
  'DC',
];

const FAV_SIDE_FIELD = 'FAVOURED SIDE' as keyof DerivedPlayer;
const INJURY_FIELD = 'TOLERANCIA LESIONES' as keyof DerivedPlayer;
const FITNESS_FIELD = 'CONDICIÓN FITNESS' as keyof DerivedPlayer;

function normalize(value: unknown): string {
  return String(value ?? '').toLowerCase();
}

export function PlayerSearch() {
  const players = useCacheStore((state) => state.players);
  const status = useCacheStore((state) => state.status);
  const error = useCacheStore((state) => state.error);

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!players) {
      return [];
    }

    if (!normalizedQuery) {
      return players.slice(0, 50);
    }

    return players
      .filter((player) =>
        SEARCH_FIELDS.some((field) => normalize(player[field]).includes(normalizedQuery)),
      )
      .slice(0, 50);
  }, [players, normalizedQuery]);

  useEffect(() => {
    if (!results.length) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !results.some((player) => player.ID === selectedId)) {
      setSelectedId(results[0].ID as string);
    }
  }, [results, selectedId]);

  const selected =
    results.find((player) => player.ID === selectedId) ??
    players?.find((player) => player.ID === selectedId);

  const loading = status === 'idle' || status === 'loading';

  return (
    <section className="card player-search">
      <header className="card-header">
        <div>
          <h2>Buscador</h2>
          <p className="muted">
            Filtra por ID, nombre, club o nacionalidad (fuente:{' '}
            <code>{cacheClient.basePath}</code>)
          </p>
        </div>
        <input
          className="search-input"
          type="text"
          placeholder="Ej. 1436, Maradona, Seleccion..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </header>

      {loading && <p className="loading">Leyendo jugadores...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="player-search__body">
          <div className="player-search__list">
            {results.length === 0 && (
              <p className="muted">
                No hay coincidencias para <strong>{query}</strong>.
              </p>
            )}
            {results.length > 0 && (
              <ul>
                {results.map((player) => (
                  <li key={player.ID}>
                    <button
                      type="button"
                      className={player.ID === selectedId ? 'selected' : undefined}
                      onClick={() => setSelectedId(player.ID as string)}
                    >
                      <span className="id">{player.ID}</span>
                      <span className="name">{player.NOMBRE}</span>
                      <span className="muted club">{player.CLUB}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="player-search__details">
            {!selected && (
              <p className="muted">Selecciona un jugador para ver detalles.</p>
            )}
            {selected && (
              <>
                <div className="player-search__details-header">
                  <div>
                    <p className="eyebrow">ID {selected.ID}</p>
                    <h3>{selected.NOMBRE}</h3>
                    <p className="muted">{selected.CLUB}</p>
                  </div>
                  <div className="player-search__positions">
                    {POSITION_FIELDS.map((field) => {
                      const value = selected[field];
                      if (!value) {
                        return null;
                      }
                      return (
                        <span key={field as string} className="tag">
                          {value}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="player-search__details-grid">
                  <div>
                    <small>Nationalidad</small>
                    <p>{selected.NACIONALIDAD ?? '-'}</p>
                  </div>
                  <div>
                    <small>Edad</small>
                    <p>{formatPlayerValue(selected.EDAD)}</p>
                  </div>
                  <div>
                    <small>Pie</small>
                    <p>{selected.PIE ?? '-'}</p>
                  </div>
                  <div>
                    <small>Altura</small>
                    <p>{formatPlayerValue(selected.ALTURA, 0)} cm</p>
                  </div>
                  <div>
                    <small>Peso</small>
                    <p>{formatPlayerValue(selected.PESO, 0)} kg</p>
                  </div>
                  <div>
                    <small>Fav side</small>
                    <p>{selected[FAV_SIDE_FIELD] ?? '-'}</p>
                  </div>
                  <div>
                    <small>Tolerancia lesiones</small>
                    <p>{selected[INJURY_FIELD] ?? '-'}</p>
                  </div>
                  <div>
                    <small>Condicion</small>
                    <p>{formatPlayerValue(selected[FITNESS_FIELD], 0)}</p>
                  </div>
                </div>

                <div className="player-search__stats">
                  {KEY_STATS.map((key) => (
                    <div key={key as string}>
                      <small>{key}</small>
                      <p>{formatPlayerValue(selected[key], 3)}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
