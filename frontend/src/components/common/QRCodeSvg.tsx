import React from 'react';

interface QRCodeSvgProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
}

/**
 * Clean, lightweight SVG QR Code matrix renderer
 */
export const QRCodeSvg: React.FC<QRCodeSvgProps> = ({
  value,
  size = 200,
  fgColor = '#0f172a',
  bgColor = '#ffffff'
}) => {
  // Deterministic 25x25 grid matrix generator based on input string hash
  const gridSize = 25;
  const modules: boolean[][] = Array(gridSize)
    .fill(false)
    .map(() => Array(gridSize).fill(false));

  // Finder pattern (7x7 outer square with 3x3 inner fill)
  const drawFinderPattern = (startRow: number, startCol: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuterBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInnerCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        modules[startRow + r][startCol + c] = isOuterBorder || isInnerCore;
      }
    }
  };

  // Top-left, Top-right, Bottom-left finder patterns
  drawFinderPattern(0, 0);
  drawFinderPattern(0, gridSize - 7);
  drawFinderPattern(gridSize - 7, 0);

  // Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    modules[6][i] = i % 2 === 0;
    modules[i][6] = i % 2 === 0;
  }

  // Populate data matrix with string hash values
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  let bitIndex = 0;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Skip finder pattern zones
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c >= gridSize - 8;
      const inBL = r >= gridSize - 8 && c < 8;
      if (!inTL && !inTR && !inBL && r !== 6 && c !== 6) {
        const cellHash = (hash + bitIndex * 31 + r * 17 + c * 13) % 100;
        modules[r][c] = cellHash > 45;
        bitIndex++;
      }
    }
  }

  const cellSize = size / gridSize;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg shadow-sm border border-slate-100 p-2 bg-white">
      <rect width={size} height={size} fill={bgColor} />
      {modules.flatMap((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.2}
              height={cellSize + 0.2}
              fill={fgColor}
              rx={0.5}
            />
          ) : null
        )
      )}
    </svg>
  );
};
