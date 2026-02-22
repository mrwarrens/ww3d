import { describe, it, expect } from 'vitest'
import { createProject, serializeProject, deserializeProject } from '../src/models/Project'
import { createPart } from '../src/models/Part'

describe('createProject', () => {
  it('returns a project with all required fields', () => {
    const project = createProject()
    expect(project).toHaveProperty('id')
    expect(project).toHaveProperty('name')
    expect(project).toHaveProperty('parts')
  })

  it('defaults name to "Untitled Project"', () => {
    expect(createProject().name).toBe('Untitled Project')
  })

  it('uses provided name when given', () => {
    expect(createProject('Bookshelf').name).toBe('Bookshelf')
  })

  it('starts with an empty parts array', () => {
    expect(createProject().parts).toEqual([])
  })

  it('generates a non-empty string id', () => {
    const { id } = createProject()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('generates unique ids for separate calls', () => {
    expect(createProject().id).not.toBe(createProject().id)
  })
})

describe('serializeProject / deserializeProject', () => {
  it('round-trips a project with all fields preserved', () => {
    const original = createProject('Workbench')
    const restored = deserializeProject(serializeProject(original))
    expect(restored).toEqual(original)
  })

  it('preserves parts array through round-trip', () => {
    const project = createProject('Cabinet')
    project.parts.push(
      createPart({ length: 12, width: 6, position: { x: 0, y: 0.375, z: 0 } })
    )
    const restored = deserializeProject(serializeProject(project))
    expect(restored.parts).toHaveLength(1)
    expect(restored.parts[0].length).toBe(12)
    expect(restored.parts[0].width).toBe(6)
  })
})
