import { useState, useMemo } from 'react';
import type { DerivedPlayer } from '@anfpes/engine';
import { useCacheStore } from '../store/cacheStore';
import { useTacticsStore, FORMATIONS } from '../store/tacticsStore';
import type { FormationSlot, FormationPlan } from '../types/tactics';
import { TacticalPitch } from '../components/TacticalPitch';
import { TacticalPlayerCard } from '../components/TacticalPlayerCard';
import { RosterPanel } from '../components/RosterPanel';
import { SavedTacticsLibrary } from '../components/SavedTacticsLibrary';
import { RecommendedSignings } from '../components/RecommendedSignings';
import { TacticalAnalysisPanel } from '../components/TacticalAnalysisPanel';
import { DepthAnalysisPanel } from '../components/DepthAnalysisPanel';
import { EnhancedTooltip } from '../components/EnhancedTooltip';
import { openPlayerActionsMenu } from '../components/PlayerActionsOverlay';
import { ANFPES_CLUBS } from '../data/playerStatus';
import { getClubShieldPath } from '../utils/imageHelpers';

// Helper function to calculate combined average positions
function calculateCombinedSlots(
  baseSlots: FormationSlot[],
  planASlots?: FormationSlot[],
  planBSlots?: FormationSlot[],
  showPlanA?: boolean,
  showPlanB?: boolean,
): FormationSlot[] {
  return baseSlots.map((baseSlot) => {
    // Buscar este jugador por playerId en Plan A y Plan B
    const planASlot = planASlots?.find((s) => s.playerId === baseSlot.playerId);
    const planBSlot = planBSlots?.find((s) => s.playerId === baseSlot.playerId);

    const positions = [{ x: baseSlot.x, y: baseSlot.y }];
    // Solo incluir Plan A si está visible/activo
    if (planASlot && showPlanA) positions.push({ x: planASlot.x, y: planASlot.y });
    // Solo incluir Plan B si está visible/activo
    if (planBSlot && showPlanB) positions.push({ x: planBSlot.x, y: planBSlot.y });

    const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
    const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;

    return {
      ...baseSlot,
      x: Math.round(avgX * 10) / 10,
      y: Math.round(avgY * 10) / 10,
    };
  });
}

// Helper to get effective slots based on active strategies
function getEffectiveSlots(
  baseSlots: FormationSlot[],
  planASlots: FormationSlot[] | undefined,
  planBSlots: FormationSlot[] | undefined,
  activeStrategies: string[],
): FormationSlot[] {
  // Si Plan A está activo, buscar cada jugador por playerId en Plan A
  if (activeStrategies.includes('STRATEGY_PLAN_A') && planASlots) {
    return baseSlots.map((baseSlot) => {
      // Buscar dónde está este jugador en Plan A (por playerId, no por slotId)
      const planASlot = planASlots.find((s) => s.playerId === baseSlot.playerId);
      if (planASlot) {
        return {
          ...baseSlot,
          x: planASlot.x,
          y: planASlot.y,
          role: planASlot.role,
        };
      }
      return baseSlot;
    });
  }

  // Si Plan B está activo, buscar cada jugador por playerId en Plan B
  if (activeStrategies.includes('STRATEGY_PLAN_B') && planBSlots) {
    return baseSlots.map((baseSlot) => {
      // Buscar dónde está este jugador en Plan B (por playerId, no por slotId)
      const planBSlot = planBSlots.find((s) => s.playerId === baseSlot.playerId);
      if (planBSlot) {
        return {
          ...baseSlot,
          x: planBSlot.x,
          y: planBSlot.y,
          role: planBSlot.role,
        };
      }
      return baseSlot;
    });
  }

  // Sin estrategias de plan, usar base
  return baseSlots;
}

