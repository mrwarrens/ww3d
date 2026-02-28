import { useState, useEffect, useRef } from 'react'
import type { Part } from '../models/Part'
import { toFractionalInches, parseInches } from '../utils/units'

interface PartPanelProps {
  part: Part | null
  onUpdate: (changes: Partial<Pick<Part, 'name' | 'length' | 'width' | 'thickness'>>) => void
}

export default function PartPanel({ part, onUpdate }: PartPanelProps) {
  const [draftName, setDraftName] = useState('')
  const [draftLength, setDraftLength] = useState('')
  const [draftWidth, setDraftWidth] = useState('')
  const [draftThickness, setDraftThickness] = useState('')
  const skipBlurRef = useRef(false)

  useEffect(() => {
    if (!part) return
    setDraftName(part.name)
    setDraftLength(toFractionalInches(part.length))
    setDraftWidth(toFractionalInches(part.width))
    setDraftThickness(toFractionalInches(part.thickness))
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
    </div>
  )
}
