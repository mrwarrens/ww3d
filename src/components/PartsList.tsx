import { useEffect, useRef, useState } from 'react'
import { Part } from '../models/Part'
import { Assembly } from '../models/Assembly'

const EyeOpen = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const EyeOff = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

interface PartsListProps {
  parts: Part[]
  assemblies: Assembly[]
  selectedIds: string[]
  onSelectIds: (ids: string[]) => void
  selectedAssemblyId?: string | null
  onSelectAssembly?: (id: string | null) => void
  onToggleVisibility: (id: string) => void
  onToggleAssemblyVisibility?: (id: string) => void
  onAddAssembly?: () => void
  onAssignPart?: (partId: string, assemblyId: string) => void
  onRemoveFromAssembly?: (partId: string) => void
  // Cuts section
  modifyingPartId?: string | null
  childParts?: Part[]
  selectedPartId?: string | null
  onEnterModifyMode?: () => void
  onExitModifyMode?: () => void
}

function PartRow({ part, index, allParts, selectedIds, onSelectIds, lastClickedIdxRef, onToggleVisibility, onRemoveFromAssembly }: {
  part: Part
  index: number
  allParts: Part[]
  selectedIds: string[]
  onSelectIds: (ids: string[]) => void
  lastClickedIdxRef: React.MutableRefObject<number>
  onToggleVisibility: (id: string) => void
  onRemoveFromAssembly?: (partId: string) => void
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (e.shiftKey) {
      const anchor = lastClickedIdxRef.current >= 0 ? lastClickedIdxRef.current : 0
      const lo = Math.min(anchor, index)
      const hi = Math.max(anchor, index)
      onSelectIds(allParts.slice(lo, hi + 1).map((p) => p.id))
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
      onRemoveFromAssembly?.(part.id)
    }
  }

  return (
    <li
      key={part.id}
      data-part-id={part.id}
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
        {part.visible !== false ? <EyeOpen /> : <EyeOff />}
      </button>
    </li>
  )
}

export default function PartsList({
  parts,
  assemblies,
  selectedIds,
  onSelectIds,
  selectedAssemblyId,
  onSelectAssembly,
  onToggleVisibility,
  onToggleAssemblyVisibility,
  onAddAssembly,
  onAssignPart,
  onRemoveFromAssembly,
  modifyingPartId,
  childParts = [],
  selectedPartId,
  onEnterModifyMode,
  onExitModifyMode,
}: PartsListProps) {
  const lastClickedIdxRef = useRef<number>(-1)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [pos, setPos] = useState({ x: 12, y: 54 })

  useEffect(() => {
    const id = selectedIds[0]
    if (!id) return
    const el = document.querySelector(`#parts-list li[data-part-id="${id}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIds[0]])
  const [partsHeight, setPartsHeight] = useState(180)
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  function toggleCollapsed(assemblyId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(assemblyId)) next.delete(assemblyId)
      else next.add(assemblyId)
      return next
    })
  }

  function handleDragStart(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('button, input, [draggable="true"]')) return
    dragOffsetRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }

    function onMouseMove(ev: MouseEvent) {
      setPos({ x: ev.clientX - dragOffsetRef.current.x, y: ev.clientY - dragOffsetRef.current.y })
    }
    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  function handleResizeStart(e: React.MouseEvent) {
    e.stopPropagation()
    const startY = e.clientY
    const startHeight = partsHeight

    function onMouseMove(ev: MouseEvent) {
      setPartsHeight(Math.max(60, startHeight + (ev.clientY - startY)))
    }
    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const unassignedParts = parts.filter((p) => !p.assemblyId)
  const visualOrder: Part[] = [
    ...assemblies.flatMap((a) => parts.filter((p) => p.assemblyId === a.id)),
    ...unassignedParts,
  ]

  const selectedPart = parts.find((p) => p.id === selectedPartId) ?? null
  const canEnterModify = !!selectedPart && !selectedPart.parentId
  const editCutsDisabled = !modifyingPartId && !canEnterModify

  return (
    <div
      id="left-panel"
      style={{ position: 'absolute', left: pos.x, top: pos.y, zIndex: 1 }}
      onMouseDown={handleDragStart}
    >
      <div className="left-panel-header">
        <span>Parts</span>
        <button onClick={onAddAssembly}>+</button>
      </div>
      <div className="left-panel-parts" style={{ height: partsHeight, overflowY: 'auto' }}>
        <ul id="parts-list">
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
                  if (draggedPartId) onAssignPart?.(draggedPartId, assembly.id)
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
                  onClick={(e) => { e.stopPropagation(); onToggleAssemblyVisibility?.(assembly.id) }}
                  aria-label={assembly.visible !== false ? 'Hide' : 'Show'}
                >
                  {assembly.visible !== false ? <EyeOpen /> : <EyeOff />}
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
            />
          ))}
        </ul>
      </div>
      <div className="left-panel-resize" onMouseDown={handleResizeStart}>· · ·</div>
      <div className="left-panel-cuts-header">
        <span>Cuts</span>
        <button
          className={`edit-cuts-btn${modifyingPartId ? ' editing' : ''}`}
          onClick={modifyingPartId ? onExitModifyMode : onEnterModifyMode}
          disabled={!modifyingPartId && editCutsDisabled}
        >
          {modifyingPartId ? 'Editing' : 'Edit Cuts'}
        </button>
      </div>
      <ul id="cuts-list" className="left-panel-cuts-list">
        {!modifyingPartId && childParts.length === 0 ? (
          <li className="cuts-empty">To edit cuts, select a board and click Edit Cuts</li>
        ) : !modifyingPartId && childParts.length > 0 ? (
          childParts.map((cut) => (
            <li key={cut.id} className="cuts-readonly">
              {cut.name}
            </li>
          ))
        ) : modifyingPartId && childParts.length === 0 ? (
          <li className="cuts-empty">Draw in the viewport to add a cut</li>
        ) : (
          childParts.map((cut) => (
            <li
              key={cut.id}
              className={selectedIds.includes(cut.id) ? 'selected' : undefined}
              onClick={(e) => { e.stopPropagation(); onSelectIds([cut.id]) }}
            >
              {cut.name}
              <button
                className="visibility-btn"
                onClick={(e) => { e.stopPropagation(); onToggleVisibility(cut.id) }}
                aria-label={cut.visible !== false ? 'Hide' : 'Show'}
              >
                {cut.visible !== false ? <EyeOpen /> : <EyeOff />}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
