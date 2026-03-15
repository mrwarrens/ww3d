import { describe, it, expect } from 'vitest'
import { render } from 'vitest-browser-react'
import PropertiesPanel from '../src/components/PropertiesPanel'
import { createPart } from '../src/models/Part'
import type { Part } from '../src/models/Part'

type PartPanelProps = { part: Part; onUpdate: Parameters<typeof PropertiesPanel>[0]['onUpdate'] }
function PartPanel({ part, onUpdate }: PartPanelProps) {
  return <PropertiesPanel part={part} assembly={null} onUpdate={onUpdate} onMoveAssembly={() => {}} />
}

const topLevelPart = createPart({
  name: 'Board',
  length: 24,
  width: 8,
  thickness: 0.75,
  position: { x: 0, y: 0.375, z: 0 },
})

const childPart = createPart({
  name: 'Cut',
  length: 4,
  width: 4,
  thickness: 0.75,
  position: { x: 0, y: 0, z: 0 },
  parentId: topLevelPart.id,
})

describe('Modify mode - PartPanel', () => {
  it('does not contain an Edit Cuts button (moved to left panel)', async () => {
    const { container } = await render(
      <PartPanel part={topLevelPart} onUpdate={() => {}} />
    )
    const buttons = Array.from(container.querySelectorAll('button'))
    const editCutsBtn = buttons.find((b) => /edit cuts/i.test(b.textContent ?? ''))
    expect(editCutsBtn).toBeUndefined()
  })

  it('does not contain a Done Editing / Done button', async () => {
    const { container } = await render(
      <PartPanel part={topLevelPart} onUpdate={() => {}} />
    )
    const buttons = Array.from(container.querySelectorAll('button'))
    const doneBtn = buttons.find((b) => /done/i.test(b.textContent ?? ''))
    expect(doneBtn).toBeUndefined()
  })

  it('does not render edit-cuts section for a child part', async () => {
    const { container } = await render(
      <PartPanel part={childPart} onUpdate={() => {}} />
    )
    const editCutsDiv = container.querySelector('.part-panel-edit-cuts')
    expect(editCutsDiv).toBeNull()
  })
})
