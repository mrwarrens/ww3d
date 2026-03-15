import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { act } from 'react'
import App from '../src/App'

afterEach(() => {
  vi.restoreAllMocks()
})

async function openMenu() {
  await act(async () => { document.getElementById('menu-btn')!.click() })
}

describe('App', () => {
  it('renders the Menu button', async () => {
    const screen = await render(<App />)
    await expect.element(screen.getByRole('button', { name: /Menu/ })).toBeVisible()
  })

  it('renders the Camera button', async () => {
    const screen = await render(<App />)
    await expect.element(screen.getByRole('button', { name: /Camera/ })).toBeVisible()
  })

  it('help pane is not visible by default', async () => {
    await render(<App />)
    expect(document.querySelector('#help-pane')).toBeNull()
  })

  it('shows the help pane via Menu > Keyboard Shortcuts', async () => {
    await render(<App />)
    await openMenu()
    const menu = document.getElementById('menu-dropdown')!
    const kbBtn = Array.from(menu.querySelectorAll('button')).find((b) => b.textContent?.includes('Keyboard Shortcuts'))!
    await act(async () => { kbBtn.click() })
    const pane = document.querySelector('#help-pane')
    expect(pane).not.toBeNull()
    expect(pane?.textContent).toContain('Left-drag')
  })

  it('Menu dropdown shows Save item', async () => {
    await render(<App />)
    await openMenu()
    const menu = document.getElementById('menu-dropdown')!
    expect(menu.textContent).toContain('Save')
  })

  it('Menu dropdown shows Load item', async () => {
    await render(<App />)
    await openMenu()
    const menu = document.getElementById('menu-dropdown')!
    expect(menu.textContent).toContain('Load')
  })

  it('Menu dropdown shows grid size', async () => {
    await render(<App />)
    await openMenu()
    const gridRow = document.querySelector('.dropdown-grid-row')
    expect(gridRow).not.toBeNull()
    expect(gridRow!.textContent).toContain('Grid:')
  })

  it('Menu dropdown is hidden by default', async () => {
    await render(<App />)
    expect(document.getElementById('menu-dropdown')).toBeNull()
  })

  it('Menu dropdown opens when Menu button is clicked', async () => {
    await render(<App />)
    await openMenu()
    expect(document.getElementById('menu-dropdown')).not.toBeNull()
  })

  it('Menu dropdown closes when Menu button is clicked again', async () => {
    await render(<App />)
    await openMenu()
    expect(document.getElementById('menu-dropdown')).not.toBeNull()
    await openMenu()
    expect(document.getElementById('menu-dropdown')).toBeNull()
  })

  it('clicking Grid + increases the displayed grid size', async () => {
    await render(<App />)
    await openMenu()
    const menu = document.getElementById('menu-dropdown')!
    const gridRow = menu.querySelector('.dropdown-grid-row')!
    const initialSize = parseInt((gridRow.textContent ?? '').replace(/[^0-9]/g, ''), 10)
    const plusBtn = Array.from(menu.querySelectorAll('button')).find((b) => b.textContent === '+')!
    await act(async () => { plusBtn.click() })
    const newSize = parseInt((menu.querySelector('.dropdown-grid-row')!.textContent ?? '').replace(/[^0-9]/g, ''), 10)
    expect(newSize).toBe(initialSize + 5)
  })

  it('renders the left panel', async () => {
    await render(<App />)
    expect(document.getElementById('left-panel')).not.toBeNull()
  })

  it('help pane z-index is greater than part outliner z-index', async () => {
    await render(<App />)
    await openMenu()
    const menu = document.getElementById('menu-dropdown')!
    const kbBtn = Array.from(menu.querySelectorAll('button')).find((b) => b.textContent?.includes('Keyboard Shortcuts'))!
    await act(async () => { kbBtn.click() })
    const helpPane = document.getElementById('help-pane')!
    const outliner = document.getElementById('left-panel')!
    const helpZ = parseInt(getComputedStyle(helpPane).zIndex, 10)
    const outlinerZ = parseInt(getComputedStyle(outliner).zIndex, 10)
    expect(helpZ).toBeGreaterThan(outlinerZ)
  })

  it('help pane background is fully opaque', async () => {
    await render(<App />)
    await openMenu()
    const menu = document.getElementById('menu-dropdown')!
    const kbBtn = Array.from(menu.querySelectorAll('button')).find((b) => b.textContent?.includes('Keyboard Shortcuts'))!
    await act(async () => { kbBtn.click() })
    const helpPane = document.getElementById('help-pane')!
    const bg = getComputedStyle(helpPane).backgroundColor
    const match = bg.match(/rgba?\([\d\s,]+(?:,\s*([\d.]+))?\)/)
    const alpha = match?.[1] !== undefined ? parseFloat(match[1]) : 1
    expect(alpha).toBe(1)
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
