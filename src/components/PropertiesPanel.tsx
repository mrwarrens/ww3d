import { useState, useEffect, useRef } from 'react'
import type { Part } from '../models/Part'
import type { Assembly } from '../models/Assembly'
import { toFractionalInches, parseInches } from '../utils/units'
import { useEditableInput } from '../hooks/useEditableInput'

interface PropertiesPanelProps {
  part: Part | null
  assembly: Assembly | null
  onUpdate: (changes: Partial<Pick<Part, 'name' | 'length' | 'width' | 'thickness' | 'rotation' | 'color' | 'position' | 'operation' | 'shape' | 'materialType'>>) => void
  onMoveAssembly: (position: { x: number; y: number; z: number }) => void
  onRenameAssembly?: (name: string) => void
  onEyedropperActivate?: () => void
  onClose?: () => void
}

const radToDeg = (r: number) => (r * 180 / Math.PI).toFixed(1)
const parseRot = (s: string) => { const d = parseFloat(s); if (isNaN(d)) throw new Error(); return d }
const formatRot = (v: number) => v.toFixed(1)

export default function PropertiesPanel({
  part,
  assembly,
  onUpdate,
  onMoveAssembly,
  onRenameAssembly,
  onEyedropperActivate,
  onClose,
}: PropertiesPanelProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; startOX: number; startOY: number } | null>(null)
  const skipBlurRef = useRef(false)

  const entity = part ?? assembly
  const isCutMode = !!(part?.parentId)
  const isAssemblyMode = !part && !!assembly

  const [draftName, setDraftName] = useState(entity?.name ?? '')

  useEffect(() => {
    setDraftName(entity?.name ?? '')
  }, [part?.id, assembly?.id, entity?.name])

  // Part dimension inputs (always called — rules of hooks)
  const lenInput = useEditableInput({
    externalValue: toFractionalInches(part?.length ?? 0),
    parse: parseInches, format: toFractionalInches,
    validate: v => v > 0, onCommit: v => onUpdate({ length: v }),
    step: 0.0625, minValue: 0.0625, skipBlurRef,
  })
  const widInput = useEditableInput({
    externalValue: toFractionalInches(part?.width ?? 0),
    parse: parseInches, format: toFractionalInches,
    validate: v => v > 0, onCommit: v => onUpdate({ width: v }),
    step: 0.0625, minValue: 0.0625, skipBlurRef,
  })
  const thkInput = useEditableInput({
    externalValue: toFractionalInches(part?.thickness ?? 0),
    parse: parseInches, format: toFractionalInches,
    validate: v => v > 0, onCommit: v => onUpdate({ thickness: v }),
    step: 0.0625, minValue: 0.0625, skipBlurRef,
  })

  // Rotation inputs
  const rotBase = part?.rotation ?? { x: 0, y: 0, z: 0 }
  const rotXInput = useEditableInput({
    externalValue: radToDeg(rotBase.x),
    parse: parseRot, format: formatRot,
    onCommit: v => onUpdate({ rotation: { ...rotBase, x: v * Math.PI / 180 } }),
    step: 1, skipBlurRef,
  })
  const rotYInput = useEditableInput({
    externalValue: radToDeg(rotBase.y),
    parse: parseRot, format: formatRot,
    onCommit: v => onUpdate({ rotation: { ...rotBase, y: v * Math.PI / 180 } }),
    step: 1, skipBlurRef,
  })
  const rotZInput = useEditableInput({
    externalValue: radToDeg(rotBase.z),
    parse: parseRot, format: formatRot,
    onCommit: v => onUpdate({ rotation: { ...rotBase, z: v * Math.PI / 180 } }),
    step: 1, skipBlurRef,
  })

  // Position inputs
  const posSource = part?.position ?? assembly?.position ?? { x: 0, y: 0, z: 0 }
  const posXInput = useEditableInput({
    externalValue: toFractionalInches(posSource.x),
    parse: parseInches, format: toFractionalInches,
    onCommit: v => part
      ? onUpdate({ position: { ...part.position, x: v } })
      : onMoveAssembly({ ...assembly!.position, x: v }),
    step: 0.0625, skipBlurRef,
  })
  const posYInput = useEditableInput({
    externalValue: toFractionalInches(posSource.y),
    parse: parseInches, format: toFractionalInches,
    onCommit: v => part
      ? onUpdate({ position: { ...part.position, y: v } })
      : onMoveAssembly({ ...assembly!.position, y: v }),
    step: 0.0625, skipBlurRef,
  })
  const posZInput = useEditableInput({
    externalValue: toFractionalInches(posSource.z),
    parse: parseInches, format: toFractionalInches,
    onCommit: v => part
      ? onUpdate({ position: { ...part.position, z: v } })
      : onMoveAssembly({ ...assembly!.position, z: v }),
    step: 0.0625, skipBlurRef,
  })

  if (!entity) return null

  function commitName() {
    if (skipBlurRef.current) { skipBlurRef.current = false; return }
    const trimmed = draftName.trim()
    if (!trimmed) { setDraftName(entity!.name); return }
    if (part) {
      onUpdate({ name: trimmed })
    } else if (assembly && onRenameAssembly) {
      onRenameAssembly(trimmed)
    } else {
      setDraftName(entity!.name)
    }
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      commitName()
      skipBlurRef.current = true
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      skipBlurRef.current = true
      setDraftName(entity!.name)
      e.currentTarget.blur()
    }
  }

  function handleHeaderMouseDown(e: React.MouseEvent) {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'BUTTON') return
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOX: offset.x, startOY: offset.y }

    function onMouseMove(ev: MouseEvent) {
      if (!dragRef.current) return
      setOffset({
        x: dragRef.current.startOX + (ev.clientX - dragRef.current.startX),
        y: dragRef.current.startOY + (ev.clientY - dragRef.current.startY),
      })
    }
    function onMouseUp() {
      dragRef.current = null
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const isEllipse = part?.shape === 'ellipse'

  return (
    <div
      id="properties-panel"
      className={isCutMode ? 'cut-mode' : undefined}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      <div className="props-header" onMouseDown={handleHeaderMouseDown}>
        <span style={isCutMode ? { color: '#f5a623' } : undefined}>
          {isCutMode ? 'Cut Properties' : 'Properties'}
        </span>
        <button className="props-close-btn" aria-label="Close properties panel" onClick={() => onClose?.()}>×</button>
      </div>
      <div className="part-panel-name">
        <input
          type="text"
          className="part-panel-input"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitName}
          onKeyDown={handleNameKeyDown}
          aria-label={part ? 'Part name' : 'Assembly name'}
        />
      </div>
      {!isAssemblyMode && (
        <>
          <div className="props-section-label">Dimensions</div>
          <div className="props-grid">
            <label>L:&nbsp;<input type="text" className="part-panel-input part-panel-dim-input" value={lenInput.draft} onChange={(e) => lenInput.setDraft(e.target.value)} onBlur={lenInput.onBlur} onKeyDown={lenInput.onKeyDown} aria-label="Length" /></label>
            <label>W:&nbsp;<input type="text" className="part-panel-input part-panel-dim-input" value={widInput.draft} onChange={(e) => widInput.setDraft(e.target.value)} onBlur={widInput.onBlur} onKeyDown={widInput.onKeyDown} aria-label="Width" /></label>
            <label>T:&nbsp;<input type="text" className="part-panel-input part-panel-dim-input" value={thkInput.draft} onChange={(e) => thkInput.setDraft(e.target.value)} onBlur={thkInput.onBlur} onKeyDown={thkInput.onKeyDown} aria-label="Thickness" /></label>
          </div>
        </>
      )}
      {!isAssemblyMode && (
        <>
          <div className="props-section-label">Rotation</div>
          <div className="props-grid">
            <label>Rx:&nbsp;<input type="text" className="part-panel-input part-panel-dim-input" value={rotXInput.draft} onChange={(e) => rotXInput.setDraft(e.target.value)} onBlur={rotXInput.onBlur} onKeyDown={rotXInput.onKeyDown} aria-label="Rotation X" /></label>
            <label>Ry:&nbsp;<input type="text" className="part-panel-input part-panel-dim-input" value={rotYInput.draft} onChange={(e) => rotYInput.setDraft(e.target.value)} onBlur={rotYInput.onBlur} onKeyDown={rotYInput.onKeyDown} aria-label="Rotation Y" /></label>
            <label>Rz:&nbsp;<input type="text" className="part-panel-input part-panel-dim-input" value={rotZInput.draft} onChange={(e) => rotZInput.setDraft(e.target.value)} onBlur={rotZInput.onBlur} onKeyDown={rotZInput.onKeyDown} aria-label="Rotation Z" /></label>
          </div>
        </>
      )}
      <div className="props-section-label">Position</div>
      <div className="props-grid">
        <label>Px:&nbsp;<input type="text" className="part-panel-input part-panel-dim-input" value={posXInput.draft} onChange={(e) => posXInput.setDraft(e.target.value)} onBlur={posXInput.onBlur} onKeyDown={posXInput.onKeyDown} aria-label={part ? 'Position X' : 'Assembly Position X'} /></label>
        <label>Py:&nbsp;<input type="text" className="part-panel-input part-panel-dim-input" value={posYInput.draft} onChange={(e) => posYInput.setDraft(e.target.value)} onBlur={posYInput.onBlur} onKeyDown={posYInput.onKeyDown} aria-label={part ? 'Position Y' : 'Assembly Position Y'} /></label>
        <label>Pz:&nbsp;<input type="text" className="part-panel-input part-panel-dim-input" value={posZInput.draft} onChange={(e) => posZInput.setDraft(e.target.value)} onBlur={posZInput.onBlur} onKeyDown={posZInput.onKeyDown} aria-label={part ? 'Position Z' : 'Assembly Position Z'} /></label>
      </div>
      {part && (
        <>
          {isCutMode ? (
            <div className="part-panel-op-shape-row">
              <div className="part-panel-operation" aria-label="Operation">
                <button type="button" className={part.operation === 'add' ? 'active' : ''} onClick={() => onUpdate({ operation: 'add' })} aria-label="Add operation">Add</button>
                <button type="button" className={part.operation !== 'add' ? 'active' : ''} onClick={() => onUpdate({ operation: 'subtract' })} aria-label="Subtract operation">Subtract</button>
              </div>
              <div className="part-panel-shape" aria-label="Shape">
                <button type="button" className={!isEllipse ? 'active' : ''} onClick={() => onUpdate({ shape: 'box' })} aria-label="Box shape">Box</button>
                <button type="button" className={isEllipse ? 'active' : ''} onClick={() => onUpdate({ shape: 'ellipse' })} aria-label="Ellipse shape">Ellipse</button>
              </div>
            </div>
          ) : (
            <div className="part-panel-color-shape-row">
              <div className="part-panel-color">
                <label>
                  <input type="color" value={part.color} onChange={(e) => onUpdate({ color: e.target.value })} aria-label="Color" />
                </label>
                {onEyedropperActivate && (
                  <button type="button" onClick={onEyedropperActivate} aria-label="Eyedropper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 11l-1.8-1.8M3.9 20.1L3 21l1-1M14.5 4.5l5 5-11 11-6.5 1.5 1.5-6.5 11-11z"/>
                    </svg>
                  </button>
                )}
              </div>
              <div className="part-panel-shape" aria-label="Shape">
                <button type="button" className={!isEllipse ? 'active' : ''} onClick={() => onUpdate({ shape: 'box' })} aria-label="Box shape">Box</button>
                <button type="button" className={isEllipse ? 'active' : ''} onClick={() => onUpdate({ shape: 'ellipse' })} aria-label="Ellipse shape">Ellipse</button>
              </div>
            </div>
          )}
          {!isCutMode && (
            <div className="part-panel-material">
              <label>
                Material:&nbsp;
                <select
                  value={part.materialType ?? 'hardwood'}
                  onChange={(e) => onUpdate({ materialType: e.target.value as Part['materialType'] })}
                  aria-label="Material type"
                >
                  <option value="hardwood">Hardwood</option>
                  <option value="sheet">Sheet</option>
                  <option value="dimensional">Dimensional</option>
                </select>
              </label>
            </div>
          )}
        </>
      )}
    </div>
  )
}
