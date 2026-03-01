import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from 'vitest-browser-react'
import { userEvent } from '@vitest/browser/context'
import PartPanel from '../src/components/PartPanel'
import { createAssembly } from '../src/models/Assembly'

const testAssembly = createAssembly('Leg Assembly')

afterEach(() => cleanup())

describe('Editable assembly name in PartPanel', () => {
  it('renders assembly name as an input', async () => {
    const screen = await render(
      <PartPanel
        part={null}
        onUpdate={vi.fn()}
        assembly={testAssembly}
        onMoveAssembly={vi.fn()}
      />
    )
    const input = screen.getByRole('textbox', { name: /assembly name/i })
    await expect.element(input).toHaveValue('Leg Assembly')
  })

  it('calls onRenameAssembly with trimmed value on Enter', async () => {
    const onRenameAssembly = vi.fn()
    const screen = await render(
      <PartPanel
        part={null}
        onUpdate={vi.fn()}
        assembly={testAssembly}
        onMoveAssembly={vi.fn()}
        onRenameAssembly={onRenameAssembly}
      />
    )
    const input = screen.getByRole('textbox', { name: /assembly name/i })
    await input.fill('  Cabinet Frame  ')
    await userEvent.keyboard('{Enter}')
    expect(onRenameAssembly).toHaveBeenCalledWith('Cabinet Frame')
  })

  it('resets input on Escape without calling onRenameAssembly', async () => {
    const onRenameAssembly = vi.fn()
    const screen = await render(
      <PartPanel
        part={null}
        onUpdate={vi.fn()}
        assembly={testAssembly}
        onMoveAssembly={vi.fn()}
        onRenameAssembly={onRenameAssembly}
      />
    )
    const input = screen.getByRole('textbox', { name: /assembly name/i })
    await input.fill('Oops')
    await userEvent.keyboard('{Escape}')
    await expect.element(input).toHaveValue('Leg Assembly')
    expect(onRenameAssembly).not.toHaveBeenCalled()
  })

  it('resets input on blur when value is empty without calling onRenameAssembly', async () => {
    const onRenameAssembly = vi.fn()
    const screen = await render(
      <PartPanel
        part={null}
        onUpdate={vi.fn()}
        assembly={testAssembly}
        onMoveAssembly={vi.fn()}
        onRenameAssembly={onRenameAssembly}
      />
    )
    const input = screen.getByRole('textbox', { name: /assembly name/i })
    await input.fill('')
    await userEvent.keyboard('{Tab}')
    await expect.element(input).toHaveValue('Leg Assembly')
    expect(onRenameAssembly).not.toHaveBeenCalled()
  })
})
