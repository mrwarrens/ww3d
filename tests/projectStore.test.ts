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
  useProjectStore.setState({ project: createProject(), history: [], future: [] })
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
    const newProject = { id: 'new-id', name: 'Loaded', parts: [], assemblies: [], gridSize: 10 }
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
    loadProject({ id: 'p1', name: 'Big Project', parts: [], assemblies: [], gridSize: 25 })
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
    loadProject({ id: 'proj-1', name: 'Cabinet', parts: [part], assemblies: [], gridSize: 10 })
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

  describe('undo/redo', () => {
    it('undo does nothing when history is empty', () => {
      useProjectStore.getState().addPart(baseInit)
      const after = useProjectStore.getState().project
      useProjectStore.setState({ history: [] })
      useProjectStore.getState().undo()
      expect(useProjectStore.getState().project).toEqual(after)
    })

    it('redo does nothing when future is empty', () => {
      useProjectStore.getState().addPart(baseInit)
      const after = useProjectStore.getState().project
      useProjectStore.getState().redo()
      expect(useProjectStore.getState().project).toEqual(after)
    })

    it('undo after addPart restores the empty parts list', () => {
      useProjectStore.getState().addPart(baseInit)
      expect(useProjectStore.getState().project.parts).toHaveLength(1)
      useProjectStore.getState().undo()
      expect(useProjectStore.getState().project.parts).toHaveLength(0)
    })

    it('redo after undo re-adds the part', () => {
      useProjectStore.getState().addPart(baseInit)
      useProjectStore.getState().undo()
      useProjectStore.getState().redo()
      expect(useProjectStore.getState().project.parts).toHaveLength(1)
    })

    it('undo after removePart restores the removed part', () => {
      useProjectStore.getState().addPart(baseInit)
      const id = useProjectStore.getState().project.parts[0].id
      useProjectStore.getState().removePart(id)
      expect(useProjectStore.getState().project.parts).toHaveLength(0)
      useProjectStore.getState().undo()
      expect(useProjectStore.getState().project.parts).toHaveLength(1)
    })

    it('undo after movePart restores previous position', () => {
      useProjectStore.getState().addPart(baseInit)
      const id = useProjectStore.getState().project.parts[0].id
      useProjectStore.getState().movePart(id, { x: 9, y: 0.375, z: 9 })
      useProjectStore.getState().undo()
      const part = useProjectStore.getState().project.parts[0]
      expect(part.position).toEqual(baseInit.position)
    })

    it('undo after updatePart restores the previous field value', () => {
      useProjectStore.getState().addPart({ ...baseInit, name: 'Shelf' })
      const id = useProjectStore.getState().project.parts[0].id
      useProjectStore.getState().updatePart(id, { name: 'Top Shelf' })
      useProjectStore.getState().undo()
      expect(useProjectStore.getState().project.parts[0].name).toBe('Shelf')
    })

    it('undo after duplicatePart removes the duplicate', () => {
      useProjectStore.getState().addPart(baseInit)
      const id = useProjectStore.getState().project.parts[0].id
      useProjectStore.getState().duplicatePart(id)
      expect(useProjectStore.getState().project.parts).toHaveLength(2)
      useProjectStore.getState().undo()
      expect(useProjectStore.getState().project.parts).toHaveLength(1)
    })

    it('undo after togglePartVisibility restores previous visibility', () => {
      useProjectStore.getState().addPart(baseInit)
      const id = useProjectStore.getState().project.parts[0].id
      useProjectStore.getState().togglePartVisibility(id)
      expect(useProjectStore.getState().project.parts[0].visible).toBe(false)
      useProjectStore.getState().undo()
      expect(useProjectStore.getState().project.parts[0].visible).toBe(true)
    })

    it('undo after setGridSize restores previous grid size', () => {
      const original = useProjectStore.getState().project.gridSize
      useProjectStore.getState().setGridSize(original + 10)
      useProjectStore.getState().undo()
      expect(useProjectStore.getState().project.gridSize).toBe(original)
    })

    it('multiple undos step back through history correctly', () => {
      useProjectStore.getState().addPart(baseInit)
      useProjectStore.getState().addPart(baseInit)
      useProjectStore.getState().addPart(baseInit)
      expect(useProjectStore.getState().project.parts).toHaveLength(3)
      useProjectStore.getState().undo()
      expect(useProjectStore.getState().project.parts).toHaveLength(2)
      useProjectStore.getState().undo()
      expect(useProjectStore.getState().project.parts).toHaveLength(1)
      useProjectStore.getState().undo()
      expect(useProjectStore.getState().project.parts).toHaveLength(0)
    })

    it('a new mutation clears the redo stack', () => {
      useProjectStore.getState().addPart(baseInit)
      useProjectStore.getState().undo()
      expect(useProjectStore.getState().future).toHaveLength(1)
      useProjectStore.getState().addPart(baseInit)
      expect(useProjectStore.getState().future).toHaveLength(0)
    })

    it('loadProject clears both history and future', () => {
      useProjectStore.getState().addPart(baseInit)
      useProjectStore.getState().addPart(baseInit)
      useProjectStore.getState().undo()
      // After two adds and one undo: history has 1 entry, future has 1 entry
      expect(useProjectStore.getState().history.length).toBeGreaterThan(0)
      expect(useProjectStore.getState().future.length).toBeGreaterThan(0)
      useProjectStore.getState().loadProject(createProject())
      expect(useProjectStore.getState().history).toHaveLength(0)
      expect(useProjectStore.getState().future).toHaveLength(0)
    })
  })

  describe('addAssembly', () => {
    it('appends an assembly with the given name', () => {
      const id = useProjectStore.getState().addAssembly('Cabinet')
      const { assemblies } = useProjectStore.getState().project
      expect(assemblies).toHaveLength(1)
      expect(assemblies[0].name).toBe('Cabinet')
      expect(assemblies[0].id).toBe(id)
    })

    it('returns the new assembly id', () => {
      const id = useProjectStore.getState().addAssembly('Shelf')
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('pushes to undo history; undo removes the assembly', () => {
      useProjectStore.getState().addAssembly('Frame')
      expect(useProjectStore.getState().project.assemblies).toHaveLength(1)
      useProjectStore.getState().undo()
      expect(useProjectStore.getState().project.assemblies).toHaveLength(0)
    })
  })

  describe('moveAssembly', () => {
    it('updates assembly position', () => {
      const id = useProjectStore.getState().addAssembly('Cabinet')
      useProjectStore.getState().moveAssembly(id, { x: 5, y: 0, z: 3 })
      const assembly = useProjectStore.getState().project.assemblies[0]
      expect(assembly.position).toEqual({ x: 5, y: 0, z: 3 })
    })

    it('shifts all member parts by the delta', () => {
      const id = useProjectStore.getState().addAssembly('Cabinet')
      useProjectStore.getState().addPart({ ...baseInit, position: { x: 1, y: 0.375, z: 2 } })
      const partId = useProjectStore.getState().project.parts[0].id
      // assign part to assembly via direct setState (no history push)
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: state.project.parts.map((p) =>
            p.id === partId ? { ...p, assemblyId: id } : p
          ),
        },
      }))
      // assembly starts at {x:0,y:0,z:0}; move to {x:5,y:0,z:0} → delta x+5
      useProjectStore.getState().moveAssembly(id, { x: 5, y: 0, z: 0 })
      const part = useProjectStore.getState().project.parts[0]
      expect(part.position.x).toBe(6)
      expect(part.position.z).toBe(2)
    })

    it('does not move parts that belong to a different assembly', () => {
      const id1 = useProjectStore.getState().addAssembly('A')
      const id2 = useProjectStore.getState().addAssembly('B')
      useProjectStore.getState().addPart({ ...baseInit, position: { x: 0, y: 0.375, z: 0 } })
      const partId = useProjectStore.getState().project.parts[0].id
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: state.project.parts.map((p) =>
            p.id === partId ? { ...p, assemblyId: id2 } : p
          ),
        },
      }))
      useProjectStore.getState().moveAssembly(id1, { x: 10, y: 0, z: 10 })
      const part = useProjectStore.getState().project.parts[0]
      expect(part.position).toEqual({ x: 0, y: 0.375, z: 0 })
    })

    it('pushes to undo history; undo restores previous positions', () => {
      const id = useProjectStore.getState().addAssembly('Frame')
      useProjectStore.getState().addPart({ ...baseInit, position: { x: 1, y: 0.375, z: 2 } })
      const partId = useProjectStore.getState().project.parts[0].id
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          parts: state.project.parts.map((p) =>
            p.id === partId ? { ...p, assemblyId: id } : p
          ),
        },
        history: [],
        future: [],
      }))
      useProjectStore.getState().moveAssembly(id, { x: 5, y: 0, z: 5 })
      useProjectStore.getState().undo()
      const part = useProjectStore.getState().project.parts[0]
      expect(part.position.x).toBe(1)
      expect(part.position.z).toBe(2)
      const assembly = useProjectStore.getState().project.assemblies[0]
      expect(assembly.position).toEqual({ x: 0, y: 0, z: 0 })
    })
  })
})
