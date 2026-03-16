import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from 'vitest-browser-react'
import { page, userEvent } from '@vitest/browser/context'
import { act } from 'react'
import CutListView from '../src/components/CutListView'
import { useProjectStore } from '../src/stores/projectStore'
import { createPart } from '../src/models/Part'
import { createProject } from '../src/models/Project'

function makeDimensionalPart(overrides: Partial<Parameters<typeof createPart>[0]> = {}) {
  return createPart({
    length: 72,
    width: 3.5,
    thickness: 1.5,
    position: { x: 0, y: 0.75, z: 0 },
    materialType: 'dimensional',
    ...overrides,
  })
}

beforeEach(() => {
  useProjectStore.setState({
    project: createProject(),
    history: [],
    future: [],
  })
})

afterEach(() => cleanup())

describe('CutListView dimensional lumber section', () => {
  it('renders no dimensional section when there are no dimensional parts', async () => {
    await render(<CutListView />)
    const sections = document.querySelectorAll('.cutlist-dim-section')
    expect(sections.length).toBe(0)
  })

  it('renders section header with nominal size when dimensional parts exist', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [makeDimensionalPart({ name: 'Stud' })],
        },
      }))
    })
    await render(<CutListView />)
    await expect.element(page.getByText('2x4')).toBeVisible()
  })

  it('renders two sections for two different nominal sizes', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [
            makeDimensionalPart({ name: 'Stud', width: 3.5, thickness: 1.5 }),
            makeDimensionalPart({ name: 'Joist', width: 5.5, thickness: 1.5 }),
          ],
        },
      }))
    })
    await render(<CutListView />)
    const sections = document.querySelectorAll('.cutlist-dim-section')
    expect(sections.length).toBe(2)
  })

  it('default available lengths list shows 8\', 10\', 12\'', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [makeDimensionalPart({ name: 'Stud' })],
        },
      }))
    })
    await render(<CutListView />)
    const lengthItems = document.querySelectorAll('.cutlist-dim-length-item')
    const texts = Array.from(lengthItems).map(el => el.textContent ?? '')
    expect(texts.some(t => t.includes("8'"))).toBe(true)
    expect(texts.some(t => t.includes("10'"))).toBe(true)
    expect(texts.some(t => t.includes("12'"))).toBe(true)
  })

  it('shows "No board fits" warning when part length exceeds all available lengths', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [makeDimensionalPart({ name: 'Long Stud', length: 200 })],
        },
      }))
    })
    await render(<CutListView />)
    await expect.element(page.getByText('No board fits')).toBeVisible()
  })

  it('shows assigned board length when part fits (length 72 → 8\')', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [makeDimensionalPart({ name: 'Short Stud', length: 72 })],
        },
      }))
    })
    await render(<CutListView />)
    // 72" fits in 96" (8'), not in shorter lengths
    const rows = document.querySelectorAll('.cutlist-dim-table tbody tr')
    expect(rows.length).toBe(1)
    const cells = rows[0].querySelectorAll('td')
    expect(cells[2].textContent).toBe("8'")
  })

  it('footer shows correct count string for two parts assigned to same board length', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [
            makeDimensionalPart({ name: 'Stud A', length: 72 }),
            makeDimensionalPart({ name: 'Stud B', length: 72 }),
          ],
        },
      }))
    })
    await render(<CutListView />)
    await expect.element(page.getByText(/2× 8'/)).toBeVisible()
  })

  it('persists updated lengths to store after removing a length', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [makeDimensionalPart({ name: 'Stud' })],
        },
      }))
    })
    await render(<CutListView />)
    // Remove the first length (8' = 96")
    const removeButtons = document.querySelectorAll<HTMLButtonElement>('.cutlist-dim-length-item button')
    expect(removeButtons.length).toBeGreaterThan(0)
    await userEvent.click(removeButtons[0])
    const settings = useProjectStore.getState().project.cutListSettings
    const lengths = settings?.dimensional['2x4']?.availableLengths ?? []
    expect(lengths).not.toContain(96)
    expect(lengths.length).toBe(2)
  })

  it('pre-populates lengths from stored settings', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [makeDimensionalPart({ name: 'Stud' })],
          cutListSettings: {
            sheetGoods: {},
            hardwood: {},
            dimensional: { '2x4': { availableLengths: [96, 192] } },
          },
        },
      }))
    })
    await render(<CutListView />)
    await expect.element(page.getByText(/16'/)).toBeVisible()
  })
})
