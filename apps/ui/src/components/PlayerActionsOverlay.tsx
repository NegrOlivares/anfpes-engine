import type { DerivedPlayer } from '@anfpes/engine';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { AddToPreselectionModal } from './AddToPreselectionModal';
import { AddToTacticModal } from './AddToTacticModal';
import { usePlayerActionsStore } from '../store/playerActionsStore';
import { useModuleStore, MODULE_IDS } from '../store/moduleStore';
import { useSimilarPlayersStore } from '../store/similarPlayersStore';
import { usePreselectionStore } from '../store/preselectionStore';
import { useComparatorLaunchStore } from '../store/comparatorLaunchStore';
import { useCacheStore } from '../store/cacheStore';
import { usePlayerProfileStore } from '../store/playerProfileStore';
import { useActivityHistoryStore } from '../store/activityHistoryStore';
import { useTacticsStore } from '../store/tacticsStore';

function usePlayerActions() {
  const isOpen = usePlayerActionsStore((state) => state.isOpen);
  const player = usePlayerActionsStore((state) => state.player);
  const anchor = usePlayerActionsStore((state) => state.anchor);
  const close = usePlayerActionsStore((state) => state.close);
  return { isOpen, player, anchor, close };
}

export function PlayerActionsOverlay() {
  const { isOpen, player, anchor, close } = usePlayerActions();
  const setActiveModule = useModuleStore((state) => state.setActiveModuleId);
  const setBasePlayerId = useSimilarPlayersStore((state) => state.setBasePlayerId);
  const setComparatorPending = useComparatorLaunchStore((state) => state.setPending);
  const setSelectedIds = useComparatorLaunchStore((state) => state.setSelectedIds);
  const setSelectedPlayer = usePlayerProfileStore((state) => state.setSelectedPlayerId);
  const hideCompare = usePlayerActionsStore((state) => state.hideCompare);
  const hideProfile = usePlayerActionsStore((state) => state.hideProfile);
  const forceDown = usePlayerActionsStore((state) => state.forceDown);
  const [showPreselectionModal, setShowPreselectionModal] = useState(false);
  const [showTacticModal, setShowTacticModal] = useState(false);
  const selectedPlayerIds = usePreselectionStore((state) => state.selectedPlayerIds);
  const clearSelection = usePreselectionStore((state) => state.clearSelection);
  const addActivity = useActivityHistoryStore((state) => state.addActivity);
  const savedTactics = useTacticsStore((state) => state.savedTactics);

  const effectiveSelection = useMemo(() => {
    if (selectedPlayerIds.size > 0) {
      return new Set(selectedPlayerIds);
    }
    if (player) {
      return new Set<string>([player.ID as string]);
    }
    return new Set<string>();
  }, [selectedPlayerIds, player]);

  const selectionCount = effectiveSelection.size;
  const soleSelectionId = selectionCount === 1 ? Array.from(effectiveSelection)[0] : null;
  const canSearchSimilar = selectionCount === 1;

  const handleBackdropClick = useCallback(() => {
    if (!showPreselectionModal) {
      close();
    }
  }, [close, showPreselectionModal]);

  useEffect(() => {
    if (!isOpen) {
      setShowPreselectionModal(false);
      return;
    }

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (showPreselectionModal) {
          setShowPreselectionModal(false);
        } else {
          close();
        }
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [close, isOpen, showPreselectionModal]);

  // Detect viewport overflow and adjust position (must be before early return)
  const menuStyle: React.CSSProperties = useMemo(() => {
    if (!anchor) return { top: 0, left: 0 };

    const MENU_WIDTH = 280; // Approximate menu width
    const MENU_HEIGHT = 200; // Approximate menu height
    const PADDING = 16;

    let x = anchor.x;
    let y = anchor.y;

    console.log('[PlayerActionsOverlay] Calculando posición:', {
      forceDown,
      anchorX: anchor.x,
      anchorY: anchor.y,
      windowHeight: window.innerHeight,
      menuHeight: MENU_HEIGHT,
    });

    if (forceDown) {
      // Modo forceDown: menú SIEMPRE hacia abajo desde anchor.y
      // NO ajustar aunque se salga - dejarlo en anchor.y
      console.log('[PlayerActionsOverlay] forceDown: Usando anchor.y sin ajustes:', y);
      // No aplicar ningún ajuste a Y
    } else {
      // Modo normal: intentar hacia abajo, pero ajustar si no cabe
      if (y + MENU_HEIGHT + PADDING > window.innerHeight) {
        // No cabe abajo, intentar moverlo arriba
        y = Math.max(PADDING, window.innerHeight - MENU_HEIGHT - PADDING);
      }
      y = Math.max(PADDING, y);
    }

    // Check right overflow (aplicar siempre)
    if (x + MENU_WIDTH + PADDING > window.innerWidth) {
      x = anchor.x - MENU_WIDTH;
    }
    x = Math.max(PADDING, x);

    return { top: y, left: x };
  }, [anchor, forceDown]);

  if (!isOpen || !player || !anchor) {
    return null;
  }

  const handlePreselection = () => {
    if (selectionCount === 0) return;
    setShowPreselectionModal(true);
  };

  const handleTactic = () => {
    if (selectionCount === 0) return;
    setShowTacticModal(true);
  };

  const handleSimilarPlayers = () => {
    if (!soleSelectionId) return;
    setBasePlayerId(soleSelectionId);
    addActivity({
      type: 'similar',
      playerId: soleSelectionId,
      playerName: player.NOMBRE as string,
      details: 'Búsqueda de similares',
    });
    setActiveModule(MODULE_IDS.similar);
    close();
  };

  const handleComparePlayer = () => {
    if (!soleSelectionId) return;
    // Clear previous comparison and start fresh
    setSelectedIds([]);
    setComparatorPending(soleSelectionId);
    addActivity({
      type: 'comparison',
      playerId: soleSelectionId,
      playerName: player.NOMBRE as string,
      details: 'Nueva comparación',
    });
    setActiveModule(MODULE_IDS.comparator);
    close();
  };

  const handleOpenProfile = () => {
    if (!soleSelectionId) return;
    setSelectedPlayer(soleSelectionId);
    addActivity({
      type: 'profile',
      playerId: soleSelectionId,
      playerName: player.NOMBRE as string,
    });
    setActiveModule(MODULE_IDS.profile);
    close();
  };

  return (
    <>
      <div className="player-actions-backdrop" onClick={handleBackdropClick} />
      <div
        className={`player-actions-menu ${forceDown ? 'force-down' : ''}`}
        style={menuStyle}
      >
        <div className="player-actions-options">
          {canSearchSimilar && !hideProfile && (
            <button type="button" onClick={handleOpenProfile}>
              Abrir Perfil
            </button>
          )}
          <button type="button" onClick={handlePreselection}>
            Agregar a preselección
          </button>
          {savedTactics.length > 0 && (
            <button type="button" onClick={handleTactic}>
              Fichar en planificador
            </button>
          )}
          {canSearchSimilar && (
            <button type="button" onClick={handleSimilarPlayers}>
              Buscar jugadores similares
            </button>
          )}
          {canSearchSimilar && !hideCompare && (
            <button type="button" onClick={handleComparePlayer}>
              Comparar jugador
            </button>
          )}
        </div>
      </div>

      {showPreselectionModal && (
        <AddToPreselectionModal
          selectedPlayerIds={effectiveSelection}
          onClose={() => {
            setShowPreselectionModal(false);
            close();
          }}
          onSuccess={() => {
            clearSelection();
            setShowPreselectionModal(false);
            close();
          }}
        />
      )}

      {showTacticModal && (
        <AddToTacticModal
          selectedPlayerIds={effectiveSelection}
          onClose={() => {
            setShowTacticModal(false);
            close();
          }}
          onSuccess={() => {
            clearSelection();
            setShowTacticModal(false);
            close();
          }}
        />
      )}
    </>
  );
}

export function openPlayerActionsMenu(
  event: React.SyntheticEvent,
  player: DerivedPlayer,
  opts?: { hideCompare?: boolean; hideProfile?: boolean; forceDown?: boolean },
) {
  event.stopPropagation();
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const anchor = {
    x: rect.left + rect.width / 2,
    y: rect.bottom + 8,
  };
  usePlayerActionsStore.getState().open(player, anchor, opts);
}

export function closePlayerActionsMenu() {
  usePlayerActionsStore.getState().close();
}
