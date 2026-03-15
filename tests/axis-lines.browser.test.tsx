import { describe, it, expect } from 'vitest'
import { render } from 'vitest-browser-react'
import { act } from 'react'
import App from '../src/App'

async function openMenuDropdown() {
  await render(<App />)
  await act(async () => { document.getElementById('menu-btn')!.click() })
  return document.getElementById('menu-dropdown')!
}

describe('Axes toggle button', () => {
  it('is present in menu dropdown after opening', async () => {
    const dropdown = await openMenuDropdown()
    expect(dropdown.textContent).toContain('Axes')
  })

  it('shows "Axes Off" initially (axes hidden by default)', async () => {
    const dropdown = await openMenuDropdown()
    expect(dropdown.textContent).toContain('Axes Off')
  })

  it('toggles to "Axes On" after first click', async () => {
    const dropdown = await openMenuDropdown()
    const btn = Array.from(dropdown.querySelectorAll('button')).find((b) => b.textContent?.includes('Axes'))!
    await act(async () => { btn.click() })
    expect(btn.textContent).toContain('Axes On')
  })

  it('toggles back to "Axes Off" after second click', async () => {
    const dropdown = await openMenuDropdown()
    const btn = Array.from(dropdown.querySelectorAll('button')).find((b) => b.textContent?.includes('Axes'))!
    await act(async () => { btn.click() })
    await act(async () => { btn.click() })
    expect(btn.textContent).toContain('Axes Off')
  })

  it('unmounts AxisLines without error when toggling off', async () => {
    const dropdown = await openMenuDropdown()
    const btn = Array.from(dropdown.querySelectorAll('button')).find((b) => b.textContent?.includes('Axes'))!
    await act(async () => { btn.click() })
    expect(btn.textContent).toContain('Axes On')
    await act(async () => { btn.click() })
    expect(btn.textContent).toContain('Axes Off')
  })

  it('re-renders AxisLines without error when grid size changes while axes are on', async () => {
    const dropdown = await openMenuDropdown()
    const axesBtn = Array.from(dropdown.querySelectorAll('button')).find((b) => b.textContent?.includes('Axes'))!
    await act(async () => { axesBtn.click() })
    expect(axesBtn.textContent).toContain('Axes On')
    const gridPlusBtn = Array.from(dropdown.querySelectorAll('button')).find((b) => b.textContent === '+')!
    await act(async () => { gridPlusBtn.click() })
    expect(axesBtn.textContent).toContain('Axes On')
  })
})
