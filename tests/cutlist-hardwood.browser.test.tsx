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
    const rows = document.querySelectorAll('.cutlist-table tbody tr')
    const cells = rows[0].querySelectorAll('td')
    expect(cells[1].textContent).toContain('24"')
    expect(cells[2].textContent).toContain('4"')
  })

  it('renders separate Length and Width column headers', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [makeHardwoodPart({ name: 'Rail' })],
        },
      }))
    })
    await render(<CutListView />)
    const headers = document.querySelectorAll('.cutlist-table thead th')
    const headerTexts = Array.from(headers).map(h => h.textContent)
    expect(headerTexts).toContain('Length')
    expect(headerTexts).toContain('Width')
    expect(headerTexts).not.toContain('L × W')
  })

  it('shows correct glue-up board count: width 8 with board width 6, length 24 in 96" board needs 1 board', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [makeHardwoodPart({ name: 'Wide Shelf', length: 24, width: 8, thickness: 0.75 })],
        },
      }))
    })
    await render(<CutListView />)
    // strips=ceil(8/6)=2, stripsPerBoard=floor(96/24)=4, boardsToBuy=ceil(2/4)=1
    const rows = document.querySelectorAll('.cutlist-table tbody tr')
    expect(rows.length).toBe(1)
    const cells = rows[0].querySelectorAll('td')
    expect(cells[3].textContent).toBe('1')
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
    expect(cells[3].textContent).toBe('1')
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
    // warning should appear in the Length cell (cells[1]), not in a combined cell
    const rows = document.querySelectorAll('.cutlist-table tbody tr')
    const cells = rows[0].querySelectorAll('td')
    expect(cells[1].querySelector('.cutlist-warning')).not.toBeNull()
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
            // strips=2, stripsPerBoard=4, boardsToBuy=1, boardFeet(96,6,0.75)=3.0
            makeHardwoodPart({ name: 'Wide Shelf', length: 24, width: 8, thickness: 0.75 }),
          ],
        },
      }))
    })
    await render(<CutListView />)
    // Total: 1 board, 3.00 board-feet
    await expect.element(page.getByText(/Total: 1 board,/)).toBeVisible()
    await expect.element(page.getByText(/3\.00 board-feet/)).toBeVisible()
  })

  it('sums boards and board-feet across multiple parts in a group (bin-packed)', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [
            // Wide Shelf: strips=ceil(8/6)=2, each 24"; Narrow: strips=1, 24"
            // All 3 strips (72") fit in one 96" board → totalBoards=1, BF=1*boardFeet(96,6,0.75)=3.0
            makeHardwoodPart({ name: 'Wide Shelf', length: 24, width: 8, thickness: 0.75 }),
            makeHardwoodPart({ name: 'Narrow', length: 24, width: 4, thickness: 0.75 }),
          ],
        },
      }))
    })
    await render(<CutListView />)
    await expect.element(page.getByText(/Total: 1 board,/)).toBeVisible()
    await expect.element(page.getByText(/3\.00 board-feet/)).toBeVisible()
  })

  it('bin-packing: two parts of length 60" with 96" board → 2 boards total', async () => {
    act(() => {
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: [
            // Each part: 1 strip of 60"; board 0: 60" (36" remaining), 36 < 60 → board 1
            makeHardwoodPart({ name: 'Part A', length: 60, width: 4, thickness: 0.75 }),
            makeHardwoodPart({ name: 'Part B', length: 60, width: 4, thickness: 0.75 }),
          ],
        },
      }))
    })
    await render(<CutListView />)
    await expect.element(page.getByText(/Total: 2 boards/)).toBeVisible()
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
    // Board Length is the first spinbutton in the settings row; Board Width is the second
    const widthInput = screen.getByRole('spinbutton').nth(1)
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
    expect(inputs[0]?.value).toBe('120')
    expect(inputs[1]?.value).toBe('10')
  })
})
