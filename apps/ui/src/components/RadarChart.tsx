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
    return (
      <text
        key={`label-${label}`}
        x={x}
        y={y}
        textAnchor={textAnchor}
        dominantBaseline="middle"
        className="radar-label"
      >
        {label}
      </text>
    );
  });

  const shouldShowLegend = showLegend && datasets.length > 0;
  const legendSplitIndex = shouldShowLegend ? Math.ceil(datasets.length / 2) : 0;
  const leftLegend = shouldShowLegend ? datasets.slice(0, legendSplitIndex) : [];
  const rightLegend = shouldShowLegend ? datasets.slice(legendSplitIndex) : [];

  const renderLegend = (items: RadarChartDataset[]) => (
    <div className="radar-legend radar-legend-side">
      {items.map((dataset) => (
        <div key={dataset.id} className="radar-legend-item">
          <span className="radar-legend-swatch" style={{ background: dataset.color }} />
          <span className="radar-legend-label">{dataset.label}</span>
        </div>
      ))}
    </div>
  );

  const containerClassName = [
    'radar-chart',
    className ?? '',
    shouldShowLegend ? 'with-legend' : '',
  ]
    .filter(Boolean)
    .join(' ');

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

  const pointMarkers = datasets.map((dataset) =>
    dataset.values.map((value, index) => {
      const point = getPoint(value ?? 0, index);
      const label = labels[index] ?? '';
      const rounded = typeof value === 'number' ? Math.round(value) : (value ?? 0);
      return (
        <circle
          key={`${dataset.id}-point-${index}`}
          cx={point.x}
          cy={point.y}
          r={4}
          className="radar-point"
          style={{ fill: dataset.color }}
        >
          <title>
            {dataset.label}: {label} {rounded}
          </title>
        </circle>
      );
    }),
  );

  return (
    <div className={containerClassName}>
      {shouldShowLegend && leftLegend.length > 0 && renderLegend(leftLegend)}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
        <g>{gridPolygons}</g>
        <g>{axisLines}</g>
        <circle cx={center} cy={center} r={4} className="radar-center" />
        <g>{datasetPolygons}</g>
        <g>{pointMarkers}</g>
        <g>{labelElements}</g>
      </svg>
      {shouldShowLegend && rightLegend.length > 0 && renderLegend(rightLegend)}
    </div>
  );
}
