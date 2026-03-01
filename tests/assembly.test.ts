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
})
