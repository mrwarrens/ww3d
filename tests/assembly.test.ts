import { describe, it, expect } from 'vitest'
import { createAssembly } from '../src/models/Assembly'
import { createProject, deserializeProject } from '../src/models/Project'

describe('createAssembly', () => {
  it('returns an object with the given name', () => {
    const a = createAssembly('Cabinet')
    expect(a.name).toBe('Cabinet')
  })

  it('returns an object with a string id', () => {
    const a = createAssembly('Cabinet')
    expect(typeof a.id).toBe('string')
    expect(a.id.length).toBeGreaterThan(0)
  })

  it('returns unique ids for each call', () => {
    const a1 = createAssembly('A')
    const a2 = createAssembly('B')
    expect(a1.id).not.toBe(a2.id)
  })

  it('returns a position of { x: 0, y: 0, z: 0 }', () => {
    const a = createAssembly('Shelf Unit')
    expect(a.position).toEqual({ x: 0, y: 0, z: 0 })
  })
})

describe('createProject', () => {
  it('initialises assemblies as an empty array', () => {
    const project = createProject()
    expect(project.assemblies).toEqual([])
  })
})

describe('deserializeProject', () => {
  it('sets assemblies to [] when field is absent from JSON', () => {
    const json = JSON.stringify({ id: 'x', name: 'Old', parts: [], gridSize: 10 })
    const project = deserializeProject(json)
    expect(project.assemblies).toEqual([])
  })

  it('preserves assemblies when present in JSON', () => {
    const assembly = { id: 'a1', name: 'Frame', position: { x: 0, y: 0, z: 0 } }
    const json = JSON.stringify({ id: 'x', name: 'New', parts: [], assemblies: [assembly], gridSize: 10 })
    const project = deserializeProject(json)
    expect(project.assemblies).toHaveLength(1)
    expect(project.assemblies[0].name).toBe('Frame')
  })

  it('migrates old project (no schemaVersion): member part positions become local', () => {
    const assembly = { id: 'a1', name: 'Cabinet', position: { x: 3, y: 0, z: 4 }, visible: true }
    const part = {
      id: 'p1', name: 'Shelf', length: 12, width: 6, thickness: 0.75,
      position: { x: 5, y: 0.375, z: 7 }, rotation: { x: 0, y: 0, z: 0 },
      color: '#fff', visible: true, assemblyId: 'a1',
    }
    const json = JSON.stringify({ id: 'proj', name: 'Old Project', parts: [part], assemblies: [assembly], gridSize: 10 })
    const project = deserializeProject(json)
    expect(project.parts[0].position).toEqual({ x: 2, y: 0.375, z: 3 }) // {5,0.375,7} - {3,0,4}
  })

  it('does not re-migrate a project with schemaVersion: 1', () => {
    const assembly = { id: 'a1', name: 'Cabinet', position: { x: 3, y: 0, z: 4 }, visible: true }
    const part = {
      id: 'p1', name: 'Shelf', length: 12, width: 6, thickness: 0.75,
      position: { x: 2, y: 0.375, z: 3 }, rotation: { x: 0, y: 0, z: 0 },
      color: '#fff', visible: true, assemblyId: 'a1',
    }
    const json = JSON.stringify({ id: 'proj', name: 'New Project', schemaVersion: 1, parts: [part], assemblies: [assembly], gridSize: 10 })
    const project = deserializeProject(json)
    expect(project.parts[0].position).toEqual({ x: 2, y: 0.375, z: 3 }) // unchanged
  })
})
