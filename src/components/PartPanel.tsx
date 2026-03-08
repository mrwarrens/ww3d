import { useState, useEffect, useRef } from 'react'
import type { Part } from '../models/Part'
import { toFractionalInches, parseInches } from '../utils/units'

interface PartPanelProps {
  part: Part
  onUpdate: (changes: Partial<Pick<Part, 'name' | 'length' | 'width' | 'thickness' | 'rotation' | 'color' | 'position' | 'operation' | 'shape'>>) => void
  onEyedropperActivate?: () => void
  isModifying?: boolean
  onEnterModifyMode?: () => void
  onExitModifyMode?: () => void
}

export default function PartPanel({
  part,
  onUpdate,
  onEyedropperActivate,
  isModifying,
  onEnterModifyMode,
  onExitModifyMode,
}: PartPanelProps) {
  const [draftName, setDraftName] = useState('')
  const [draftLength, setDraftLength] = useState('')
  const [draftWidth, setDraftWidth] = useState('')
  const [draftThickness, setDraftThickness] = useState('')
  const [draftRotX, setDraftRotX] = useState('')
  const [draftRotY, setDraftRotY] = useState('')
  const [draftRotZ, setDraftRotZ] = useState('')
  const [draftPosX, setDraftPosX] = useState('')
  const [draftPosY, setDraftPosY] = useState('')
  const [draftPosZ, setDraftPosZ] = useState('')
  const skipBlurRef = useRef(false)

  const radToDeg = (r: number) => (r * 180 / Math.PI).toFixed(1)

  useEffect(() => {
    setDraftName(part.name)
    setDraftLength(toFractionalInches(part.length))
    setDraftWidth(toFractionalInches(part.width))
    setDraftThickness(toFractionalInches(part.thickness))
    setDraftRotX(radToDeg(part.rotation.x))
    setDraftRotY(radToDeg(part.rotation.y))
    setDraftRotZ(radToDeg(part.rotation.z))
    setDraftPosX(toFractionalInches(part.position.x))
    setDraftPosY(toFractionalInches(part.position.y))
    setDraftPosZ(toFractionalInches(part.position.z))
  }, [part.id])

  useEffect(() => {
    setDraftPosX(toFractionalInches(part.position.x))
    setDraftPosY(toFractionalInches(part.position.y))
    setDraftPosZ(toFractionalInches(part.position.z))
  }, [part.id, part.position.x, part.position.y, part.position.z])

  function commitName() {
    if (skipBlurRef.current) {
      skipBlurRef.current = false
      return
    }
    const trimmed = draftName.trim()
    if (trimmed) {
      onUpdate({ name: trimmed })
    } else {
      setDraftName(part!.name)
    }
  }

  function commitDim(
    draft: string,
    field: 'length' | 'width' | 'thickness',
    resetValue: string
  ) {
    if (skipBlurRef.current) {
      skipBlurRef.current = false
      return
    }
    try {
      const value = parseInches(draft)
      if (value > 0) {
        onUpdate({ [field]: value })
        resetDim(toFractionalInches(value), field)
      } else {
        resetDim(resetValue, field)
      }
    } catch {
      resetDim(resetValue, field)
    }
  }

  function resetDim(resetValue: string, field: 'length' | 'width' | 'thickness') {
    if (field === 'length') setDraftLength(resetValue)
    else if (field === 'width') setDraftWidth(resetValue)
    else setDraftThickness(resetValue)
  }

  function commitRot(draft: string, axis: 'x' | 'y' | 'z', resetValue: string) {
    if (skipBlurRef.current) {
      skipBlurRef.current = false
      return
    }
    const deg = parseFloat(draft)
    if (!isNaN(deg)) {
      const radians = deg * Math.PI / 180
      onUpdate({ rotation: { ...part!.rotation, [axis]: radians } })
    } else {
      resetRot(resetValue, axis)
    }
  }

  function resetRot(resetValue: string, axis: 'x' | 'y' | 'z') {
    if (axis === 'x') setDraftRotX(resetValue)
    else if (axis === 'y') setDraftRotY(resetValue)
    else setDraftRotZ(resetValue)
  }

  function handleRotKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    draft: string,
    axis: 'x' | 'y' | 'z',
    resetValue: string
  ) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      let currentDeg = parseFloat(draft)
      if (isNaN(currentDeg)) currentDeg = parseFloat(resetValue) || 0
      const newDeg = currentDeg + (e.key === 'ArrowUp' ? 1 : -1)
      const newStr = newDeg.toFixed(1)
      if (axis === 'x') setDraftRotX(newStr)
      else if (axis === 'y') setDraftRotY(newStr)
      else setDraftRotZ(newStr)
      onUpdate({ rotation: { ...part!.rotation, [axis]: newDeg * Math.PI / 180 } })
    } else if (e.key === 'Enter') {
      commitRot(draft, axis, resetValue)
      skipBlurRef.current = true
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      skipBlurRef.current = true
      resetRot(resetValue, axis)
      e.currentTarget.blur()
    }
  }

  function commitPos(draft: string, axis: 'x' | 'y' | 'z', resetValue: string) {
    if (skipBlurRef.current) {
      skipBlurRef.current = false
      return
    }
    try {
      const value = parseInches(draft)
      onUpdate({ position: { ...part!.position, [axis]: value } })
      resetPos(toFractionalInches(value), axis)
    } catch {
      resetPos(resetValue, axis)
    }
  }

  function resetPos(resetValue: string, axis: 'x' | 'y' | 'z') {
    if (axis === 'x') setDraftPosX(resetValue)
    else if (axis === 'y') setDraftPosY(resetValue)
    else setDraftPosZ(resetValue)
  }

  function handlePosKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    draft: string,
    axis: 'x' | 'y' | 'z',
    resetValue: string
  ) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      let current: number
      try { current = parseInches(draft) } catch { try { current = parseInches(resetValue) } catch { current = 0 } }
      const rawValue = current + (e.key === 'ArrowUp' ? 0.0625 : -0.0625)
      const newValue = parseFloat(rawValue.toFixed(10))
      const newStr = toFractionalInches(newValue)
      if (axis === 'x') setDraftPosX(newStr)
      else if (axis === 'y') setDraftPosY(newStr)
      else setDraftPosZ(newStr)
      onUpdate({ position: { ...part!.position, [axis]: newValue } })
    } else if (e.key === 'Enter') {
      commitPos(draft, axis, resetValue)
      skipBlurRef.current = true
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      skipBlurRef.current = true
      resetPos(resetValue, axis)
      e.currentTarget.blur()
    }
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      skipBlurRef.current = true
      setDraftName(part!.name)
      e.currentTarget.blur()
    }
  }

  function handleDimKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    draft: string,
    field: 'length' | 'width' | 'thickness',
    resetValue: string
  ) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      let current: number
      try { current = parseInches(draft) } catch { try { current = parseInches(resetValue) } catch { current = 0.0625 } }
      const newValue = Math.max(0.0625, current + (e.key === 'ArrowUp' ? 0.0625 : -0.0625))
      const newStr = toFractionalInches(newValue)
      if (field === 'length') setDraftLength(newStr)
      else if (field === 'width') setDraftWidth(newStr)
      else setDraftThickness(newStr)
      onUpdate({ [field]: newValue })
    } else if (e.key === 'Enter') {
      commitDim(draft, field, resetValue)
      skipBlurRef.current = true
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      skipBlurRef.current = true
      resetDim(resetValue, field)
      e.currentTarget.blur()
    }
  }

  const isEllipse = part.shape === 'ellipse'
  const currentLength = toFractionalInches(part.length)
  const currentWidth = toFractionalInches(part.width)
  const currentThickness = toFractionalInches(part.thickness)
  const currentRotX = radToDeg(part.rotation.x)
  const currentRotY = radToDeg(part.rotation.y)
  const currentRotZ = radToDeg(part.rotation.z)
  const currentPosX = toFractionalInches(part.position.x)
  const currentPosY = toFractionalInches(part.position.y)
  const currentPosZ = toFractionalInches(part.position.z)

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
            value={draftLength}
            onChange={(e) => setDraftLength(e.target.value)}
            onBlur={() => commitDim(draftLength, 'length', currentLength)}
            onKeyDown={(e) => handleDimKeyDown(e, draftLength, 'length', currentLength)}
            aria-label="Length"
          />
        </label>
        <label>
          W:&nbsp;
          <input
            type="text"
            className="part-panel-input part-panel-dim-input"
            value={draftWidth}
            onChange={(e) => setDraftWidth(e.target.value)}
            onBlur={() => commitDim(draftWidth, 'width', currentWidth)}
            onKeyDown={(e) => handleDimKeyDown(e, draftWidth, 'width', currentWidth)}
            aria-label="Width"
          />
        </label>
        <label>
          T:&nbsp;
          <input
            type="text"
            className="part-panel-input part-panel-dim-input"
            value={draftThickness}
            onChange={(e) => setDraftThickness(e.target.value)}
            onBlur={() => commitDim(draftThickness, 'thickness', currentThickness)}
            onKeyDown={(e) => handleDimKeyDown(e, draftThickness, 'thickness', currentThickness)}
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
            value={draftRotX}
            onChange={(e) => setDraftRotX(e.target.value)}
            onBlur={() => commitRot(draftRotX, 'x', currentRotX)}
            onKeyDown={(e) => handleRotKeyDown(e, draftRotX, 'x', currentRotX)}
            aria-label="Rotation X"
          />
        </label>
        <label>
          Ry:&nbsp;
          <input
            type="text"
            className="part-panel-input part-panel-dim-input"
            value={draftRotY}
            onChange={(e) => setDraftRotY(e.target.value)}
            onBlur={() => commitRot(draftRotY, 'y', currentRotY)}
            onKeyDown={(e) => handleRotKeyDown(e, draftRotY, 'y', currentRotY)}
            aria-label="Rotation Y"
          />
        </label>
        <label>
          Rz:&nbsp;
          <input
            type="text"
            className="part-panel-input part-panel-dim-input"
            value={draftRotZ}
            onChange={(e) => setDraftRotZ(e.target.value)}
            onBlur={() => commitRot(draftRotZ, 'z', currentRotZ)}
            onKeyDown={(e) => handleRotKeyDown(e, draftRotZ, 'z', currentRotZ)}
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
            value={draftPosX}
            onChange={(e) => setDraftPosX(e.target.value)}
            onBlur={() => commitPos(draftPosX, 'x', currentPosX)}
            onKeyDown={(e) => handlePosKeyDown(e, draftPosX, 'x', currentPosX)}
            aria-label="Position X"
          />
        </label>
        <label>
          Py:&nbsp;
          <input
            type="text"
            className="part-panel-input part-panel-dim-input"
            value={draftPosY}
            onChange={(e) => setDraftPosY(e.target.value)}
            onBlur={() => commitPos(draftPosY, 'y', currentPosY)}
            onKeyDown={(e) => handlePosKeyDown(e, draftPosY, 'y', currentPosY)}
            aria-label="Position Y"
          />
        </label>
        <label>
          Pz:&nbsp;
          <input
            type="text"
            className="part-panel-input part-panel-dim-input"
            value={draftPosZ}
            onChange={(e) => setDraftPosZ(e.target.value)}
            onBlur={() => commitPos(draftPosZ, 'z', currentPosZ)}
            onKeyDown={(e) => handlePosKeyDown(e, draftPosZ, 'z', currentPosZ)}
            aria-label="Position Z"
          />
        </label>
      </div>
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
      {!part.parentId && (
        <div className="part-panel-edit-cuts">
          {isModifying
            ? <button type="button" onClick={onExitModifyMode}>Done Editing</button>
            : <button type="button" onClick={onEnterModifyMode}>Edit Cuts</button>
          }
        </div>
      )}
    </div>
  )
}
