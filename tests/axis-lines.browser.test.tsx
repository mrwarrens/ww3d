import { describe, it, expect } from 'vitest'
import { render } from 'vitest-browser-react'
import { act } from 'react'
import App from '../src/App'

async function openGridPane() {
  await render(<App />)
  await act(async () => { document.getElementById('grid-toggle-btn')!.click() })
  return document.getElementById('grid-pane')!
}

describe('Axes toggle button', () => {
  it('is present in grid pane after opening', async () => {
    const pane = await openGridPane()
    expect(pane.textContent).toContain('Axes')
  })

  it('shows "Axes Off" initially (axes hidden by default)', async () => {
    const pane = await openGridPane()
    expect(pane.textContent).toContain('Axes Off')
  })

  it('toggles to "Axes On" after first click', async () => {
    const pane = await openGridPane()
    const btn = Array.from(pane.querySelectorAll('button')).find((b) => b.textContent?.includes('Axes'))!
    await act(async () => { btn.click() })
    expect(btn.textContent).toBe('Axes On')
  })

  it('toggles back to "Axes Off" after second click', async () => {
    const pane = await openGridPane()
    const btn = Array.from(pane.querySelectorAll('button')).find((b) => b.textContent?.includes('Axes'))!
    await act(async () => { btn.click() })
    await act(async () => { btn.click() })
    expect(btn.textContent).toBe('Axes Off')
  })
})
