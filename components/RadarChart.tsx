import React from 'react';
import { RadarMetric } from '../types';

interface RadarChartProps {
  data: RadarMetric[];
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ data, size = 300 }) => {
  // Configuration
  // Dynamic padding: Slightly less padding for cleaner compact look
  const padding = size * 0.15;
  const radius = (size - padding * 2) / 2;
  const center = size / 2;
  const angleSlice = (Math.PI * 2) / data.length;

  // Helper: Polar to Cartesian coordinates
  const getCoordinates = (value: number, index: number, max: number) => {
    // -Math.PI / 2 adjusts the rotation so the first axis is at 12 o'clock
    const angle = index * angleSlice - Math.PI / 2;
    const r = (value / max) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Generate the main data path
  const pathPoints = data
    .map((d, i) => {
      const { x, y } = getCoordinates(d.value, i, d.fullMark);
      return `${x},${y}`;
    })
    .join(' ');

  // Grid Levels (0.2, 0.4, 0.6, 0.8, 1.0)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const gridColor = 'stroke-slate-200 dark:stroke-slate-700/50';

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <defs>
          {/* Professional Gradient for the Fill */}
          <linearGradient id="radarFillGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" /> {/* Indigo */}
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" /> {/* Violet */}
          </linearGradient>

          {/* Subtle Glow Filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Background Grid (Concentric Hexagons) */}
        {levels.map((level, idx) => (
          <polygon
            key={`grid-${idx}`}
            points={data
              .map((d, i) => {
                const { x, y } = getCoordinates(d.fullMark * level, i, d.fullMark);
                return `${x},${y}`;
              })
              .join(' ')}
            fill="transparent"
            className={`${gridColor} transition-all duration-500`}
            strokeWidth={idx === levels.length - 1 ? 1 : 0.5} // Thicker outer rim
            strokeDasharray={idx === levels.length - 1 ? '0' : '3 3'} // Dashed inner lines
          />
        ))}

        {/* 2. Axis Lines (Spokes) */}
        {data.map((d, i) => {
          const { x, y } = getCoordinates(d.fullMark, i, d.fullMark);
          return (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              className={gridColor}
              strokeWidth="0.5"
            />
          );
        })}

        {/* 3. Data Shape Area - Thin stroke (1px) */}
        <polygon
          points={pathPoints}
          fill="url(#radarFillGradient)"
          stroke="#6366f1"
          strokeWidth="1.5"
          strokeLinejoin="round"
          filter="url(#glow)"
          className="drop-shadow-md transition-all duration-1000 ease-out opacity-90"
        />

        {/* 4. Data Points (Anchors) */}
        {data.map((d, i) => {
          const { x, y } = getCoordinates(d.value, i, d.fullMark);
          return (
            <g key={`point-${i}`} className="group">
              <circle
                cx={x}
                cy={y}
                r="2"
                className="fill-white stroke-indigo-500 stroke-2 transition-all duration-300 group-hover:r-3"
              />
            </g>
          );
        })}

        {/* 5. Labels */}
        {data.map((d, i) => {
          // Push labels slightly further out based on dynamic padding
          const { x, y } = getCoordinates(d.fullMark * 1.15, i, d.fullMark);

          // Logic to determine text anchor based on position relative to center
          let textAnchor: 'middle' | 'start' | 'end' = 'middle';
          if (Math.abs(x - center) < 5) textAnchor = 'middle';
          else if (x > center) textAnchor = 'start';
          else textAnchor = 'end';

          // Logic for vertical alignment
          let dy = '0.35em'; // default middle
          if (Math.abs(y - center) < 5) dy = '0.35em';
          else if (y < center)
            dy = '0em'; // top labels
          else dy = '0.8em'; // bottom labels

          return (
            <g key={`label-${i}`}>
              <text
                x={x}
                y={y}
                dy={dy}
                textAnchor={textAnchor}
                className="fill-slate-500 dark:fill-slate-400 text-[9px] font-bold tracking-tight font-sans"
              >
                {d.label}
              </text>
              {/* Value Indicator below label */}
              <text
                x={x}
                y={y}
                dy={y < center ? '1.4em' : '2.2em'}
                textAnchor={textAnchor}
                className="fill-indigo-600 dark:fill-indigo-400 text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {Math.round(d.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
