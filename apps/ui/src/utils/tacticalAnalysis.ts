import type { FormationSlot, PlayerInstruction, RunDirection } from '../types/tactics';

// Configuración de la cancha (dividida en zonas)
const PITCH_ZONES = {
  rows: 6, // Defensive third, mid-defensive, mid-offensive, attacking third
  cols: 5, // Left wing, left channel, center, right channel, right wing
};

interface Position {
  x: number;
  y: number;
}

interface ZoneCoverage {
  zone: string; // "row-col" e.g., "0-2"
  players: string[]; // player IDs covering this zone
  coverage: number; // 0-1 scale
}

interface GhostPosition {
  playerId: string;
  originalX: number;
  originalY: number;
  ghostX: number;
  ghostY: number;
}

interface PositionConflict {
  players: string[];
  x: number;
  y: number;
  severity: 'warning' | 'critical';
}

// Calcular posición virtual basada en flechas de movimiento
function calculateGhostPosition(x: number, y: number, arrows: RunDirection[]): Position {
  let deltaX = 0;
  let deltaY = 0;

  // Movimiento por flecha (15% del campo por flecha)
  const moveDistance = 15;

  arrows.forEach((arrow) => {
    switch (arrow) {
      case 'FORWARD':
        deltaY -= moveDistance;
        break;
      case 'BACKWARD':
        deltaY += moveDistance;
        break;
      case 'LEFT':
        deltaX -= moveDistance;
        break;
      case 'RIGHT':
        deltaX += moveDistance;
        break;
      case 'DIAGONAL_LEFT_FORWARD':
        deltaX -= moveDistance * 0.7;
        deltaY -= moveDistance * 0.7;
        break;
      case 'DIAGONAL_RIGHT_FORWARD':
        deltaX += moveDistance * 0.7;
        deltaY -= moveDistance * 0.7;
        break;
      case 'DIAGONAL_LEFT_BACKWARD':
        deltaX -= moveDistance * 0.7;
        deltaY += moveDistance * 0.7;
        break;
      case 'DIAGONAL_RIGHT_BACKWARD':
        deltaX += moveDistance * 0.7;
        deltaY += moveDistance * 0.7;
        break;
    }
  });

  return {
    x: Math.max(0, Math.min(100, x + deltaX)),
    y: Math.max(0, Math.min(100, y + deltaY)),
  };
}

// Calcular zona de una posición
function getZone(x: number, y: number): string {
  const col = Math.min(
    PITCH_ZONES.cols - 1,
    Math.max(0, Math.floor((x / 100) * PITCH_ZONES.cols)),
  );
  const row = Math.min(
    PITCH_ZONES.rows - 1,
    Math.max(0, Math.floor((y / 100) * PITCH_ZONES.rows)),
  );
  return `${row}-${col}`;
}

// Calcular radio de cobertura basado en posición
function getCoverageRadius(y: number): number {
  // Defensores cubren más (20%), mediocampistas (18%), delanteros (15%)
  if (y > 66) return 20; // Defensive third
  if (y > 33) return 18; // Midfield
  return 15; // Attacking third
}

// Calcular zonas cubiertas por un jugador
function getCoveredZones(x: number, y: number, radius: number): string[] {
  const zones: Set<string> = new Set();

  // Centro
  zones.add(getZone(x, y));

  // Zonas adyacentes según radio
  for (let dx = -radius; dx <= radius; dx += 10) {
    for (let dy = -radius; dy <= radius; dy += 10) {
      const newX = Math.max(0, Math.min(100, x + dx));
      const newY = Math.max(0, Math.min(100, y + dy));
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= radius) {
        zones.add(getZone(newX, newY));
      }
    }
  }

  return Array.from(zones);
}

export function analyzeTacticalCoverage(
  slots: FormationSlot[],
  playerInstructions: Record<string, PlayerInstruction>,
) {
  // 1. Calcular posiciones ghost
  const ghostPositions: GhostPosition[] = slots
    .filter((slot) => slot.playerId)
    .map((slot) => {
      const arrows = playerInstructions[slot.slotId]?.runArrows || [];
      const ghost = calculateGhostPosition(slot.x, slot.y, arrows);
      return {
        playerId: slot.playerId!,
        originalX: slot.x,
        originalY: slot.y,
        ghostX: ghost.x,
        ghostY: ghost.y,
      };
    });

  // 2. Calcular cobertura por zona (usando posiciones ghost)
  const zoneMap = new Map<string, { players: string[]; coverage: number }>();

  // Inicializar todas las zonas
  for (let row = 0; row < PITCH_ZONES.rows; row++) {
    for (let col = 0; col < PITCH_ZONES.cols; col++) {
      zoneMap.set(`${row}-${col}`, { players: [], coverage: 0 });
    }
  }

  // Calcular cobertura
  ghostPositions.forEach((ghost) => {
    const radius = getCoverageRadius(ghost.ghostY);
    const coveredZones = getCoveredZones(ghost.ghostX, ghost.ghostY, radius);

    coveredZones.forEach((zone) => {
      const current = zoneMap.get(zone);
      if (current) {
        current.players.push(ghost.playerId);
        current.coverage = Math.min(1, current.coverage + 0.4); // +40% por jugador
      }
    });
  });

  const zoneCoverage: ZoneCoverage[] = Array.from(zoneMap.entries()).map(
    ([zone, data]) => ({
      zone,
      players: data.players,
      coverage: data.coverage,
    }),
  );

  // 3. Detectar conflictos (jugadores muy cerca después del movimiento)
  const conflicts: PositionConflict[] = [];
  const conflictThreshold = 8; // 8% del campo
  const criticalThreshold = 4; // 4% del campo

  for (let i = 0; i < ghostPositions.length; i++) {
    for (let j = i + 1; j < ghostPositions.length; j++) {
      const p1 = ghostPositions[i];
      const p2 = ghostPositions[j];

      const distance = Math.sqrt(
        Math.pow(p1.ghostX - p2.ghostX, 2) + Math.pow(p1.ghostY - p2.ghostY, 2),
      );

      if (distance < conflictThreshold) {
        conflicts.push({
          players: [p1.playerId, p2.playerId],
          x: (p1.ghostX + p2.ghostX) / 2,
          y: (p1.ghostY + p2.ghostY) / 2,
          severity: distance < criticalThreshold ? 'critical' : 'warning',
        });
      }
    }
  }

  // 4. Calcular balance táctico (excluir arquero - Y > 85)
  const outfieldPlayers = ghostPositions.filter((g) => g.ghostY <= 85);
  const defensive = outfieldPlayers.filter((g) => g.ghostY > 66).length;
  const midfield = outfieldPlayers.filter((g) => g.ghostY > 33 && g.ghostY <= 66).length;
  const attacking = outfieldPlayers.filter((g) => g.ghostY <= 33).length;

  // 5. Identificar zonas débiles (< 30% cobertura)
  const weakZones = zoneCoverage.filter((z) => z.coverage < 0.3);

  return {
    ghostPositions,
    zoneCoverage,
    conflicts,
    weakZones,
    balance: {
      defensive,
      midfield,
      attacking,
      formationString: `${defensive}-${midfield}-${attacking}`,
    },
  };
}
