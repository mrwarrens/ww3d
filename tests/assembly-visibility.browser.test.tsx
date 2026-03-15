import { describe, it, expect, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import PartsList from '../src/components/PartsList'
import { createPart } from '../src/models/Part'
import { createAssembly } from '../src/models/Assembly'

const partA = createPart({ name: 'Top Rail', length: 36, width: 4, position: { x: 0, y: 0.375, z: 0 } })

const defaultProps = {
  parts: [],
  selectedIds: [],
  onSelectIds: vi.fn(),
  onToggleVisibility: vi.fn(),
  onToggleAssemblyVisibility: vi.fn(),
  onAddAssembly: vi.fn(),
  onAssignPart: vi.fn(),
  onRemoveFromAssembly: vi.fn(),
}

describe('assembly visibility toggle', () => {
  it('assembly row has a .visibility-btn button', async () => {
    const assembly = createAssembly('Cabinet')
    const { container } = await render(
      <PartsList {...defaultProps} assemblies={[assembly]} />
    )
    const assemblyLi = container.querySelector('li.assembly-row') as HTMLElement
    expect(assemblyLi.querySelector('.visibility-btn')).not.toBeNull()
  })

  it('visibility button has aria-label "Hide" when assembly.visible is true (default)', async () => {
    const assembly = createAssembly('Cabinet')
    const { container } = await render(
      <PartsList {...defaultProps} assemblies={[assembly]} />
    )
    const assemblyLi = container.querySelector('li.assembly-row') as HTMLElement
    const btn = assemblyLi.querySelector('.visibility-btn') as HTMLElement
    expect(btn.getAttribute('aria-label')).toBe('Hide')
  })

  it('visibility button has aria-label "Show" when assembly.visible is false', async () => {
    const assembly = { ...createAssembly('Cabinet'), visible: false }
    const { container } = await render(
      <PartsList {...defaultProps} assemblies={[assembly]} />
    )
    const assemblyLi = container.querySelector('li.assembly-row') as HTMLElement
    const btn = assemblyLi.querySelector('.visibility-btn') as HTMLElement
    expect(btn.getAttribute('aria-label')).toBe('Show')
  })

  it('clicking assembly visibility button calls onToggleAssemblyVisibility with assembly id', async () => {
    const assembly = createAssembly('Cabinet')
    const onToggleAssemblyVisibility = vi.fn()
    const { container } = await render(
      <PartsList {...defaultProps} assemblies={[assembly]} onToggleAssemblyVisibility={onToggleAssemblyVisibility} />
    )
    const assemblyLi = container.querySelector('li.assembly-row') as HTMLElement
    const btn = assemblyLi.querySelector('.visibility-btn') as HTMLElement
    await btn.click()
    expect(onToggleAssemblyVisibility).toHaveBeenCalledWith(assembly.id)
  })

  it('clicking assembly visibility button does not call onSelectIds', async () => {
    const assembly = createAssembly('Cabinet')
    const onSelectIds = vi.fn()
    const onToggleAssemblyVisibility = vi.fn()
    const { container } = await render(
      <PartsList {...defaultProps} assemblies={[assembly]} onSelectIds={onSelectIds} onToggleAssemblyVisibility={onToggleAssemblyVisibility} />
    )
    const assemblyLi = container.querySelector('li.assembly-row') as HTMLElement
    const btn = assemblyLi.querySelector('.visibility-btn') as HTMLElement
    await btn.click()
    expect(onToggleAssemblyVisibility).toHaveBeenCalled()
    expect(onSelectIds).not.toHaveBeenCalled()
  })

  it('each assembly row has its own visibility button independent of part rows', async () => {
    const assembly = createAssembly('Cabinet')
    const member = { ...partA, assemblyId: assembly.id }
    const { container } = await render(
      <PartsList {...defaultProps} parts={[member]} assemblies={[assembly]} />
    )
    const assemblyLi = container.querySelector('li.assembly-row') as HTMLElement
    const assemblyBtns = Array.from(assemblyLi.querySelectorAll('.visibility-btn'))
    // assembly row has its own button, plus member parts have their buttons nested inside
    const directBtn = assemblyBtns.find(
      (btn) => btn.parentElement === assemblyLi
    )
    expect(directBtn).not.toBeNull()
  })
})
