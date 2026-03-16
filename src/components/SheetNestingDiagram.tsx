import type { PackedSheet } from '../utils/cutlist'
import type { Part } from '../models/Part'
import { toFractionalInches } from '../utils/units'

interface Props {
  sheet: PackedSheet
  sheetWidth: number
  sheetHeight: number
  partsById: Map<string, Part>
}

export default function SheetNestingDiagram({ sheet, sheetWidth, sheetHeight, partsById }: Props) {
  return (
    <svg
      className="cutlist-sheet-svg"
      viewBox={`0 0 ${sheetWidth} ${sheetHeight}`}
      width="100%"
      style={{ aspectRatio: `${sheetWidth} / ${sheetHeight}` }}
    >
      <rect x={0} y={0} width={sheetWidth} height={sheetHeight} fill="white" stroke="#ccc" strokeWidth={0.5} />
      {sheet.placements.map((p) => {
        const part = partsById.get(p.partId)
        const fill = part?.color ?? '#aaa'
        const fontSize = Math.min(2, p.length * 0.2)
        const label = part ? `${part.name} ${toFractionalInches(p.length)}×${toFractionalInches(p.width)}` : p.partId
        return (
          <g key={`${p.partId}-${p.x}-${p.y}`}>
            <rect
              x={p.x}
              y={p.y}
              width={p.length}
              height={p.width}
              fill={fill}
              fillOpacity={0.6}
              stroke="#555"
              strokeWidth={0.3}
            />
            <text
              x={p.x + p.length / 2}
              y={p.y + p.width / 2}
              fontSize={fontSize}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#111"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
