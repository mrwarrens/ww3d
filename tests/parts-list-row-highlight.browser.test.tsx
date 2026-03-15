import { expect, test, describe, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import PartsList from '../src/components/PartsList'
import { createPart } from '../src/models/Part'

const defaultProps = {
  onAddAssembly: vi.fn(),
  onAssignPart: vi.fn(),
  onRemoveFromAssembly: vi.fn(),
  onToggleAssemblyVisibility: vi.fn(),
}

describe('PartsList row highlight', () => {
  test('selected part row has .selected class', async () => {
    const part = createPart({ name: 'Board A', color: '#0000ff' })

    const { container } = await render(
      <PartsList
        parts={[part]}
        assemblies={[]}
        selectedIds={[part.id]}
        onSelectIds={vi.fn()}
        onToggleVisibility={vi.fn()}
        {...defaultProps}
      />
    )

    const li = container.querySelector(`li[data-part-id="${part.id}"]`)
    expect(li?.classList.contains('selected')).toBe(true)
  })

  test('cuts-list selected item has .selected class and not .cuts-empty', async () => {
    const parent = createPart({ name: 'Parent Board', color: '#aabbcc' })
    const cut = createPart({ name: 'Cut 1', color: '#ffffff', parentId: parent.id })

    const { container } = await render(
      <PartsList
        parts={[parent]}
        assemblies={[]}
        selectedIds={[cut.id]}
        onSelectIds={vi.fn()}
        onToggleVisibility={vi.fn()}
        modifyingPartId={parent.id}
        childParts={[cut]}
        selectedPartId={parent.id}
        {...defaultProps}
      />
    )

    const cutsList = container.querySelector('#cuts-list')
    expect(cutsList).toBeTruthy()

    const selectedLi = cutsList?.querySelector('li.selected')
    expect(selectedLi).toBeTruthy()
    expect(selectedLi?.classList.contains('cuts-empty')).toBe(false)
  })
})
