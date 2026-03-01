import { useRef } from 'react'
import { Part } from '../models/Part'
import { Assembly } from '../models/Assembly'

interface PartOutlinerProps {
  parts: Part[]
  assemblies: Assembly[]
  selectedIds: string[]
  onSelectIds: (ids: string[]) => void
  onToggleVisibility: (id: string) => void
  onAddAssembly: () => void
  onAssignPart: (partId: string, assemblyId: string) => void
  onRemoveFromAssembly: (partId: string) => void
}

function PartRow({ part, index, allParts, selectedIds, onSelectIds, lastClickedIdxRef, onToggleVisibility, onRemoveFromAssembly }: {
  part: Part
  index: number
  allParts: Part[]
  selectedIds: string[]
  onSelectIds: (ids: string[]) => void
  lastClickedIdxRef: React.MutableRefObject<number>
  onToggleVisibility: (id: string) => void
  onRemoveFromAssembly: (partId: string) => void
}) {
  const handleClick = (e: React.MouseEvent) => {
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

export default function PartOutliner({ parts, assemblies, selectedIds, onSelectIds, onToggleVisibility, onAddAssembly, onAssignPart, onRemoveFromAssembly }: PartOutlinerProps) {
  const lastClickedIdxRef = useRef<number>(-1)
  const unassignedParts = parts.filter((p) => !p.assemblyId)

  return (
    <div id="part-outliner" style={{ zIndex: 1 }}>
      <button onClick={onAddAssembly}>New Assembly</button>
      <ul>
        {assemblies.map((assembly) => {
          const members = parts.filter((p) => p.assemblyId === assembly.id)
          return (
            <li
              key={assembly.id}
              className="assembly-row"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const draggedPartId = e.dataTransfer.getData('text/plain')
                if (draggedPartId) onAssignPart(draggedPartId, assembly.id)
              }}
            >
              {assembly.name}
              <ul>
                {members.map((part) => {
                  const index = parts.indexOf(part)
                  return (
                    <PartRow
                      key={part.id}
                      part={part}
                      index={index}
                      allParts={parts}
                      selectedIds={selectedIds}
                      onSelectIds={onSelectIds}
                      lastClickedIdxRef={lastClickedIdxRef}
                      onToggleVisibility={onToggleVisibility}
                      onRemoveFromAssembly={onRemoveFromAssembly}
                    />
                  )
                })}
              </ul>
            </li>
          )
        })}
        {unassignedParts.map((part) => {
          const index = parts.indexOf(part)
          return (
            <PartRow
              key={part.id}
              part={part}
              index={index}
              allParts={parts}
              selectedIds={selectedIds}
              onSelectIds={onSelectIds}
              lastClickedIdxRef={lastClickedIdxRef}
              onToggleVisibility={onToggleVisibility}
              onRemoveFromAssembly={onRemoveFromAssembly}
            />
          )
        })}
      </ul>
    </div>
  )
}
