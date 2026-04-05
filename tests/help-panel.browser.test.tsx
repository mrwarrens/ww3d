import { describe, it, expect } from 'vitest'
import { render } from 'vitest-browser-react'
import { act } from 'react'
import App from '../src/App'

async function openHelp() {
  await render(<App />)
  await act(async () => { document.getElementById('menu-btn')!.click() })
  const menu = document.getElementById('menu-dropdown')!
  const kbBtn = Array.from(menu.querySelectorAll('button')).find((b) => b.textContent?.includes('Keyboard Shortcuts'))!
  await act(async () => { kbBtn.click() })
  return document.getElementById('help-pane')!
}

describe('Help Panel', () => {
  it('opens via Menu > Keyboard Shortcuts', async () => {
    const pane = await openHelp()
    expect(pane).not.toBeNull()
  })

  it('closes when Keyboard Shortcuts is clicked a second time via menu', async () => {
    await render(<App />)
    await act(async () => { document.getElementById('menu-btn')!.click() })
    let menu = document.getElementById('menu-dropdown')!
    const kbBtn = Array.from(menu.querySelectorAll('button')).find((b) => b.textContent?.includes('Keyboard Shortcuts'))!
    await act(async () => { kbBtn.click() })
    expect(document.getElementById('help-pane')).not.toBeNull()
    // Open menu again and click Keyboard Shortcuts to toggle off
    await act(async () => { document.getElementById('menu-btn')!.click() })
    menu = document.getElementById('menu-dropdown')!
    const kbBtn2 = Array.from(menu.querySelectorAll('button')).find((b) => b.textContent?.includes('Keyboard Shortcuts'))!
    await act(async () => { kbBtn2.click() })
    expect(document.getElementById('help-pane')).toBeNull()
  })

  it('shows "Left-drag on empty grid" entry', async () => {
    const pane = await openHelp()
    expect(pane.textContent).toContain('Left-drag on empty grid')
  })

  it('shows "Delete / Backspace" entry', async () => {
    const pane = await openHelp()
    expect(pane.textContent).toContain('Delete / Backspace')
  })

  it('shows "Cmd+D" entry', async () => {
    const pane = await openHelp()
    expect(pane.textContent).toContain('Cmd+D')
  })

  it('shows "Cmd+Z" entry', async () => {
    const pane = await openHelp()
    expect(pane.textContent).toContain('Cmd+Z')
  })

  it('shows "F" frame all entry', async () => {
    const pane = await openHelp()
    expect(pane.textContent).toContain('F')
    expect(pane.textContent).toContain('Frame all parts')
  })

  it('shows "1 / 2 / 3 / 4" camera preset entry', async () => {
    const pane = await openHelp()
    expect(pane.textContent).toContain('1 / 2 / 3 / 4')
  })

  it('shows "Arrow keys" orbit entry', async () => {
    const pane = await openHelp()
    expect(pane.textContent).toContain('Arrow keys')
  })

  it('shows "Shift+Arrow keys" pan entry', async () => {
    const pane = await openHelp()
    expect(pane.textContent).toContain('Shift+Arrow keys')
  })

  it('shows "Cmd+G" entry', async () => {
    const pane = await openHelp()
    expect(pane.textContent).toContain('Cmd+G')
  })

  it('closes when close button is clicked', async () => {
    await openHelp()
    expect(document.getElementById('help-pane')).not.toBeNull()
    await act(async () => { document.getElementById('help-pane-close')!.click() })
    expect(document.getElementById('help-pane')).toBeNull()
  })
})
