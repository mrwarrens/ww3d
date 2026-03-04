import { useState, useEffect, useRef } from 'react'
import type { Assembly } from '../models/Assembly'
import { toFractionalInches, parseInches } from '../utils/units'

interface AssemblyPanelProps {
  assembly: Assembly
  onMoveAssembly: (position: { x: number; y: number; z: number }) => void
  onRenameAssembly?: (name: string) => void
}

export default function AssemblyPanel({ assembly, onMoveAssembly, onRenameAssembly }: AssemblyPanelProps) {
  const [draftAsmName, setDraftAsmName] = useState(assembly.name)
  const [draftAsmPosX, setDraftAsmPosX] = useState(toFractionalInches(assembly.position.x))
  const [draftAsmPosY, setDraftAsmPosY] = useState(toFractionalInches(assembly.position.y))
  const [draftAsmPosZ, setDraftAsmPosZ] = useState(toFractionalInches(assembly.position.z))
  const skipBlurRef = useRef(false)

  useEffect(() => {
    setDraftAsmName(assembly.name)
    setDraftAsmPosX(toFractionalInches(assembly.position.x))
    setDraftAsmPosY(toFractionalInches(assembly.position.y))
    setDraftAsmPosZ(toFractionalInches(assembly.position.z))
  }, [assembly.id, assembly.position.x, assembly.position.y, assembly.position.z])

  const currentAsmPosX = toFractionalInches(assembly.position.x)
  const currentAsmPosY = toFractionalInches(assembly.position.y)
  const currentAsmPosZ = toFractionalInches(assembly.position.z)

  function commitAsmPos(draft: string, axis: 'x' | 'y' | 'z', resetValue: string) {
    if (skipBlurRef.current) { skipBlurRef.current = false; return }
    try {
      const value = parseInches(draft)
      onMoveAssembly({ ...assembly.position, [axis]: value })
      if (axis === 'x') setDraftAsmPosX(toFractionalInches(value))
      else if (axis === 'y') setDraftAsmPosY(toFractionalInches(value))
      else setDraftAsmPosZ(toFractionalInches(value))
    } catch {
      if (axis === 'x') setDraftAsmPosX(resetValue)
      else if (axis === 'y') setDraftAsmPosY(resetValue)
      else setDraftAsmPosZ(resetValue)
    }
  }

  function handleAsmPosKeyDown(e: React.KeyboardEvent<HTMLInputElement>, draft: string, axis: 'x' | 'y' | 'z', resetValue: string) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      let current: number
      try { current = parseInches(draft) } catch { try { current = parseInches(resetValue) } catch { current = 0 } }
      const rawValue = current + (e.key === 'ArrowUp' ? 0.0625 : -0.0625)
      const newValue = parseFloat(rawValue.toFixed(10))
      const newStr = toFractionalInches(newValue)
      if (axis === 'x') setDraftAsmPosX(newStr)
      else if (axis === 'y') setDraftAsmPosY(newStr)
      else setDraftAsmPosZ(newStr)
      onMoveAssembly({ ...assembly.position, [axis]: newValue })
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
      setDraftAsmName(assembly.name)
    }
  }

  function handleAsmNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      commitAsmName()
      skipBlurRef.current = true
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      skipBlurRef.current = true
      setDraftAsmName(assembly.name)
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
