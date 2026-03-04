import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from '../src/stores/projectStore'
import { createProject } from '../src/models/Project'

const baseInit = {
  length: 10,
  width: 6,
  position: { x: 0, y: 0.375, z: 0 },
  color: '#aaaaaa',
}

function addParentAndGetId(): string {
  useProjectStore.getState().addPart(baseInit)
  return useProjectStore.getState().project.parts[0].id
}

beforeEach(() => {
  useProjectStore.setState({ project: createProject(), history: [], future: [] })
})

describe('undo/redo for addChildPart', () => {
  it('undo removes the added child', () => {
    const { addChildPart, undo } = useProjectStore.getState()
    const parentId = addParentAndGetId()

    addChildPart(parentId, {
      length: 2,
      width: 2,
      position: { x: 0, y: 0, z: 0 },
      color: '#ff0000',
      operation: 'subtract',
    })

    expect(useProjectStore.getState().project.parts).toHaveLength(2)

    undo()

    const parts = useProjectStore.getState().project.parts
    expect(parts).toHaveLength(1)
    expect(parts[0].id).toBe(parentId)
  })

  it('redo restores the child after undo', () => {
    const { addChildPart, undo, redo } = useProjectStore.getState()
    const parentId = addParentAndGetId()

    addChildPart(parentId, {
      length: 2,
      width: 2,
      position: { x: 0, y: 0, z: 0 },
      color: '#ff0000',
      operation: 'subtract',
    })

    undo()
    expect(useProjectStore.getState().project.parts).toHaveLength(1)

    redo()
    const parts = useProjectStore.getState().project.parts
    expect(parts).toHaveLength(2)
    expect(parts.some((p) => p.parentId === parentId)).toBe(true)
  })

  it('adding two children and undoing twice returns to no children', () => {
    const { addChildPart, undo } = useProjectStore.getState()
    const parentId = addParentAndGetId()

    addChildPart(parentId, {
      length: 1,
      width: 1,
      position: { x: 0, y: 0, z: 0 },
      color: '#ff0000',
      operation: 'subtract',
    })
    addChildPart(parentId, {
      length: 1,
      width: 1,
      position: { x: 2, y: 0, z: 0 },
      color: '#00ff00',
      operation: 'subtract',
    })

    expect(useProjectStore.getState().project.parts).toHaveLength(3)

    undo()
    expect(useProjectStore.getState().project.parts).toHaveLength(2)

    undo()
    const parts = useProjectStore.getState().project.parts
    expect(parts).toHaveLength(1)
    expect(parts[0].parentId).toBeUndefined()
  })
})

describe('undo/redo for removeChildPart', () => {
  it('undo restores the removed child', () => {
    const { addChildPart, removeChildPart, undo } = useProjectStore.getState()
    const parentId = addParentAndGetId()
    const childId = addChildPart(parentId, {
      length: 2,
      width: 2,
      position: { x: 0, y: 0, z: 0 },
      color: '#ff0000',
      operation: 'subtract',
    })

    removeChildPart(childId)
    expect(useProjectStore.getState().project.parts).toHaveLength(1)

    undo()
    const parts = useProjectStore.getState().project.parts
    expect(parts).toHaveLength(2)
    expect(parts.find((p) => p.id === childId)).toBeDefined()
  })

  it('redo removes the child again after undo', () => {
    const { addChildPart, removeChildPart, undo, redo } = useProjectStore.getState()
    const parentId = addParentAndGetId()
    const childId = addChildPart(parentId, {
      length: 2,
      width: 2,
      position: { x: 0, y: 0, z: 0 },
      color: '#ff0000',
      operation: 'subtract',
    })

    removeChildPart(childId)
    undo()
    expect(useProjectStore.getState().project.parts).toHaveLength(2)

    redo()
    const parts = useProjectStore.getState().project.parts
    expect(parts).toHaveLength(1)
    expect(parts.find((p) => p.id === childId)).toBeUndefined()
  })
})

describe('undo/redo for updatePart on a child', () => {
  it('undo reverts a child dimension change', () => {
    const { addChildPart, updatePart, undo } = useProjectStore.getState()
    const parentId = addParentAndGetId()
    const childId = addChildPart(parentId, {
      length: 2,
      width: 2,
      position: { x: 0, y: 0, z: 0 },
      color: '#ff0000',
      operation: 'subtract',
    })

    updatePart(childId, { length: 4 })
    expect(useProjectStore.getState().project.parts.find((p) => p.id === childId)?.length).toBe(4)

    undo()
    expect(useProjectStore.getState().project.parts.find((p) => p.id === childId)?.length).toBe(2)
  })

  it('redo re-applies a child dimension change', () => {
    const { addChildPart, updatePart, undo, redo } = useProjectStore.getState()
    const parentId = addParentAndGetId()
    const childId = addChildPart(parentId, {
      length: 2,
      width: 2,
      position: { x: 0, y: 0, z: 0 },
      color: '#ff0000',
      operation: 'subtract',
    })

    updatePart(childId, { length: 4 })
    undo()
    expect(useProjectStore.getState().project.parts.find((p) => p.id === childId)?.length).toBe(2)

    redo()
    expect(useProjectStore.getState().project.parts.find((p) => p.id === childId)?.length).toBe(4)
  })

  it('undo does not affect the parent when reverting a child update', () => {
    const { addChildPart, updatePart, undo } = useProjectStore.getState()
    const parentId = addParentAndGetId()
    const childId = addChildPart(parentId, {
      length: 2,
      width: 2,
      position: { x: 0, y: 0, z: 0 },
      color: '#ff0000',
      operation: 'subtract',
    })

    updatePart(childId, { color: '#0000ff' })
    undo()

    const parent = useProjectStore.getState().project.parts.find((p) => p.id === parentId)
    expect(parent?.color).toBe('#aaaaaa')
  })
})
