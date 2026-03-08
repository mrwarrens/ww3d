import { useState, useEffect, useRef } from 'react'
import type { Assembly } from '../models/Assembly'
import { toFractionalInches, parseInches } from '../utils/units'
import { useEditableInput } from '../hooks/useEditableInput'

interface AssemblyPanelProps {
  assembly: Assembly
  onMoveAssembly: (position: { x: number; y: number; z: number }) => void
  onRenameAssembly?: (name: string) => void
}

export default function AssemblyPanel({ assembly, onMoveAssembly, onRenameAssembly }: AssemblyPanelProps) {
  const [draftAsmName, setDraftAsmName] = useState(assembly.name)
  const skipBlurRef = useRef(false)

  useEffect(() => {
    setDraftAsmName(assembly.name)
  }, [assembly.id, assembly.name])

  const posXInput = useEditableInput({
    externalValue: toFractionalInches(assembly.position.x),
    parse: parseInches, format: toFractionalInches,
    onCommit: v => onMoveAssembly({ ...assembly.position, x: v }),
    step: 0.0625, skipBlurRef,
  })
  const posYInput = useEditableInput({
    externalValue: toFractionalInches(assembly.position.y),
    parse: parseInches, format: toFractionalInches,
    onCommit: v => onMoveAssembly({ ...assembly.position, y: v }),
    step: 0.0625, skipBlurRef,
  })
  const posZInput = useEditableInput({
    externalValue: toFractionalInches(assembly.position.z),
    parse: parseInches, format: toFractionalInches,
    onCommit: v => onMoveAssembly({ ...assembly.position, z: v }),
    step: 0.0625, skipBlurRef,
  })

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
          <input type="text" className="part-panel-input part-panel-dim-input" value={posXInput.draft}
            onChange={(e) => posXInput.setDraft(e.target.value)}
            onBlur={posXInput.onBlur}
            onKeyDown={posXInput.onKeyDown}
            aria-label="Assembly Position X" />
        </label>
        <label>
          Py:&nbsp;
          <input type="text" className="part-panel-input part-panel-dim-input" value={posYInput.draft}
            onChange={(e) => posYInput.setDraft(e.target.value)}
            onBlur={posYInput.onBlur}
            onKeyDown={posYInput.onKeyDown}
            aria-label="Assembly Position Y" />
        </label>
        <label>
          Pz:&nbsp;
          <input type="text" className="part-panel-input part-panel-dim-input" value={posZInput.draft}
            onChange={(e) => posZInput.setDraft(e.target.value)}
            onBlur={posZInput.onBlur}
            onKeyDown={posZInput.onKeyDown}
            aria-label="Assembly Position Z" />
        </label>
      </div>
    </div>
  )
}
