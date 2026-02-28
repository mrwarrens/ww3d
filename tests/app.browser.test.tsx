import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { act } from 'react'
import App from '../src/App'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('App', () => {
  it('renders the help button and no hint text by default', async () => {
    const screen = await render(<App />)
    await expect.element(screen.getByRole('button', { name: '?' })).toBeVisible()
    expect(document.querySelector('#help-pane')).toBeNull()
  })

  it('shows the help pane when the help button is clicked', async () => {
    await render(<App />)
    await act(async () => { document.getElementById('help-btn')!.click() })
    const pane = document.querySelector('#help-pane')
    expect(pane).not.toBeNull()
    expect(pane?.textContent).toContain('Left-drag')
  })

  it('hides the help pane when the help button is clicked again', async () => {
    await render(<App />)
    const helpBtn = document.getElementById('help-btn')!
    await act(async () => { helpBtn.click() })
    expect(document.querySelector('#help-pane')).not.toBeNull()
    await act(async () => { helpBtn.click() })
    expect(document.querySelector('#help-pane')).toBeNull()
  })

  it('renders the save button', async () => {
    const screen = await render(<App />)
    await expect.element(screen.getByRole('button', { name: 'Save' })).toBeVisible()
  })

  it('renders the load button', async () => {
    const screen = await render(<App />)
    await expect.element(screen.getByRole('button', { name: 'Load' })).toBeVisible()
  })

  it('renders a grid toggle button showing the current grid size', async () => {
    await render(<App />)
    const btn = document.getElementById('grid-toggle-btn')
    expect(btn).not.toBeNull()
    expect(btn?.textContent?.trim()).toMatch(/^Grid: \d+$/)
  })

  it('grid pane is hidden by default', async () => {
    await render(<App />)
    expect(document.getElementById('grid-pane')).toBeNull()
  })

  it('opens the grid pane when the toggle button is clicked', async () => {
    await render(<App />)
    await act(async () => { document.getElementById('grid-toggle-btn')!.click() })
    expect(document.getElementById('grid-pane')).not.toBeNull()
  })

  it('closes the grid pane when the toggle button is clicked again', async () => {
    await render(<App />)
    const toggleBtn = document.getElementById('grid-toggle-btn')!
    await act(async () => { toggleBtn.click() })
    expect(document.getElementById('grid-pane')).not.toBeNull()
    await act(async () => { toggleBtn.click() })
    expect(document.getElementById('grid-pane')).toBeNull()
  })

  it('clicking Grid + increases the displayed grid size', async () => {
    await render(<App />)
    const toggleBtn = document.getElementById('grid-toggle-btn')!
    const initialText = toggleBtn.textContent?.trim() ?? ''
    const initialSize = parseInt(initialText.replace('Grid: ', ''), 10)
    await act(async () => { toggleBtn.click() })
    const pane = document.getElementById('grid-pane')!
    const plusBtn = Array.from(pane.querySelectorAll('button')).find((b) => b.textContent?.includes('+'))!
    await act(async () => { plusBtn.click() })
    expect(toggleBtn.textContent?.trim()).toBe(`Grid: ${initialSize + 5}`)
  })

  it('Cmd+S triggers a download', async () => {
    const anchors: HTMLAnchorElement[] = []
    const origCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag)
      if (tag === 'a') anchors.push(el as HTMLAnchorElement)
      return el
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    await render(<App />)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', metaKey: true, bubbles: true }))

    expect(anchors.length).toBeGreaterThanOrEqual(1)
    const anchor = anchors[anchors.length - 1]
    expect(anchor.download).toContain('.json')
  })
})
