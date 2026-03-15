import { describe, it, expect, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import PartsList from '../src/components/PartsList'
import { createPart } from '../src/models/Part'
import { createAssembly } from '../src/models/Assembly'

const partA = createPart({ name: 'Part A', length: 12, width: 4, position: { x: 0, y: 0.375, z: 0 } })
const partB = createPart({ name: 'Part B', length: 12, width: 4, position: { x: 0, y: 0.375, z: 10 } })
const partC = createPart({ name: 'Part C', length: 12, width: 4, position: { x: 0, y: 0.375, z: 20 } })

describe('PartsList multi-select', () => {
  it('plain click calls onSelectIds with single-item array', async () => {
    const onSelectIds = vi.fn()
    const screen = await render(
      <PartsList parts={[partA, partB, partC]} assemblies={[]} selectedIds={[]} onSelectIds={onSelectIds} onToggleVisibility={vi.fn()} />
    )
    await screen.getByText('Part B').click()
    expect(onSelectIds).toHaveBeenCalledWith([partB.id])
  })

  it('Cmd+click on unselected part adds it to the selection', async () => {
    const onSelectIds = vi.fn()
    const screen = await render(
      <PartsList parts={[partA, partB, partC]} assemblies={[]} selectedIds={[partA.id]} onSelectIds={onSelectIds} onToggleVisibility={vi.fn()} />
    )
    await screen.getByText('Part B').click({ modifiers: ['Meta'] })
    expect(onSelectIds).toHaveBeenCalledWith([partA.id, partB.id])
  })

  it('Cmd+click on already-selected part removes it from the selection', async () => {
    const onSelectIds = vi.fn()
    const screen = await render(
      <PartsList parts={[partA, partB, partC]} assemblies={[]} selectedIds={[partA.id, partB.id]} onSelectIds={onSelectIds} onToggleVisibility={vi.fn()} />
    )
    await screen.getByText('Part A').click({ modifiers: ['Meta'] })
    expect(onSelectIds).toHaveBeenCalledWith([partB.id])
  })

  it('Ctrl+click on unselected part adds it to the selection', async () => {
    const onSelectIds = vi.fn()
    const { container } = await render(
      <PartsList parts={[partA, partB, partC]} assemblies={[]} selectedIds={[partA.id]} onSelectIds={onSelectIds} onToggleVisibility={vi.fn()} />
    )
    // Use dispatchEvent to avoid macOS treating Ctrl+click as a right-click
    const items = container.querySelectorAll('li')
    items[2].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }))
    expect(onSelectIds).toHaveBeenCalledWith([partA.id, partC.id])
  })

  it('Shift+click selects range between anchor and clicked row', async () => {
    const onSelectIds = vi.fn()
    const screen = await render(
      <PartsList parts={[partA, partB, partC]} assemblies={[]} selectedIds={[partA.id]} onSelectIds={onSelectIds} onToggleVisibility={vi.fn()} />
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
      <PartsList parts={[partA, partB, partC]} assemblies={[]} selectedIds={[partA.id, partC.id]} onSelectIds={vi.fn()} onToggleVisibility={vi.fn()} />
    )
    const items = container.querySelectorAll('li')
    expect(items[0].classList.contains('selected')).toBe(true)
    expect(items[1].classList.contains('selected')).toBe(false)
    expect(items[2].classList.contains('selected')).toBe(true)
  })

  it('plain click after multi-select replaces selection with single item', async () => {
    const onSelectIds = vi.fn()
    const screen = await render(
      <PartsList parts={[partA, partB, partC]} assemblies={[]} selectedIds={[partA.id, partB.id]} onSelectIds={onSelectIds} onToggleVisibility={vi.fn()} />
    )
    await screen.getByText('Part C').click()
    expect(onSelectIds).toHaveBeenCalledWith([partC.id])
  })

  it('Shift+click range select uses visual order, not raw store order', async () => {
    // Store order: [partA (unassigned), partB (in assembly), partC (in assembly)]
    // Visual order: [partB, partC, partA] — assembly members first, unassigned last
    const assembly = createAssembly('Cabinet')
    const partBAssigned = { ...partB, assemblyId: assembly.id }
    const partCAssigned = { ...partC, assemblyId: assembly.id }
    const onSelectIds = vi.fn()
    const { container } = await render(
      <PartsList
        parts={[partA, partBAssigned, partCAssigned]}
        assemblies={[assembly]}
        selectedIds={[]}
        onSelectIds={onSelectIds}
        onToggleVisibility={vi.fn()}
        onToggleAssemblyVisibility={vi.fn()}
        onAddAssembly={vi.fn()}
        onAssignPart={vi.fn()}
        onRemoveFromAssembly={vi.fn()}
      />
    )
    // Find all part rows (non-assembly-header li elements) within the parts list
    const partLis = Array.from(container.querySelectorAll('.left-panel-parts li:not(.assembly-row)'))
    const partBLi = partLis.find((li) => li.textContent?.includes('Part B')) as HTMLElement
    const partALi = partLis.find((li) => li.textContent?.includes('Part A')) as HTMLElement
    // Plain click Part B (visual index 0) to set anchor; use dispatchEvent for reliability
    partBLi.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    onSelectIds.mockClear()
    // Shift+click Part A (visual index 2) — should select all three in visual order
    partALi.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }))
    expect(onSelectIds).toHaveBeenCalledWith([partBAssigned.id, partCAssigned.id, partA.id])
  })

  it('dragging a selected part when multiple are selected assigns all selected parts to assembly', async () => {
    const assembly = createAssembly('Cabinet')
    const onAssignPart = vi.fn()
    const { container } = await render(
      <PartsList
        parts={[partA, partB, partC]}
        assemblies={[assembly]}
        selectedIds={[partA.id, partB.id]}
        onSelectIds={vi.fn()}
        onToggleVisibility={vi.fn()}
        onToggleAssemblyVisibility={vi.fn()}
        onAddAssembly={vi.fn()}
        onAssignPart={onAssignPart}
        onRemoveFromAssembly={vi.fn()}
      />
    )
    const partALi = container.querySelector(`li[data-part-id="${partA.id}"]`) as HTMLElement
    const assemblyLi = container.querySelector('.assembly-row') as HTMLElement

    // Simulate drag from partA (which is selected) and drop on assembly
    partALi.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() }))
    assemblyLi.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true }))

    const dropTransfer = new DataTransfer()
    dropTransfer.setData('text/plain', `${partA.id},${partB.id}`)
    assemblyLi.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dropTransfer }))

    expect(onAssignPart).toHaveBeenCalledWith(partA.id, assembly.id)
    expect(onAssignPart).toHaveBeenCalledWith(partB.id, assembly.id)
    expect(onAssignPart).toHaveBeenCalledTimes(2)
  })

  it('dragging an unselected part only assigns that part to assembly', async () => {
    const assembly = createAssembly('Cabinet')
    const onAssignPart = vi.fn()
    const { container } = await render(
      <PartsList
        parts={[partA, partB, partC]}
        assemblies={[assembly]}
        selectedIds={[partA.id, partB.id]}
        onSelectIds={vi.fn()}
        onToggleVisibility={vi.fn()}
        onToggleAssemblyVisibility={vi.fn()}
        onAddAssembly={vi.fn()}
        onAssignPart={onAssignPart}
        onRemoveFromAssembly={vi.fn()}
      />
    )
    const assemblyLi = container.querySelector('.assembly-row') as HTMLElement

    // Drop only partC's id (it is not in selectedIds)
    const dropTransfer = new DataTransfer()
    dropTransfer.setData('text/plain', partC.id)
    assemblyLi.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dropTransfer }))

    expect(onAssignPart).toHaveBeenCalledWith(partC.id, assembly.id)
    expect(onAssignPart).toHaveBeenCalledTimes(1)
  })

  it('clicking an assembly row does not throw when onSelectAssembly is omitted', async () => {
    const assembly = createAssembly('Cabinet')
    const screen = await render(
      <PartsList
        parts={[]}
        assemblies={[assembly]}
        selectedIds={[]}
        onSelectIds={vi.fn()}
        onToggleVisibility={vi.fn()}
        onToggleAssemblyVisibility={vi.fn()}
        onAddAssembly={vi.fn()}
        onAssignPart={vi.fn()}
        onRemoveFromAssembly={vi.fn()}
      />
    )
    // Should not throw even though onSelectAssembly is not provided
    await expect(screen.getByText('Cabinet').click()).resolves.not.toThrow()
  })
})
