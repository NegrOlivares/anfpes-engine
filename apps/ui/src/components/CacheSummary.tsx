import { useMemo } from 'react';
import { cacheClient } from '../services/cacheClient';
import { useCacheStore } from '../store/cacheStore';

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function CacheSummary() {
  const status = useCacheStore((state) => state.status);
  const meta = useCacheStore((state) => state.meta);
  const error = useCacheStore((state) => state.error);

  const generated = useMemo(() => {
    if (!meta) {
      return null;
    }

    try {
      return dateFormatter.format(new Date(meta.generatedAt));
    } catch {
      return meta.generatedAt;
    }
  }, [meta]);

  const loading = status === 'idle' || status === 'loading';

  return (
    <section className="card">
      <header className="card-header">
        <div>
          <h2>Estado de la cache</h2>
          <p className="muted">
            Lectura directa desde <code>{cacheClient.basePath}</code>
          </p>
        </div>
        <span className="tag">{cacheClient.env}</span>
      </header>

      {loading && <p className="loading">Leyendo metadatos...</p>}
      {error && <p className="error">{error}</p>}

      {meta && !loading && !error && (
        <>
          <div className="meta-grid">
            <div className="meta-item">
              <dl>
                <dt>Version</dt>
                <dd>{meta.dataVersion}</dd>
              </dl>
            </div>
            <div className="meta-item">
              <dl>
                <dt>Generado</dt>
                <dd>{generated}</dd>
              </dl>
            </div>
            <div className="meta-item">
              <dl>
                <dt>Jugadores</dt>
                <dd>{meta.counts.players.toLocaleString('es-CL')}</dd>
              </dl>
            </div>
            <div className="meta-item">
              <dl>
                <dt>Clubes</dt>
                <dd>{meta.counts.clubs.toLocaleString('es-CL')}</dd>
              </dl>
            </div>
            <div className="meta-item">
              <dl>
                <dt>Tabla 0</dt>
                <dd title={meta.sources.table}>{meta.sources.table.split('\\').pop()}</dd>
              </dl>
            </div>
            <div className="meta-item">
              <dl>
                <dt>Shop tags</dt>
                <dd title={meta.sources.shop}>{meta.sources.shop.split('\\').pop()}</dd>
              </dl>
            </div>
          </div>

          <p className="status">
            Hash jugadores: <code>{meta.hashes.players}</code>
          </p>
        </>
      )}
    </section>
  );
}
