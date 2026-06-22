import type { ReleaseNote } from '../data/releaseNotes';

interface ReleaseNotesModalProps {
  note: ReleaseNote | null;
  onClose: () => void;
}

export function ReleaseNotesModal({ note, onClose }: ReleaseNotesModalProps) {
  if (!note) return null;

  return (
    <div className="release-notes-backdrop" role="presentation">
      <section
        className="release-notes-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="release-notes-title"
      >
        <header className="release-notes-header">
          <div>
            <span className="release-notes-version">Version {note.version}</span>
            <h2 id="release-notes-title">{note.title}</h2>
            {note.intro && <p>{note.intro}</p>}
          </div>
          <button
            type="button"
            className="release-notes-close"
            onClick={onClose}
            aria-label="Cerrar novedades"
          >
            X
          </button>
        </header>

        <ul className="release-notes-list">
          {note.changes.map((change) => (
            <li key={change}>{change}</li>
          ))}
        </ul>

        <footer className="release-notes-footer">
          <span>Tambien puedes revisar estos cambios en la proxima publicacion.</span>
          <button type="button" onClick={onClose}>
            Entendido
          </button>
        </footer>
      </section>
    </div>
  );
}
