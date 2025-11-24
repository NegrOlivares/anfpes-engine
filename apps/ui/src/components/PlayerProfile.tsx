import type { DerivedPlayer } from '@anfpes/engine';
import { RadarChart } from './RadarChart';
import { PositionBadges, getPlayerPositions } from './PositionBadges';
import { PositionMap, getActivePositionCells } from './PositionMap';
import { useCacheStore, useSelectedPlayer } from '../store/cacheStore';
import { formatPlayerValue, ensureNumber } from '../utils/format';
import {
  formatClub,
  formatFoot,
  formatNationality,
  formatSelectionDisplay,
  formatSkinTone,
  getFieldLabel,
  SPECIAL_SKILL_FIELDS,
} from '../utils/playerDisplay';
import { getFlagImagePath, getClubShieldPath } from '../utils/imageHelpers';
import { getStatColor } from '../types/table';

const NATIONAL_SELECTION_FIELD = 'nro selección' as keyof DerivedPlayer;
const CLASSIC_SELECTION_FIELD = 'nro clasico' as keyof DerivedPlayer;

const MACRO_FIELDS: (keyof DerivedPlayer)[] = ['ATK', 'TEC', 'RES', 'DEF', 'FUE', 'VEL'];
const CORE_STATS: Array<keyof DerivedPlayer> = [
  'ATAQUE',
  'DEFENSA',
  'ESTABILIDAD',
  'RESISTENCIA',
  'VELOCIDAD MÁXIMA',
  'ACELERACIÓN',
  'RESPUESTA',
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

export function PlayerProfile() {
  const player = useSelectedPlayer();
  const status = useCacheStore((state) => state.status);
  const error = useCacheStore((state) => state.error);

  const loading = status === 'idle' || status === 'loading';

  if (loading) {
    return (
      <section className="profile-shell">
        <p className="muted">Leyendo jugadores ···</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="profile-shell">
        <p className="error">{error}</p>
      </section>
    );
  }

  if (!player) {
    return (
      <section className="profile-shell">
        <p className="muted">
          Usa la pestaña <strong>Buscador</strong> para seleccionar un jugador.
        </p>
      </section>
    );
  }

  const clubShield = getClubShieldPath(player.CLUB as string);
  const flagPath = getFlagImagePath(player.NACIONALIDAD as string);
  const positions = getPlayerPositions(player);
  const promedioValue = ensureNumber(player.PROMEDIO);
  const macroDataset = {
    id: String(player.ID),
    label: player.NOMBRE as string,
    values: MACRO_FIELDS.map((field) => ensureNumber(player[field]) ?? 0),
    color: '#7ac9ff',
    fillOpacity: 0.16,
  };

  return (
    <section className="profile-shell">
      <header className="profile-header">
        <div className="profile-identity">
          <div className="photo-placeholder">IMG</div>
          <div className="profile-name">
            <h2>{player.NOMBRE}</h2>
            <div className="profile-sub">
              <span>{formatNationality(player.NACIONALIDAD as string)}</span>
              <span>·</span>
              <span>
                {formatClub(player.CLUB as string, player.NACIONALIDAD as string)}
              </span>
              <span>· ID {player.ID}</span>
            </div>
            <div className="profile-tags">
              <span className="chip gold">{promedioValue ?? '-'}</span>
              {positions.length > 0 && (
                <span className="chip primary-pos">{positions[0]}</span>
              )}
              <PositionBadges player={player} maxVisible={4} />
            </div>
          </div>
        </div>
        <div className="profile-flags">
          {clubShield && <img src={clubShield} alt="" className="club-shield" />}
          {flagPath && <img src={flagPath} alt="" className="flag" />}
        </div>
      </header>

      <div className="profile-grid three-cols">
        <div className="profile-panel">
          <h3>Bio</h3>
          <div className="profile-info-grid">
            <InfoRow label="Altura" value={`${formatPlayerValue(player.ALTURA, 0)} cm`} />
            <InfoRow label="Peso" value={`${formatPlayerValue(player.PESO, 0)} kg`} />
            <InfoRow label="Edad" value={formatPlayerValue(player.EDAD, 0)} />
            <InfoRow label="Pie" value={formatFoot(player.PIE as string)} />
            <InfoRow
              label="Lado Preferido"
              value={formatFoot(player['LADO PREFERIDO'] as string)}
            />
            <InfoRow
              label="Selección Nacional"
              value={formatSelectionDisplay(player[NATIONAL_SELECTION_FIELD] as string)}
            />
            <InfoRow
              label="Selección Clásica"
              value={formatSelectionDisplay(player[CLASSIC_SELECTION_FIELD] as string)}
            />
            <InfoRow label="Tono de Piel" value={formatSkinTone(player['SKIN COLOR'])} />
            <InfoRow label="Número Dorsal" value={formatPlayerValue(player.DORSAL, 0)} />
            <InfoRow
              label="Nombre Dorsal"
              value={formatPlayerValue(player.DORSAL_1, 0)}
            />
          </div>
        </div>

        <div className="profile-panel">
          <h3>Resumen</h3>
          <div className="profile-summary">
            <div>
              <small>Promedio Principal</small>
              <p className="big">{formatPlayerValue(player.PROMEDIO, 1)}</p>
            </div>
            <div>
              <small>Posición Principal</small>
              <p className="big">{positions[0] ?? '-'}</p>
            </div>
            <div>
              <small>Club</small>
              <p>{formatClub(player.CLUB as string, player.NACIONALIDAD as string)}</p>
            </div>
            <div>
              <small>Tolerancia Lesiones</small>
              <p>{player['TOLERANCIA LESIONES'] ?? '-'}</p>
            </div>
            <div>
              <small>Consistencia</small>
              <p>{formatPlayerValue(player['CONSISTENCIA'], 0)}</p>
            </div>
            <div>
              <small>Condición Física</small>
              <p>{formatPlayerValue(player['CONDICIÓN FÍSICA'], 0)}</p>
            </div>
          </div>
        </div>

        <div className="profile-panel tall">
          <h3>Radar & Posiciones</h3>
          <div className="profile-radar-row">
            <RadarChart
              labels={MACRO_FIELDS.map((field) => getFieldLabel(field as string))}
              datasets={[macroDataset]}
              size={220}
              showLegend={false}
            />
            <div className="profile-positions-compact">
              <h4>Posiciones</h4>
              <PositionBadges player={player} maxVisible={6} />
              <PositionMap
                player={player}
                activeCells={getActivePositionCells(player)}
                primaryPosition={positions[0]}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="profile-panel full stats-card">
        <h3>Stats</h3>
        <div className="profile-stats-grid compact">
          {CORE_STATS.map((field) => {
            const value = ensureNumber(player[field]) ?? 0;
            const color = getStatColor(value) ?? '#7ac9ff';
            const width = Math.max(0, Math.min(100, (value / 99) * 100));
            return (
              <div key={field as string} className="stat-block row compact">
                <span className="stat-label">{getFieldLabel(field as string)}</span>
                <div className="stat-bar compact">
                  <div
                    className="stat-bar-fill"
                    style={{ width: `${width}%`, background: color }}
                  />
                </div>
                <span className="stat-value">{formatPlayerValue(value, 0)}</span>
              </div>
            );
          })}
        </div>
        <h4>Habilidades Especiales</h4>
        <PlayerSkills player={player} />
      </div>
    </section>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="info-row">
      <span className="muted">{label}</span>
      <span className="strong">{value}</span>
    </div>
  );
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
    return <p className="muted">Sin habilidades activas</p>;
  }

  return (
    <div className="skills-grid">
      {activeSkills.map((skill) => (
        <span key={skill.field} className="skill-pill active">
          ? {skill.label}
        </span>
      ))}
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
