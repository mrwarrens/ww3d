import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from 'vitest-browser-react'
import { act } from 'react'
import App from '../src/App'
import { useProjectStore } from '../src/stores/projectStore'
import { createProject } from '../src/models/Project'

afterEach(() => cleanup())

async function setupParentAndChild() {
  useProjectStore.setState({ project: createProject(), history: [], future: [] })
  useProjectStore.getState().addPart({ name: 'Shelf', length: 24, width: 12, position: { x: 0, y: 0.375, z: 0 } })
  const parent = useProjectStore.getState().project.parts[0]
  useProjectStore.getState().addChildPart(parent.id, {
    name: 'Dado',
    length: 2,
    width: 12,
    thickness: 0.375,
    position: { x: 0, y: 0, z: 0 },
    operation: 'subtract',
  })
  return { parentId: parent.id }
}

async function enterModifyMode() {
  // Wait for R3F / Scene to mount its keydown listener before interacting
  await act(async () => { await new Promise((r) => setTimeout(r, 100)) })

  const partsListItems = document.querySelectorAll('#parts-list li')
  const parentRow = Array.from(partsListItems).find((li) => li.textContent?.includes('Shelf'))
  await act(async () => { (parentRow as HTMLElement)!.click() })

  const editCutsBtn = Array.from(document.querySelectorAll('button')).find(
    (b) => b.textContent === 'Edit Cuts'
  )
  await act(async () => { editCutsBtn!.click() })
}

async function selectChildInCutsList() {
  const cutsItems = document.querySelectorAll('#cuts-list li')
  const dadoRow = Array.from(cutsItems).find((li) => li.textContent?.includes('Dado'))
  await act(async () => { (dadoRow as HTMLElement)!.click() })
}

async function pressDelete() {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }))
  await act(async () => {})
}

describe('Modify mode - delete child', () => {
  beforeEach(async () => {
    await setupParentAndChild()
  })

  it('pressing Delete with child selected removes it from the store', async () => {
    await render(<App />)
    await enterModifyMode()
    await selectChildInCutsList()

    const beforeCount = useProjectStore.getState().project.parts.length
    await pressDelete()

    const afterCount = useProjectStore.getState().project.parts.length
    expect(afterCount).toBe(beforeCount - 1)
    const remaining = useProjectStore.getState().project.parts
    expect(remaining.some((p) => p.name === 'Dado')).toBe(false)
  })

  it('CutsList no longer shows deleted child after deletion', async () => {
    await render(<App />)
    await enterModifyMode()
    await selectChildInCutsList()
    await pressDelete()

    const cutsList = document.getElementById('cuts-list')
    expect(cutsList).not.toBeNull()
    const items = cutsList!.querySelectorAll('li')
    const texts = Array.from(items).map((li) => li.textContent)
    expect(texts.some((t) => t?.includes('Dado'))).toBe(false)
  })

  it('modify mode is preserved after deleting a child (CutsList still visible)', async () => {
    await render(<App />)
    await enterModifyMode()
    await selectChildInCutsList()

    expect(document.getElementById('cuts-list')).not.toBeNull()
    await pressDelete()
    expect(document.getElementById('cuts-list')).not.toBeNull()
  })

  it('undo restores the deleted child', async () => {
    await render(<App />)
    await enterModifyMode()
    await selectChildInCutsList()
    await pressDelete()

    expect(useProjectStore.getState().project.parts.some((p) => p.name === 'Dado')).toBe(false)

    await act(async () => {
      useProjectStore.getState().undo()
    })

    expect(useProjectStore.getState().project.parts.some((p) => p.name === 'Dado')).toBe(true)
  })
})
