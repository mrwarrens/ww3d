import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from 'vitest-browser-react'
import PartOutliner from '../src/components/PartOutliner'
import { createPart } from '../src/models/Part'
import { createAssembly } from '../src/models/Assembly'

const partA = createPart({ name: 'Top Rail', length: 36, width: 4, position: { x: 0, y: 0.375, z: 0 } })
const partB = createPart({ name: 'Bottom Rail', length: 36, width: 4, position: { x: 0, y: 0.375, z: 10 } })

const defaultProps = {
  onAddAssembly: vi.fn(),
  onAssignPart: vi.fn(),
  onRemoveFromAssembly: vi.fn(),
}

describe('PartOutliner', () => {
  it('renders nothing (no crash) when parts is empty', async () => {
    const { container } = await render(
      <PartOutliner parts={[]} assemblies={[]} selectedIds={[]} onSelectIds={vi.fn()} onToggleVisibility={vi.fn()} {...defaultProps} />
    )
    const ul = container.querySelector('ul')
    expect(ul?.children.length).toBe(0)
  })

  it('renders a row for each part by name', async () => {
    const screen = await render(
      <PartOutliner parts={[partA, partB]} assemblies={[]} selectedIds={[]} onSelectIds={vi.fn()} onToggleVisibility={vi.fn()} {...defaultProps} />
    )
    await expect.element(screen.getByText('Top Rail')).toBeVisible()
    await expect.element(screen.getByText('Bottom Rail')).toBeVisible()
  })

  it('applies selected class to the selected part row', async () => {
    const { container } = await render(
      <PartOutliner parts={[partA, partB]} assemblies={[]} selectedIds={[partA.id]} onSelectIds={vi.fn()} onToggleVisibility={vi.fn()} {...defaultProps} />
    )
    const items = container.querySelectorAll('li')
    expect(items[0].classList.contains('selected')).toBe(true)
    expect(items[1].classList.contains('selected')).toBe(false)
  })

  it('does not apply selected class when no part is selected', async () => {
    const { container } = await render(
      <PartOutliner parts={[partA, partB]} assemblies={[]} selectedIds={[]} onSelectIds={vi.fn()} onToggleVisibility={vi.fn()} {...defaultProps} />
    )
    const items = container.querySelectorAll('li')
    items.forEach((li) => expect(li.classList.contains('selected')).toBe(false))
  })

  it('calls onSelectIds with a single-item array when a row is clicked', async () => {
    const onSelectIds = vi.fn()
    const screen = await render(
      <PartOutliner parts={[partA, partB]} assemblies={[]} selectedIds={[]} onSelectIds={onSelectIds} onToggleVisibility={vi.fn()} {...defaultProps} />
    )
    await screen.getByText('Bottom Rail').click()
    expect(onSelectIds).toHaveBeenCalledWith([partB.id])
  })

  it('each row contains a .visibility-btn button', async () => {
    const { container } = await render(
      <PartOutliner parts={[partA, partB]} assemblies={[]} selectedIds={[]} onSelectIds={vi.fn()} onToggleVisibility={vi.fn()} {...defaultProps} />
    )
    const btns = container.querySelectorAll('.visibility-btn')
    expect(btns.length).toBe(2)
  })

  it('visibility button shows ● for a visible part', async () => {
    const { container } = await render(
      <PartOutliner parts={[partA]} assemblies={[]} selectedIds={[]} onSelectIds={vi.fn()} onToggleVisibility={vi.fn()} {...defaultProps} />
    )
    const btn = container.querySelector('.visibility-btn')
    expect(btn?.textContent).toBe('●')
    expect(btn?.getAttribute('aria-label')).toBe('Hide')
  })

  it('visibility button shows ○ for a hidden part', async () => {
    const hiddenPart = { ...partA, visible: false }
    const { container } = await render(
      <PartOutliner parts={[hiddenPart]} assemblies={[]} selectedIds={[]} onSelectIds={vi.fn()} onToggleVisibility={vi.fn()} {...defaultProps} />
    )
    const btn = container.querySelector('.visibility-btn')
    expect(btn?.textContent).toBe('○')
    expect(btn?.getAttribute('aria-label')).toBe('Show')
  })

  it('clicking visibility button calls onToggleVisibility with the correct part id', async () => {
    const onToggleVisibility = vi.fn()
    const screen = await render(
      <PartOutliner parts={[partA, partB]} assemblies={[]} selectedIds={[]} onSelectIds={vi.fn()} onToggleVisibility={onToggleVisibility} {...defaultProps} />
    )
    const btns = screen.container.querySelectorAll('.visibility-btn')
    await (btns[1] as HTMLElement).click()
    expect(onToggleVisibility).toHaveBeenCalledWith(partB.id)
  })

  it('clicking visibility button does not trigger onSelectIds', async () => {
    const onSelectIds = vi.fn()
    const onToggleVisibility = vi.fn()
    const screen = await render(
      <PartOutliner parts={[partA]} assemblies={[]} selectedIds={[]} onSelectIds={onSelectIds} onToggleVisibility={onToggleVisibility} {...defaultProps} />
    )
    const btn = screen.container.querySelector('.visibility-btn') as HTMLElement
    await btn.click()
    expect(onToggleVisibility).toHaveBeenCalled()
    expect(onSelectIds).not.toHaveBeenCalled()
  })

  describe('#part-outliner positioning', () => {
    let styleEl: HTMLStyleElement

    beforeEach(() => {
      styleEl = document.createElement('style')
      styleEl.textContent = `
        #part-outliner {
          position: absolute;
          top: 50px;
          left: 10px;
          width: 200px;
        }
      `
      document.head.appendChild(styleEl)
    })

    afterEach(() => {
      document.head.removeChild(styleEl)
    })

    it('#part-outliner is positioned on the left side (left: 10px)', async () => {
      const { container } = await render(
        <PartOutliner parts={[partA]} assemblies={[]} selectedIds={[]} onSelectIds={vi.fn()} onToggleVisibility={vi.fn()} {...defaultProps} />
      )
      const el = container.querySelector('#part-outliner') as HTMLElement
      const style = window.getComputedStyle(el)
      expect(style.left).toBe('10px')
    })
  })

  describe('assembly hierarchy', () => {
    it('renders an assembly row by name', async () => {
      const assembly = createAssembly('Cabinet')
      const screen = await render(
        <PartOutliner parts={[]} assemblies={[assembly]} selectedIds={[]} onSelectIds={vi.fn()} onToggleVisibility={vi.fn()} {...defaultProps} />
      )
      await expect.element(screen.getByText('Cabinet')).toBeVisible()
    })

    it('renders member parts nested inside the assembly row', async () => {
      const assembly = createAssembly('Cabinet')
      const member = { ...partA, assemblyId: assembly.id }
      const { container } = await render(
        <PartOutliner parts={[member]} assemblies={[assembly]} selectedIds={[]} onSelectIds={vi.fn()} onToggleVisibility={vi.fn()} {...defaultProps} />
      )
      const assemblyLi = container.querySelector('li.assembly-row') as HTMLElement
      expect(assemblyLi).not.toBeNull()
      const nestedItems = assemblyLi.querySelectorAll('li')
      expect(nestedItems.length).toBe(1)
      expect(nestedItems[0].textContent).toContain(partA.name)
    })

    it('renders unassigned parts at root level alongside assembly rows', async () => {
      const assembly = createAssembly('Cabinet')
      const member = { ...partA, assemblyId: assembly.id }
      const { container } = await render(
        <PartOutliner parts={[member, partB]} assemblies={[assembly]} selectedIds={[]} onSelectIds={vi.fn()} onToggleVisibility={vi.fn()} {...defaultProps} />
      )
      // root <ul> should have 2 children: the assembly <li> and the unassigned part <li>
      const rootUl = container.querySelector('#part-outliner > ul') as HTMLElement
      expect(rootUl.children.length).toBe(2)
      // The second child is the unassigned part
      expect(rootUl.children[1].textContent).toContain(partB.name)
    })
  })

  describe('New Assembly button', () => {
    it('renders a "New Assembly" button', async () => {
      const screen = await render(
        <PartOutliner parts={[]} assemblies={[]} selectedIds={[]} onSelectIds={vi.fn()} onToggleVisibility={vi.fn()} {...defaultProps} />
      )
      await expect.element(screen.getByText('New Assembly')).toBeVisible()
    })

    it('clicking "New Assembly" button calls onAddAssembly', async () => {
      const onAddAssembly = vi.fn()
      const screen = await render(
        <PartOutliner parts={[]} assemblies={[]} selectedIds={[]} onSelectIds={vi.fn()} onToggleVisibility={vi.fn()} onAddAssembly={onAddAssembly} onAssignPart={vi.fn()} onRemoveFromAssembly={vi.fn()} />
      )
      await screen.getByText('New Assembly').click()
      expect(onAddAssembly).toHaveBeenCalled()
    })
  })

  describe('drag-to-assign', () => {
    it('dragging a part row and dropping onto an assembly row calls onAssignPart', async () => {
      const assembly = createAssembly('Cabinet')
      const onAssignPart = vi.fn()
      const { container } = await render(
        <PartOutliner parts={[partA]} assemblies={[assembly]} selectedIds={[]} onSelectIds={vi.fn()} onToggleVisibility={vi.fn()} onAddAssembly={vi.fn()} onAssignPart={onAssignPart} onRemoveFromAssembly={vi.fn()} />
      )

      const assemblyLi = container.querySelector('li.assembly-row') as HTMLElement
      const partLis = Array.from(container.querySelectorAll('li')).filter(
        (li) => !li.classList.contains('assembly-row') && li.textContent?.includes(partA.name)
      )
      const partLi = partLis[0] as HTMLElement

      const dt = new DataTransfer()
      partLi.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }))
      assemblyLi.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: dt, cancelable: true }))
      assemblyLi.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt }))

      expect(onAssignPart).toHaveBeenCalledWith(partA.id, assembly.id)
    })
  })

  describe('right-click to remove from assembly', () => {
    it('right-clicking a part with an assemblyId calls onRemoveFromAssembly', async () => {
      const assembly = createAssembly('Cabinet')
      const member = { ...partA, assemblyId: assembly.id }
      const onRemoveFromAssembly = vi.fn()
      const { container } = await render(
        <PartOutliner parts={[member]} assemblies={[assembly]} selectedIds={[]} onSelectIds={vi.fn()} onToggleVisibility={vi.fn()} onAddAssembly={vi.fn()} onAssignPart={vi.fn()} onRemoveFromAssembly={onRemoveFromAssembly} />
      )

      const assemblyLi = container.querySelector('li.assembly-row') as HTMLElement
      const partLi = assemblyLi.querySelector('li') as HTMLElement
      partLi.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))

      expect(onRemoveFromAssembly).toHaveBeenCalledWith(partA.id)
    })

    it('right-clicking a part without an assemblyId does not call onRemoveFromAssembly', async () => {
      const onRemoveFromAssembly = vi.fn()
      const { container } = await render(
        <PartOutliner parts={[partA]} assemblies={[]} selectedIds={[]} onSelectIds={vi.fn()} onToggleVisibility={vi.fn()} onAddAssembly={vi.fn()} onAssignPart={vi.fn()} onRemoveFromAssembly={onRemoveFromAssembly} />
      )

      const partLi = Array.from(container.querySelectorAll('li')).find(
        (li) => li.textContent?.includes(partA.name)
      ) as HTMLElement
      partLi.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))

      expect(onRemoveFromAssembly).not.toHaveBeenCalled()
    })
  })
})
