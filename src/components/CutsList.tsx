import { Part } from '../models/Part'

interface CutsListProps {
  children: Part[]
  selectedIds: string[]
  onSelectIds: (ids: string[]) => void
}

export default function CutsList({ children, selectedIds, onSelectIds }: CutsListProps) {
  return (
    <div id="cuts-list">
      <div className="cuts-heading">Cuts</div>
      <ul>
        {children.length === 0 ? (
          <li className="cuts-empty">No cuts yet</li>
        ) : (
          children.map((child) => (
            <li
              key={child.id}
              className={selectedIds.includes(child.id) ? 'selected' : undefined}
              onClick={() => onSelectIds([child.id])}
            >
              {child.name}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
