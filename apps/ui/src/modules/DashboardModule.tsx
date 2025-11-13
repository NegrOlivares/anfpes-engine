import { CacheSummary } from '../components/CacheSummary';
import { PlayerPeek } from '../components/PlayerPeek';

export function DashboardModule() {
  return (
    <div className="module-stack">
      <CacheSummary />
      <PlayerPeek />
    </div>
  );
}
