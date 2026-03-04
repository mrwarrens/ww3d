import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from 'vitest-browser-react'
import { act } from 'react'
import PartPanel from '../src/components/PartPanel'
import { createPart } from '../src/models/Part'

const topLevelPart = createPart({
  name: 'Board',
  length: 24,
  width: 8,
  thickness: 0.75,
  position: { x: 0, y: 0.375, z: 0 },
})

const childPart = createPart({
  name: 'Cut',
  length: 4,
  width: 4,
  thickness: 0.75,
  position: { x: 0, y: 0, z: 0 },
  parentId: topLevelPart.id,
})

afterEach(() => cleanup())

describe('Modify mode', () => {
  it('shows "Edit Cuts" button for top-level part', async () => {
    const screen = await render(
      <PartPanel part={topLevelPart} onUpdate={vi.fn()} isModifying={false} onEnterModifyMode={vi.fn()} onExitModifyMode={vi.fn()} />
    )
    const btn = screen.getByRole('button', { name: /edit cuts/i })
    await expect.element(btn).toBeInTheDocument()
  })

  it('clicking "Edit Cuts" calls onEnterModifyMode', async () => {
    const onEnter = vi.fn()
    const screen = await render(
      <PartPanel part={topLevelPart} onUpdate={vi.fn()} isModifying={false} onEnterModifyMode={onEnter} onExitModifyMode={vi.fn()} />
    )
    const btn = screen.getByRole('button', { name: /edit cuts/i })
    await act(async () => { btn.element().click() })
    expect(onEnter).toHaveBeenCalledOnce()
  })

  it('shows "Done Editing" button when isModifying is true', async () => {
    const screen = await render(
      <PartPanel part={topLevelPart} onUpdate={vi.fn()} isModifying={true} onEnterModifyMode={vi.fn()} onExitModifyMode={vi.fn()} />
    )
    const btn = screen.getByRole('button', { name: /done editing/i })
    await expect.element(btn).toBeInTheDocument()
  })

  it('clicking "Done Editing" calls onExitModifyMode', async () => {
    const onExit = vi.fn()
    const screen = await render(
      <PartPanel part={topLevelPart} onUpdate={vi.fn()} isModifying={true} onEnterModifyMode={vi.fn()} onExitModifyMode={onExit} />
    )
    const btn = screen.getByRole('button', { name: /done editing/i })
    await act(async () => { btn.element().click() })
    expect(onExit).toHaveBeenCalledOnce()
  })

  it('does not show Edit Cuts button for a part with parentId', async () => {
    await render(
      <PartPanel part={childPart} onUpdate={vi.fn()} isModifying={false} onEnterModifyMode={vi.fn()} onExitModifyMode={vi.fn()} />
    )
    const buttons = Array.from(document.querySelectorAll('button'))
    const editCutsBtn = buttons.find((b) => /edit cuts/i.test(b.textContent ?? ''))
    expect(editCutsBtn).toBeUndefined()
  })
})
