import { describe, it, expect, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import PartOutliner from '../src/components/PartOutliner'
import { createPart } from '../src/models/Part'

const partA = createPart({ name: 'Top Rail', length: 36, width: 4, position: { x: 0, y: 0.375, z: 0 } })
const partB = createPart({ name: 'Bottom Rail', length: 36, width: 4, position: { x: 0, y: 0.375, z: 10 } })

describe('PartOutliner', () => {
  it('renders nothing (no crash) when parts is empty', async () => {
    const { container } = await render(
      <PartOutliner parts={[]} selectedId={null} onSelectId={vi.fn()} />
    )
    const ul = container.querySelector('ul')
    expect(ul?.children.length).toBe(0)
  })

  it('renders a row for each part by name', async () => {
    const screen = await render(
      <PartOutliner parts={[partA, partB]} selectedId={null} onSelectId={vi.fn()} />
    )
    await expect.element(screen.getByText('Top Rail')).toBeVisible()
    await expect.element(screen.getByText('Bottom Rail')).toBeVisible()
  })

  it('applies selected class to the selected part row', async () => {
    const { container } = await render(
      <PartOutliner parts={[partA, partB]} selectedId={partA.id} onSelectId={vi.fn()} />
    )
    const items = container.querySelectorAll('li')
    expect(items[0].classList.contains('selected')).toBe(true)
    expect(items[1].classList.contains('selected')).toBe(false)
  })

  it('does not apply selected class when no part is selected', async () => {
    const { container } = await render(
      <PartOutliner parts={[partA, partB]} selectedId={null} onSelectId={vi.fn()} />
    )
    const items = container.querySelectorAll('li')
    items.forEach((li) => expect(li.classList.contains('selected')).toBe(false))
  })

  it('calls onSelectId with the correct part id when a row is clicked', async () => {
    const onSelectId = vi.fn()
    const screen = await render(
      <PartOutliner parts={[partA, partB]} selectedId={null} onSelectId={onSelectId} />
    )
    await screen.getByText('Bottom Rail').click()
    expect(onSelectId).toHaveBeenCalledWith(partB.id)
  })

  it('each row contains a .visibility-slot span', async () => {
    const { container } = await render(
      <PartOutliner parts={[partA, partB]} selectedId={null} onSelectId={vi.fn()} />
    )
    const slots = container.querySelectorAll('.visibility-slot')
    expect(slots.length).toBe(2)
  })
})
