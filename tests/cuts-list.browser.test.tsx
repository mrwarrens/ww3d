import { describe, it, expect, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import CutsList from '../src/components/CutsList'
import PartsList from '../src/components/PartsList'
import { createPart } from '../src/models/Part'

const parent = createPart({ name: 'Side Panel', length: 24, width: 12, position: { x: 0, y: 0.375, z: 0 } })
const cut1 = createPart({ name: 'Dado Cut', length: 12, width: 1, position: { x: 0, y: 0, z: 6 }, parentId: parent.id })
const cut2 = createPart({ name: 'Notch', length: 2, width: 2, position: { x: 0, y: 0, z: 0 }, parentId: parent.id })

describe('CutsList', () => {
  it('renders one row per child by name', async () => {
    const screen = await render(
      <CutsList children={[cut1, cut2]} selectedIds={[]} onSelectIds={vi.fn()} />
    )
    await expect.element(screen.getByText('Dado Cut')).toBeInTheDocument()
    await expect.element(screen.getByText('Notch')).toBeInTheDocument()
  })

  it('renders "No cuts yet" when children is empty', async () => {
    const screen = await render(
      <CutsList children={[]} selectedIds={[]} onSelectIds={vi.fn()} />
    )
    await expect.element(screen.getByText('No cuts yet')).toBeInTheDocument()
  })

  it('calls onSelectIds with child id when a row is clicked', async () => {
    const onSelectIds = vi.fn()
    const screen = await render(
      <CutsList children={[cut1, cut2]} selectedIds={[]} onSelectIds={onSelectIds} />
    )
    await screen.getByText('Dado Cut').click()
    expect(onSelectIds).toHaveBeenCalledWith([cut1.id])
  })

  it('applies selected class to the selected child row', async () => {
    const { container } = await render(
      <CutsList children={[cut1, cut2]} selectedIds={[cut1.id]} onSelectIds={vi.fn()} />
    )
    const items = container.querySelectorAll('li')
    const dadoItem = Array.from(items).find((li) => li.textContent?.includes('Dado Cut'))
    expect(dadoItem?.classList.contains('selected')).toBe(true)
    const notchItem = Array.from(items).find((li) => li.textContent?.includes('Notch'))
    expect(notchItem?.classList.contains('selected')).toBe(false)
  })

  it('does not apply selected class when child is not selected', async () => {
    const { container } = await render(
      <CutsList children={[cut1]} selectedIds={[]} onSelectIds={vi.fn()} />
    )
    const items = container.querySelectorAll('li')
    expect(items[0].classList.contains('selected')).toBe(false)
  })
})

describe('PartsList cuts indicator', () => {
  it('renders ✂ indicator on part that has cuts', async () => {
    const partsWithCuts = new Set([parent.id])
    const screen = await render(
      <PartsList
        parts={[parent]}
        assemblies={[]}
        selectedIds={[]}
        onSelectIds={vi.fn()}
        onToggleVisibility={vi.fn()}
        onToggleAssemblyVisibility={vi.fn()}
        onAddAssembly={vi.fn()}
        onAssignPart={vi.fn()}
        onRemoveFromAssembly={vi.fn()}
        partsWithCuts={partsWithCuts}
      />
    )
    await expect.element(screen.getByText('✂')).toBeInTheDocument()
  })

  it('does not render ✂ indicator on part without cuts', async () => {
    const screen = await render(
      <PartsList
        parts={[parent]}
        assemblies={[]}
        selectedIds={[]}
        onSelectIds={vi.fn()}
        onToggleVisibility={vi.fn()}
        onToggleAssemblyVisibility={vi.fn()}
        onAddAssembly={vi.fn()}
        onAssignPart={vi.fn()}
        onRemoveFromAssembly={vi.fn()}
      />
    )
    const indicators = screen.container.querySelectorAll('.cuts-indicator')
    expect(indicators.length).toBe(0)
  })

  it('does not render child parts (with parentId) when filtered out upstream', async () => {
    // PartsList receives only top-level parts (no parentId); child parts should not appear
    const screen = await render(
      <PartsList
        parts={[parent]}
        assemblies={[]}
        selectedIds={[]}
        onSelectIds={vi.fn()}
        onToggleVisibility={vi.fn()}
        onToggleAssemblyVisibility={vi.fn()}
        onAddAssembly={vi.fn()}
        onAssignPart={vi.fn()}
        onRemoveFromAssembly={vi.fn()}
      />
    )
    // cut1 and cut2 are not passed; only parent should appear
    const items = screen.container.querySelectorAll('li')
    const texts = Array.from(items).map((li) => li.textContent)
    expect(texts.some((t) => t?.includes('Dado Cut'))).toBe(false)
    expect(texts.some((t) => t?.includes('Notch'))).toBe(false)
    expect(texts.some((t) => t?.includes('Side Panel'))).toBe(true)
  })
})
