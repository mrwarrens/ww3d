import { describe, it, expect, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from '@vitest/browser/context'
import { useState, useEffect, act } from 'react'
import App from '../src/App'
import CutListView from '../src/components/CutListView'

function Root() {
  const [route, setRoute] = useState(window.location.hash)

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route === '#/cutlist' ? <CutListView /> : <App />
}

describe('hash-based routing', () => {
  beforeEach(() => {
    window.location.hash = '#/'
  })

  it('renders design view by default', async () => {
    render(<Root />)
    // PartsList renders in the design view
    await expect.element(page.getByText('Parts')).toBeVisible()
  })

  it('renders CutListView when hash is #/cutlist', async () => {
    render(<Root />)
    window.location.hash = '#/cutlist'
    await expect.element(page.getByText('← Design')).toBeVisible()
    await expect.element(page.getByText('Cut list coming soon')).toBeVisible()
  })

  it('returns to design view when hash changes back to #/', async () => {
    window.location.hash = '#/cutlist'
    render(<Root />)
    await expect.element(page.getByText('← Design')).toBeVisible()
    window.location.hash = '#/'
    await expect.element(page.getByText('Parts')).toBeVisible()
  })

  it('Cut List menu item exists in Menu dropdown', async () => {
    window.location.hash = '#/'
    await render(<App />)
    await act(async () => { document.getElementById('menu-btn')!.click() })
    const menu = document.getElementById('menu-dropdown')!
    const cutListLink = Array.from(menu.querySelectorAll('a')).find((a) => a.textContent?.includes('Cut List'))
    expect(cutListLink).not.toBeNull()
  })
})
