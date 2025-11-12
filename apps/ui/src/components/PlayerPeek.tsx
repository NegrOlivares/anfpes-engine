import type { DerivedPlayer } from '@anfpes/engine';
import { cacheClient } from '../services/cacheClient';
import { useCacheStore } from '../store/cacheStore';
import { formatPlayerValue } from '../utils/format';

const columns: Array<{ key: keyof DerivedPlayer | string; label: string }> = [
  { key: 'ID', label: 'ID' },
  { key: 'NOMBRE', label: 'Nombre' },
  { key: 'CLUB', label: 'Club' },
  { key: 'NACIONALIDAD', label: 'Nacionalidad' },
  { key: 'PROMEDIO', label: 'Promedio' },
  { key: 'PT', label: 'PT' },
  { key: 'CT/LIB', label: 'CT/LIB' },
  { key: 'DC', label: 'DC' },
];

export function PlayerPeek() {
  const players = useCacheStore((state) => state.players);
  const status = useCacheStore((state) => state.status);
  const error = useCacheStore((state) => state.error);

  const loading = status === 'idle' || status === 'loading';
  const preview = players?.slice(0, 20);

  return (
    <section className="card">
      <header className="card-header">
        <div>
          <h2>Vista rapida de jugadores</h2>
          <p className="muted">
            Primeros 20 registros desde <code>{cacheClient.basePath}/players.json</code>
          </p>
        </div>
      </header>

      {loading && <p className="loading">Cargando jugadores...</p>}
      {error && <p className="error">{error}</p>}

      {preview && !loading && !error && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key as string}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((player) => (
                <tr key={player.ID}>
                  {columns.map((column) => {
                    const value = player[column.key as keyof DerivedPlayer];
                    return (
                      <td key={column.key as string}>
                        {value === null || value === undefined || value === '' ? (
                          <span className="muted">-</span>
                        ) : (
                          formatPlayerValue(value, 3)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
