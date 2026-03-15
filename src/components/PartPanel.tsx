import { useState, useEffect, useRef } from 'react'
import type { Part } from '../models/Part'
import { toFractionalInches, parseInches } from '../utils/units'
import { useEditableInput } from '../hooks/useEditableInput'

interface PartPanelProps {
  part: Part
  onUpdate: (changes: Partial<Pick<Part, 'name' | 'length' | 'width' | 'thickness' | 'rotation' | 'color' | 'position' | 'operation' | 'shape'>>) => void
  onEyedropperActivate?: () => void
}

const radToDeg = (r: number) => (r * 180 / Math.PI).toFixed(1)
const parseRot = (s: string) => { const d = parseFloat(s); if (isNaN(d)) throw new Error(); return d }
const formatRot = (v: number) => v.toFixed(1)

export default function PartPanel({
  part,
  onUpdate,
  onEyedropperActivate,
}: PartPanelProps) {
  const [draftName, setDraftName] = useState(part.name)
  const skipBlurRef = useRef(false)

  useEffect(() => {
    setDraftName(part.name)
  }, [part.id, part.name])

  const lenInput = useEditableInput({
    externalValue: toFractionalInches(part.length),
    parse: parseInches, format: toFractionalInches,
    validate: v => v > 0, onCommit: v => onUpdate({ length: v }),
    step: 0.0625, minValue: 0.0625, skipBlurRef,
  })
  const widInput = useEditableInput({
    externalValue: toFractionalInches(part.width),
    parse: parseInches, format: toFractionalInches,
    validate: v => v > 0, onCommit: v => onUpdate({ width: v }),
    step: 0.0625, minValue: 0.0625, skipBlurRef,
  })
  const thkInput = useEditableInput({
    externalValue: toFractionalInches(part.thickness),
    parse: parseInches, format: toFractionalInches,
    validate: v => v > 0, onCommit: v => onUpdate({ thickness: v }),
    step: 0.0625, minValue: 0.0625, skipBlurRef,
  })
  const rotXInput = useEditableInput({
    externalValue: radToDeg(part.rotation.x),
    parse: parseRot, format: formatRot,
    onCommit: v => onUpdate({ rotation: { ...part.rotation, x: v * Math.PI / 180 } }),
    step: 1, skipBlurRef,
  })
  const rotYInput = useEditableInput({
    externalValue: radToDeg(part.rotation.y),
    parse: parseRot, format: formatRot,
    onCommit: v => onUpdate({ rotation: { ...part.rotation, y: v * Math.PI / 180 } }),
    step: 1, skipBlurRef,
  })
  const rotZInput = useEditableInput({
    externalValue: radToDeg(part.rotation.z),
    parse: parseRot, format: formatRot,
    onCommit: v => onUpdate({ rotation: { ...part.rotation, z: v * Math.PI / 180 } }),
    step: 1, skipBlurRef,
  })
  const posXInput = useEditableInput({
    externalValue: toFractionalInches(part.position.x),
    parse: parseInches, format: toFractionalInches,
    onCommit: v => onUpdate({ position: { ...part.position, x: v } }),
    step: 0.0625, skipBlurRef,
  })
  const posYInput = useEditableInput({
    externalValue: toFractionalInches(part.position.y),
    parse: parseInches, format: toFractionalInches,
    onCommit: v => onUpdate({ position: { ...part.position, y: v } }),
    step: 0.0625, skipBlurRef,
  })
  const posZInput = useEditableInput({
    externalValue: toFractionalInches(part.position.z),
    parse: parseInches, format: toFractionalInches,
    onCommit: v => onUpdate({ position: { ...part.position, z: v } }),
    step: 0.0625, skipBlurRef,
  })

  function commitName() {
    if (skipBlurRef.current) {
      skipBlurRef.current = false
      return
    }
    const trimmed = draftName.trim()
    if (trimmed) {
      onUpdate({ name: trimmed })
    } else {
      setDraftName(part.name)
    }
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      skipBlurRef.current = true
      setDraftName(part.name)
      e.currentTarget.blur()
    }
  }

  const isEllipse = part.shape === 'ellipse'

  return (
    <div id="part-panel">
      <div className="part-panel-name">
        <input
          type="text"
          className="part-panel-input"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitName}
          onKeyDown={handleNameKeyDown}
          aria-label="Part name"
        />
      </div>
      <div className="part-panel-dims">
        <label>
          L:&nbsp;
          <input
            type="text"
            className="part-panel-input part-panel-dim-input"
            value={lenInput.draft}
            onChange={(e) => lenInput.setDraft(e.target.value)}
            onBlur={lenInput.onBlur}
            onKeyDown={lenInput.onKeyDown}
            aria-label="Length"
          />
        </label>
        <label>
          W:&nbsp;
          <input
            type="text"
            className="part-panel-input part-panel-dim-input"
            value={widInput.draft}
            onChange={(e) => widInput.setDraft(e.target.value)}
            onBlur={widInput.onBlur}
            onKeyDown={widInput.onKeyDown}
            aria-label="Width"
          />
        </label>
        <label>
          T:&nbsp;
          <input
            type="text"
            className="part-panel-input part-panel-dim-input"
            value={thkInput.draft}
            onChange={(e) => thkInput.setDraft(e.target.value)}
            onBlur={thkInput.onBlur}
            onKeyDown={thkInput.onKeyDown}
            aria-label="Thickness"
          />
        </label>
      </div>
      <div className="part-panel-dims">
        <label>
          Rx:&nbsp;
          <input
            type="text"
            className="part-panel-input part-panel-dim-input"
            value={rotXInput.draft}
            onChange={(e) => rotXInput.setDraft(e.target.value)}
            onBlur={rotXInput.onBlur}
            onKeyDown={rotXInput.onKeyDown}
            aria-label="Rotation X"
          />
        </label>
        <label>
          Ry:&nbsp;
          <input
            type="text"
            className="part-panel-input part-panel-dim-input"
            value={rotYInput.draft}
            onChange={(e) => rotYInput.setDraft(e.target.value)}
            onBlur={rotYInput.onBlur}
            onKeyDown={rotYInput.onKeyDown}
            aria-label="Rotation Y"
          />
        </label>
        <label>
          Rz:&nbsp;
          <input
            type="text"
            className="part-panel-input part-panel-dim-input"
            value={rotZInput.draft}
            onChange={(e) => rotZInput.setDraft(e.target.value)}
            onBlur={rotZInput.onBlur}
            onKeyDown={rotZInput.onKeyDown}
            aria-label="Rotation Z"
          />
        </label>
      </div>
      <div className="part-panel-dims">
        <label>
          Px:&nbsp;
          <input
            type="text"
            className="part-panel-input part-panel-dim-input"
            value={posXInput.draft}
            onChange={(e) => posXInput.setDraft(e.target.value)}
            onBlur={posXInput.onBlur}
            onKeyDown={posXInput.onKeyDown}
            aria-label="Position X"
          />
        </label>
        <label>
          Py:&nbsp;
          <input
            type="text"
            className="part-panel-input part-panel-dim-input"
            value={posYInput.draft}
            onChange={(e) => posYInput.setDraft(e.target.value)}
            onBlur={posYInput.onBlur}
            onKeyDown={posYInput.onKeyDown}
            aria-label="Position Y"
          />
        </label>
        <label>
          Pz:&nbsp;
          <input
            type="text"
            className="part-panel-input part-panel-dim-input"
            value={posZInput.draft}
            onChange={(e) => posZInput.setDraft(e.target.value)}
            onBlur={posZInput.onBlur}
            onKeyDown={posZInput.onKeyDown}
            aria-label="Position Z"
          />
        </label>
      </div>
      <div className="part-panel-color-shape-row">
        <div className="part-panel-color">
          <label>
            Color:&nbsp;
            <input
              type="color"
              value={part.color}
              onChange={(e) => onUpdate({ color: e.target.value })}
              aria-label="Color"
            />
          </label>
          {onEyedropperActivate && (
            <button type="button" onClick={onEyedropperActivate} aria-label="Eyedropper">Pick</button>
          )}
        </div>
        <div className="part-panel-shape" aria-label="Shape">
          <button
            type="button"
            className={!isEllipse ? 'active' : ''}
            onClick={() => onUpdate({ shape: 'box' })}
            aria-label="Box shape"
          >Box</button>
          <button
            type="button"
            className={isEllipse ? 'active' : ''}
            onClick={() => onUpdate({ shape: 'ellipse' })}
            aria-label="Ellipse shape"
          >Ellipse</button>
        </div>
      </div>
      {part.parentId && (
        <div className="part-panel-operation" aria-label="Operation">
          <button
            type="button"
            className={part.operation === 'add' ? 'active' : ''}
            onClick={() => onUpdate({ operation: 'add' })}
            aria-label="Add operation"
          >Add</button>
          <button
            type="button"
            className={part.operation !== 'add' ? 'active' : ''}
            onClick={() => onUpdate({ operation: 'subtract' })}
            aria-label="Subtract operation"
          >Subtract</button>
        </div>
      )}
    </div>
  )
}
