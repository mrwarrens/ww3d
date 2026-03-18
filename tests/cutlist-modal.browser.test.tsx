import { render } from 'vitest-browser-react'
import { expect, test, vi } from 'vitest'
import { act } from 'react'
import App from '../src/App'

async function openCutListModal() {
  await render(<App />)
  await act(async () => { document.getElementById('menu-btn')!.click() })
  const menu = document.getElementById('menu-dropdown')!
  const cutListBtn = Array.from(menu.querySelectorAll('button')).find((b) => b.textContent?.includes('Cut List'))!
  await act(async () => { cutListBtn.click() })
}

test('clicking Cut List in the menu opens the modal', async () => {
  await openCutListModal()
  expect(document.querySelector('.cutlist-modal-backdrop')).not.toBeNull()
})

test('pressing Escape closes the modal', async () => {
  await openCutListModal()
  expect(document.querySelector('.cutlist-modal-backdrop')).not.toBeNull()
  await act(async () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  })
  expect(document.querySelector('.cutlist-modal-backdrop')).toBeNull()
})

test('3D canvas is still in the DOM behind the modal', async () => {
  await openCutListModal()
  expect(document.querySelector('.cutlist-modal-backdrop')).not.toBeNull()
  expect(document.querySelector('canvas')).not.toBeNull()
})
