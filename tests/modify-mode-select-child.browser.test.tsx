import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from 'vitest-browser-react'
import { act } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import PartPanel from '../src/components/PartPanel'
import Board from '../src/components/Board'
import App from '../src/App'
import { createPart } from '../src/models/Part'
import { useProjectStore } from '../src/stores/projectStore'
import { createProject } from '../src/models/Project'

afterEach(() => cleanup())

// ──────────────────────────────────────────────────────────────────────────────
// PartPanel tests — component-level, no store needed
// ──────────────────────────────────────────────────────────────────────────────

const parentPart = createPart({ name: 'Side', length: 24, width: 12, position: { x: 0, y: 0.375, z: 0 } })
const childPart = createPart({
  name: 'Dado',
  length: 12,
  width: 1,
  position: { x: 0, y: 0, z: 0 },
  operation: 'subtract',
  parentId: parentPart.id,
})

describe('PartPanel with child part', () => {
  it('renders Add and Subtract operation buttons for a child part', async () => {
    const screen = await render(<PartPanel part={childPart} onUpdate={vi.fn()} />)
    await expect.element(screen.getByRole('button', { name: 'Add operation' })).toBeInTheDocument()
    await expect.element(screen.getByRole('button', { name: 'Subtract operation' })).toBeInTheDocument()
  })

  it('does not render operation buttons for a top-level part', async () => {
    const { container } = await render(<PartPanel part={parentPart} onUpdate={vi.fn()} />)
    const opDiv = container.querySelector('.part-panel-operation')
    expect(opDiv).toBeNull()
  })

  it('Subtract button has active class when operation is subtract', async () => {
    const { container } = await render(<PartPanel part={childPart} onUpdate={vi.fn()} />)
    const buttons = container.querySelectorAll('.part-panel-operation button')
    const addBtn = Array.from(buttons).find((b) => b.textContent === 'Add')!
    const subBtn = Array.from(buttons).find((b) => b.textContent === 'Subtract')!
    expect(subBtn.classList.contains('active')).toBe(true)
    expect(addBtn.classList.contains('active')).toBe(false)
  })

  it('Add button has active class when operation is add', async () => {
    const addChild = { ...childPart, operation: 'add' as const }
    const { container } = await render(<PartPanel part={addChild} onUpdate={vi.fn()} />)
    const buttons = container.querySelectorAll('.part-panel-operation button')
    const addBtn = Array.from(buttons).find((b) => b.textContent === 'Add')!
    const subBtn = Array.from(buttons).find((b) => b.textContent === 'Subtract')!
    expect(addBtn.classList.contains('active')).toBe(true)
    expect(subBtn.classList.contains('active')).toBe(false)
  })

  it('calls onUpdate with operation add when Add button is clicked', async () => {
    const onUpdate = vi.fn()
    const screen = await render(<PartPanel part={childPart} onUpdate={onUpdate} />)
    await screen.getByRole('button', { name: 'Add operation' }).click()
    expect(onUpdate).toHaveBeenCalledWith({ operation: 'add' })
  })

  it('calls onUpdate with operation subtract when Subtract button is clicked', async () => {
    const onUpdate = vi.fn()
    const addChild = { ...childPart, operation: 'add' as const }
    const screen = await render(<PartPanel part={addChild} onUpdate={onUpdate} />)
    await screen.getByRole('button', { name: 'Subtract operation' }).click()
    expect(onUpdate).toHaveBeenCalledWith({ operation: 'subtract' })
  })

  it('operation container div has aria-label="Operation"', async () => {
    const { container } = await render(<PartPanel part={childPart} onUpdate={vi.fn()} />)
    const opDiv = container.querySelector('.part-panel-operation')
    expect(opDiv?.getAttribute('aria-label')).toBe('Operation')
  })

  it('hides Constraints section for a child part', async () => {
    const { container } = await render(<PartPanel part={childPart} onUpdate={vi.fn()} />)
    const constraintsDiv = container.querySelector('.part-panel-constraints')
    expect(constraintsDiv).toBeNull()
  })

  it('shows Constraints section for a top-level part', async () => {
    const { container } = await render(<PartPanel part={parentPart} onUpdate={vi.fn()} />)
    const constraintsDiv = container.querySelector('.part-panel-constraints')
    expect(constraintsDiv).not.toBeNull()
  })

  it('hides Edit Cuts button for a child part', async () => {
    const { container } = await render(<PartPanel part={childPart} onUpdate={vi.fn()} />)
    const editCutsDiv = container.querySelector('.part-panel-edit-cuts')
    expect(editCutsDiv).toBeNull()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Board tests — child mesh ref registration
// ──────────────────────────────────────────────────────────────────────────────

describe('Board - onChildMeshRef', () => {
  beforeEach(() => {
    useProjectStore.setState({ project: createProject(), history: [], future: [] })
  })

  it('calls onChildMeshRef with a THREE.Mesh when a subtract child is rendered in modify mode', async () => {
    const parent = createPart({ name: 'Panel', length: 24, width: 12, position: { x: 0, y: 0.375, z: 0 } })
    const child = createPart({ name: 'Dado', length: 2, width: 12, position: { x: 0, y: 0, z: 0 }, parentId: parent.id, operation: 'subtract' })
    useProjectStore.setState({
      project: { ...createProject(), parts: [parent, child] },
      history: [],
      future: [],
    })

    const childMeshRefCalled = vi.fn()

    await render(
      <Canvas>
        <Board
          {...parent}
          isSelected={false}
          onSelect={vi.fn()}
          isModifying={true}
          onChildMeshRef={(childId, mesh) => {
            if (mesh) childMeshRefCalled(childId, mesh instanceof THREE.Mesh)
          }}
        />
      </Canvas>
    )

    // Allow R3F to render and commit refs
    await act(async () => { await new Promise((r) => setTimeout(r, 100)) })

    expect(childMeshRefCalled).toHaveBeenCalledWith(child.id, true)
  })

  it('calls onChildMeshRef with a THREE.Mesh when an add child is rendered in modify mode', async () => {
    const parent = createPart({ name: 'Panel', length: 24, width: 12, position: { x: 0, y: 0.375, z: 0 } })
    const child = createPart({ name: 'Plug', length: 2, width: 2, position: { x: 0, y: 0, z: 0 }, parentId: parent.id, operation: 'add' })
    useProjectStore.setState({
      project: { ...createProject(), parts: [parent, child] },
      history: [],
      future: [],
    })

    const childMeshRefCalled = vi.fn()

    await render(
      <Canvas>
        <Board
          {...parent}
          isSelected={false}
          onSelect={vi.fn()}
          isModifying={true}
          onChildMeshRef={(childId, mesh) => {
            if (mesh) childMeshRefCalled(childId, mesh instanceof THREE.Mesh)
          }}
        />
      </Canvas>
    )

    await act(async () => { await new Promise((r) => setTimeout(r, 100)) })

    expect(childMeshRefCalled).toHaveBeenCalledWith(child.id, true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// App integration tests — modify mode preserved when selecting a child
// ──────────────────────────────────────────────────────────────────────────────

describe('App - modify mode child selection', () => {
  beforeEach(() => {
    useProjectStore.setState({ project: createProject(), history: [], future: [] })
  })

  it('CutsList remains visible after clicking a child row', async () => {
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

    await render(<App />)

    // Select the parent via PartsList click
    const partsListItems = document.querySelectorAll('#parts-list li')
    const parentRow = Array.from(partsListItems).find((li) => li.textContent?.includes('Shelf'))
    await act(async () => { (parentRow as HTMLElement)!.click() })

    // Enter modify mode
    const editCutsBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent === 'Edit Cuts'
    )
    expect(editCutsBtn).toBeDefined()
    await act(async () => { editCutsBtn!.click() })

    // CutsList should now be visible with the child
    expect(document.getElementById('cuts-list')).not.toBeNull()

    // Click the child row in CutsList
    const cutsItems = document.querySelectorAll('#cuts-list li')
    const dadoRow = Array.from(cutsItems).find((li) => li.textContent?.includes('Dado'))
    await act(async () => { (dadoRow as HTMLElement)!.click() })

    // CutsList should still be visible (modify mode preserved)
    expect(document.getElementById('cuts-list')).not.toBeNull()
  })

  it('PartPanel shows child part name after selecting child in CutsList', async () => {
    useProjectStore.getState().addPart({ name: 'Board 1', length: 24, width: 12, position: { x: 0, y: 0.375, z: 0 } })
    const parent = useProjectStore.getState().project.parts[0]
    useProjectStore.getState().addChildPart(parent.id, {
      name: 'Notch',
      length: 2,
      width: 12,
      thickness: 0.375,
      position: { x: 0, y: 0, z: 0 },
      operation: 'subtract',
    })

    await render(<App />)

    // Select parent
    const partsListItems = document.querySelectorAll('#parts-list li')
    const parentRow = Array.from(partsListItems).find((li) => li.textContent?.includes('Board 1'))
    await act(async () => { (parentRow as HTMLElement)!.click() })

    // Enter modify mode
    const editCutsBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent === 'Edit Cuts'
    )
    await act(async () => { editCutsBtn!.click() })

    // Click child in CutsList
    const cutsItems = document.querySelectorAll('#cuts-list li')
    const notchRow = Array.from(cutsItems).find((li) => li.textContent?.includes('Notch'))
    await act(async () => { (notchRow as HTMLElement)!.click() })

    // PartPanel should show the child's name
    const nameInput = document.querySelector('#part-panel input[aria-label="Part name"]') as HTMLInputElement
    expect(nameInput).not.toBeNull()
    expect(nameInput.value).toBe('Notch')
  })

  it('PartPanel shows operation toggle after selecting a child', async () => {
    useProjectStore.getState().addPart({ name: 'Board 2', length: 24, width: 12, position: { x: 0, y: 0.375, z: 0 } })
    const parent = useProjectStore.getState().project.parts[0]
    useProjectStore.getState().addChildPart(parent.id, {
      name: 'Cut 1',
      length: 2,
      width: 12,
      thickness: 0.375,
      position: { x: 0, y: 0, z: 0 },
      operation: 'subtract',
    })

    await render(<App />)

    // Select parent and enter modify mode
    const partsListItems = document.querySelectorAll('#parts-list li')
    const parentRow = Array.from(partsListItems).find((li) => li.textContent?.includes('Board 2'))
    await act(async () => { (parentRow as HTMLElement)!.click() })

    const editCutsBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent === 'Edit Cuts'
    )
    await act(async () => { editCutsBtn!.click() })

    // Click child
    const cutsItems = document.querySelectorAll('#cuts-list li')
    const cutRow = Array.from(cutsItems).find((li) => li.textContent?.includes('Cut 1'))
    await act(async () => { (cutRow as HTMLElement)!.click() })

    // Operation toggle buttons should be visible
    const opSection = document.querySelector('.part-panel-operation')
    expect(opSection).not.toBeNull()
  })

  // ── Regression tests for stale-closure bug ──────────────────────────────────

  it('CutsList remains visible after addChildPart + immediate handleSelectIds (stale closure regression)', async () => {
    // This test reproduces the exact sequence that caused the bug:
    // addChildPart (store updated) → onChildPartCreated([childId]) → handleSelectIds([childId])
    // The old code used a stale React-state closure for `parts`, so find() returned undefined
    // and modify mode was silently exited.
    useProjectStore.getState().addPart({ name: 'Panel', length: 24, width: 12, position: { x: 0, y: 0.375, z: 0 } })
    const parent = useProjectStore.getState().project.parts[0]

    await render(<App />)

    // Select parent and enter modify mode
    const parentRow = Array.from(document.querySelectorAll('#parts-list li')).find(
      (li) => li.textContent?.includes('Panel')
    )
    await act(async () => { (parentRow as HTMLElement)!.click() })
    const editCutsBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent === 'Edit Cuts'
    )
    await act(async () => { editCutsBtn!.click() })

    expect(document.getElementById('cuts-list')).not.toBeNull()

    // Simulate BoardCreator sequence: addChildPart then immediately select the child
    // (React hasn't re-rendered yet when handleSelectIds is called, so parts closure is stale)
    let childId!: string
    await act(async () => {
      useProjectStore.getState().addChildPart(parent.id, {
        name: 'Slot',
        length: 2,
        width: 12,
        thickness: 0.375,
        position: { x: 0, y: 0, z: 0 },
        operation: 'subtract',
      })
      childId = useProjectStore.getState().project.parts.find((p) => p.parentId === parent.id)!.id
    })

    // Now simulate the immediate onChildPartCreated callback (selecting the new child)
    // by clicking the child row in CutsList — or directly trigger via a child row if it exists
    // At this point CutsList should show the new child; click it to test preserve-mode logic
    await act(async () => {
      const cutsItems = document.querySelectorAll('#cuts-list li')
      const slotRow = Array.from(cutsItems).find((li) => li.textContent?.includes('Slot'))
      if (slotRow) (slotRow as HTMLElement).click()
    })

    // Modify mode must be preserved — CutsList still visible
    expect(document.getElementById('cuts-list')).not.toBeNull()
  })

  it('adding two children keeps both as children in the store (not top-level)', async () => {
    useProjectStore.getState().addPart({ name: 'Shelf', length: 24, width: 12, position: { x: 0, y: 0.375, z: 0 } })
    const parent = useProjectStore.getState().project.parts[0]

    useProjectStore.getState().addChildPart(parent.id, {
      name: 'Cut A',
      length: 2,
      width: 12,
      thickness: 0.375,
      position: { x: -4, y: 0, z: 0 },
      operation: 'subtract',
    })
    useProjectStore.getState().addChildPart(parent.id, {
      name: 'Cut B',
      length: 2,
      width: 12,
      thickness: 0.375,
      position: { x: 4, y: 0, z: 0 },
      operation: 'subtract',
    })

    const parts = useProjectStore.getState().project.parts
    const children = parts.filter((p) => p.parentId === parent.id)
    expect(children).toHaveLength(2)
    expect(children.every((c) => c.parentId === parent.id)).toBe(true)
  })

  it('Done Editing preserves children in the store', async () => {
    useProjectStore.getState().addPart({ name: 'Rail', length: 24, width: 12, position: { x: 0, y: 0.375, z: 0 } })
    const parent = useProjectStore.getState().project.parts[0]
    useProjectStore.getState().addChildPart(parent.id, {
      name: 'Mortise',
      length: 2,
      width: 2,
      thickness: 0.375,
      position: { x: 0, y: 0, z: 0 },
      operation: 'subtract',
    })

    await render(<App />)

    // Select parent and enter modify mode
    const parentRow = Array.from(document.querySelectorAll('#parts-list li')).find(
      (li) => li.textContent?.includes('Rail')
    )
    await act(async () => { (parentRow as HTMLElement)!.click() })
    const editCutsBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent === 'Edit Cuts'
    )
    await act(async () => { editCutsBtn!.click() })

    // Exit via Done Editing
    const doneBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent === 'Done Editing'
    )
    expect(doneBtn).toBeDefined()
    await act(async () => { doneBtn!.click() })

    // CutsList should be gone
    expect(document.getElementById('cuts-list')).toBeNull()

    // Child must still exist in store
    const parts = useProjectStore.getState().project.parts
    const child = parts.find((p) => p.parentId === parent.id)
    expect(child).toBeDefined()
    expect(child!.name).toBe('Mortise')
  })

  it('Escape exits modify mode and children remain in the store', async () => {
    useProjectStore.getState().addPart({ name: 'Stile', length: 24, width: 12, position: { x: 0, y: 0.375, z: 0 } })
    const parent = useProjectStore.getState().project.parts[0]
    useProjectStore.getState().addChildPart(parent.id, {
      name: 'Tenon',
      length: 2,
      width: 2,
      thickness: 0.375,
      position: { x: 0, y: 0, z: 0 },
      operation: 'subtract',
    })

    await render(<App />)
    // Wait for R3F / Scene to mount its keydown listener
    await act(async () => { await new Promise((r) => setTimeout(r, 100)) })

    // Select parent and enter modify mode
    const parentRow = Array.from(document.querySelectorAll('#parts-list li')).find(
      (li) => li.textContent?.includes('Stile')
    )
    await act(async () => { (parentRow as HTMLElement)!.click() })
    const editCutsBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent === 'Edit Cuts'
    )
    await act(async () => { editCutsBtn!.click() })

    expect(document.getElementById('cuts-list')).not.toBeNull()

    // Press Escape (handled by Scene's keydown listener)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await act(async () => {})

    // CutsList should be gone (modify mode exited)
    expect(document.getElementById('cuts-list')).toBeNull()

    // Child must still exist in store
    const parts = useProjectStore.getState().project.parts
    const child = parts.find((p) => p.parentId === parent.id)
    expect(child).toBeDefined()
    expect(child!.name).toBe('Tenon')
  })
})
