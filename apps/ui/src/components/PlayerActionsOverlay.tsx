import type { DerivedPlayer } from '@anfpes/engine';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { AddToPreselectionModal } from './AddToPreselectionModal';
import { usePlayerActionsStore } from '../store/playerActionsStore';
import { useModuleStore, MODULE_IDS } from '../store/moduleStore';
import { useSimilarPlayersStore } from '../store/similarPlayersStore';
import { usePreselectionStore } from '../store/preselectionStore';
import { useComparatorLaunchStore } from '../store/comparatorLaunchStore';
import { useCacheStore } from '../store/cacheStore';
import { usePlayerProfileStore } from '../store/playerProfileStore';
import { useActivityHistoryStore } from '../store/activityHistoryStore';

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
  const [showPreselectionModal, setShowPreselectionModal] = useState(false);
  const selectedPlayerIds = usePreselectionStore((state) => state.selectedPlayerIds);
  const clearSelection = usePreselectionStore((state) => state.clearSelection);
  const addActivity = useActivityHistoryStore((state) => state.addActivity);

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

    // Check right overflow
    if (x + MENU_WIDTH + PADDING > window.innerWidth) {
      x = anchor.x - MENU_WIDTH;
    }

    // Check bottom overflow
    if (y + MENU_HEIGHT + PADDING > window.innerHeight) {
      y = window.innerHeight - MENU_HEIGHT - PADDING;
    }

    // Ensure not negative
    x = Math.max(PADDING, x);
    y = Math.max(PADDING, y);

    return { top: y, left: x };
  }, [anchor]);

  if (!isOpen || !player || !anchor) {
    return null;
  }

  const handlePreselection = () => {
    if (selectionCount === 0) return;
    setShowPreselectionModal(true);
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
      <div className="player-actions-menu" style={menuStyle}>
        <div className="player-actions-options">
          {canSearchSimilar && !hideProfile && (
            <button type="button" onClick={handleOpenProfile}>
              Abrir Perfil
            </button>
          )}
          <button type="button" onClick={handlePreselection}>
            Agregar a preseleccion
          </button>
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
    </>
  );
}

export function openPlayerActionsMenu(
  event: React.SyntheticEvent,
  player: DerivedPlayer,
  opts?: { hideCompare?: boolean; hideProfile?: boolean },
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
