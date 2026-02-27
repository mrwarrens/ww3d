import { Part } from '../models/Part'

interface PartOutlinerProps {
  parts: Part[]
  selectedId: string | null
  onSelectId: (id: string) => void
}

export default function PartOutliner({ parts, selectedId, onSelectId }: PartOutlinerProps) {
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
            <span className="visibility-slot" />
          </li>
        ))}
      </ul>
    </div>
  )
}
