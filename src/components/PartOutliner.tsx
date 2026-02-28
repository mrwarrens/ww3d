import { Part } from '../models/Part'

interface PartOutlinerProps {
  parts: Part[]
  selectedId: string | null
  onSelectId: (id: string) => void
  onToggleVisibility: (id: string) => void
}

export default function PartOutliner({ parts, selectedId, onSelectId, onToggleVisibility }: PartOutlinerProps) {
  return (
    <div id="part-outliner">
      <ul>
        {parts.map((part) => (
          <li
            key={part.id}
            className={part.id === selectedId ? 'selected' : undefined}
            onClick={() => onSelectId(part.id)}
          >
            {part.name}
            <button
              className="visibility-btn"
              onClick={(e) => { e.stopPropagation(); onToggleVisibility(part.id) }}
              aria-label={part.visible !== false ? 'Hide' : 'Show'}
            >
              {part.visible !== false ? '●' : '○'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
