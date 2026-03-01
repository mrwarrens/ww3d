import { describe, it, expect } from 'vitest'
import { render } from 'vitest-browser-react'
import { act } from 'react'
import App from '../src/App'

async function openHelp() {
  await render(<App />)
  await act(async () => { document.getElementById('help-btn')!.click() })
  return document.getElementById('help-pane')!
}

describe('Help Panel', () => {
  it('opens when ? button is clicked', async () => {
    const pane = await openHelp()
    expect(pane).not.toBeNull()
  })

  it('closes when ? button is clicked a second time', async () => {
    await render(<App />)
    const btn = document.getElementById('help-btn')!
    await act(async () => { btn.click() })
    expect(document.getElementById('help-pane')).not.toBeNull()
    await act(async () => { btn.click() })
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

  it('shows "1 / 2 / 3 / 4" camera preset entry', async () => {
    const pane = await openHelp()
    expect(pane.textContent).toContain('1 / 2 / 3 / 4')
  })

  it('shows "Cmd+G" entry', async () => {
    const pane = await openHelp()
    expect(pane.textContent).toContain('Cmd+G')
  })
})
