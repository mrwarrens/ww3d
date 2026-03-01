import { useState, useEffect, useRef } from 'react'
import type { Part } from '../models/Part'
import type { Assembly } from '../models/Assembly'
import type { Constraint } from '../models/Constraint'
import { toFractionalInches, parseInches } from '../utils/units'

type ConstraintPreset = 'flush-min' | 'flush-max' | 'centered' | 'offset'

const PRESET_LABELS: Record<ConstraintPreset, string> = {
  'flush-min': 'Flush (min faces)',
  'flush-max': 'Flush (max faces)',
  'centered': 'Centered',
  'offset': 'Offset by X',
}

interface PartPanelProps {
  part: Part | null
  onUpdate: (changes: Partial<Pick<Part, 'name' | 'length' | 'width' | 'thickness' | 'rotation' | 'color' | 'position'>>) => void
  assembly: Assembly | null
  onMoveAssembly: (position: { x: number; y: number; z: number }) => void
  onRenameAssembly?: (name: string) => void
  constraints?: Constraint[]
  allParts?: Part[]
  onAddConstraint?: (c: Omit<Constraint, 'id'>) => void
  onRemoveConstraint?: (id: string) => void
}

export default function PartPanel({
  part,
  onUpdate,
  assembly,
  onMoveAssembly,
  onRenameAssembly,
  constraints = [],
  allParts = [],
  onAddConstraint,
  onRemoveConstraint,
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

  // Constraint add form state
  const [addingConstraint, setAddingConstraint] = useState(false)
  const [cAnchorId, setCAnchorId] = useState('')
  const [cPreset, setCPreset] = useState<ConstraintPreset>('flush-min')
  const [cAxis, setCAxis] = useState<'x' | 'y' | 'z'>('x')
  const [cOffset, setCOffset] = useState('0')

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
    setDraftPosX(part.position.x.toFixed(3))
    setDraftPosY(part.position.y.toFixed(3))
    setDraftPosZ(part.position.z.toFixed(3))
  }, [part?.id])

  useEffect(() => {
    if (!part) return
    setDraftPosX(part.position.x.toFixed(3))
    setDraftPosY(part.position.y.toFixed(3))
    setDraftPosZ(part.position.z.toFixed(3))
  }, [part?.id, part?.position.x, part?.position.y, part?.position.z])

  // Assembly draft state
  const [draftAsmName, setDraftAsmName] = useState('')
  const [draftAsmPosX, setDraftAsmPosX] = useState('')
  const [draftAsmPosY, setDraftAsmPosY] = useState('')
  const [draftAsmPosZ, setDraftAsmPosZ] = useState('')

  useEffect(() => {
    if (!assembly) return
    setDraftAsmName(assembly.name)
    setDraftAsmPosX(assembly.position.x.toFixed(3))
    setDraftAsmPosY(assembly.position.y.toFixed(3))
    setDraftAsmPosZ(assembly.position.z.toFixed(3))
  }, [assembly?.id, assembly?.position.x, assembly?.position.y, assembly?.position.z])

  if (!part && !assembly) return null

  if (assembly && !part) {
    const currentAsmPosX = assembly.position.x.toFixed(3)
    const currentAsmPosY = assembly.position.y.toFixed(3)
    const currentAsmPosZ = assembly.position.z.toFixed(3)

    function commitAsmPos(draft: string, axis: 'x' | 'y' | 'z', resetValue: string) {
      if (skipBlurRef.current) { skipBlurRef.current = false; return }
      const value = parseFloat(draft)
      if (!isNaN(value)) {
        onMoveAssembly({ ...assembly!.position, [axis]: value })
      } else {
        if (axis === 'x') setDraftAsmPosX(resetValue)
        else if (axis === 'y') setDraftAsmPosY(resetValue)
        else setDraftAsmPosZ(resetValue)
      }
    }

    function handleAsmPosKeyDown(e: React.KeyboardEvent<HTMLInputElement>, draft: string, axis: 'x' | 'y' | 'z', resetValue: string) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        let current = parseFloat(draft)
        if (isNaN(current)) current = parseFloat(resetValue) || 0
        const newValue = current + (e.key === 'ArrowUp' ? 0.0625 : -0.0625)
        const newStr = newValue.toFixed(4)
        if (axis === 'x') setDraftAsmPosX(newStr)
        else if (axis === 'y') setDraftAsmPosY(newStr)
        else setDraftAsmPosZ(newStr)
        onMoveAssembly({ ...assembly!.position, [axis]: newValue })
      } else if (e.key === 'Enter') {
        commitAsmPos(draft, axis, resetValue)
        skipBlurRef.current = true
        e.currentTarget.blur()
      } else if (e.key === 'Escape') {
        skipBlurRef.current = true
        if (axis === 'x') setDraftAsmPosX(resetValue)
        else if (axis === 'y') setDraftAsmPosY(resetValue)
        else setDraftAsmPosZ(resetValue)
        e.currentTarget.blur()
      }
    }

    function commitAsmName() {
      if (skipBlurRef.current) { skipBlurRef.current = false; return }
      const trimmed = draftAsmName.trim()
      if (trimmed && onRenameAssembly) {
        onRenameAssembly(trimmed)
      } else {
        setDraftAsmName(assembly!.name)
      }
    }

    function handleAsmNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === 'Enter') {
        commitAsmName()
        skipBlurRef.current = true
        e.currentTarget.blur()
      } else if (e.key === 'Escape') {
        skipBlurRef.current = true
        setDraftAsmName(assembly!.name)
        e.currentTarget.blur()
      }
    }

    return (
      <div id="part-panel">
        <div className="part-panel-name">
          <input
            type="text"
            className="part-panel-input"
            value={draftAsmName}
            onChange={(e) => setDraftAsmName(e.target.value)}
            onBlur={commitAsmName}
            onKeyDown={handleAsmNameKeyDown}
            aria-label="Assembly name"
          />
        </div>
        <div className="part-panel-dims">
          <label>
            Px:&nbsp;
            <input type="text" className="part-panel-input part-panel-dim-input" value={draftAsmPosX}
              onChange={(e) => setDraftAsmPosX(e.target.value)}
              onBlur={() => commitAsmPos(draftAsmPosX, 'x', currentAsmPosX)}
              onKeyDown={(e) => handleAsmPosKeyDown(e, draftAsmPosX, 'x', currentAsmPosX)}
              aria-label="Assembly Position X" />
          </label>
          <label>
            Py:&nbsp;
            <input type="text" className="part-panel-input part-panel-dim-input" value={draftAsmPosY}
              onChange={(e) => setDraftAsmPosY(e.target.value)}
              onBlur={() => commitAsmPos(draftAsmPosY, 'y', currentAsmPosY)}
              onKeyDown={(e) => handleAsmPosKeyDown(e, draftAsmPosY, 'y', currentAsmPosY)}
              aria-label="Assembly Position Y" />
          </label>
          <label>
            Pz:&nbsp;
            <input type="text" className="part-panel-input part-panel-dim-input" value={draftAsmPosZ}
              onChange={(e) => setDraftAsmPosZ(e.target.value)}
              onBlur={() => commitAsmPos(draftAsmPosZ, 'z', currentAsmPosZ)}
              onKeyDown={(e) => handleAsmPosKeyDown(e, draftAsmPosZ, 'z', currentAsmPosZ)}
              aria-label="Assembly Position Z" />
          </label>
        </div>
      </div>
    )
  }

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
    const value = parseFloat(draft)
    if (!isNaN(value)) {
      onUpdate({ position: { ...part!.position, [axis]: value } })
    } else {
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
      let current = parseFloat(draft)
      if (isNaN(current)) current = parseFloat(resetValue) || 0
      const newValue = current + (e.key === 'ArrowUp' ? 0.0625 : -0.0625)
      const newStr = newValue.toFixed(4)
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

  const currentLength = toFractionalInches(part.length)
  const currentWidth = toFractionalInches(part.width)
  const currentThickness = toFractionalInches(part.thickness)
  const currentRotX = radToDeg(part.rotation.x)
  const currentRotY = radToDeg(part.rotation.y)
  const currentRotZ = radToDeg(part.rotation.z)
  const currentPosX = part.position.x.toFixed(3)
  const currentPosY = part.position.y.toFixed(3)
  const currentPosZ = part.position.z.toFixed(3)

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
      </div>
      <div className="part-panel-constraints">
        <div className="part-panel-constraints-header">
          <strong>Constraints</strong>
          {onAddConstraint && !addingConstraint && (
            <button
              onClick={() => {
                const firstOther = allParts.find((p) => p.id !== part.id)
                setCAnchorId(firstOther?.id ?? '')
                setCPreset('flush-min')
                setCAxis('x')
                setCOffset('0')
                setAddingConstraint(true)
              }}
              aria-label="Add constraint"
            >
              + Add
            </button>
          )}
        </div>
        {constraints.map((c) => {
          const anchor = allParts.find((p) => p.id === c.anchorPartId)
          const presetLabel = `${c.anchorFace}/${c.constrainedFace}` === 'min/min' ? 'Flush (min)'
            : `${c.anchorFace}/${c.constrainedFace}` === 'max/max' ? 'Flush (max)'
            : `${c.anchorFace}/${c.constrainedFace}` === 'center/center' ? 'Centered'
            : `Offset ${c.offset}"`
          return (
            <div key={c.id} className="part-panel-constraint-row">
              <span>{c.axis.toUpperCase()} — {presetLabel} → {anchor?.name ?? c.anchorPartId}</span>
              {onRemoveConstraint && (
                <button onClick={() => onRemoveConstraint(c.id)} aria-label="Remove constraint">✕</button>
              )}
            </div>
          )
        })}
        {addingConstraint && (
          <div className="part-panel-constraint-form">
            <label>
              Anchor:&nbsp;
              <select value={cAnchorId} onChange={(e) => setCAnchorId(e.target.value)} aria-label="Anchor part">
                {allParts.filter((p) => p.id !== part.id).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <label>
              Type:&nbsp;
              <select value={cPreset} onChange={(e) => setCPreset(e.target.value as ConstraintPreset)} aria-label="Constraint type">
                {(Object.keys(PRESET_LABELS) as ConstraintPreset[]).map((k) => (
                  <option key={k} value={k}>{PRESET_LABELS[k]}</option>
                ))}
              </select>
            </label>
            <label>
              Axis:&nbsp;
              <select value={cAxis} onChange={(e) => setCAxis(e.target.value as 'x' | 'y' | 'z')} aria-label="Constraint axis">
                <option value="x">X</option>
                <option value="y">Y</option>
                <option value="z">Z</option>
              </select>
            </label>
            {cPreset === 'offset' && (
              <label>
                Distance:&nbsp;
                <input
                  type="number"
                  value={cOffset}
                  onChange={(e) => setCOffset(e.target.value)}
                  aria-label="Offset distance"
                  style={{ width: '4em' }}
                />
              </label>
            )}
            <div className="part-panel-constraint-form-actions">
              <button
                onClick={() => {
                  if (!onAddConstraint || !cAnchorId) return
                  const presetMap: Record<ConstraintPreset, { anchorFace: 'min' | 'center' | 'max'; constrainedFace: 'min' | 'center' | 'max'; offset: number }> = {
                    'flush-min': { anchorFace: 'min', constrainedFace: 'min', offset: 0 },
                    'flush-max': { anchorFace: 'max', constrainedFace: 'max', offset: 0 },
                    'centered': { anchorFace: 'center', constrainedFace: 'center', offset: 0 },
                    'offset': { anchorFace: 'max', constrainedFace: 'min', offset: parseFloat(cOffset) || 0 },
                  }
                  onAddConstraint({
                    anchorPartId: cAnchorId,
                    constrainedPartId: part.id,
                    axis: cAxis,
                    ...presetMap[cPreset],
                  })
                  setAddingConstraint(false)
                }}
              >
                Apply
              </button>
              <button onClick={() => setAddingConstraint(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
