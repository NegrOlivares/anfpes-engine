import type { DerivedPlayer } from '@anfpes/engine';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { AddToPreselectionModal } from './AddToPreselectionModal';
import { usePlayerActionsStore } from '../store/playerActionsStore';
import { useModuleStore, MODULE_IDS } from '../store/moduleStore';
import { useSimilarPlayersStore } from '../store/similarPlayersStore';
import { usePreselectionStore } from '../store/preselectionStore';

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
  const [showPreselectionModal, setShowPreselectionModal] = useState(false);
  const selectedPlayerIds = usePreselectionStore((state) => state.selectedPlayerIds);
  const clearSelection = usePreselectionStore((state) => state.clearSelection);

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

  if (!isOpen || !player || !anchor) {
    return null;
  }

  const handlePreselection = () => {
    if (selectionCount === 0) {
      return;
    }
    setShowPreselectionModal(true);
  };

  const handleSimilarPlayers = () => {
    if (!soleSelectionId) {
      return;
    }
    setBasePlayerId(soleSelectionId);
    setActiveModule(MODULE_IDS.similar);
    close();
  };

  const menuStyle: React.CSSProperties = {
    top: anchor.y,
    left: anchor.x,
  };

  return (
    <>
      <div className="player-actions-backdrop" onClick={handleBackdropClick} />
      <div className="player-actions-menu" style={menuStyle}>
        <div className="player-actions-options">
          <button type="button" onClick={handlePreselection}>
            Agregar a preselección
          </button>
          {canSearchSimilar && (
            <button type="button" onClick={handleSimilarPlayers}>
              Buscar jugadores similares
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
  event: SyntheticEvent<HTMLElement>,
  player: DerivedPlayer,
) {
  event.stopPropagation();
  const rect = event.currentTarget.getBoundingClientRect();
  const anchor = {
    x: rect.left + rect.width / 2,
    y: rect.bottom + 8,
  };
  usePlayerActionsStore.getState().open(player, anchor);
}

export function closePlayerActionsMenu() {
  usePlayerActionsStore.getState().close();
}
