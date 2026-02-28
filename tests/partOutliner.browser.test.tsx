import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from 'vitest-browser-react'
import PartOutliner from '../src/components/PartOutliner'
import { createPart } from '../src/models/Part'

const partA = createPart({ name: 'Top Rail', length: 36, width: 4, position: { x: 0, y: 0.375, z: 0 } })
const partB = createPart({ name: 'Bottom Rail', length: 36, width: 4, position: { x: 0, y: 0.375, z: 10 } })

describe('PartOutliner', () => {
  it('renders nothing (no crash) when parts is empty', async () => {
    const { container } = await render(
      <PartOutliner parts={[]} selectedId={null} onSelectId={vi.fn()} onToggleVisibility={vi.fn()} />
    )
    const ul = container.querySelector('ul')
    expect(ul?.children.length).toBe(0)
  })

  it('renders a row for each part by name', async () => {
    const screen = await render(
      <PartOutliner parts={[partA, partB]} selectedId={null} onSelectId={vi.fn()} onToggleVisibility={vi.fn()} />
    )
    await expect.element(screen.getByText('Top Rail')).toBeVisible()
    await expect.element(screen.getByText('Bottom Rail')).toBeVisible()
  })

  it('applies selected class to the selected part row', async () => {
    const { container } = await render(
      <PartOutliner parts={[partA, partB]} selectedId={partA.id} onSelectId={vi.fn()} onToggleVisibility={vi.fn()} />
    )
    const items = container.querySelectorAll('li')
    expect(items[0].classList.contains('selected')).toBe(true)
    expect(items[1].classList.contains('selected')).toBe(false)
  })

  it('does not apply selected class when no part is selected', async () => {
    const { container } = await render(
      <PartOutliner parts={[partA, partB]} selectedId={null} onSelectId={vi.fn()} onToggleVisibility={vi.fn()} />
    )
    const items = container.querySelectorAll('li')
    items.forEach((li) => expect(li.classList.contains('selected')).toBe(false))
  })

  it('calls onSelectId with the correct part id when a row is clicked', async () => {
    const onSelectId = vi.fn()
    const screen = await render(
      <PartOutliner parts={[partA, partB]} selectedId={null} onSelectId={onSelectId} onToggleVisibility={vi.fn()} />
    )
    await screen.getByText('Bottom Rail').click()
    expect(onSelectId).toHaveBeenCalledWith(partB.id)
  })

  it('each row contains a .visibility-btn button', async () => {
    const { container } = await render(
      <PartOutliner parts={[partA, partB]} selectedId={null} onSelectId={vi.fn()} onToggleVisibility={vi.fn()} />
    )
    const btns = container.querySelectorAll('.visibility-btn')
    expect(btns.length).toBe(2)
  })

  it('visibility button shows ● for a visible part', async () => {
    const { container } = await render(
      <PartOutliner parts={[partA]} selectedId={null} onSelectId={vi.fn()} onToggleVisibility={vi.fn()} />
    )
    const btn = container.querySelector('.visibility-btn')
    expect(btn?.textContent).toBe('●')
    expect(btn?.getAttribute('aria-label')).toBe('Hide')
  })

  it('visibility button shows ○ for a hidden part', async () => {
    const hiddenPart = { ...partA, visible: false }
    const { container } = await render(
      <PartOutliner parts={[hiddenPart]} selectedId={null} onSelectId={vi.fn()} onToggleVisibility={vi.fn()} />
    )
    const btn = container.querySelector('.visibility-btn')
    expect(btn?.textContent).toBe('○')
    expect(btn?.getAttribute('aria-label')).toBe('Show')
  })

  it('clicking visibility button calls onToggleVisibility with the correct part id', async () => {
    const onToggleVisibility = vi.fn()
    const screen = await render(
      <PartOutliner parts={[partA, partB]} selectedId={null} onSelectId={vi.fn()} onToggleVisibility={onToggleVisibility} />
    )
    const btns = screen.container.querySelectorAll('.visibility-btn')
    await (btns[1] as HTMLElement).click()
    expect(onToggleVisibility).toHaveBeenCalledWith(partB.id)
  })

  it('clicking visibility button does not trigger onSelectId', async () => {
    const onSelectId = vi.fn()
    const onToggleVisibility = vi.fn()
    const screen = await render(
      <PartOutliner parts={[partA]} selectedId={null} onSelectId={onSelectId} onToggleVisibility={onToggleVisibility} />
    )
    const btn = screen.container.querySelector('.visibility-btn') as HTMLElement
    await btn.click()
    expect(onToggleVisibility).toHaveBeenCalled()
    expect(onSelectId).not.toHaveBeenCalled()
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
        <PartOutliner parts={[partA]} selectedId={null} onSelectId={vi.fn()} onToggleVisibility={vi.fn()} />
      )
      const el = container.querySelector('#part-outliner') as HTMLElement
      const style = window.getComputedStyle(el)
      expect(style.left).toBe('10px')
    })
  })
})
