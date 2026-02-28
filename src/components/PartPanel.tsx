import { useState, useEffect, useRef } from 'react'
import type { Part } from '../models/Part'
import { toFractionalInches, parseInches } from '../utils/units'

interface PartPanelProps {
  part: Part | null
  onUpdate: (changes: Partial<Pick<Part, 'name' | 'length' | 'width' | 'thickness' | 'rotation' | 'color'>>) => void
}

export default function PartPanel({ part, onUpdate }: PartPanelProps) {
  const [draftName, setDraftName] = useState('')
  const [draftLength, setDraftLength] = useState('')
  const [draftWidth, setDraftWidth] = useState('')
  const [draftThickness, setDraftThickness] = useState('')
  const [draftRotX, setDraftRotX] = useState('')
  const [draftRotY, setDraftRotY] = useState('')
  const [draftRotZ, setDraftRotZ] = useState('')
  const skipBlurRef = useRef(false)

  const radToDeg = (r: number) => (r * 180 / Math.PI).toFixed(1)

  useEffect(() => {
    if (!part) return
    setDraftName(part.name)
    setDraftLength(toFractionalInches(part.length))
    setDraftWidth(toFractionalInches(part.width))
    setDraftThickness(toFractionalInches(part.thickness))
    setDraftRotX(radToDeg(part.rotation.x))
    setDraftRotY(radToDeg(part.rotation.y))
    setDraftRotZ(radToDeg(part.rotation.z))
  }, [part?.id])

  if (!part) return null

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
    if (e.key === 'Enter') {
      commitRot(draft, axis, resetValue)
      skipBlurRef.current = true
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      skipBlurRef.current = true
      resetRot(resetValue, axis)
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
    if (e.key === 'Enter') {
      commitDim(draft, field, resetValue)
      skipBlurRef.current = true
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      skipBlurRef.current = true
      resetDim(resetValue, field)
      e.currentTarget.blur()
    }
  }

  const currentLength = toFractionalInches(part.length)
  const currentWidth = toFractionalInches(part.width)
  const currentThickness = toFractionalInches(part.thickness)
  const currentRotX = radToDeg(part.rotation.x)
  const currentRotY = radToDeg(part.rotation.y)
  const currentRotZ = radToDeg(part.rotation.z)

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
      </div>
    </div>
  )
}
