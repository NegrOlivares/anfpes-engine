import { type ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface EnhancedTooltipProps {
  /**
   * Contenido del tooltip
   */
  content: string | ReactNode;
  /**
   * Elemento a envolver con el tooltip
   */
  children: ReactNode;
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
 * Componente de tooltip enriquecido con el mismo estilo que GlossaryTooltip
 * pero para contenido arbitrario (no vinculado al glosario).
 */
export function EnhancedTooltip({
  content,
  children,
  placement = 'bottom',
  className = '',
}: EnhancedTooltipProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [actualPlacement, setActualPlacement] = useState<ActualPlacement>(placement);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  // Calcular posición absoluta del tooltip en el viewport
  useEffect(() => {
    if (!isHovering || !wrapperRef.current) {
      return;
    }

    const updatePosition = () => {
      try {
        const wrapper = wrapperRef.current;
        const tooltip = tooltipRef.current;
        if (!wrapper) return;

        const wrapperRect = wrapper.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const margin = 8;

        // Usar dimensiones reales del tooltip si está disponible, sino estimaciones
        const tooltipWidth = tooltip ? tooltip.offsetWidth : 200;
        const tooltipHeight = tooltip ? tooltip.offsetHeight : 50;

        let top = 0;
        let left = 0;
        let newPlacement = placement;

        // Calcular posición según placement
        if (placement === 'top') {
          top = wrapperRect.top - tooltipHeight - 8;
          left = wrapperRect.left + wrapperRect.width / 2 - tooltipWidth / 2;

          if (top < margin) {
            newPlacement = 'bottom';
            top = wrapperRect.bottom + 8;
          }
        } else if (placement === 'bottom') {
          top = wrapperRect.bottom + 8;
          left = wrapperRect.left + wrapperRect.width / 2 - tooltipWidth / 2;

          if (top + tooltipHeight > viewportHeight - margin) {
            newPlacement = 'top';
            top = wrapperRect.top - tooltipHeight - 8;
          }
        } else if (placement === 'left') {
          top = wrapperRect.top + wrapperRect.height / 2 - tooltipHeight / 2;
          left = wrapperRect.left - tooltipWidth - 8;

          if (left < margin) {
            newPlacement = 'right';
            left = wrapperRect.right + 8;
          }
        } else if (placement === 'right') {
          top = wrapperRect.top + wrapperRect.height / 2 - tooltipHeight / 2;
          left = wrapperRect.right + 8;

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
    };

    // Actualizar posición inmediatamente
    const frameId = window.requestAnimationFrame(updatePosition);

    // Actualizar en un segundo frame para tener dimensiones reales del tooltip
    const secondFrameId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(updatePosition);
    });

    // Escuchar scroll para actualizar posición
    const handleScroll = () => {
      window.requestAnimationFrame(updatePosition);
    };

    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.cancelAnimationFrame(secondFrameId);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isHovering, placement, actualPlacement]);

  const handleMouseEnter = () => {
    try {
      setIsHovering(true);
      setActualPlacement(placement);
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
        padding: '0.5rem 0.65rem',
        width: 'max-content',
        minWidth: 0,
      }}
    >
      <div
        className="glossary-tooltip-definition"
        style={{ color: '#7ac9ff', fontWeight: 600, margin: 0 }}
      >
        {content}
      </div>
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
