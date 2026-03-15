import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from 'vitest-browser-react'
import { userEvent } from '@vitest/browser/context'
import PropertiesPanel from '../src/components/PropertiesPanel'
import type { Assembly } from '../src/models/Assembly'

type AssemblyPanelProps = { assembly: Assembly; onMoveAssembly: Parameters<typeof PropertiesPanel>[0]['onMoveAssembly']; onRenameAssembly?: (name: string) => void; onClose?: () => void }
function AssemblyPanel({ assembly, onMoveAssembly, onRenameAssembly, onClose }: AssemblyPanelProps) {
  return <PropertiesPanel part={null} assembly={assembly} onUpdate={() => {}} onMoveAssembly={onMoveAssembly} onRenameAssembly={onRenameAssembly} onClose={onClose} />
}
import { createAssembly } from '../src/models/Assembly'

const testAssembly = createAssembly('Leg Assembly')

afterEach(() => cleanup())

describe('Editable assembly name in AssemblyPanel', () => {
  it('renders assembly name as an input', async () => {
    const screen = await render(
      <AssemblyPanel
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
      <AssemblyPanel
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
      <AssemblyPanel
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

  it('renders close button with aria-label "Close properties panel" when assembly selected', async () => {
    const screen = await render(
      <AssemblyPanel assembly={testAssembly} onMoveAssembly={vi.fn()} />
    )
    await expect.element(screen.getByRole('button', { name: /close properties panel/i })).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked in assembly mode', async () => {
    const onClose = vi.fn()
    const screen = await render(
      <AssemblyPanel assembly={testAssembly} onMoveAssembly={vi.fn()} onClose={onClose} />
    )
    await screen.getByRole('button', { name: /close properties panel/i }).click()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('resets input on blur when value is empty without calling onRenameAssembly', async () => {
    const onRenameAssembly = vi.fn()
    const screen = await render(
      <AssemblyPanel
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
