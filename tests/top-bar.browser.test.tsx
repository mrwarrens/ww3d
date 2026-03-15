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

async function openCamera() {
  await act(async () => { document.getElementById('camera-btn')!.click() })
}

describe('Top Bar', () => {
  it('Menu button is present', async () => {
    await render(<App />)
    const btn = document.getElementById('menu-btn')
    expect(btn).not.toBeNull()
    expect(btn?.textContent).toContain('Menu')
  })

  it('Camera button is present', async () => {
    await render(<App />)
    const btn = document.getElementById('camera-btn')
    expect(btn).not.toBeNull()
    expect(btn?.textContent).toContain('Camera')
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

  it('Menu dropdown shows Load and Save items', async () => {
    await render(<App />)
    await openMenu()
    const menu = document.getElementById('menu-dropdown')!
    expect(menu.textContent).toContain('Load')
    expect(menu.textContent).toContain('Save')
  })

  it('Menu dropdown shows Grid − and Grid + controls', async () => {
    await render(<App />)
    await openMenu()
    const menu = document.getElementById('menu-dropdown')!
    expect(menu.textContent).toContain('Grid:')
    const buttons = Array.from(menu.querySelectorAll('button'))
    expect(buttons.some((b) => b.textContent === '−')).toBe(true)
    expect(buttons.some((b) => b.textContent === '+')).toBe(true)
  })

  it('Clicking Grid + increases the displayed grid size', async () => {
    await render(<App />)
    await openMenu()
    const menu = document.getElementById('menu-dropdown')!
    const gridRow = menu.querySelector('.dropdown-grid-row')!
    const initialText = gridRow.textContent ?? ''
    const initialSize = parseInt(initialText.replace(/[^0-9]/g, ''), 10)
    const plusBtn = Array.from(menu.querySelectorAll('button')).find((b) => b.textContent === '+')!
    await act(async () => { plusBtn.click() })
    const newText = menu.querySelector('.dropdown-grid-row')!.textContent ?? ''
    const newSize = parseInt(newText.replace(/[^0-9]/g, ''), 10)
    expect(newSize).toBe(initialSize + 5)
  })

  it('Clicking Grid + does not close the menu dropdown', async () => {
    await render(<App />)
    await openMenu()
    const menu = document.getElementById('menu-dropdown')!
    const plusBtn = Array.from(menu.querySelectorAll('button')).find((b) => b.textContent === '+')!
    await act(async () => { plusBtn.click() })
    expect(document.getElementById('menu-dropdown')).not.toBeNull()
  })

  it('Clicking Grid − does not close the menu dropdown', async () => {
    await render(<App />)
    await openMenu()
    const menu = document.getElementById('menu-dropdown')!
    const minusBtn = Array.from(menu.querySelectorAll('button')).find((b) => b.textContent === '−')!
    await act(async () => { minusBtn.click() })
    expect(document.getElementById('menu-dropdown')).not.toBeNull()
  })

  it('Menu dropdown shows Axes toggle', async () => {
    await render(<App />)
    await openMenu()
    const menu = document.getElementById('menu-dropdown')!
    expect(menu.textContent).toContain('Axes')
  })

  it('Menu dropdown shows Keyboard Shortcuts item', async () => {
    await render(<App />)
    await openMenu()
    const menu = document.getElementById('menu-dropdown')!
    expect(menu.textContent).toContain('Keyboard Shortcuts')
  })

  it('Help pane is not visible until Keyboard Shortcuts is clicked', async () => {
    await render(<App />)
    expect(document.getElementById('help-pane')).toBeNull()
  })

  it('Clicking Keyboard Shortcuts opens the help pane', async () => {
    await render(<App />)
    await openMenu()
    const menu = document.getElementById('menu-dropdown')!
    const kbBtn = Array.from(menu.querySelectorAll('button')).find((b) => b.textContent?.includes('Keyboard Shortcuts'))!
    await act(async () => { kbBtn.click() })
    expect(document.getElementById('help-pane')).not.toBeNull()
  })

  it('Camera dropdown is hidden by default', async () => {
    await render(<App />)
    expect(document.getElementById('camera-dropdown')).toBeNull()
  })

  it('Camera dropdown opens when Camera button is clicked', async () => {
    await render(<App />)
    await openCamera()
    expect(document.getElementById('camera-dropdown')).not.toBeNull()
  })

  it('Camera dropdown shows Front, Right, Top, Iso with keyboard hints', async () => {
    await render(<App />)
    await openCamera()
    const menu = document.getElementById('camera-dropdown')!
    expect(menu.textContent).toContain('Front')
    expect(menu.textContent).toContain('Right')
    expect(menu.textContent).toContain('Top')
    expect(menu.textContent).toContain('Iso')
    expect(menu.textContent).toContain('1')
    expect(menu.textContent).toContain('2')
    expect(menu.textContent).toContain('3')
    expect(menu.textContent).toContain('4')
  })

  it('Opening Menu closes Camera dropdown', async () => {
    await render(<App />)
    await openCamera()
    expect(document.getElementById('camera-dropdown')).not.toBeNull()
    await openMenu()
    expect(document.getElementById('camera-dropdown')).toBeNull()
    expect(document.getElementById('menu-dropdown')).not.toBeNull()
  })

  it('Opening Camera closes Menu dropdown', async () => {
    await render(<App />)
    await openMenu()
    expect(document.getElementById('menu-dropdown')).not.toBeNull()
    await openCamera()
    expect(document.getElementById('menu-dropdown')).toBeNull()
    expect(document.getElementById('camera-dropdown')).not.toBeNull()
  })

  it('Clicking backdrop closes open Menu dropdown', async () => {
    await render(<App />)
    await openMenu()
    expect(document.getElementById('menu-dropdown')).not.toBeNull()
    const backdrop = document.querySelector('.dropdown-backdrop') as HTMLElement
    await act(async () => { backdrop.click() })
    expect(document.getElementById('menu-dropdown')).toBeNull()
  })

  it('Clicking backdrop closes open Camera dropdown', async () => {
    await render(<App />)
    await openCamera()
    expect(document.getElementById('camera-dropdown')).not.toBeNull()
    const backdrop = document.querySelector('.dropdown-backdrop') as HTMLElement
    await act(async () => { backdrop.click() })
    expect(document.getElementById('camera-dropdown')).toBeNull()
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
    expect(anchors[anchors.length - 1].download).toContain('.json')
  })

  it('Cmd+O triggers file input click', async () => {
    await render(<App />)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const clickSpy = vi.spyOn(fileInput, 'click').mockImplementation(() => {})
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'o', metaKey: true, bubbles: true }))
    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it('Old IDs are no longer present', async () => {
    await render(<App />)
    expect(document.getElementById('help-btn')).toBeNull()
    expect(document.getElementById('save-btn')).toBeNull()
    expect(document.getElementById('load-btn')).toBeNull()
    expect(document.getElementById('grid-toggle-btn')).toBeNull()
    expect(document.getElementById('camera-presets')).toBeNull()
  })
})
