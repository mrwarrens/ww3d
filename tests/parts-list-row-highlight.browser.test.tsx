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
  test('each part row contains a .part-color-swatch element', async () => {
    const part1 = createPart({ name: 'Board A', color: '#ff0000' })
    const part2 = createPart({ name: 'Board B', color: '#00ff00' })

    const { container } = await render(
      <PartsList
        parts={[part1, part2]}
        assemblies={[]}
        selectedIds={[]}
        onSelectIds={vi.fn()}
        onToggleVisibility={vi.fn()}
        {...defaultProps}
      />
    )

    const swatches = container.querySelectorAll('.part-color-swatch')
    expect(swatches).toHaveLength(2)
  })

  test('swatch backgroundColor matches the part color', async () => {
    const part = createPart({ name: 'Board A', color: '#ff0000' })

    const { container } = await render(
      <PartsList
        parts={[part]}
        assemblies={[]}
        selectedIds={[]}
        onSelectIds={vi.fn()}
        onToggleVisibility={vi.fn()}
        {...defaultProps}
      />
    )

    const swatch = container.querySelector('.part-color-swatch') as HTMLElement
    expect(swatch).toBeTruthy()
    // Browser normalizes hex to rgb()
    expect(swatch.style.backgroundColor).toMatch(/^(#ff0000|rgb\(255,\s*0,\s*0\))$/)
  })

  test('selected part row has .selected class and swatch is still present', async () => {
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

    const swatch = li?.querySelector('.part-color-swatch')
    expect(swatch).toBeTruthy()
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
