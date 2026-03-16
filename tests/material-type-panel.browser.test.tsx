import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from 'vitest-browser-react'
import PropertiesPanel from '../src/components/PropertiesPanel'
import type { Part } from '../src/models/Part'
import { createPart } from '../src/models/Part'

type PartPanelProps = { part: Part; onUpdate: Parameters<typeof PropertiesPanel>[0]['onUpdate'] }
function PartPanel({ part, onUpdate }: PartPanelProps) {
  return <PropertiesPanel part={part} assembly={null} onUpdate={onUpdate} onMoveAssembly={() => {}} />
}

const topLevelPart = createPart({
  name: 'Shelf',
  length: 24,
  width: 8,
  thickness: 0.75,
  position: { x: 0, y: 0.375, z: 0 },
})

const hardwoodPart = createPart({
  name: 'Shelf',
  length: 24,
  width: 8,
  thickness: 0.75,
  position: { x: 0, y: 0.375, z: 0 },
  materialType: 'hardwood',
})

const sheetPart = createPart({
  name: 'Panel',
  length: 24,
  width: 8,
  thickness: 0.75,
  position: { x: 0, y: 0.375, z: 0 },
  materialType: 'sheet',
})

const dimensionalPart = createPart({
  name: 'Stud',
  length: 96,
  width: 3.5,
  thickness: 1.5,
  position: { x: 0, y: 0.75, z: 0 },
  materialType: 'dimensional',
})

const childPart = createPart({
  name: 'Dado',
  length: 6,
  width: 3,
  thickness: 0.375,
  position: { x: 0, y: 0, z: 0 },
  parentId: 'parent-id',
})

afterEach(() => cleanup())

describe('Material type selector', () => {
  it('renders the material type selector for a top-level part', async () => {
    const screen = await render(<PartPanel part={topLevelPart} onUpdate={vi.fn()} />)
    const select = screen.getByRole('combobox', { name: /material type/i })
    await expect.element(select).toBeInTheDocument()
  })

  it('defaults to hardwood when materialType is not set', async () => {
    const screen = await render(<PartPanel part={topLevelPart} onUpdate={vi.fn()} />)
    const select = screen.getByRole('combobox', { name: /material type/i })
    await expect.element(select).toHaveValue('hardwood')
  })

  it('shows correct value for hardwood part', async () => {
    const screen = await render(<PartPanel part={hardwoodPart} onUpdate={vi.fn()} />)
    const select = screen.getByRole('combobox', { name: /material type/i })
    await expect.element(select).toHaveValue('hardwood')
  })

  it('shows correct value for sheet part', async () => {
    const screen = await render(<PartPanel part={sheetPart} onUpdate={vi.fn()} />)
    const select = screen.getByRole('combobox', { name: /material type/i })
    await expect.element(select).toHaveValue('sheet')
  })

  it('shows correct value for dimensional part', async () => {
    const screen = await render(<PartPanel part={dimensionalPart} onUpdate={vi.fn()} />)
    const select = screen.getByRole('combobox', { name: /material type/i })
    await expect.element(select).toHaveValue('dimensional')
  })

  it('does not render the material type selector for a child part', async () => {
    const screen = await render(<PartPanel part={childPart} onUpdate={vi.fn()} />)
    expect(screen.container.querySelector('[aria-label="Material type"]')).toBeNull()
  })

  it('calls onUpdate with new materialType when selector changes', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={hardwoodPart} onUpdate={onUpdate} />)
    const select = screen.getByRole('combobox', { name: /material type/i })
    await select.selectOptions('sheet')
    expect(onUpdate).toHaveBeenCalledWith({ materialType: 'sheet' })
  })

  it('calls onUpdate with dimensional when dimensional is selected', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={hardwoodPart} onUpdate={onUpdate} />)
    const select = screen.getByRole('combobox', { name: /material type/i })
    await select.selectOptions('dimensional')
    expect(onUpdate).toHaveBeenCalledWith({ materialType: 'dimensional' })
  })
})
