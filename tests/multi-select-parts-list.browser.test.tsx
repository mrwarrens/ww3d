import { describe, it, expect, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import PartOutliner from '../src/components/PartOutliner'
import { createPart } from '../src/models/Part'

const partA = createPart({ name: 'Part A', length: 12, width: 4, position: { x: 0, y: 0.375, z: 0 } })
const partB = createPart({ name: 'Part B', length: 12, width: 4, position: { x: 0, y: 0.375, z: 10 } })
const partC = createPart({ name: 'Part C', length: 12, width: 4, position: { x: 0, y: 0.375, z: 20 } })

describe('PartOutliner multi-select', () => {
  it('plain click calls onSelectIds with single-item array', async () => {
    const onSelectIds = vi.fn()
    const screen = await render(
      <PartOutliner parts={[partA, partB, partC]} assemblies={[]} selectedIds={[]} onSelectIds={onSelectIds} onToggleVisibility={vi.fn()} />
    )
    await screen.getByText('Part B').click()
    expect(onSelectIds).toHaveBeenCalledWith([partB.id])
  })

  it('Cmd+click on unselected part adds it to the selection', async () => {
    const onSelectIds = vi.fn()
    const screen = await render(
      <PartOutliner parts={[partA, partB, partC]} assemblies={[]} selectedIds={[partA.id]} onSelectIds={onSelectIds} onToggleVisibility={vi.fn()} />
    )
    await screen.getByText('Part B').click({ modifiers: ['Meta'] })
    expect(onSelectIds).toHaveBeenCalledWith([partA.id, partB.id])
  })

  it('Cmd+click on already-selected part removes it from the selection', async () => {
    const onSelectIds = vi.fn()
    const screen = await render(
      <PartOutliner parts={[partA, partB, partC]} assemblies={[]} selectedIds={[partA.id, partB.id]} onSelectIds={onSelectIds} onToggleVisibility={vi.fn()} />
    )
    await screen.getByText('Part A').click({ modifiers: ['Meta'] })
    expect(onSelectIds).toHaveBeenCalledWith([partB.id])
  })

  it('Ctrl+click on unselected part adds it to the selection', async () => {
    const onSelectIds = vi.fn()
    const { container } = await render(
      <PartOutliner parts={[partA, partB, partC]} assemblies={[]} selectedIds={[partA.id]} onSelectIds={onSelectIds} onToggleVisibility={vi.fn()} />
    )
    // Use dispatchEvent to avoid macOS treating Ctrl+click as a right-click
    const items = container.querySelectorAll('li')
    items[2].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }))
    expect(onSelectIds).toHaveBeenCalledWith([partA.id, partC.id])
  })

  it('Shift+click selects range between anchor and clicked row', async () => {
    const onSelectIds = vi.fn()
    const screen = await render(
      <PartOutliner parts={[partA, partB, partC]} assemblies={[]} selectedIds={[partA.id]} onSelectIds={onSelectIds} onToggleVisibility={vi.fn()} />
    )
    // First plain click to set anchor to index 0
    await screen.getByText('Part A').click()
    onSelectIds.mockClear()
    // Shift+click on index 2
    await screen.getByText('Part C').click({ modifiers: ['Shift'] })
    expect(onSelectIds).toHaveBeenCalledWith([partA.id, partB.id, partC.id])
  })

  it('selected class is applied to all rows in selectedIds', async () => {
    const { container } = await render(
      <PartOutliner parts={[partA, partB, partC]} assemblies={[]} selectedIds={[partA.id, partC.id]} onSelectIds={vi.fn()} onToggleVisibility={vi.fn()} />
    )
    const items = container.querySelectorAll('li')
    expect(items[0].classList.contains('selected')).toBe(true)
    expect(items[1].classList.contains('selected')).toBe(false)
    expect(items[2].classList.contains('selected')).toBe(true)
  })

  it('plain click after multi-select replaces selection with single item', async () => {
    const onSelectIds = vi.fn()
    const screen = await render(
      <PartOutliner parts={[partA, partB, partC]} assemblies={[]} selectedIds={[partA.id, partB.id]} onSelectIds={onSelectIds} onToggleVisibility={vi.fn()} />
    )
    await screen.getByText('Part C').click()
    expect(onSelectIds).toHaveBeenCalledWith([partC.id])
  })
})
