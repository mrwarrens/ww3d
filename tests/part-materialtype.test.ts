import { describe, it, expect } from 'vitest'
import { createPart } from '../src/models/Part'
import { createProject, serializeProject, deserializeProject } from '../src/models/Project'

describe('Part materialType', () => {
  it('defaults to hardwood', () => {
    const part = createPart({ length: 10, width: 6, position: { x: 0, y: 0, z: 0 } })
    expect(part.materialType).toBe('hardwood')
  })

  it('stores explicit materialType: sheet', () => {
    const part = createPart({ length: 48, width: 24, position: { x: 0, y: 0, z: 0 }, materialType: 'sheet' })
    expect(part.materialType).toBe('sheet')
  })

  it('stores explicit materialType: dimensional', () => {
    const part = createPart({ length: 96, width: 3.5, position: { x: 0, y: 0, z: 0 }, materialType: 'dimensional' })
    expect(part.materialType).toBe('dimensional')
  })

  it('round-trips materialType through serialize/deserialize', () => {
    const project = createProject()
    const part = createPart({ length: 10, width: 6, position: { x: 0, y: 0, z: 0 }, materialType: 'sheet' })
    project.parts.push(part)
    const json = serializeProject(project)
    const loaded = deserializeProject(json)
    expect(loaded.parts[0].materialType).toBe('sheet')
  })

  it('defaults to hardwood when materialType is missing from saved JSON', () => {
    const project = createProject()
    const part = createPart({ length: 10, width: 6, position: { x: 0, y: 0, z: 0 } })
    project.parts.push(part)
    // Strip materialType to simulate an old save file
    const raw = JSON.parse(serializeProject(project))
    delete raw.parts[0].materialType
    const loaded = deserializeProject(JSON.stringify(raw))
    expect(loaded.parts[0].materialType).toBe('hardwood')
  })
})
