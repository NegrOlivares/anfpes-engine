import { type ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { findGlossaryTerm } from '../data/glossary';

interface GlossaryTooltipProps {
  /**
   * El nombre del campo (stat, habilidad, etc.)
   * Puede ser el nombre en la UI o el nombre legacy del Excel
   */
  fieldName: string;
  /**
   * Elemento a envolver con el tooltip
   */
  children: ReactNode;
  /**
   * Label a mostrar en el tooltip (opcional, por defecto usa term.term del glossary)
   */
  displayLabel?: string;
  /**
   * Posición del tooltip (opcional)
   */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /**
   * Clase CSS adicional para el contenedor
   */
  className?: string;
}

type ActualPlacement = 'top' | 'bottom' | 'left' | 'right';

/**
 * Componente que envuelve cualquier elemento y muestra un tooltip enriquecido
 * con la definición del glosario y la fórmula de cálculo (si aplica).
 *
 * Reutiliza el sistema de tooltips existente (atributo title) pero lo enriquece
 * con información adicional del glosario.
 *
 * Incluye detección inteligente de viewport para ajustar posición automáticamente.
 */
export function GlossaryTooltip({
  fieldName,
  children,
  displayLabel,
  placement = 'bottom',
  className = '',
}: GlossaryTooltipProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [actualPlacement, setActualPlacement] = useState<ActualPlacement>(placement);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  let term: ReturnType<typeof findGlossaryTerm>;
  try {
    term = findGlossaryTerm(fieldName);
  } catch (error) {
    console.warn('Error finding glossary term for:', fieldName, error);
    return <>{children}</>;
  }

  // Si no hay término en el glosario, renderizar sin tooltip especial
  if (!term) {
    return <>{children}</>;
  }

  const hasFormula = term.isCalculated && term.formula;
  const hasRelatedStats = term.relatedStats && term.relatedStats.length > 0;

  // Calcular posición absoluta del tooltip en el viewport
  useEffect(() => {
    if (!isHovering || !wrapperRef.current) {
      return;
    }

    // Usar requestAnimationFrame para asegurar que el DOM esté actualizado
    const frameId = window.requestAnimationFrame(() => {
      try {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const wrapperRect = wrapper.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const margin = 8;
        const tooltipWidth = 320; // Estimado basado en min-width
        const tooltipHeight = 150; // Estimado, se ajustará cuando se renderice

        let top = 0;
        let left = 0;
        let newPlacement = placement;

        // Calcular posición según placement
        if (placement === 'top') {
          top = wrapperRect.top - tooltipHeight - 8;
          left = wrapperRect.left + wrapperRect.width / 2 - tooltipWidth / 2;

          // Si se sale arriba, cambiar a bottom
          if (top < margin) {
            newPlacement = 'bottom';
            top = wrapperRect.bottom + 8;
          }
        } else if (placement === 'bottom') {
          top = wrapperRect.bottom + 8;
          left = wrapperRect.left + wrapperRect.width / 2 - tooltipWidth / 2;

          // Si se sale abajo, cambiar a top
          if (top + tooltipHeight > viewportHeight - margin) {
            newPlacement = 'top';
            top = wrapperRect.top - tooltipHeight - 8;
          }
        } else if (placement === 'left') {
          top = wrapperRect.top + wrapperRect.height / 2 - tooltipHeight / 2;
          left = wrapperRect.left - tooltipWidth - 8;

          // Si se sale por la izquierda, cambiar a right
          if (left < margin) {
            newPlacement = 'right';
            left = wrapperRect.right + 8;
          }
        } else if (placement === 'right') {
          top = wrapperRect.top + wrapperRect.height / 2 - tooltipHeight / 2;
          left = wrapperRect.right + 8;

          // Si se sale por la derecha, cambiar a left
          if (left + tooltipWidth > viewportWidth - margin) {
            newPlacement = 'left';
            left = wrapperRect.left - tooltipWidth - 8;
          }
        }

        // Ajustar horizontalmente si se sale del viewport
        if (left < margin) {
          left = margin;
        } else if (left + tooltipWidth > viewportWidth - margin) {
          left = viewportWidth - tooltipWidth - margin;
        }

        // Ajustar verticalmente si se sale del viewport
        if (top < margin) {
          top = margin;
        } else if (top + tooltipHeight > viewportHeight - margin) {
          top = viewportHeight - tooltipHeight - margin;
        }

        setTooltipPosition({ top, left });
        if (newPlacement !== actualPlacement) {
          setActualPlacement(newPlacement);
        }
      } catch (error) {
        console.warn('Error calculating tooltip position:', error);
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isHovering, placement, actualPlacement]);

  const handleMouseEnter = () => {
    try {
      setIsHovering(true);
      setActualPlacement(placement); // Reset a la posición preferida
    } catch (error) {
      console.warn('Error showing tooltip:', error);
    }
  };

  const handleMouseLeave = () => {
    try {
      setIsHovering(false);
    } catch (error) {
      console.warn('Error hiding tooltip:', error);
    }
  };

  // Renderizar el tooltip
  const tooltipContent = isHovering && (
    <div
      ref={tooltipRef}
      className={`glossary-tooltip-popup glossary-tooltip-${actualPlacement}`}
      style={{
        position: 'fixed',
        top: `${tooltipPosition.top}px`,
        left: `${tooltipPosition.left}px`,
        transform: 'none',
      }}
    >
      <div className="glossary-tooltip-header">
        <strong>{displayLabel || term.term}</strong>
        {term.range && (
          <span className="glossary-tooltip-badge range-badge">{term.range}</span>
        )}
        {term.isCalculated && <span className="glossary-tooltip-badge">Calculado</span>}
      </div>

      <div className="glossary-tooltip-definition">{term.definition}</div>

      {hasFormula && (
        <div className="glossary-tooltip-formula">
          <div className="glossary-tooltip-formula-label">Fórmula:</div>
          <code className="glossary-tooltip-formula-code">{term.formula}</code>
        </div>
      )}

      {hasRelatedStats && (
        <div className="glossary-tooltip-related">
          <div className="glossary-tooltip-related-label">Basado en:</div>
          <div className="glossary-tooltip-related-stats">
            {term.relatedStats!.join(' • ')}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <span
        ref={wrapperRef}
        className={`glossary-tooltip-wrapper ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>

      {tooltipContent && createPortal(tooltipContent, document.body)}
    </>
  );
}

/**
 * Hook para obtener el título enriquecido del tooltip (fallback para title nativo)
 * Útil para casos donde no se puede usar el componente GlossaryTooltip
 */
export function useGlossaryTitle(fieldName: string): string {
  const term = findGlossaryTerm(fieldName);

  if (!term) {
    return fieldName;
  }

  let title = `${term.term}\n\n${term.definition}`;

  if (term.formula) {
    title += `\n\nFórmula: ${term.formula}`;
  }

  if (term.relatedStats && term.relatedStats.length > 0) {
    title += `\n\nBasado en: ${term.relatedStats.join(', ')}`;
  }

  return title;
}
