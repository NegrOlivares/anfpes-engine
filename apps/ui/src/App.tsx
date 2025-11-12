import { CacheSummary } from './components/CacheSummary';
import { PlayerPeek } from './components/PlayerPeek';
import { PlayerSearch } from './components/PlayerSearch';
import { useCacheLoader } from './store/cacheStore';

const cacheEnv = import.meta.env.VITE_CACHE_ENV ?? 'dev';

export default function App() {
  useCacheLoader();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">ANFPES :: Fase 4</p>
          <h1>Panel de datos</h1>
          <p className="subtitle">
            Explorador de la cache generada por el motor. Fuente: <code>{cacheEnv}</code>
          </p>
        </div>
      </header>
      <main className="app-main">
        <CacheSummary />
        <PlayerPeek />
        <PlayerSearch />
      </main>
    </div>
  );
}
