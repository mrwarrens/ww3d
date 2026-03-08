import { describe, it, expect, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import PartPanel from '../src/components/PartPanel'
import { createPart } from '../src/models/Part'

const topLevelPart = createPart({ name: 'Board', length: 12, width: 8, position: { x: 0, y: 0.375, z: 0 } })
const childPart = createPart({ name: 'Cut', length: 4, width: 4, position: { x: 0, y: 0, z: 0 }, parentId: 'parent-id' })

describe('shape toggle', () => {
  it('shows shape toggle for top-level parts', async () => {
    const screen = await render(
      <PartPanel part={topLevelPart} onUpdate={vi.fn()} />
    )
    await expect.element(screen.getByLabelText('Box shape')).toBeInTheDocument()
    await expect.element(screen.getByLabelText('Ellipse shape')).toBeInTheDocument()
  })

  it('shows shape toggle for child parts (cuts)', async () => {
    const screen = await render(
      <PartPanel part={childPart} onUpdate={vi.fn()} />
    )
    await expect.element(screen.getByLabelText('Box shape')).toBeInTheDocument()
    await expect.element(screen.getByLabelText('Ellipse shape')).toBeInTheDocument()
  })

  it('calls onUpdate with box shape when Box is clicked', async () => {
    const onUpdate = vi.fn()
    const screen = await render(
      <PartPanel part={{ ...topLevelPart, shape: 'ellipse' }} onUpdate={onUpdate} />
    )
    await screen.getByLabelText('Box shape').click()
    expect(onUpdate).toHaveBeenCalledWith({ shape: 'box' })
  })

  it('calls onUpdate with ellipse shape when Ellipse is clicked', async () => {
    const onUpdate = vi.fn()
    const screen = await render(
      <PartPanel part={topLevelPart} onUpdate={onUpdate} />
    )
    await screen.getByLabelText('Ellipse shape').click()
    expect(onUpdate).toHaveBeenCalledWith({ shape: 'ellipse' })
  })

})
