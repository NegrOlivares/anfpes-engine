import { useState, useMemo } from 'react';
import { GLOSSARY_DATA, CATEGORY_LABELS, type GlossaryCategory } from '../data/glossary';

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal completo de glosario con búsqueda y filtros por categoría.
 * Muestra todos los términos del sistema con definiciones, fórmulas y stats relacionados.
 */
export function GlossaryModal({ isOpen, onClose }: GlossaryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GlossaryCategory | 'all'>(
    'all',
  );

  const filteredTerms = useMemo(() => {
    const normalized = searchQuery.toLowerCase().trim();

    return GLOSSARY_DATA.filter((term) => {
      // Filtro por categoría
      const matchesCategory =
        selectedCategory === 'all' || term.category === selectedCategory;

      // Filtro por búsqueda
      if (!normalized) return matchesCategory;

      const matchesSearch =
        term.term.toLowerCase().includes(normalized) ||
        term.definition.toLowerCase().includes(normalized) ||
        term.legacyTerm?.toLowerCase().includes(normalized) ||
        term.tags?.some((tag) => tag.toLowerCase().includes(normalized)) ||
        term.relatedStats?.some((stat) => stat.toLowerCase().includes(normalized));

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<GlossaryCategory, number>> = {};
    GLOSSARY_DATA.forEach((term) => {
      counts[term.category] = (counts[term.category] || 0) + 1;
    });
    return counts;
  }, []);

  if (!isOpen) return null;

  return (
    <div className="glossary-modal-overlay" onClick={onClose}>
      <div className="glossary-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="glossary-modal-header">
          <h2>Glosario de Términos</h2>
          <button
            className="glossary-modal-close"
            onClick={onClose}
            title="Cerrar glosario"
          >
            ✕
          </button>
        </div>

        <div className="glossary-modal-controls">
          <div className="glossary-search-box">
            <input
              type="search"
              placeholder="Buscar términos, definiciones, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glossary-search-input"
            />
          </div>

          <div className="glossary-category-filter">
            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value as GlossaryCategory | 'all')
              }
              className="glossary-category-select"
            >
              <option value="all">Todas las categorías ({GLOSSARY_DATA.length})</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label} ({categoryCounts[key as GlossaryCategory] || 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="glossary-modal-body">
          {filteredTerms.length === 0 ? (
            <div className="glossary-no-results">
              <p>No se encontraron términos que coincidan con la búsqueda.</p>
              <button
                className="glossary-clear-button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="glossary-terms-grid">
              {filteredTerms.map((term) => (
                <div key={term.id} className="glossary-term-card">
                  <div className="glossary-term-header">
                    <h3 className="glossary-term-title">
                      {term.badge && term.badgeStyle && (
                        <span
                          className="glossary-term-badge-icon"
                          style={{
                            background: term.badgeStyle.background,
                            color: term.badgeStyle.color,
                            padding: '0.15rem 0.4rem',
                            borderRadius: '3px',
                            marginRight: '0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-block',
                          }}
                        >
                          {term.badge}
                        </span>
                      )}
                      {term.term}
                    </h3>
                    <div className="glossary-term-badges">
                      {term.isCalculated && (
                        <span className="glossary-badge glossary-badge-calculated">
                          Calculado
                        </span>
                      )}
                      <span className="glossary-badge glossary-badge-category">
                        {CATEGORY_LABELS[term.category]}
                      </span>
                    </div>
                  </div>

                  <div className="glossary-term-definition">{term.definition}</div>

                  {term.formula && (
                    <div className="glossary-term-formula">
                      <div className="glossary-formula-label">Fórmula:</div>
                      <code className="glossary-formula-code">{term.formula}</code>
                    </div>
                  )}

                  {term.relatedStats && term.relatedStats.length > 0 && (
                    <div className="glossary-term-related">
                      <div className="glossary-related-label">Basado en:</div>
                      <div className="glossary-related-stats">
                        {term.relatedStats.map((stat, i) => (
                          <span key={i} className="glossary-related-stat">
                            {stat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {term.tags && term.tags.length > 0 && (
                    <div className="glossary-term-tags">
                      {term.tags.map((tag, i) => (
                        <span key={i} className="glossary-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glossary-modal-footer">
          <div className="glossary-footer-stats">
            Mostrando {filteredTerms.length} de {GLOSSARY_DATA.length} términos
          </div>
          <button className="glossary-footer-button" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
