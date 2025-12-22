import type { RunDirection } from '../types/tactics';

interface MovementArrowsProps {
  arrows: RunDirection[];
  size?: number;
}

const ARROW_PATHS: Record<RunDirection, string> = {
  FORWARD: 'M 0,-8 L 0,-20 M -4,-16 L 0,-20 L 4,-16',
  BACKWARD: 'M 0,8 L 0,20 M -4,16 L 0,20 L 4,16',
  LEFT: 'M -8,0 L -20,0 M -16,-4 L -20,0 L -16,4',
  RIGHT: 'M 8,0 L 20,0 M 16,-4 L 20,0 L 16,4',
  DIAGONAL_LEFT_FORWARD: 'M -6,-6 L -16,-16 M -12,-16 L -16,-16 L -16,-12',
  DIAGONAL_RIGHT_FORWARD: 'M 6,-6 L 16,-16 M 12,-16 L 16,-16 L 16,-12',
  DIAGONAL_LEFT_BACKWARD: 'M -6,6 L -16,16 M -12,16 L -16,16 L -16,12',
  DIAGONAL_RIGHT_BACKWARD: 'M 6,6 L 16,16 M 12,16 L 16,16 L 16,12',
};

export function MovementArrows({ arrows, size = 40 }: MovementArrowsProps) {
  if (arrows.length === 0) return null;

  const offset = size; // pixels to push away from center per direction

  const OFFSETS: Record<RunDirection, { x: number; y: number }> = {
    FORWARD: { x: 0, y: -offset },
    BACKWARD: { x: 0, y: offset },
    LEFT: { x: -offset, y: 0 },
    RIGHT: { x: offset, y: 0 },
    DIAGONAL_LEFT_FORWARD: { x: -offset * 0.8, y: -offset * 0.8 },
    DIAGONAL_RIGHT_FORWARD: { x: offset * 0.8, y: -offset * 0.8 },
    DIAGONAL_LEFT_BACKWARD: { x: -offset * 0.8, y: offset * 0.8 },
    DIAGONAL_RIGHT_BACKWARD: { x: offset * 0.8, y: offset * 0.8 },
  };

  return (
    <>
      {arrows.map((arrow, index) => {
        const pos = OFFSETS[arrow];
        return (
          <svg
            key={`${arrow}-${index}`}
            className="movement-arrow"
            width={size}
            height={size}
            viewBox="-20 -20 40 40"
            style={{
              position: 'absolute',
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          >
            <path
              d={ARROW_PATHS[arrow]}
              stroke="#00b7ffff"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                filter: 'drop-shadow(0 0 3px rgba(255, 215, 0, 0.8))',
              }}
            />
          </svg>
        );
      })}
    </>
  );
}
