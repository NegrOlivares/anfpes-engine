import type { CSSProperties } from 'react';

export interface RadarChartDataset {
  id: string;
  label: string;
  values: number[];
  color: string;
  fillOpacity?: number;
}

interface RadarChartProps {
  labels: string[];
  datasets: RadarChartDataset[];
  maxValue?: number;
  size?: number;
  showLegend?: boolean;
  className?: string;
}

export function RadarChart({
  labels,
  datasets,
  maxValue = 100,
  size = 240,
  showLegend = true,
  className,
}: RadarChartProps) {
  const center = size / 2;
  const radius = size / 2 - 20;
  const steps = 4;

  const angleStep = (Math.PI * 2) / labels.length;

  const getPoint = (value: number, index: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const safeValue = Math.max(0, Math.min(value, maxValue));
    const pointRadius = (safeValue / maxValue) * radius;
    return {
      x: center + pointRadius * Math.cos(angle),
      y: center + pointRadius * Math.sin(angle),
    };
  };

  const gridPolygons = Array.from({ length: steps }, (_, stepIndex) => {
    const ratio = (stepIndex + 1) / steps;
    const path = labels
      .map((_, index) => {
        const angle = angleStep * index - Math.PI / 2;
        const stepRadius = radius * ratio;
        const x = center + stepRadius * Math.cos(angle);
        const y = center + stepRadius * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');
    return <polygon key={ratio} points={path} className="radar-grid" />;
  });

  const axisLines = labels.map((_, index) => {
    const angle = angleStep * index - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return (
      <line
        key={`axis-${index}`}
        x1={center}
        y1={center}
        x2={x}
        y2={y}
        className="radar-axis"
      />
    );
  });

  const labelElements = labels.map((label, index) => {
    const angle = angleStep * index - Math.PI / 2;
    const x = center + (radius + 12) * Math.cos(angle);
    const y = center + (radius + 12) * Math.sin(angle);
    const textAnchor =
      Math.abs(Math.cos(angle)) < 0.1 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';
    const dy = Math.sin(angle) > 0.1 ? '1em' : '-0.4em';
    return (
      <text
        key={`label-${label}`}
        x={x}
        y={y}
        textAnchor={textAnchor}
        className="radar-label"
        dy={dy}
      >
        {label}
      </text>
    );
  });

  const datasetPolygons = datasets.map((dataset) => {
    const path = dataset.values
      .map((value, index) => {
        const point = getPoint(value ?? 0, index);
        return `${point.x},${point.y}`;
      })
      .join(' ');
    const style: CSSProperties = {
      stroke: dataset.color,
      fill: dataset.color,
      fillOpacity: dataset.fillOpacity ?? 0.15,
    };
    return (
      <polygon key={dataset.id} points={path} style={style} className="radar-dataset" />
    );
  });

  return (
    <div className={`radar-chart ${className ?? ''}`.trim()}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
        <g>{gridPolygons}</g>
        <g>{axisLines}</g>
        <circle cx={center} cy={center} r={4} className="radar-center" />
        <g>{datasetPolygons}</g>
        <g>{labelElements}</g>
      </svg>
      {showLegend && datasets.length > 0 && (
        <div className="radar-legend">
          {datasets.map((dataset) => (
            <div key={dataset.id} className="radar-legend-item">
              <span
                className="radar-legend-swatch"
                style={{ background: dataset.color }}
              />
              <span>{dataset.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
