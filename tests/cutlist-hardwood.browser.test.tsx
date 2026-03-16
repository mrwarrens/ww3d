import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from 'vitest-browser-react'
import { page, userEvent } from '@vitest/browser/context'
import { act } from 'react'
import CutListView from '../src/components/CutListView'
import { useProjectStore } from '../src/stores/projectStore'
import { createPart } from '../src/models/Part'
import { createProject } from '../src/models/Project'

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

describe('CutListView hardwood section', () => {
  it('renders nothing when there are no hardwood parts', async () => {
    await render(<CutListView />)
    const sections = document.querySelectorAll('.cutlist-hardwood-section')
    expect(sections.length).toBe(0)
  })

  it('renders a section header with quarter notation for 4/4 stock', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [makeHardwoodPart({ name: 'Shelf', thickness: 0.75 })],
        },
      }))
    })
    await render(<CutListView />)
    await expect.element(page.getByText('4/4 stock')).toBeVisible()
  })

  it('renders correct quarter notation for 8/4 stock', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [makeHardwoodPart({ name: 'Leg', thickness: 2.0 })],
        },
      }))
    })
    await render(<CutListView />)
    await expect.element(page.getByText('8/4 stock')).toBeVisible()
  })

  it('renders two section headers for two thickness groups', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [
            makeHardwoodPart({ name: 'Shelf', thickness: 0.75 }),
            makeHardwoodPart({ name: 'Leg', thickness: 2.0 }),
          ],
        },
      }))
    })
    await render(<CutListView />)
    const sections = document.querySelectorAll('.cutlist-hardwood-section')
    expect(sections.length).toBe(2)
  })

  it('renders part name and dimensions in the table', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [makeHardwoodPart({ name: 'Top Rail', length: 24, width: 4, thickness: 0.75 })],
        },
      }))
    })
    await render(<CutListView />)
    await expect.element(page.getByText('Top Rail')).toBeVisible()
    // 24" × 4" dimensions displayed as fractional inches
    await expect.element(page.getByText(/24.*×.*4/)).toBeVisible()
  })

  it('shows correct glue-up board count: width 8 with board width 6 needs 2 boards', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [makeHardwoodPart({ name: 'Wide Shelf', length: 24, width: 8, thickness: 0.75 })],
        },
      }))
    })
    await render(<CutListView />)
    // glueUpBoardCount(8, 6) = ceil(8/6) = 2
    const rows = document.querySelectorAll('.cutlist-table tbody tr')
    expect(rows.length).toBe(1)
    const cells = rows[0].querySelectorAll('td')
    expect(cells[2].textContent).toBe('2')
  })

  it('shows 1 board when part width fits in one board', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [makeHardwoodPart({ name: 'Narrow', length: 24, width: 4, thickness: 0.75 })],
        },
      }))
    })
    await render(<CutListView />)
    // glueUpBoardCount(4, 6) = ceil(4/6) = 1
    const rows = document.querySelectorAll('.cutlist-table tbody tr')
    const cells = rows[0].querySelectorAll('td')
    expect(cells[2].textContent).toBe('1')
  })

  it('shows warning badge when part length exceeds board length', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [makeHardwoodPart({ name: 'Long Board', length: 100, width: 4, thickness: 0.75 })],
        },
      }))
    })
    await render(<CutListView />)
    // default boardLength = 96, part.length = 100 > 96
    await expect.element(page.getByText(/part exceeds board length/)).toBeVisible()
  })

  it('does not show warning badge when part length fits in board', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [makeHardwoodPart({ name: 'Short Board', length: 24, width: 4, thickness: 0.75 })],
        },
      }))
    })
    await render(<CutListView />)
    const warnings = document.querySelectorAll('.cutlist-warning')
    expect(warnings.length).toBe(0)
  })

  it('renders group footer with total boards and board-feet', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [
            // glueUpBoardCount(8, 6) = 2, boardFeet(24, 12, 0.75) = 1.5
            makeHardwoodPart({ name: 'Wide Shelf', length: 24, width: 8, thickness: 0.75 }),
          ],
        },
      }))
    })
    await render(<CutListView />)
    // Total: 2 boards, 1.50 board-feet
    await expect.element(page.getByText(/Total: 2 boards/)).toBeVisible()
    await expect.element(page.getByText(/1\.50 board-feet/)).toBeVisible()
  })

  it('sums boards and board-feet across multiple parts in a group', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [
            // glueUpBoardCount(8, 6)=2, boardFeet(24, 12, 0.75)=1.5
            makeHardwoodPart({ name: 'Wide Shelf', length: 24, width: 8, thickness: 0.75 }),
            // glueUpBoardCount(4, 6)=1, boardFeet(24, 6, 0.75)=0.75
            makeHardwoodPart({ name: 'Narrow', length: 24, width: 4, thickness: 0.75 }),
          ],
        },
      }))
    })
    await render(<CutListView />)
    // Total: 3 boards, 2.25 board-feet
    await expect.element(page.getByText(/Total: 3 boards/)).toBeVisible()
    await expect.element(page.getByText(/2\.25 board-feet/)).toBeVisible()
  })

  it('shows singular "board" when total is 1', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [makeHardwoodPart({ name: 'Rail', length: 24, width: 4, thickness: 0.75 })],
        },
      }))
    })
    await render(<CutListView />)
    // glueUpBoardCount(4, 6) = 1
    await expect.element(page.getByText(/Total: 1 board,/)).toBeVisible()
  })

  it('persists hardwood settings to store on blur', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [makeHardwoodPart({ name: 'Shelf' })],
        },
      }))
    })
    const screen = await render(<CutListView />)
    // Board Width is the first spinbutton in the settings row
    const widthInput = screen.getByRole('spinbutton').first()
    await widthInput.fill('8')
    await userEvent.keyboard('{Tab}')
    const settings = useProjectStore.getState().project.cutListSettings
    expect(settings?.hardwood['4/4']?.boardWidth).toBe(8)
  })

  it('pre-populates inputs with stored settings', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [makeHardwoodPart({ name: 'Shelf' })],
          cutListSettings: {
            sheetGoods: {},
            hardwood: { '4/4': { boardWidth: 10, boardLength: 120 } },
            dimensional: {},
          },
        },
      }))
    })
    await render(<CutListView />)
    const inputs = document.querySelectorAll<HTMLInputElement>('.cutlist-settings-row input[type="number"]')
    expect(inputs[0]?.value).toBe('10')
    expect(inputs[1]?.value).toBe('120')
  })
})
