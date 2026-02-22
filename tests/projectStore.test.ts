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
    const newProject = { id: 'new-id', name: 'Loaded', parts: [] }
    loadProject(newProject)
    const { project } = useProjectStore.getState()
    expect(project.id).toBe('new-id')
    expect(project.name).toBe('Loaded')
    expect(project.parts).toEqual([])
  })

  it('loadProject replaces parts with the loaded project parts', () => {
    const { loadProject } = useProjectStore.getState()
    const part = { id: 'p1', name: 'Shelf', length: 12, width: 6, thickness: 0.75,
                   position: { x: 0, y: 0.375, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, color: '#fff' }
    loadProject({ id: 'proj-1', name: 'Cabinet', parts: [part] })
    const { project } = useProjectStore.getState()
    expect(project.parts).toHaveLength(1)
    expect(project.parts[0].name).toBe('Shelf')
  })
})