export function PlanningModule() {
  const players = useCacheStore((state) => state.players);
  const status = useCacheStore((state) => state.status);

  const currentTactic = useTacticsStore((state) => state.currentTactic);
  const savedTactics = useTacticsStore((state) => state.savedTactics);
  const selectedClubId = useTacticsStore((state) => state.selectedClubId);
  const showPlanA = useTacticsStore((state) => state.showPlanA);
  const showPlanB = useTacticsStore((state) => state.showPlanB);
  const combinedView = useTacticsStore((state) => state.combinedView);
  const hasUnsavedChanges = useTacticsStore((state) => state.hasUnsavedChanges);

  const createTactic = useTacticsStore((state) => state.createTactic);
  const loadTactic = useTacticsStore((state) => state.loadTactic);
  const saveTactic = useTacticsStore((state) => state.saveTactic);
  const deleteTactic = useTacticsStore((state) => state.deleteTactic);
  const duplicateTactic = useTacticsStore((state) => state.duplicateTactic);
  const renameTactic = useTacticsStore((state) => state.renameTactic);
  const clearCurrentTactic = useTacticsStore((state) => state.clearCurrentTactic);
  const setClub = useTacticsStore((state) => state.setClub);
  const setTacticName = useTacticsStore((state) => state.setTacticName);
  const setShowPlanA = useTacticsStore((state) => state.setShowPlanA);
  const setShowPlanB = useTacticsStore((state) => state.setShowPlanB);
  const setCombinedView = useTacticsStore((state) => state.setCombinedView);
  const setAttackDefenceLevel = useTacticsStore((state) => state.setAttackDefenceLevel);
  const setBackLine = useTacticsStore((state) => state.setBackLine);
  const setOffsideTrap = useTacticsStore((state) => state.setOffsideTrap);
  const setStrategyInSlot = useTacticsStore((state) => state.setStrategyInSlot);
  const toggleStrategyActive = useTacticsStore((state) => state.toggleStrategyActive);
  const setSelectedCBForOverlap = useTacticsStore(
    (state) => state.setSelectedCBForOverlap,
  );
  const updateSlot = useTacticsStore((state) => state.updateSlot);
  const changeFormation = useTacticsStore((state) => state.changeFormation);
  const addCandidateIn = useTacticsStore((state) => state.addCandidateIn);
  const removeCandidateIn = useTacticsStore((state) => state.removeCandidateIn);
  const addCandidateOut = useTacticsStore((state) => state.addCandidateOut);
  const removeCandidateOut = useTacticsStore((state) => state.removeCandidateOut);
  const addPossibleSigning = useTacticsStore((state) => state.addPossibleSigning);
  const updatePlayerInstruction = useTacticsStore(
    (state) => state.updatePlayerInstruction,
  );
  const setDepthSlot = useTacticsStore((state) => state.setDepthSlot);
  const setCustomDorsal = useTacticsStore((state) => state.setCustomDorsal);

  const [showSavedTactics, setShowSavedTactics] = useState(false);
  const [showRosterPanel, setShowRosterPanel] = useState(true);
  const [showRecommendedSignings, setShowRecommendedSignings] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showAttitudeColors, setShowAttitudeColors] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [editingPositions, setEditingPositions] = useState(false);
  const [showDepthChart, setShowDepthChart] = useState(false);
  const [activeTab, setActiveTab] = useState<'plantilla' | 'instrucciones'>('plantilla');
  const [activePlanForInstructions, setActivePlanForInstructions] = useState<
    'base' | 'planA' | 'planB'
  >('base');

  // Calculate combined slots when in combined view
  const combinedSlots = useMemo(() => {
    if (!currentTactic || !combinedView) return null;
    return calculateCombinedSlots(
      currentTactic.basePlan.slots,
      currentTactic.planA?.slots,
      currentTactic.planB?.slots,
      showPlanA,
      showPlanB,
    );
  }, [currentTactic, combinedView, showPlanA, showPlanB]);

  // Calculate effective slots for base plan based on active strategies
  const effectiveBaseSlots = useMemo(() => {
    if (!currentTactic) return [];
    const activeStrategies = currentTactic.strategySlots
      .filter((slot) => slot.isActive && slot.strategy !== 'NO_STRATEGY')
      .map((slot) => slot.strategy);
    return getEffectiveSlots(
      currentTactic.basePlan.slots,
      currentTactic.planA?.slots,
      currentTactic.planB?.slots,
      activeStrategies,
    );
  }, [currentTactic]);

  // Create player map for efficient lookup
  const playerMap = useMemo(() => {
    return new Map((players || []).map((p) => [p.ID, p]));
  }, [players]);

  // Helper to get strategy display name
  const getStrategyName = (strategy: string): string => {
    const names: Record<string, string> = {
      NO_STRATEGY: 'Sin Estrategia',
      CENTRE_ATTACK: 'Ataque por el Centro',
      RIGHT_SIDE_ATTACK: 'Ataque por Derecha',
      LEFT_SIDE_ATTACK: 'Ataque por Izquierda',
      OPPOSITE_SIDE_ATTACK: 'Ataque por el Lado Opuesto',
      CHANGE_SIDES: 'Cambio de Banda',
      CB_OVERLAP: 'Desborde Defensa Central',
      PRESSURE: 'Presión',
      COUNTER_ATTACK: 'Contraataque',
      OFFSIDE_TRAP: 'Fuera de Juego',
      STRATEGY_PLAN_A: 'Estrategia Plan A',
      STRATEGY_PLAN_B: 'Estrategia Plan B',
    };
    return names[strategy] || strategy;
  };

  // Get depth chart data and map to players
  // Construir depthChartSlots SEPARADOS para cada plan desde playerDepthCharts GLOBALES
  const buildDepthChartSlots = (plan: FormationPlan | null | undefined) => {
    if (!currentTactic || !plan) return [];

    return plan.slots.map((slot) => {
      if (!slot.playerId) {
        return {
          slotId: slot.slotId,
          role: slot.role,
          depth1: undefined,
          depth2: undefined,
          depth3: undefined,
          depth4: undefined,
          depth5: undefined,
        };
      }

      // Buscar el playerDepthChart para este jugador en los charts globales
      const playerChart = currentTactic.playerDepthCharts.find(
        (c) => c.playerId === slot.playerId,
      );

      return {
        slotId: slot.slotId,
        role: slot.role,
        depth1: slot.playerId,
        depth2: playerChart?.depth2,
        depth3: playerChart?.depth3,
        depth4: playerChart?.depth4,
        depth5: playerChart?.depth5,
      };
    });
  };

  const baseDepthChartSlots = useMemo(
    () => (currentTactic ? buildDepthChartSlots(currentTactic.basePlan) : []),
    [currentTactic],
  );

  const planADepthChartSlots = useMemo(
    () => (currentTactic?.planA ? buildDepthChartSlots(currentTactic.planA) : []),
    [currentTactic],
  );

  const planBDepthChartSlots = useMemo(
    () => (currentTactic?.planB ? buildDepthChartSlots(currentTactic.planB) : []),
    [currentTactic],
  );

  const getDepthPlayer = (playerId: string | undefined): DerivedPlayer | undefined => {
    if (!playerId) return undefined;
    return playerMap.get(playerId);
  };

  const handleDepthSlotDrop = (
    slotId: string,
    depth: 1 | 2 | 3 | 4 | 5,
    playerId: string,
  ) => {
    setDepthSlot(slotId, depth, playerId);
  };

  const handleDepthSlotRemove = (slotId: string, depth: 1 | 2 | 3 | 4 | 5) => {
    setDepthSlot(slotId, depth, undefined);
  };

  const handleCreateNew = () => {
    const name = prompt('Nombre de la táctica:');
    if (name) {
      createTactic(name, selectedClubId ?? undefined);
    }
  };

  const handleSave = () => {
    saveTactic();
  };

  const handleClear = () => {
    if (confirm('¿Limpiar táctica actual?')) {
      clearCurrentTactic();
    }
  };

  const handleCreatePlanA = () => {
    if (!currentTactic) return;

    // Detectar formación actual del base plan
    let baseFormation = '3-2-5'; // default
    for (const [formationName, template] of Object.entries(FORMATIONS)) {
      const rolesMatch = template.every((templateSlot, index) => {
        const planSlot = currentTactic.basePlan.slots[index];
        return planSlot && planSlot.role === templateSlot.role;
      });
      if (rolesMatch) {
        baseFormation = formationName;
        break;
      }
    }

    // Copy from base plan (solo slots y configuración, NO playerDepthCharts)
    useTacticsStore.setState((state) => ({
      currentTactic: state.currentTactic
        ? {
            ...state.currentTactic,
            planA: {
              slots: JSON.parse(JSON.stringify(state.currentTactic.basePlan.slots)),
              playerInstructions: {},
              attackDefenceLevel: state.currentTactic.basePlan.attackDefenceLevel,
              backLine: state.currentTactic.basePlan.backLine,
              offsideTrap: state.currentTactic.basePlan.offsideTrap,
              lastUsedFormation: baseFormation,
            },
          }
        : state.currentTactic,
      hasUnsavedChanges: true,
    }));
    setShowPlanA(true);
  };

  const handleCreatePlanB = () => {
    if (!currentTactic) return;

    // Detectar formación actual del base plan
    let baseFormation = '3-2-5'; // default
    for (const [formationName, template] of Object.entries(FORMATIONS)) {
      const rolesMatch = template.every((templateSlot, index) => {
        const planSlot = currentTactic.basePlan.slots[index];
        return planSlot && planSlot.role === templateSlot.role;
      });
      if (rolesMatch) {
        baseFormation = formationName;
        break;
      }
    }

    // Copy from base plan (solo slots y configuración, NO playerDepthCharts)
    useTacticsStore.setState((state) => ({
      currentTactic: state.currentTactic
        ? {
            ...state.currentTactic,
            planB: {
              slots: JSON.parse(JSON.stringify(state.currentTactic.basePlan.slots)),
              playerInstructions: {},
              attackDefenceLevel: state.currentTactic.basePlan.attackDefenceLevel,
              backLine: state.currentTactic.basePlan.backLine,
              offsideTrap: state.currentTactic.basePlan.offsideTrap,
              lastUsedFormation: baseFormation,
            },
          }
        : state.currentTactic,
      hasUnsavedChanges: true,
    }));
    setShowPlanB(true);
  };

  const handlePlayerDrop = (
    plan: 'base' | 'planA' | 'planB',
    slotId: string,
    playerId: string,
  ) => {
    // Check if player is already assigned in another slot
    const currentPlan =
      plan === 'base'
        ? currentTactic?.basePlan
        : plan === 'planA'
          ? currentTactic?.planA
          : currentTactic?.planB;

    if (!currentPlan) return;

    const existingSlot = currentPlan.slots.find(
      (s) => s.playerId === playerId && s.slotId !== slotId,
    );

    if (existingSlot) {
      // Player already assigned, remove from old position
      updateSlot(plan, existingSlot.slotId, { playerId: undefined });
    }

    updateSlot(plan, slotId, { playerId });
  };

  const handleSlotDrag = (
    plan: 'base' | 'planA' | 'planB',
    fromSlotId: string,
    toSlotId: string,
  ) => {
    if (fromSlotId === toSlotId) return;

    const currentPlan =
      plan === 'base'
        ? currentTactic?.basePlan
        : plan === 'planA'
          ? currentTactic?.planA
          : currentTactic?.planB;

    if (!currentPlan) return;

    const fromSlot = currentPlan.slots.find((s) => s.slotId === fromSlotId);
    const toSlot = currentPlan.slots.find((s) => s.slotId === toSlotId);

    if (!fromSlot || !toSlot) return;

    // UNA SOLA llamada: updateSlot detecta el intercambio y actualiza ambos slots
    updateSlot(plan, toSlotId, { playerId: fromSlot.playerId });
  };

  const handleRoleChange = (
    plan: 'base' | 'planA' | 'planB',
    slotId: string,
    role: string,
  ) => {
    updateSlot(plan, slotId, { role });
  };

  const handlePositionChange = (
    plan: 'base' | 'planA' | 'planB',
    slotId: string,
    coords: { x: number; y: number },
  ) => {
    updateSlot(plan, slotId, coords);
  };

  const handleToggleCandidateIn = (playerId: string) => {
    if (currentTactic?.rosterContext.candidateInPlayerIds.includes(playerId)) {
      removeCandidateIn(playerId);
    } else {
      addCandidateIn(playerId);
    }
  };

  const handleToggleCandidateOut = (playerId: string) => {
    if (currentTactic?.rosterContext.candidateOutPlayerIds.includes(playerId)) {
      removeCandidateOut(playerId);
    } else {
      addCandidateOut(playerId);
    }
  };

  const renderFormationSelect = (plan: 'base' | 'planA' | 'planB') => {
    const currentPlan =
      plan === 'base'
        ? currentTactic?.basePlan
        : plan === 'planA'
          ? currentTactic?.planA
          : currentTactic?.planB;

    // Detectar formación actual comparando roles de los slots (slotIds son fijos slot1-slot11)
    let currentFormation = currentPlan?.lastUsedFormation || '4-4-2'; // default a lastUsedFormation
    let isEdited = false;
    let foundExactMatch = false;

    if (currentPlan && currentPlan.slots.length === 11) {
      // Buscar la formación que tiene la misma secuencia de roles en slot1-slot11
      for (const [formationName, template] of Object.entries(FORMATIONS)) {
        const rolesMatch = template.every((templateSlot, index) => {
          const planSlot = currentPlan.slots[index];
          return planSlot && planSlot.role === templateSlot.role;
        });

        if (rolesMatch) {
          // Verificar si las posiciones (x, y) también coinciden
          const positionsMatch = template.every((templateSlot, index) => {
            const planSlot = currentPlan.slots[index];
            return (
              planSlot && planSlot.x === templateSlot.x && planSlot.y === templateSlot.y
            );
          });

          if (positionsMatch) {
            // Coincidencia exacta (roles Y posiciones)
            currentFormation = formationName;
            isEdited = false;
            foundExactMatch = true;
            break;
          } else {
            // Roles coinciden pero posiciones editadas
            currentFormation = formationName;
            isEdited = true;
            foundExactMatch = true;
            break;
          }
        }
      }

      // Si no encontramos coincidencia exacta, usar lastUsedFormation con *
      if (!foundExactMatch && currentPlan.lastUsedFormation) {
        currentFormation = currentPlan.lastUsedFormation;
        isEdited = true;
      } else if (!foundExactMatch) {
        // Fallback si no hay lastUsedFormation
        isEdited = true;
      }
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <select
          onChange={(e) => changeFormation(plan, e.target.value)}
          className="formation-select"
          value={currentFormation}
        >
          {Object.keys(FORMATIONS).map((formation) => (
            <option key={formation} value={formation}>
              {formation}
            </option>
          ))}
        </select>
        {isEdited && (
          <span style={{ color: '#ffa726', fontWeight: 'bold', fontSize: '18px' }}>
            *
          </span>
        )}
      </div>
    );
  };

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="module-loading">
        <p>Cargando datos...</p>
      </div>
    );
  }

  if (!players || players.length === 0) {
    return (
      <div className="module-error">
        <p>No hay jugadores disponibles</p>
      </div>
    );
  }

  return (
    <div className="planning-module">
      {/* Header */}
      <header className="planning-header">
        <div className="planning-header-row">
          <div className="planning-title-group">
            <h2>Táctica</h2>
            {currentTactic && (
              <input
                type="text"
                value={currentTactic.name}
                onChange={(e) => setTacticName(e.target.value)}
                className="tactic-name-input"
                placeholder="Nombre de táctica"
              />
            )}
          </div>

          {/* Club and Formation selectors */}
          {currentTactic && (
            <div className="planning-header-row">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                Club ANFPES:
                <select
                  value={selectedClubId || ''}
                  onChange={(e) => setClub(e.target.value || null)}
                  className="club-select"
                >
                  <option value="">Seleccionar club...</option>
                  {Array.from(ANFPES_CLUBS)
                    .sort()
                    .map((club) => (
                      <option key={club} value={club}>
                        {club}
                      </option>
                    ))}
                </select>
                {selectedClubId && (
                  <img
                    src={getClubShieldPath(selectedClubId) || ''}
                    alt={selectedClubId}
                    style={{
                      width: '32px',
                      height: '32px',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </label>
            </div>
          )}

          <div className="planning-actions">
            <button type="button" onClick={handleCreateNew}>
              Nueva Táctica
            </button>
            <button type="button" onClick={() => setShowSavedTactics(!showSavedTactics)}>
              {showSavedTactics ? 'Ocultar' : 'Tácticas Guardadas'}
            </button>
            {currentTactic && (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges}
                  className="save-button"
                >
                  Guardar {hasUnsavedChanges && '*'}
                </button>
                <button type="button" onClick={handleClear}>
                  Limpiar
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      {!currentTactic ? (
        <div className="planning-empty">
          <p>Crea una nueva táctica o carga una guardada</p>
        </div>
      ) : (
        <div className="planning-content">
          {/* Main layout with sidebar */}
          <div className="planning-layout">
            {/* Left sidebar */}
            {showRosterPanel && (
              <aside className="planning-sidebar">
                {/* Tabs dentro del sidebar */}
                <div className="planning-tabs">
                  <button
                    type="button"
                    className={`planning-tab ${activeTab === 'plantilla' ? 'active' : ''}`}
                    onClick={() => setActiveTab('plantilla')}
                  >
                    Plantilla
                  </button>
                  <button
                    type="button"
                    className={`planning-tab ${activeTab === 'instrucciones' ? 'active' : ''}`}
                    onClick={() => setActiveTab('instrucciones')}
                  >
                    Instrucciones Tácticas
                  </button>
                </div>

                {activeTab === 'plantilla' ? (
                  <RosterPanel
                    players={players}
                    clubFilter={selectedClubId ?? undefined}
                    candidateInIds={currentTactic.rosterContext.candidateInPlayerIds}
                    candidateOutIds={currentTactic.rosterContext.candidateOutPlayerIds}
                    customDorsals={currentTactic.customDorsals}
                    onPlayerSelect={(playerId) => console.log('Selected:', playerId)}
                    onToggleCandidateIn={handleToggleCandidateIn}
                    onToggleCandidateOut={handleToggleCandidateOut}
                    onSetCustomDorsal={setCustomDorsal}
                    showRecommendations={showRecommendedSignings}
                    onToggleRecommendations={() =>
                      setShowRecommendedSignings(!showRecommendedSignings)
                    }
                  />
                ) : (
                  <div className="tactical-instructions-panel">
                    <div className="tactical-panel-header"></div>

                    <div className="tactical-panel-content">
                      <div className="tactical-section">
                        <h4>📊 Visualización</h4>
                        <button
                          type="button"
                          onClick={() => setShowAttitudeColors(!showAttitudeColors)}
                          className={`tactical-toggle-btn ${showAttitudeColors ? 'active' : ''}`}
                        >
                          <span className="btn-icon">🎯</span>
                          <span className="btn-label">Instrucciones Individuales</span>
                          <span className="btn-status">
                            {showAttitudeColors ? '✓' : ''}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowConnections(!showConnections)}
                          className={`tactical-toggle-btn ${showConnections ? 'active' : ''}`}
                        >
                          <span className="btn-icon">🔗</span>
                          <span className="btn-label">Conexiones</span>
                          <span className="btn-status">{showConnections ? '✓' : ''}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAnalysis(!showAnalysis)}
                          className={`tactical-toggle-btn ${showAnalysis ? 'active' : ''}`}
                        >
                          <span className="btn-icon">📊</span>
                          <span className="btn-label">Análisis Táctico</span>
                          <span className="btn-status">{showAnalysis ? '✓' : ''}</span>
                        </button>
                      </div>

                      <div className="tactical-section">
                        <h4>🎮 Estrategias (4 Slots)</h4>
                        {currentTactic.strategySlots.map((slot, index) => {
                          const hasCBOverlap = slot.strategy === 'CB_OVERLAP';
                          const centerBacks = currentTactic.basePlan.slots
                            .filter(
                              (s: FormationSlot) => s.role === 'CT' || s.role === 'LIB',
                            )
                            .map((s: FormationSlot) => ({
                              slotId: s.slotId,
                              role: s.role,
                              playerId: s.playerId,
                            }));

                          const playerMap = new Map(players.map((p) => [p.ID, p]));

                          // Símbolos PlayStation: X (azul), ▢ (rosa), △ (verde), ○ (rojo)
                          const psSymbols = ['✕', '▢', '△', 'O '];
                          const psColors = ['#5C9EE7', '#E967A0', '#89D88D', '#E15F5F'];

                          return (
                            <div key={index} className="strategy-slot-container">
                              <div className="strategy-slot-row">
                                <select
                                  value={slot.strategy}
                                  onChange={(e) =>
                                    setStrategyInSlot(index, e.target.value as any)
                                  }
                                  className="tactical-select strategy-select"
                                  style={{ flex: 1 }}
                                >
                                  <option value="NO_STRATEGY">Sin Estrategia</option>
                                  <option value="CENTRE_ATTACK">
                                    Ataque por el Centro
                                  </option>
                                  <option value="RIGHT_SIDE_ATTACK">
                                    Ataque por Derecha
                                  </option>
                                  <option value="LEFT_SIDE_ATTACK">
                                    Ataque por Izquierda
                                  </option>
                                  <option value="OPPOSITE_SIDE_ATTACK">
                                    Ataque por el Lado Opuesto
                                  </option>
                                  <option value="CHANGE_SIDES">Cambio de Banda</option>
                                  <option value="CB_OVERLAP">
                                    Desborde Defensa Central
                                  </option>
                                  <option value="PRESSURE">Presión</option>
                                  <option value="COUNTER_ATTACK">Contraataque</option>
                                  <option value="OFFSIDE_TRAP">Fuera de Juego</option>
                                  <option value="STRATEGY_PLAN_A">
                                    Estrategia Plan A
                                  </option>
                                  <option value="STRATEGY_PLAN_B">
                                    Estrategia Plan B
                                  </option>
                                </select>
                                <EnhancedTooltip content="Previsualizar estrategia">
                                  <button
                                    type="button"
                                    onClick={() => toggleStrategyActive(index)}
                                    className={`strategy-preview-btn ${slot.isActive ? 'active' : ''}`}
                                    disabled={slot.strategy === 'NO_STRATEGY'}
                                    style={{
                                      color: slot.isActive ? psColors[index] : '#666',
                                    }}
                                  >
                                    {psSymbols[index]}
                                  </button>
                                </EnhancedTooltip>
                              </div>
                              {hasCBOverlap && centerBacks.length > 0 && (
                                <div
                                  className="cb-selector"
                                  style={{ marginLeft: '10px', marginTop: '5px' }}
                                >
                                  <label
                                    style={{ fontSize: '0.85rem', marginRight: '5px' }}
                                  >
                                    DC que sube:
                                  </label>
                                  <select
                                    value={currentTactic.selectedCBForOverlap || ''}
                                    onChange={(e) =>
                                      setSelectedCBForOverlap(e.target.value)
                                    }
                                    className="tactical-select"
                                    style={{ flex: 1, fontSize: '0.85rem' }}
                                  >
                                    <option value="">Seleccionar DC...</option>
                                    {centerBacks.map((cb: any) => {
                                      const player = cb.playerId
                                        ? playerMap.get(cb.playerId)
                                        : null;
                                      return (
                                        <option key={cb.slotId} value={cb.slotId}>
                                          {player
                                            ? (player.NOMBRE as string)
                                            : `${cb.role} (Vacío)`}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="tactical-section">
                        <h4>📋 Instrucciones de Equipo</h4>
                        <select
                          value={activePlanForInstructions}
                          onChange={(e) =>
                            setActivePlanForInstructions(
                              e.target.value as 'base' | 'planA' | 'planB',
                            )
                          }
                          className="tactical-select"
                        >
                          <option value="base">Base</option>
                          {currentTactic.planA && <option value="planA">Plan A</option>}
                          {currentTactic.planB && <option value="planB">Plan B</option>}
                        </select>
                        <div className="tactical-control-group">
                          <label>⚔️ Nivel de Ataque/Defensa:</label>
                          <select
                            value={
                              activePlanForInstructions === 'base'
                                ? currentTactic.basePlan.attackDefenceLevel
                                : activePlanForInstructions === 'planA' &&
                                    currentTactic.planA
                                  ? currentTactic.planA.attackDefenceLevel
                                  : activePlanForInstructions === 'planB' &&
                                      currentTactic.planB
                                    ? currentTactic.planB.attackDefenceLevel
                                    : 'BALANCED'
                            }
                            onChange={(e) =>
                              setAttackDefenceLevel(
                                activePlanForInstructions,
                                e.target.value as any,
                              )
                            }
                            className="tactical-select"
                          >
                            <option value="ALL_OUT_DEFENCE">Toda Defensa</option>
                            <option value="DEFENSIVE">Defensivo</option>
                            <option value="BALANCED">Balanceado</option>
                            <option value="ATTACKING">Ofensivo</option>
                            <option value="ALL_OUT_ATTACK">Todo Ataque</option>
                          </select>
                        </div>
                        <div className="tactical-control-group">
                          <label>🔙 Línea Defensiva:</label>
                          <select
                            value={
                              activePlanForInstructions === 'base'
                                ? currentTactic.basePlan.backLine
                                : activePlanForInstructions === 'planA' &&
                                    currentTactic.planA
                                  ? currentTactic.planA.backLine
                                  : activePlanForInstructions === 'planB' &&
                                      currentTactic.planB
                                    ? currentTactic.planB.backLine
                                    : 'B'
                            }
                            onChange={(e) =>
                              setBackLine(
                                activePlanForInstructions,
                                e.target.value as any,
                              )
                            }
                            className="tactical-select"
                          >
                            <option value="A">A (Alta)</option>
                            <option value="B">B (Media)</option>
                            <option value="C">C (Baja)</option>
                          </select>
                        </div>
                        <div className="tactical-control-group">
                          <label>🚫 Trampa de Fuera de Juego:</label>
                          <select
                            value={
                              activePlanForInstructions === 'base'
                                ? currentTactic.basePlan.offsideTrap
                                : activePlanForInstructions === 'planA' &&
                                    currentTactic.planA
                                  ? currentTactic.planA.offsideTrap
                                  : activePlanForInstructions === 'planB' &&
                                      currentTactic.planB
                                    ? currentTactic.planB.offsideTrap
                                    : 'B'
                            }
                            onChange={(e) =>
                              setOffsideTrap(
                                activePlanForInstructions,
                                e.target.value as any,
                              )
                            }
                            className="tactical-select"
                          >
                            <option value="A">A (Agresiva)</option>
                            <option value="B">B (Situacional)</option>
                            <option value="C">C (Mínima)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </aside>
            )}

            {/* Main area - Pitches */}
            <div className="planning-main">
              {/* Pitch visibility controls */}
              <div className="planning-controls">
                <button
                  type="button"
                  onClick={() => setShowRosterPanel(!showRosterPanel)}
                  className="toggle-roster-btn"
                >
                  {showRosterPanel ? 'Ocultar' : 'Mostrar'} Panel Lateral
                </button>

                {!currentTactic.planA && (
                  <button
                    type="button"
                    onClick={handleCreatePlanA}
                    className="create-plan-btn"
                  >
                    Crear Plan A
                  </button>
                )}
                {currentTactic.planA && (
                  <label>
                    <input
                      type="checkbox"
                      checked={showPlanA}
                      onChange={(e) => setShowPlanA(e.target.checked)}
                    />
                    Mostrar Plan A
                  </label>
                )}

                {!currentTactic.planB && (
                  <button
                    type="button"
                    onClick={handleCreatePlanB}
                    className="create-plan-btn"
                  >
                    Crear Plan B
                  </button>
                )}
                {currentTactic.planB && (
                  <label>
                    <input
                      type="checkbox"
                      checked={showPlanB}
                      onChange={(e) => setShowPlanB(e.target.checked)}
                    />
                    Mostrar Plan B
                  </label>
                )}

                <label>
                  <input
                    type="checkbox"
                    checked={combinedView}
                    onChange={(e) => setCombinedView(e.target.checked)}
                  />
                  Vista Combinada
                </label>

                <button
                  type="button"
                  onClick={() => setEditingPositions(!editingPositions)}
                  className="toggle-depth-btn"
                  style={{
                    background: editingPositions
                      ? 'rgba(255, 193, 7, 0.25)'
                      : 'rgba(255, 193, 7, 0.15)',
                  }}
                >
                  {editingPositions ? 'Cerrar' : 'Editar'} Posicion
                </button>

                <button
                  type="button"
                  onClick={() => setShowDepthChart(!showDepthChart)}
                  className="toggle-depth-btn"
                  style={{
                    background: showDepthChart
                      ? 'rgba(33, 150, 243, 0.25)'
                      : 'rgba(33, 150, 243, 0.15)',
                  }}
                >
                  📊 {showDepthChart ? 'Cerrar' : 'Ver'} Profundidad
                </button>
              </div>

              {/* Pitches container with sidebar */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                {/* Pitches */}
                <div
                  className="planning-pitches"
                  style={{ position: 'relative', flex: 1 }}
                >
                  {/* Overlay de recomendaciones */}
                  {showRecommendedSignings && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(18, 18, 18, 0.98)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 1000,
                        padding: '24px',
                        overflowY: 'auto',
                        borderRadius: '8px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          marginBottom: '-40px',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setShowRecommendedSignings(false)}
                          style={{
                            background: 'rgba(244, 67, 54, 0.2)',
                            border: '1px solid rgba(244, 67, 54, 0.5)',
                            borderRadius: '4px',
                            padding: '8px 16px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500,
                          }}
                        >
                          ✕ Cerrar
                        </button>
                      </div>
                      <RecommendedSignings
                        slots={currentTactic.basePlan.slots}
                        players={players}
                        recommendedSignings={currentTactic.recommendedSignings}
                        clubId={currentTactic.clubId}
                        onAddPossibleSigning={addPossibleSigning}
                      />
                    </div>
                  )}

                  {combinedView && combinedSlots ? (
                    <TacticalPitch
                      slots={combinedSlots}
                      players={players}
                      clubId={currentTactic.clubId}
                      candidateInIds={currentTactic.rosterContext.candidateInPlayerIds}
                      candidateOutIds={currentTactic.rosterContext.candidateOutPlayerIds}
                      customDorsals={currentTactic.customDorsals}
                      planLabel="Vista Combinada (Promedio de Planes)"
                      playerInstructions={currentTactic.basePlan.playerInstructions}
                      showAnalysis={showAnalysis}
                      showAttitudeColors={showAttitudeColors}
                      showConnections={showConnections}
                      showDepthChart={showDepthChart}
                      depthChartSlots={baseDepthChartSlots}
                      getDepthPlayer={getDepthPlayer}
                      onDepthSlotDrop={handleDepthSlotDrop}
                      onDepthSlotRemove={handleDepthSlotRemove}
                      activeStrategies={[]} // No strategies in combined view
                      attackDefenceLevel={currentTactic.basePlan.attackDefenceLevel}
                      backLine={currentTactic.basePlan.backLine}
                      offsideTrap={currentTactic.basePlan.offsideTrap}
                      selectedCBForOverlap={currentTactic.selectedCBForOverlap}
                      planASlots={undefined}
                      planBSlots={undefined}
                      editingPosition={false} // Read-only in combined view
                    />
                  ) : (
                    <>
                      <TacticalPitch
                        slots={effectiveBaseSlots}
                        players={players}
                        clubId={currentTactic.clubId}
                        candidateInIds={currentTactic.rosterContext.candidateInPlayerIds}
                        candidateOutIds={
                          currentTactic.rosterContext.candidateOutPlayerIds
                        }
                        customDorsals={currentTactic.customDorsals}
                        planLabel="Base"
                        playerInstructions={currentTactic.basePlan.playerInstructions}
                        showAnalysis={showAnalysis}
                        showAttitudeColors={showAttitudeColors}
                        showConnections={showConnections}
                        showDepthChart={showDepthChart}
                        depthChartSlots={baseDepthChartSlots}
                        getDepthPlayer={getDepthPlayer}
                        onDepthSlotDrop={handleDepthSlotDrop}
                        onDepthSlotRemove={handleDepthSlotRemove}
                        activeStrategies={(() => {
                          const active = currentTactic.strategySlots
                            .filter(
                              (slot) => slot.isActive && slot.strategy !== 'NO_STRATEGY',
                            )
                            .map((slot) => slot.strategy);
                          // Filtrar STRATEGY_PLAN_A y STRATEGY_PLAN_B ya que effectiveBaseSlots ya tiene las posiciones correctas
                          return active.filter(
                            (s) => s !== 'STRATEGY_PLAN_A' && s !== 'STRATEGY_PLAN_B',
                          );
                        })()}
                        attackDefenceLevel={currentTactic.basePlan.attackDefenceLevel}
                        backLine={currentTactic.basePlan.backLine}
                        offsideTrap={currentTactic.basePlan.offsideTrap}
                        selectedCBForOverlap={currentTactic.selectedCBForOverlap}
                        planASlots={undefined}
                        planBSlots={undefined}
                        onPlayerDrop={(slotId, playerId) =>
                          handlePlayerDrop('base', slotId, playerId)
                        }
                        onSlotDrag={(fromSlotId, toSlotId) =>
                          handleSlotDrag('base', fromSlotId, toSlotId)
                        }
                        onUpdateInstruction={(playerId, instruction) =>
                          updatePlayerInstruction('base', playerId, instruction)
                        }
                        onRoleChange={(slotId, role) =>
                          handleRoleChange('base', slotId, role)
                        }
                        editingPosition={editingPositions}
                        onPositionChange={(slotId, coords) =>
                          handlePositionChange('base', slotId, coords)
                        }
                        labelAddon={renderFormationSelect('base')}
                      />

                      {showPlanA && currentTactic.planA && (
                        <TacticalPitch
                          slots={currentTactic.planA.slots}
                          players={players}
                          clubId={currentTactic.clubId}
                          candidateInIds={
                            currentTactic.rosterContext.candidateInPlayerIds
                          }
                          candidateOutIds={
                            currentTactic.rosterContext.candidateOutPlayerIds
                          }
                          customDorsals={currentTactic.customDorsals}
                          planLabel="Plan A"
                          playerInstructions={currentTactic.planA.playerInstructions}
                          showAnalysis={showAnalysis}
                          showAttitudeColors={showAttitudeColors}
                          showConnections={showConnections}
                          showDepthChart={showDepthChart}
                          depthChartSlots={planADepthChartSlots}
                          getDepthPlayer={getDepthPlayer}
                          onDepthSlotDrop={undefined} // READ-ONLY: No permitir edición de depth charts en Plan A
                          onDepthSlotRemove={undefined} // READ-ONLY: No permitir eliminación de depth charts en Plan A
                          activeStrategies={currentTactic.strategySlots
                            .filter(
                              (slot) => slot.isActive && slot.strategy !== 'NO_STRATEGY',
                            )
                            .map((slot) => slot.strategy)}
                          attackDefenceLevel={currentTactic.planA.attackDefenceLevel}
                          backLine={currentTactic.planA.backLine}
                          offsideTrap={currentTactic.planA.offsideTrap}
                          selectedCBForOverlap={currentTactic.selectedCBForOverlap}
                          planASlots={currentTactic.planA?.slots}
                          planBSlots={currentTactic.planB?.slots}
                          onPlayerDrop={undefined} // BLOQUEADO: No permitir drag desde roster en Plan A
                          onSlotDrag={(fromSlotId, toSlotId) =>
                            handleSlotDrag('planA', fromSlotId, toSlotId)
                          }
                          onUpdateInstruction={(playerId, instruction) =>
                            updatePlayerInstruction('planA', playerId, instruction)
                          }
                          onRoleChange={(slotId, role) =>
                            handleRoleChange('planA', slotId, role)
                          }
                          editingPosition={editingPositions}
                          onPositionChange={(slotId, coords) =>
                            handlePositionChange('planA', slotId, coords)
                          }
                          labelAddon={renderFormationSelect('planA')}
                        />
                      )}

                      {showPlanB && currentTactic.planB && (
                        <TacticalPitch
                          slots={currentTactic.planB.slots}
                          players={players}
                          clubId={currentTactic.clubId}
                          candidateInIds={
                            currentTactic.rosterContext.candidateInPlayerIds
                          }
                          candidateOutIds={
                            currentTactic.rosterContext.candidateOutPlayerIds
                          }
                          customDorsals={currentTactic.customDorsals}
                          planLabel="Plan B"
                          playerInstructions={currentTactic.planB.playerInstructions}
                          showAnalysis={showAnalysis}
                          showAttitudeColors={showAttitudeColors}
                          showConnections={showConnections}
                          showDepthChart={showDepthChart}
                          depthChartSlots={planBDepthChartSlots}
                          getDepthPlayer={getDepthPlayer}
                          onDepthSlotDrop={undefined} // READ-ONLY: No permitir edición de depth charts en Plan B
                          onDepthSlotRemove={undefined} // READ-ONLY: No permitir eliminación de depth charts en Plan B
                          activeStrategies={currentTactic.strategySlots
                            .filter(
                              (slot) => slot.isActive && slot.strategy !== 'NO_STRATEGY',
                            )
                            .map((slot) => slot.strategy)}
                          attackDefenceLevel={currentTactic.planB.attackDefenceLevel}
                          backLine={currentTactic.planB.backLine}
                          offsideTrap={currentTactic.planB.offsideTrap}
                          selectedCBForOverlap={currentTactic.selectedCBForOverlap}
                          planASlots={currentTactic.planA?.slots}
                          planBSlots={currentTactic.planB?.slots}
                          onPlayerDrop={undefined} // BLOQUEADO: No permitir drag desde roster en Plan B
                          onSlotDrag={(fromSlotId, toSlotId) =>
                            handleSlotDrag('planB', fromSlotId, toSlotId)
                          }
                          onUpdateInstruction={(playerId, instruction) =>
                            updatePlayerInstruction('planB', playerId, instruction)
                          }
                          onRoleChange={(slotId, role) =>
                            handleRoleChange('planB', slotId, role)
                          }
                          editingPosition={editingPositions}
                          onPositionChange={(slotId, coords) =>
                            handlePositionChange('planB', slotId, coords)
                          }
                          labelAddon={renderFormationSelect('planB')}
                        />
                      )}
                    </>
                  )}
                  {/* Substitutes sidebar - only show in base or combined view */}
                  {((!showPlanA && !showPlanB) || combinedView) && (
                    <div
                      style={{
                        width: '15vw',
                        flexShrink: 0,
                        background: '#062b12cc',
                        marginTop: '20px',
                        marginLeft: '-200px',
                        marginRight: '100px',
                        borderRadius: '8px',
                        padding: '12px',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        height: '73vh',
                        overflowY: 'auto',
                      }}
                    >
                      <h3
                        style={{
                          margin: '0 0 3px 0',
                          marginTop: '-10px',
                          borderBottom: '2px solid #6b686844',
                          fontSize: '17px',
                          fontWeight: 600,
                          color: '#fff',
                          textAlign: 'center',
                        }}
                      >
                        SUPLENTES
                      </h3>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '2px',
                        }}
                      >
                        {(() => {
                          // Orden de roles para suplentes
                          const roleOrder = [
                            'PT',
                            'LIB',
                            'CT',
                            'DI',
                            'DD',
                            'DLI',
                            'DLD',
                            'CCD',
                            'CC',
                            'CIZ',
                            'CDR',
                            'MP',
                            'EI',
                            'ED',
                            'SD',
                            'DC',
                          ];

                          // Recopilar suplentes (depth2-5) de todos los slots
                          const seenPlayers = new Set<string>();
                          const substitutes: Array<{
                            playerId: string;
                            role: string;
                            depthLevel: number;
                            slotId: string;
                          }> = [];

                          baseDepthChartSlots.forEach((depthSlot) => {
                            const baseSlot = currentTactic.basePlan.slots.find(
                              (s) => s.slotId === depthSlot.slotId,
                            );
                            if (!baseSlot) return;

                            [2, 3, 4, 5].forEach((depth) => {
                              const playerId =
                                depthSlot[`depth${depth}` as keyof typeof depthSlot];
                              if (
                                typeof playerId === 'string' &&
                                playerId &&
                                !seenPlayers.has(playerId)
                              ) {
                                seenPlayers.add(playerId);
                                substitutes.push({
                                  playerId,
                                  role: baseSlot.role,
                                  depthLevel: depth,
                                  slotId: depthSlot.slotId,
                                });
                              }
                            });
                          });

                          // Ordenar por rol según roleOrder
                          substitutes.sort((a, b) => {
                            const aIndex = roleOrder.indexOf(a.role);
                            const bIndex = roleOrder.indexOf(b.role);
                            if (aIndex !== bIndex) return aIndex - bIndex;
                            return a.depthLevel - b.depthLevel;
                          });

                          // Limitar a 12 jugadores máximo (2 columnas de 6)
                          const limitedSubstitutes = substitutes.slice(0, 12);

                          // Renderizar cartas de suplentes con TacticalPlayerCard
                          return limitedSubstitutes.map((sub, idx) => {
                            const player = playerMap.get(sub.playerId);
                            if (!player) return null;

                            return (
                              <div
                                key={`${sub.slotId}-${sub.depthLevel}-${idx}`}
                                style={{
                                  transform: 'scale(0.9)',
                                  transformOrigin: 'center',
                                }}
                              >
                                <TacticalPlayerCard
                                  player={player}
                                  clubId={currentTactic.clubId}
                                  slotRole={sub.role}
                                  customDorsal={currentTactic.customDorsals[player.ID]}
                                  isCandidate={false}
                                  isMarkedOut={false}
                                  movementArrows={[]}
                                  onUpdateInstruction={undefined}
                                  showAttitudeColors={false}
                                  roleOptions={undefined}
                                  onRoleChange={undefined}
                                />
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tactical Analysis Panel */}
              {showAnalysis && (
                <TacticalAnalysisPanel
                  slots={currentTactic.basePlan.slots}
                  playerInstructions={currentTactic.basePlan.playerInstructions}
                  formationName={
                    currentTactic.basePlan.slots.length > 0 ? '4-4-2' : 'Sin formación'
                  }
                />
              )}

              {/* Depth Analysis Panel */}
              {showDepthChart && (
                <DepthAnalysisPanel
                  depthChartSlots={baseDepthChartSlots}
                  slots={currentTactic.basePlan.slots}
                  players={players}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Saved Tactics Library Modal */}
      {showSavedTactics && (
        <SavedTacticsLibrary
          tactics={savedTactics}
          currentTacticId={currentTactic?.tacticId}
          onLoad={(tacticId) => {
            loadTactic(tacticId);
            setShowSavedTactics(false);
          }}
          onDelete={deleteTactic}
          onDuplicate={duplicateTactic}
          onRename={renameTactic}
          onClose={() => setShowSavedTactics(false)}
        />
      )}
    </div>
  );
}
