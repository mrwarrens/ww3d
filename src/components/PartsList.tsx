import { useRef, useState } from 'react'
import { Part } from '../models/Part'
import { Assembly } from '../models/Assembly'

interface PartsListProps {
  parts: Part[]
  assemblies: Assembly[]
  selectedIds: string[]
  onSelectIds: (ids: string[]) => void
  selectedAssemblyId?: string | null
  onSelectAssembly?: (id: string | null) => void
  onToggleVisibility: (id: string) => void
  onToggleAssemblyVisibility: (id: string) => void
  onAddAssembly: () => void
  onAssignPart: (partId: string, assemblyId: string) => void
  onRemoveFromAssembly: (partId: string) => void
  partsWithCuts?: Set<string>
}

function PartRow({ part, index, allParts, selectedIds, onSelectIds, lastClickedIdxRef, onToggleVisibility, onRemoveFromAssembly, partsWithCuts }: {
  part: Part
  index: number
  allParts: Part[]
  selectedIds: string[]
  onSelectIds: (ids: string[]) => void
  lastClickedIdxRef: React.MutableRefObject<number>
  onToggleVisibility: (id: string) => void
  onRemoveFromAssembly: (partId: string) => void
  partsWithCuts?: Set<string>
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (e.shiftKey) {
      const anchor = lastClickedIdxRef.current >= 0 ? lastClickedIdxRef.current : 0
      const lo = Math.min(anchor, index)
      const hi = Math.max(anchor, index)
      onSelectIds(allParts.slice(lo, hi + 1).map((p) => p.id))
      // anchor stays fixed for subsequent shift-clicks
    } else if (e.metaKey || e.ctrlKey) {
      if (selectedIds.includes(part.id)) {
        onSelectIds(selectedIds.filter((id) => id !== part.id))
      } else {
        onSelectIds([...selectedIds, part.id])
      }
      lastClickedIdxRef.current = index
    } else {
      onSelectIds([part.id])
      lastClickedIdxRef.current = index
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    if (part.assemblyId) {
      e.preventDefault()
      onRemoveFromAssembly(part.id)
    }
  }

  return (
    <li
      key={part.id}
      className={selectedIds.includes(part.id) ? 'selected' : undefined}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      draggable={true}
      onDragStart={(e) => e.dataTransfer.setData('text/plain', part.id)}
    >
      {part.name}
      {partsWithCuts?.has(part.id) && <span className="cuts-indicator">✂</span>}
      <button
        className="visibility-btn"
        onClick={(e) => { e.stopPropagation(); onToggleVisibility(part.id) }}
        aria-label={part.visible !== false ? 'Hide' : 'Show'}
      >
        {part.visible !== false ? '●' : '○'}
      </button>
    </li>
  )
}

export default function PartsList({ parts, assemblies, selectedIds, onSelectIds, selectedAssemblyId, onSelectAssembly, onToggleVisibility, onToggleAssemblyVisibility, onAddAssembly, onAssignPart, onRemoveFromAssembly, partsWithCuts }: PartsListProps) {
  const lastClickedIdxRef = useRef<number>(-1)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  function toggleCollapsed(assemblyId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(assemblyId)) next.delete(assemblyId)
      else next.add(assemblyId)
      return next
    })
  }
  const unassignedParts = parts.filter((p) => !p.assemblyId)
  const visualOrder: Part[] = [
    ...assemblies.flatMap((a) => parts.filter((p) => p.assemblyId === a.id)),
    ...unassignedParts,
  ]

  return (
    <div id="parts-list" style={{ zIndex: 1 }}>
      <button onClick={onAddAssembly}>New Assembly</button>
      <ul>
        {assemblies.map((assembly) => {
          const members = parts.filter((p) => p.assemblyId === assembly.id)
          return (
            <li
              key={assembly.id}
              className={`assembly-row${selectedAssemblyId === assembly.id ? ' selected' : ''}`}
              onClick={() => onSelectAssembly?.(assembly.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.stopPropagation()
                const draggedPartId = e.dataTransfer.getData('text/plain')
                if (draggedPartId) onAssignPart(draggedPartId, assembly.id)
              }}
            >
              <button
                className="collapse-btn"
                onClick={(e) => { e.stopPropagation(); toggleCollapsed(assembly.id) }}
                aria-label={collapsed.has(assembly.id) ? 'Expand' : 'Collapse'}
              >
                {collapsed.has(assembly.id) ? '▶' : '▼'}
              </button>
              {assembly.name}
              <button
                className="visibility-btn"
                onClick={(e) => { e.stopPropagation(); onToggleAssemblyVisibility(assembly.id) }}
                aria-label={assembly.visible !== false ? 'Hide' : 'Show'}
              >
                {assembly.visible !== false ? '●' : '○'}
              </button>
              {!collapsed.has(assembly.id) && (
                <ul>
                  {members.map((part) => (
                    <PartRow
                      key={part.id}
                      part={part}
                      index={visualOrder.indexOf(part)}
                      allParts={visualOrder}
                      selectedIds={selectedIds}
                      onSelectIds={onSelectIds}
                      lastClickedIdxRef={lastClickedIdxRef}
                      onToggleVisibility={onToggleVisibility}
                      onRemoveFromAssembly={onRemoveFromAssembly}
                      partsWithCuts={partsWithCuts}
                    />
                  ))}
                </ul>
              )}
            </li>
          )
        })}
        {unassignedParts.map((part) => (
          <PartRow
            key={part.id}
            part={part}
            index={visualOrder.indexOf(part)}
            allParts={visualOrder}
            selectedIds={selectedIds}
            onSelectIds={onSelectIds}
            lastClickedIdxRef={lastClickedIdxRef}
            onToggleVisibility={onToggleVisibility}
            onRemoveFromAssembly={onRemoveFromAssembly}
            partsWithCuts={partsWithCuts}
          />
        ))}
      </ul>
    </div>
  )
}
