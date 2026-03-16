import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from 'vitest-browser-react'
import { page, userEvent } from '@vitest/browser/context'
import { act } from 'react'
import CutListView from '../src/components/CutListView'
import { useProjectStore } from '../src/stores/projectStore'
import { createPart } from '../src/models/Part'
import { createProject } from '../src/models/Project'

function makeSheetPart(overrides: Partial<Parameters<typeof createPart>[0]> = {}) {
  return createPart({
    length: 24,
    width: 18,
    thickness: 0.75,
    position: { x: 0, y: 0.375, z: 0 },
    materialType: 'sheet',
    ...overrides,
  })
}

function makeHardwoodPart(overrides: Partial<Parameters<typeof createPart>[0]> = {}) {
  return createPart({
    length: 24,
    width: 4,
    thickness: 0.75,
    position: { x: 0, y: 0.375, z: 0 },
    materialType: 'hardwood',
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

describe('CutListView sheet goods section', () => {
  it('shows no nesting diagram when there are no sheet parts', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [makeHardwoodPart({ name: 'Rail' })],
        },
      }))
    })
    await render(<CutListView />)
    const svgs = document.querySelectorAll('.cutlist-sheet-svg')
    expect(svgs.length).toBe(0)
  })

  it('renders a nesting diagram when sheet parts exist', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [
            makeSheetPart({ name: 'Panel A' }),
            makeSheetPart({ name: 'Panel B' }),
          ],
        },
      }))
    })
    await render(<CutListView />)
    const svgs = document.querySelectorAll('.cutlist-sheet-svg')
    expect(svgs.length).toBeGreaterThan(0)
  })

  it('renders a summary line with sheet count', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [makeSheetPart({ name: 'Panel A' })],
        },
      }))
    })
    await render(<CutListView />)
    await expect.element(page.getByText(/\d+ sheet/)).toBeVisible()
  })

  it('pre-populates width input with 48 and height with 96 by default', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [makeSheetPart({ name: 'Panel' })],
        },
      }))
    })
    await render(<CutListView />)
    const inputs = document.querySelectorAll<HTMLInputElement>('.cutlist-section-inputs input[type="number"]')
    expect(inputs[0]?.value).toBe('48')
    expect(inputs[1]?.value).toBe('96')
  })

  it('persists sheet width to store on blur', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [makeSheetPart({ name: 'Panel' })],
        },
      }))
    })
    const screen = await render(<CutListView />)
    const widthInput = screen.getByRole('spinbutton').first()
    await widthInput.fill('60')
    await userEvent.keyboard('{Tab}')
    const settings = useProjectStore.getState().project.cutListSettings
    expect(settings?.sheetGoods['0.75']?.sheetWidth).toBe(60)
  })

  it('renders two section headers for two thickness groups', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [
            makeSheetPart({ name: 'Panel A', thickness: 0.75 }),
            makeSheetPart({ name: 'Panel B', thickness: 0.5 }),
          ],
        },
      }))
    })
    await render(<CutListView />)
    const headers = document.querySelectorAll('.cutlist-section h2')
    expect(headers.length).toBe(2)
  })
})
