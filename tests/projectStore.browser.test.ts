import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from '../src/stores/projectStore'

beforeEach(() => {
  useProjectStore.setState({ boards: [] })
})

describe('projectStore', () => {
  it('starts with an empty boards array', () => {
    const { boards } = useProjectStore.getState()
    expect(boards).toEqual([])
  })

  it('addBoard adds a board with all fields and a generated id', () => {
    const { addBoard } = useProjectStore.getState()
    addBoard({ x: 1, z: 2, width: 4, depth: 3, color: '#ff0000' })

    const { boards } = useProjectStore.getState()
    expect(boards).toHaveLength(1)
    expect(boards[0].x).toBe(1)
    expect(boards[0].z).toBe(2)
    expect(boards[0].width).toBe(4)
    expect(boards[0].depth).toBe(3)
    expect(boards[0].color).toBe('#ff0000')
    expect(typeof boards[0].id).toBe('string')
    expect(boards[0].id.length).toBeGreaterThan(0)
  })

  it('addBoard assigns unique ids to each board', () => {
    const { addBoard } = useProjectStore.getState()
    addBoard({ x: 0, z: 0, width: 1, depth: 1, color: '#aaa' })
    addBoard({ x: 1, z: 1, width: 2, depth: 2, color: '#bbb' })

    const { boards } = useProjectStore.getState()
    expect(boards).toHaveLength(2)
    expect(boards[0].id).not.toBe(boards[1].id)
  })

  it('removeBoard removes the board with the given id', () => {
    const { addBoard } = useProjectStore.getState()
    addBoard({ x: 0, z: 0, width: 1, depth: 1, color: '#aaa' })
    addBoard({ x: 1, z: 1, width: 2, depth: 2, color: '#bbb' })

    const id = useProjectStore.getState().boards[0].id
    useProjectStore.getState().removeBoard(id)

    const { boards } = useProjectStore.getState()
    expect(boards).toHaveLength(1)
    expect(boards[0].color).toBe('#bbb')
  })

  it('removeBoard with unknown id leaves boards unchanged', () => {
    const { addBoard } = useProjectStore.getState()
    addBoard({ x: 0, z: 0, width: 1, depth: 1, color: '#aaa' })
    useProjectStore.getState().removeBoard('nonexistent-id')

    const { boards } = useProjectStore.getState()
    expect(boards).toHaveLength(1)
  })
})
