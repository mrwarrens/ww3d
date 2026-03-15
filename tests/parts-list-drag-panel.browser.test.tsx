import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import PartsList from '../src/components/PartsList'
import { createPart } from '../src/models/Part'
import { createAssembly } from '../src/models/Assembly'

test('mousedown on a draggable part row does not move the panel', async () => {
  const assembly = createAssembly('Assembly 1')
  const part = createPart({ name: 'Board A' })

  const { container } = await render(
    <PartsList
      parts={[part]}
      assemblies={[assembly]}
      selectedIds={[]}
      onSelectIds={() => {}}
      onToggleVisibility={() => {}}
    />
  )

  const leftPanel = container.querySelector('#left-panel') as HTMLElement
  expect(leftPanel).not.toBeNull()

  // Record the panel's initial position
  const initialLeft = leftPanel.style.left
  const initialTop = leftPanel.style.top

  // Find the draggable part row and fire mousedown on it
  const partRow = leftPanel.querySelector('li[draggable="true"]') as HTMLElement
  expect(partRow).not.toBeNull()

  partRow.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: 100, clientY: 100 }))

  // Move mouse significantly (simulate what would happen if panel drag triggered)
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: 300, clientY: 300, bubbles: true }))
  document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))

  // Panel position must not have changed
  expect(leftPanel.style.left).toBe(initialLeft)
  expect(leftPanel.style.top).toBe(initialTop)
})
