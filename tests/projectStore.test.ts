import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from '../src/stores/projectStore'

const baseInit = {
  length: 4,
  width: 3,
  position: { x: 1, y: 0.375, z: 2 },
  color: '#ff0000',
}

beforeEach(() => {
  useProjectStore.setState({ parts: [] })
})

describe('projectStore', () => {
  it('starts with an empty parts array', () => {
    const { parts } = useProjectStore.getState()
    expect(parts).toEqual([])
  })

  it('addPart adds a part with all fields and a generated id', () => {
    const { addPart } = useProjectStore.getState()
    addPart(baseInit)

    const { parts } = useProjectStore.getState()
    expect(parts).toHaveLength(1)
    expect(parts[0].length).toBe(4)
    expect(parts[0].width).toBe(3)
    expect(parts[0].position).toEqual({ x: 1, y: 0.375, z: 2 })
    expect(parts[0].color).toBe('#ff0000')
    expect(typeof parts[0].id).toBe('string')
    expect(parts[0].id.length).toBeGreaterThan(0)
  })

  it('addPart assigns unique ids to each part', () => {
    const { addPart } = useProjectStore.getState()
    addPart({ length: 1, width: 1, position: { x: 0, y: 0.375, z: 0 }, color: '#aaa' })
    addPart({ length: 2, width: 2, position: { x: 1, y: 0.375, z: 1 }, color: '#bbb' })

    const { parts } = useProjectStore.getState()
    expect(parts).toHaveLength(2)
    expect(parts[0].id).not.toBe(parts[1].id)
  })

  it('removePart removes the part with the given id', () => {
    const { addPart } = useProjectStore.getState()
    addPart({ length: 1, width: 1, position: { x: 0, y: 0.375, z: 0 }, color: '#aaa' })
    addPart({ length: 2, width: 2, position: { x: 1, y: 0.375, z: 1 }, color: '#bbb' })

    const id = useProjectStore.getState().parts[0].id
    useProjectStore.getState().removePart(id)

    const { parts } = useProjectStore.getState()
    expect(parts).toHaveLength(1)
    expect(parts[0].color).toBe('#bbb')
  })

  it('removePart with unknown id leaves parts unchanged', () => {
    const { addPart } = useProjectStore.getState()
    addPart({ length: 1, width: 1, position: { x: 0, y: 0.375, z: 0 }, color: '#aaa' })
    useProjectStore.getState().removePart('nonexistent-id')

    const { parts } = useProjectStore.getState()
    expect(parts).toHaveLength(1)
  })
})
