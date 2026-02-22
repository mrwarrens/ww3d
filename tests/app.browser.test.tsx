import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from 'vitest-browser-react'
import App from '../src/App'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('App', () => {
  it('renders the save button', async () => {
    const screen = await render(<App />)
    await expect.element(screen.getByRole('button', { name: 'Save' })).toBeVisible()
  })

  it('renders the load button', async () => {
    const screen = await render(<App />)
    await expect.element(screen.getByRole('button', { name: 'Load' })).toBeVisible()
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
