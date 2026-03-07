import { describe, it, expect, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import PartsList from '../src/components/PartsList'
import { createPart } from '../src/models/Part'
import { createAssembly } from '../src/models/Assembly'

const assembly = createAssembly('Cabinet')
const part1 = createPart({ name: 'Top Panel', length: 24, width: 12, assemblyId: assembly.id })
const part2 = createPart({ name: 'Bottom Panel', length: 24, width: 12, assemblyId: assembly.id })

const defaultProps = {
  parts: [part1, part2],
  assemblies: [assembly],
  selectedIds: [],
  onSelectIds: vi.fn(),
  onToggleVisibility: vi.fn(),
  onToggleAssemblyVisibility: vi.fn(),
  onAddAssembly: vi.fn(),
  onAssignPart: vi.fn(),
  onRemoveFromAssembly: vi.fn(),
}

describe('Collapsible assembly groups', () => {
  it('renders a chevron button (▼) on the assembly row when expanded', async () => {
    const screen = await render(<PartsList {...defaultProps} />)
    const chevron = screen.getByRole('button', { name: 'Collapse' })
    await expect.element(chevron).toBeInTheDocument()
    await expect.element(chevron).toHaveTextContent('▼')
  })

  it('shows nested part rows by default', async () => {
    const screen = await render(<PartsList {...defaultProps} />)
    await expect.element(screen.getByText('Top Panel')).toBeInTheDocument()
    await expect.element(screen.getByText('Bottom Panel')).toBeInTheDocument()
  })

  it('hides nested part rows and shows ▶ after clicking the chevron', async () => {
    const screen = await render(<PartsList {...defaultProps} />)
    const chevron = screen.getByRole('button', { name: 'Collapse' })
    await userEvent.click(chevron)
    await expect.element(screen.getByRole('button', { name: 'Expand' })).toHaveTextContent('▶')
    expect(screen.container.querySelector('li.assembly-row ul')).toBeNull()
  })

  it('re-expands and shows part rows after clicking the chevron again', async () => {
    const screen = await render(<PartsList {...defaultProps} />)
    const chevron = screen.getByRole('button', { name: 'Collapse' })
    await userEvent.click(chevron)
    const expandBtn = screen.getByRole('button', { name: 'Expand' })
    await userEvent.click(expandBtn)
    await expect.element(screen.getByRole('button', { name: 'Collapse' })).toHaveTextContent('▼')
    await expect.element(screen.getByText('Top Panel')).toBeInTheDocument()
    await expect.element(screen.getByText('Bottom Panel')).toBeInTheDocument()
  })

  it('clicking the assembly name (not the chevron) calls onSelectAssembly', async () => {
    const onSelectAssembly = vi.fn()
    const screen = await render(
      <PartsList {...defaultProps} onSelectAssembly={onSelectAssembly} />
    )
    await screen.getByText('Cabinet').click()
    expect(onSelectAssembly).toHaveBeenCalledWith(assembly.id)
  })
})
