import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from '../src/stores/projectStore'
import { createProject } from '../src/models/Project'

const baseInit = {
  length: 4,
  width: 3,
  position: { x: 1, y: 0.375, z: 2 },
  color: '#ff0000',
}

beforeEach(() => {
  useProjectStore.setState({ project: createProject() })
})

describe('projectStore', () => {
  it('starts with an empty parts array', () => {
    const { project } = useProjectStore.getState()
    expect(project.parts).toEqual([])
  })

  it('starts with the default project name', () => {
    const { project } = useProjectStore.getState()
    expect(project.name).toBe('Untitled Project')
  })

  it('addPart adds a part with all fields and a generated id', () => {
    const { addPart } = useProjectStore.getState()
    addPart(baseInit)

    const { project } = useProjectStore.getState()
    expect(project.parts).toHaveLength(1)
    expect(project.parts[0].length).toBe(4)
    expect(project.parts[0].width).toBe(3)
    expect(project.parts[0].position).toEqual({ x: 1, y: 0.375, z: 2 })
    expect(project.parts[0].color).toBe('#ff0000')
    expect(typeof project.parts[0].id).toBe('string')
    expect(project.parts[0].id.length).toBeGreaterThan(0)
  })

  it('addPart assigns unique ids to each part', () => {
    const { addPart } = useProjectStore.getState()
    addPart({ length: 1, width: 1, position: { x: 0, y: 0.375, z: 0 }, color: '#aaa' })
    addPart({ length: 2, width: 2, position: { x: 1, y: 0.375, z: 1 }, color: '#bbb' })

    const { project } = useProjectStore.getState()
    expect(project.parts).toHaveLength(2)
    expect(project.parts[0].id).not.toBe(project.parts[1].id)
  })

  it('removePart removes the part with the given id', () => {
    const { addPart } = useProjectStore.getState()
    addPart({ length: 1, width: 1, position: { x: 0, y: 0.375, z: 0 }, color: '#aaa' })
    addPart({ length: 2, width: 2, position: { x: 1, y: 0.375, z: 1 }, color: '#bbb' })

    const id = useProjectStore.getState().project.parts[0].id
    useProjectStore.getState().removePart(id)

    const { project } = useProjectStore.getState()
    expect(project.parts).toHaveLength(1)
    expect(project.parts[0].color).toBe('#bbb')
  })

  it('removePart with unknown id leaves parts unchanged', () => {
    const { addPart } = useProjectStore.getState()
    addPart({ length: 1, width: 1, position: { x: 0, y: 0.375, z: 0 }, color: '#aaa' })
    useProjectStore.getState().removePart('nonexistent-id')

    const { project } = useProjectStore.getState()
    expect(project.parts).toHaveLength(1)
  })

  it('setProjectName updates the project name', () => {
    useProjectStore.getState().setProjectName('Bookshelf')
    expect(useProjectStore.getState().project.name).toBe('Bookshelf')
  })

  it('addPart auto-names the first part "Board 1"', () => {
    useProjectStore.getState().addPart(baseInit)
    expect(useProjectStore.getState().project.parts[0].name).toBe('Board 1')
  })

  it('addPart auto-names subsequent parts sequentially', () => {
    const { addPart } = useProjectStore.getState()
    addPart(baseInit)
    addPart(baseInit)
    const { parts } = useProjectStore.getState().project
    expect(parts[0].name).toBe('Board 1')
    expect(parts[1].name).toBe('Board 2')
  })

  it('addPart preserves explicit name when provided', () => {
    useProjectStore.getState().addPart({ ...baseInit, name: 'Shelf' })
    expect(useProjectStore.getState().project.parts[0].name).toBe('Shelf')
  })

  it('loadProject replaces the current project', () => {
    useProjectStore.getState().addPart(baseInit)
    const { loadProject } = useProjectStore.getState()
    const newProject = { id: 'new-id', name: 'Loaded', parts: [], gridSize: 10 }
    loadProject(newProject)
    const { project } = useProjectStore.getState()
    expect(project.id).toBe('new-id')
    expect(project.name).toBe('Loaded')
    expect(project.parts).toEqual([])
  })

  it('setGridSize updates project.gridSize', () => {
    useProjectStore.getState().setGridSize(20)
    expect(useProjectStore.getState().project.gridSize).toBe(20)
  })

  it('setGridSize leaves all other project fields unchanged', () => {
    useProjectStore.getState().addPart(baseInit)
    const before = useProjectStore.getState().project
    useProjectStore.getState().setGridSize(15)
    const after = useProjectStore.getState().project
    expect(after.id).toBe(before.id)
    expect(after.name).toBe(before.name)
    expect(after.parts).toEqual(before.parts)
    expect(after.gridSize).toBe(15)
  })

  it('loadProject restores gridSize from the loaded project', () => {
    const { loadProject } = useProjectStore.getState()
    loadProject({ id: 'p1', name: 'Big Project', parts: [], gridSize: 25 })
    expect(useProjectStore.getState().project.gridSize).toBe(25)
  })

  it('movePart updates the position of the matching part', () => {
    const { addPart } = useProjectStore.getState()
    addPart({ length: 4, width: 3, position: { x: 1, y: 0.375, z: 2 }, color: '#f00' })
    const id = useProjectStore.getState().project.parts[0].id

    useProjectStore.getState().movePart(id, { x: 5, y: 0.375, z: 6 })

    const part = useProjectStore.getState().project.parts[0]
    expect(part.position).toEqual({ x: 5, y: 0.375, z: 6 })
  })

  it('movePart leaves other fields on the part unchanged', () => {
    const { addPart } = useProjectStore.getState()
    addPart({ length: 4, width: 3, position: { x: 1, y: 0.375, z: 2 }, color: '#f00', name: 'Shelf' })
    const id = useProjectStore.getState().project.parts[0].id

    useProjectStore.getState().movePart(id, { x: 5, y: 0.375, z: 6 })

    const part = useProjectStore.getState().project.parts[0]
    expect(part.name).toBe('Shelf')
    expect(part.length).toBe(4)
    expect(part.width).toBe(3)
    expect(part.color).toBe('#f00')
  })

  it('movePart only updates the targeted part when multiple parts exist', () => {
    const { addPart } = useProjectStore.getState()
    addPart({ length: 4, width: 3, position: { x: 0, y: 0.375, z: 0 }, color: '#f00' })
    addPart({ length: 2, width: 2, position: { x: 1, y: 0.375, z: 1 }, color: '#00f' })
    const id = useProjectStore.getState().project.parts[0].id

    useProjectStore.getState().movePart(id, { x: 9, y: 0.375, z: 9 })

    const parts = useProjectStore.getState().project.parts
    expect(parts[0].position).toEqual({ x: 9, y: 0.375, z: 9 })
    expect(parts[1].position).toEqual({ x: 1, y: 0.375, z: 1 })
  })

  it('updatePart changes the named field on the matching part', () => {
    const { addPart } = useProjectStore.getState()
    addPart({ length: 4, width: 3, position: { x: 0, y: 0.375, z: 0 }, color: '#f00', name: 'Shelf' })
    const id = useProjectStore.getState().project.parts[0].id

    useProjectStore.getState().updatePart(id, { name: 'Top Shelf', length: 36 })

    const part = useProjectStore.getState().project.parts[0]
    expect(part.name).toBe('Top Shelf')
    expect(part.length).toBe(36)
  })

  it('updatePart does not modify other parts', () => {
    const { addPart } = useProjectStore.getState()
    addPart({ length: 4, width: 3, position: { x: 0, y: 0.375, z: 0 }, color: '#f00' })
    addPart({ length: 2, width: 2, position: { x: 1, y: 0.375, z: 1 }, color: '#00f' })
    const id = useProjectStore.getState().project.parts[0].id

    useProjectStore.getState().updatePart(id, { length: 99 })

    const parts = useProjectStore.getState().project.parts
    expect(parts[0].length).toBe(99)
    expect(parts[1].length).toBe(2)
  })

  it('updatePart with unknown id leaves parts unchanged', () => {
    const { addPart } = useProjectStore.getState()
    addPart({ length: 4, width: 3, position: { x: 0, y: 0.375, z: 0 }, color: '#f00', name: 'Shelf' })

    useProjectStore.getState().updatePart('nonexistent-id', { name: 'Ghost' })

    const parts = useProjectStore.getState().project.parts
    expect(parts[0].name).toBe('Shelf')
  })

  it('updatePart with rotation updates the matching part rotation', () => {
    const { addPart } = useProjectStore.getState()
    addPart({ length: 4, width: 3, position: { x: 0, y: 0.375, z: 0 }, color: '#f00' })
    const id = useProjectStore.getState().project.parts[0].id

    const newRotation = { x: Math.PI / 2, y: 0, z: 0 }
    useProjectStore.getState().updatePart(id, { rotation: newRotation })

    const part = useProjectStore.getState().project.parts[0]
    expect(part.rotation).toEqual(newRotation)
  })

  it('updatePart with rotation does not affect other parts', () => {
    const { addPart } = useProjectStore.getState()
    addPart({ length: 4, width: 3, position: { x: 0, y: 0.375, z: 0 }, color: '#f00' })
    addPart({ length: 2, width: 2, position: { x: 1, y: 0.375, z: 1 }, color: '#00f' })
    const id = useProjectStore.getState().project.parts[0].id

    useProjectStore.getState().updatePart(id, { rotation: { x: Math.PI / 4, y: 0, z: 0 } })

    const parts = useProjectStore.getState().project.parts
    expect(parts[0].rotation.x).toBeCloseTo(Math.PI / 4)
    expect(parts[1].rotation).toEqual({ x: 0, y: 0, z: 0 })
  })

  it('duplicatePart creates a second part with a different id', () => {
    useProjectStore.getState().addPart(baseInit)
    const original = useProjectStore.getState().project.parts[0]

    const newId = useProjectStore.getState().duplicatePart(original.id)

    const { parts } = useProjectStore.getState().project
    expect(parts).toHaveLength(2)
    expect(newId).not.toBeNull()
    expect(newId).not.toBe(original.id)
    expect(parts[1].id).toBe(newId)
  })

  it('duplicatePart preserves dimensions, color, rotation, and name', () => {
    useProjectStore.getState().addPart({ ...baseInit, name: 'Shelf' })
    const original = useProjectStore.getState().project.parts[0]

    useProjectStore.getState().duplicatePart(original.id)

    const copy = useProjectStore.getState().project.parts[1]
    expect(copy.length).toBe(original.length)
    expect(copy.width).toBe(original.width)
    expect(copy.thickness).toBe(original.thickness)
    expect(copy.color).toBe(original.color)
    expect(copy.rotation).toEqual(original.rotation)
    expect(copy.name).toBe(original.name)
  })

  it('duplicatePart offsets position by x+1 and z+1', () => {
    useProjectStore.getState().addPart(baseInit)
    const original = useProjectStore.getState().project.parts[0]

    useProjectStore.getState().duplicatePart(original.id)

    const copy = useProjectStore.getState().project.parts[1]
    expect(copy.position.x).toBe(original.position.x + 1)
    expect(copy.position.z).toBe(original.position.z + 1)
    expect(copy.position.y).toBe(original.position.y)
  })

  it('duplicatePart with unknown id returns null and leaves parts unchanged', () => {
    useProjectStore.getState().addPart(baseInit)

    const result = useProjectStore.getState().duplicatePart('nonexistent-id')

    expect(result).toBeNull()
    expect(useProjectStore.getState().project.parts).toHaveLength(1)
  })

  it('loadProject replaces parts with the loaded project parts', () => {
    const { loadProject } = useProjectStore.getState()
    const part = { id: 'p1', name: 'Shelf', length: 12, width: 6, thickness: 0.75,
                   position: { x: 0, y: 0.375, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, color: '#fff', visible: true }
    loadProject({ id: 'proj-1', name: 'Cabinet', parts: [part], gridSize: 10 })
    const { project } = useProjectStore.getState()
    expect(project.parts).toHaveLength(1)
    expect(project.parts[0].name).toBe('Shelf')
  })

  it('newly created parts default to visible: true', () => {
    useProjectStore.getState().addPart(baseInit)
    const part = useProjectStore.getState().project.parts[0]
    expect(part.visible).toBe(true)
  })

  it('togglePartVisibility hides a visible part', () => {
    useProjectStore.getState().addPart(baseInit)
    const id = useProjectStore.getState().project.parts[0].id

    useProjectStore.getState().togglePartVisibility(id)

    expect(useProjectStore.getState().project.parts[0].visible).toBe(false)
  })

  it('togglePartVisibility shows a hidden part', () => {
    useProjectStore.getState().addPart(baseInit)
    const id = useProjectStore.getState().project.parts[0].id
    useProjectStore.getState().togglePartVisibility(id)

    useProjectStore.getState().togglePartVisibility(id)

    expect(useProjectStore.getState().project.parts[0].visible).toBe(true)
  })

  it('togglePartVisibility does not affect other parts', () => {
    const { addPart } = useProjectStore.getState()
    addPart(baseInit)
    addPart(baseInit)
    const parts = useProjectStore.getState().project.parts
    const id = parts[0].id

    useProjectStore.getState().togglePartVisibility(id)

    const after = useProjectStore.getState().project.parts
    expect(after[0].visible).toBe(false)
    expect(after[1].visible).toBe(true)
  })

  it('updatePart with color updates the matching part color', () => {
    const { addPart } = useProjectStore.getState()
    addPart({ length: 4, width: 3, position: { x: 0, y: 0.375, z: 0 }, color: '#ff0000' })
    const id = useProjectStore.getState().project.parts[0].id

    useProjectStore.getState().updatePart(id, { color: '#0000ff' })

    const part = useProjectStore.getState().project.parts[0]
    expect(part.color).toBe('#0000ff')
  })

  it('updatePart with color does not affect other parts', () => {
    const { addPart } = useProjectStore.getState()
    addPart({ length: 4, width: 3, position: { x: 0, y: 0.375, z: 0 }, color: '#ff0000' })
    addPart({ length: 2, width: 2, position: { x: 1, y: 0.375, z: 1 }, color: '#00ff00' })
    const id = useProjectStore.getState().project.parts[0].id

    useProjectStore.getState().updatePart(id, { color: '#ffffff' })

    const parts = useProjectStore.getState().project.parts
    expect(parts[0].color).toBe('#ffffff')
    expect(parts[1].color).toBe('#00ff00')
  })
})
