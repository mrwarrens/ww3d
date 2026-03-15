import { describe, it, expect, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import PartsList from '../src/components/PartsList'
import { createPart } from '../src/models/Part'

const parent = createPart({ name: 'Side Panel', length: 24, width: 12, position: { x: 0, y: 0.375, z: 0 } })
const cut1 = createPart({ name: 'Dado Cut', length: 12, width: 1, position: { x: 0, y: 0, z: 6 }, parentId: parent.id })
const cut2 = createPart({ name: 'Notch', length: 2, width: 2, position: { x: 0, y: 0, z: 0 }, parentId: parent.id })

describe('LeftPanel cuts section', () => {
  it('renders one row per child by name', async () => {
    const screen = await render(
      <PartsList
        parts={[parent]}
        assemblies={[]}
        selectedIds={[]}
        onSelectIds={vi.fn()}
        onToggleVisibility={vi.fn()}
        modifyingPartId={parent.id}
        childParts={[cut1, cut2]}
      />
    )
    await expect.element(screen.getByText('Dado Cut')).toBeInTheDocument()
    await expect.element(screen.getByText('Notch')).toBeInTheDocument()
  })

  it('renders "Draw in the viewport" message when modifyingPartId is set and childParts is empty', async () => {
    const screen = await render(
      <PartsList
        parts={[parent]}
        assemblies={[]}
        selectedIds={[]}
        onSelectIds={vi.fn()}
        onToggleVisibility={vi.fn()}
        modifyingPartId={parent.id}
        childParts={[]}
      />
    )
    await expect.element(screen.getByText('Draw in the viewport to add a cut')).toBeInTheDocument()
  })

  it('renders "select a board" message when modifyingPartId is not set', async () => {
    const { container } = await render(
      <PartsList
        parts={[parent]}
        assemblies={[]}
        selectedIds={[]}
        onSelectIds={vi.fn()}
        onToggleVisibility={vi.fn()}
        modifyingPartId={null}
        childParts={[]}
      />
    )
    const emptyEl = container.querySelector('.cuts-empty')
    expect(emptyEl?.textContent).toContain('select a board')
  })

  it('renders a visibility button on each cut row', async () => {
    const { container } = await render(
      <PartsList
        parts={[parent]}
        assemblies={[]}
        selectedIds={[]}
        onSelectIds={vi.fn()}
        onToggleVisibility={vi.fn()}
        modifyingPartId={parent.id}
        childParts={[cut1, cut2]}
      />
    )
    const cutsItems = container.querySelectorAll('.left-panel-cuts-list li')
    for (const item of Array.from(cutsItems)) {
      const btn = item.querySelector('.visibility-btn')
      expect(btn).not.toBeNull()
    }
  })

  it('calls onToggleVisibility with cut id when visibility button is clicked, not onSelectIds', async () => {
    const onToggleVisibility = vi.fn()
    const onSelectIds = vi.fn()
    const { container } = await render(
      <PartsList
        parts={[parent]}
        assemblies={[]}
        selectedIds={[]}
        onSelectIds={onSelectIds}
        onToggleVisibility={onToggleVisibility}
        modifyingPartId={parent.id}
        childParts={[cut1]}
      />
    )
    const cutsItems = container.querySelectorAll('.left-panel-cuts-list li')
    const btn = cutsItems[0].querySelector('.visibility-btn') as HTMLButtonElement
    btn.click()
    expect(onToggleVisibility).toHaveBeenCalledWith(cut1.id)
    expect(onSelectIds).not.toHaveBeenCalled()
  })

  it('calls onSelectIds with child id when a row is clicked', async () => {
    const onSelectIds = vi.fn()
    const screen = await render(
      <PartsList
        parts={[parent]}
        assemblies={[]}
        selectedIds={[]}
        onSelectIds={onSelectIds}
        onToggleVisibility={vi.fn()}
        modifyingPartId={parent.id}
        childParts={[cut1, cut2]}
      />
    )
    await screen.getByText('Dado Cut').click()
    expect(onSelectIds).toHaveBeenCalledWith([cut1.id])
  })

  it('applies selected class to the selected child row', async () => {
    const { container } = await render(
      <PartsList
        parts={[parent]}
        assemblies={[]}
        selectedIds={[cut1.id]}
        onSelectIds={vi.fn()}
        onToggleVisibility={vi.fn()}
        modifyingPartId={parent.id}
        childParts={[cut1, cut2]}
      />
    )
    const cutsItems = container.querySelectorAll('.left-panel-cuts-list li')
    const dadoItem = Array.from(cutsItems).find((li) => li.textContent?.includes('Dado Cut'))
    expect(dadoItem?.classList.contains('selected')).toBe(true)
    const notchItem = Array.from(cutsItems).find((li) => li.textContent?.includes('Notch'))
    expect(notchItem?.classList.contains('selected')).toBe(false)
  })

  it('does not apply selected class when child is not selected', async () => {
    const { container } = await render(
      <PartsList
        parts={[parent]}
        assemblies={[]}
        selectedIds={[]}
        onSelectIds={vi.fn()}
        onToggleVisibility={vi.fn()}
        modifyingPartId={parent.id}
        childParts={[cut1]}
      />
    )
    const cutsItems = container.querySelectorAll('.left-panel-cuts-list li')
    expect(cutsItems[0].classList.contains('selected')).toBe(false)
  })

  it('does not render ✂ indicator in part rows', async () => {
    const { container } = await render(
      <PartsList
        parts={[parent]}
        assemblies={[]}
        selectedIds={[]}
        onSelectIds={vi.fn()}
        onToggleVisibility={vi.fn()}
        childParts={[cut1]}
      />
    )
    const indicators = container.querySelectorAll('.cuts-indicator')
    expect(indicators.length).toBe(0)
    const panelText = container.textContent ?? ''
    // The ✂ character should not appear in any part row
    const partsItems = container.querySelectorAll('.left-panel-parts li')
    const partTexts = Array.from(partsItems).map((li) => li.textContent ?? '')
    expect(partTexts.some((t) => t.includes('✂'))).toBe(false)
  })

  it('renders Editing button when modifyingPartId is set', async () => {
    const { container } = await render(
      <PartsList
        parts={[parent]}
        assemblies={[]}
        selectedIds={[]}
        onSelectIds={vi.fn()}
        onToggleVisibility={vi.fn()}
        modifyingPartId={parent.id}
        childParts={[cut1]}
      />
    )
    const editingBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Editing'
    )
    expect(editingBtn).toBeDefined()
    expect(editingBtn?.classList.contains('editing')).toBe(true)
    const badge = container.querySelector('.editing-badge')
    expect(badge).toBeNull()
    const editCutsBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Edit Cuts'
    )
    expect(editCutsBtn).toBeUndefined()
  })

  it('renders Edit Cuts button and no badge when modifyingPartId is null', async () => {
    const selectedParent = createPart({ name: 'Top', length: 24, width: 12, position: { x: 0, y: 0.375, z: 0 } })
    const { container } = await render(
      <PartsList
        parts={[selectedParent]}
        assemblies={[]}
        selectedIds={[selectedParent.id]}
        onSelectIds={vi.fn()}
        onToggleVisibility={vi.fn()}
        modifyingPartId={null}
        selectedPartId={selectedParent.id}
        childParts={[]}
      />
    )
    const badge = container.querySelector('.editing-badge')
    expect(badge).toBeNull()
    const editCutsBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Edit Cuts'
    )
    expect(editCutsBtn).toBeDefined()
  })

  it('calls onExitModifyMode when Editing button is clicked', async () => {
    const onExitModifyMode = vi.fn()
    const { container } = await render(
      <PartsList
        parts={[parent]}
        assemblies={[]}
        selectedIds={[]}
        onSelectIds={vi.fn()}
        onToggleVisibility={vi.fn()}
        modifyingPartId={parent.id}
        childParts={[cut1]}
        onExitModifyMode={onExitModifyMode}
      />
    )
    const editingBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Editing'
    ) as HTMLButtonElement
    editingBtn.click()
    expect(onExitModifyMode).toHaveBeenCalledOnce()
  })

  it('does not render child parts (with parentId) when filtered out upstream', async () => {
    const screen = await render(
      <PartsList
        parts={[parent]}
        assemblies={[]}
        selectedIds={[]}
        onSelectIds={vi.fn()}
        onToggleVisibility={vi.fn()}
      />
    )
    // cut1 and cut2 are not passed in parts; only parent should appear in the parts list
    const partsItems = screen.container.querySelectorAll('.left-panel-parts li')
    const texts = Array.from(partsItems).map((li) => li.textContent)
    expect(texts.some((t) => t?.includes('Dado Cut'))).toBe(false)
    expect(texts.some((t) => t?.includes('Notch'))).toBe(false)
    expect(texts.some((t) => t?.includes('Side Panel'))).toBe(true)
  })
})
