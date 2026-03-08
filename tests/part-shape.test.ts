import { describe, it, expect } from 'vitest'
import { createPart } from '../src/models/Part'
import { serializeProject, deserializeProject, createProject } from '../src/models/Project'

const baseInit = {
  length: 10,
  width: 6,
  position: { x: 0, y: 0, z: 0 },
}

describe('Part shape field', () => {
  it('defaults shape to "box" when not provided', () => {
    const part = createPart(baseInit)
    expect(part.shape).toBe('box')
  })

  it('preserves shape: "ellipse" when provided', () => {
    const part = createPart({ ...baseInit, shape: 'ellipse' })
    expect(part.shape).toBe('ellipse')
  })

  it('preserves shape: "box" when explicitly provided', () => {
    const part = createPart({ ...baseInit, shape: 'box' })
    expect(part.shape).toBe('box')
  })

  it('round-trips shape: "ellipse" through serialize/deserialize', () => {
    const project = createProject()
    const part = createPart({ ...baseInit, shape: 'ellipse' })
    project.parts.push(part)
    const json = serializeProject(project)
    const loaded = deserializeProject(json)
    expect(loaded.parts[0].shape).toBe('ellipse')
  })

  it('old JSON without shape field deserializes with shape as undefined (backwards-compatible)', () => {
    // Simulate a saved project from before shape was added
    const oldProject = {
      id: 'test-id',
      name: 'Old Project',
      parts: [
        {
          id: 'part-1',
          name: 'Board',
          length: 10,
          width: 6,
          thickness: 0.75,
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          color: '#8B6914',
          visible: true,
        },
      ],
      assemblies: [],
      gridSize: 10,
    }
    const loaded = deserializeProject(JSON.stringify(oldProject))
    // shape is undefined — consumers should treat undefined as 'box'
    expect(loaded.parts[0].shape).toBeUndefined()
  })
})
