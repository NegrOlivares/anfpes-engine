import { cacheClient } from '../services/cacheClient';
import {
  FAV_SIDE_FIELD,
  FITNESS_FIELD,
  INJURY_FIELD,
  KEY_STATS,
  POSITION_FIELDS,
} from '../constants/playerFields';
import { formatPlayerValue } from '../utils/format';
import { useCacheStore, useSelectedPlayer } from '../store/cacheStore';
import {
  formatClub,
  formatFoot,
  formatNationality,
  formatSelectionDisplay,
  formatSkinTone,
  getFieldDisplayValue,
  getFieldLabel,
} from '../utils/playerDisplay';

export function PlayerProfile() {
  const player = useSelectedPlayer();
  const status = useCacheStore((state) => state.status);
  const error = useCacheStore((state) => state.error);

  const loading = status === 'idle' || status === 'loading';

  return (
    <section className="card player-profile">
      <header className="card-header">
        <div>
          <h2>Perfil</h2>
          <p className="muted">
            Ficha completa del jugador seleccionado (fuente:{' '}
            <code>{cacheClient.basePath}</code>)
          </p>
        </div>
      </header>

      {loading && <p className="loading">Leyendo jugadores...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && !player && (
        <p className="muted">
          Usa la pestaña <strong>Buscador</strong> para seleccionar un jugador.
        </p>
      )}

      {!loading && !error && player && (
        <div className="player-profile__card">
          <div className="player-profile__header">
            <div>
              <p className="eyebrow">ID {player.ID}</p>
              <h3>{player.NOMBRE}</h3>
              <p className="muted">
                {formatClub(player.CLUB as string, player.NACIONALIDAD as string)}
              </p>
            </div>
            <div className="player-profile__positions">
              {POSITION_FIELDS.map((field, index) => {
                const value = player[field];
                if (!value) {
                  return null;
                }
                const isPrimary = index === 0;
                return (
                  <span
                    key={field as string}
                    className={isPrimary ? 'tag primary-position' : 'tag'}
                  >
                    {value}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="player-profile__grid">
            <div>
              <small>Nacionalidad</small>
              <p>{formatNationality(player.NACIONALIDAD as string)}</p>
            </div>
            <div>
              <small>Edad</small>
              <p>{formatPlayerValue(player.EDAD, 0)}</p>
            </div>
            <div>
              <small>Pie</small>
              <p>{formatFoot(player.PIE as string)}</p>
            </div>
            <div>
              <small>Lado Preferido</small>
              <p>{formatFoot(player[FAV_SIDE_FIELD] as string)}</p>
            </div>
            <div>
              <small>Altura</small>
              <p>{formatPlayerValue(player.ALTURA, 0)} cm</p>
            </div>
            <div>
              <small>Peso</small>
              <p>{formatPlayerValue(player.PESO, 0)} kg</p>
            </div>
            <div>
              <small>Número Dorsal</small>
              <p>{getFieldDisplayValue('DORSAL', player)}</p>
            </div>
            <div>
              <small>Nombre Dorsal</small>
              <p>{getFieldDisplayValue('DORSAL_1', player)}</p>
            </div>
            <div>
              <small>Tono de Piel</small>
              <p>{formatSkinTone(player['SKIN COLOR'])}</p>
            </div>
            <div>
              <small>Seleccionado Nacional</small>
              <p>{formatSelectionDisplay(player['nro selecci\u00F3n'])}</p>
            </div>
            <div>
              <small>Selección Clásica</small>
              <p>{formatSelectionDisplay(player['nro clasico'])}</p>
            </div>
            <div>
              <small>Tolerancia Lesiones</small>
              <p>{player[INJURY_FIELD] ?? '-'}</p>
            </div>
            <div>
              <small>Condición Física</small>
              <p>{formatPlayerValue(player[FITNESS_FIELD], 0)}</p>
            </div>
          </div>

          <div className="player-profile__stats">
            {KEY_STATS.map((key) => (
              <div key={key as string}>
                <small>{getFieldLabel(key as string)}</small>
                <p>{formatPlayerValue(player[key], 3)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
