import { useEffect, useMemo, useState } from 'react';
import { CLUB_COMPETITION_DETAILS } from '../data/clubCompetition';
import { getClubShieldPath } from '../utils/imageHelpers';
import { useClubViewStore } from '../store/clubViewStore';
import { MODULE_IDS, useModuleStore } from '../store/moduleStore';
import { IDENTITY_SEASON, useIdentityStore } from '../store/identityStore';

interface IdentitySetupModalProps {
  open: boolean;
  allowClose?: boolean;
  onClose?: () => void;
}

type IdentitySetupMode = 'manager' | 'spectator';

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function IdentityClubMark({ club }: { club: string }) {
  const shield = getClubShieldPath(club);

  return (
    <span className="identity-club-mark">
      {shield ? <img src={shield} alt="" /> : <span>{getInitials(club)}</span>}
    </span>
  );
}

export function IdentitySetupModal({
  open,
  allowClose = false,
  onClose,
}: IdentitySetupModalProps) {
  const profile = useIdentityStore((state) => state.profile);
  const setManagerIdentity = useIdentityStore((state) => state.setManagerIdentity);
  const setSpectatorIdentity = useIdentityStore((state) => state.setSpectatorIdentity);
  const setSelectedClub = useClubViewStore((state) => state.setSelectedClub);
  const setActiveModuleId = useModuleStore((state) => state.setActiveModuleId);

  const managerOptions = useMemo(
    () =>
      Object.entries(CLUB_COMPETITION_DETAILS)
        .map(([club, detail]) => ({
          club,
          manager: detail.manager,
          division: detail.division,
        }))
        .sort((a, b) =>
          a.manager.localeCompare(b.manager, 'es', { sensitivity: 'base' }),
        ),
    [],
  );

  const firstManagerClub = managerOptions[0]?.club ?? '';
  const [mode, setMode] = useState<IdentitySetupMode>(
    profile?.mode === 'spectator' ? 'spectator' : 'manager',
  );
  const [selectedManagerClub, setSelectedManagerClub] = useState(
    profile?.club ?? firstManagerClub,
  );

  useEffect(() => {
    if (!open) return;

    setMode(profile?.mode === 'spectator' ? 'spectator' : 'manager');
    setSelectedManagerClub(profile?.club ?? firstManagerClub);
  }, [firstManagerClub, open, profile]);

  if (!open) return null;

  const selectedManager = managerOptions.find(
    (option) => option.club === selectedManagerClub,
  );
  const canConfirm = mode === 'spectator' || Boolean(selectedManager);

  const closeIfAllowed = () => {
    if (allowClose) {
      onClose?.();
    }
  };

  const focusClub = (club: string) => {
    setSelectedClub(club);
    setActiveModuleId(MODULE_IDS.club);
  };

  const handleConfirm = () => {
    if (mode === 'manager' && selectedManager) {
      setManagerIdentity(selectedManager.manager, selectedManager.club);
      focusClub(selectedManager.club);
      onClose?.();
      return;
    }

    setSpectatorIdentity();
    onClose?.();
  };

  return (
    <div
      className="identity-modal-backdrop"
      role="presentation"
      onMouseDown={closeIfAllowed}
    >
      <section
        className="identity-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="identity-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="identity-modal-header">
          <div>
            <span className="identity-modal-season">{IDENTITY_SEASON}</span>
            <h2 id="identity-modal-title">Identificacion de usuario</h2>
            <p>
              Selecciona tu Usuario para que puedas abrir Cesante Manager con tu club como
              protagonista.
            </p>
          </div>
          {allowClose && (
            <button
              type="button"
              className="identity-modal-close"
              onClick={onClose}
              aria-label="Cerrar identificacion"
            >
              X
            </button>
          )}
        </header>

        <div className="identity-mode-tabs" role="tablist" aria-label="Tipo de identidad">
          <button
            type="button"
            className={mode === 'manager' ? 'active' : ''}
            onClick={() => setMode('manager')}
          >
            Usuario
          </button>
          <button
            type="button"
            className={mode === 'spectator' ? 'active' : ''}
            onClick={() => setMode('spectator')}
          >
            Espectador
          </button>
        </div>

        <div className="identity-modal-body">
          {mode === 'manager' && (
            <div className="identity-manager-grid">
              {managerOptions.map((option) => (
                <button
                  key={`${option.manager}-${option.club}`}
                  type="button"
                  className={
                    selectedManagerClub === option.club
                      ? 'identity-manager-card selected'
                      : 'identity-manager-card'
                  }
                  onClick={() => setSelectedManagerClub(option.club)}
                >
                  <IdentityClubMark club={option.club} />
                  <span className="identity-manager-main">
                    <strong>{option.manager}</strong>
                    <span>{option.club}</span>
                  </span>
                  <small>{option.division}</small>
                </button>
              ))}
            </div>
          )}

          {mode === 'spectator' && (
            <div className="identity-spectator-panel">
              <h3>Modo espectador</h3>
              <p>
                La app se abrira sin club propio. Podras revisar clubes, jugadores y
                analisis igual que ahora, y cambiar esta decision desde la cabecera.
              </p>
            </div>
          )}
        </div>

        <footer className="identity-modal-footer">
          <span>Guardado local en este equipo.</span>
          <button type="button" onClick={handleConfirm} disabled={!canConfirm}>
            Continuar
          </button>
        </footer>
      </section>
    </div>
  );
}
