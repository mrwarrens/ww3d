import { describe, it, expect, beforeEach } from 'vitest'
import { getPartFacePosition, computeConstrainedPosition, propagateConstraints } from '../src/utils/constraints'
import { useProjectStore } from '../src/stores/projectStore'
import type { Part } from '../src/models/Part'

function makePart(overrides: Partial<Part> = {}): Part {
  return {
    id: crypto.randomUUID(),
    name: 'Board',
    length: 10,   // x-axis, half = 5
    width: 4,     // z-axis, half = 2
    thickness: 1, // y-axis, half = 0.5
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    color: '#8B6914',
    visible: true,
    ...overrides,
  }
}

describe('getPartFacePosition', () => {
  const part = makePart({ position: { x: 10, y: 5, z: 3 } })

  it('returns min face on x axis', () => {
    expect(getPartFacePosition(part, 'x', 'min')).toBeCloseTo(10 - 5) // 5
  })
  it('returns center on x axis', () => {
    expect(getPartFacePosition(part, 'x', 'center')).toBeCloseTo(10)
  })
  it('returns max face on x axis', () => {
    expect(getPartFacePosition(part, 'x', 'max')).toBeCloseTo(15)
  })

  it('returns min face on y axis (thickness)', () => {
    expect(getPartFacePosition(part, 'y', 'min')).toBeCloseTo(5 - 0.5) // 4.5
  })
  it('returns center on y axis', () => {
    expect(getPartFacePosition(part, 'y', 'center')).toBeCloseTo(5)
  })
  it('returns max face on y axis', () => {
    expect(getPartFacePosition(part, 'y', 'max')).toBeCloseTo(5.5)
  })

  it('returns min face on z axis (width)', () => {
    expect(getPartFacePosition(part, 'z', 'min')).toBeCloseTo(3 - 2) // 1
  })
  it('returns center on z axis', () => {
    expect(getPartFacePosition(part, 'z', 'center')).toBeCloseTo(3)
  })
  it('returns max face on z axis', () => {
    expect(getPartFacePosition(part, 'z', 'max')).toBeCloseTo(5)
  })
})

describe('computeConstrainedPosition', () => {
  const anchor = makePart({ id: 'anchor', position: { x: 0, y: 0, z: 0 } })
  // length=10, so min=-5, center=0, max=5
  // width=4, so z min=-2, center=0, max=2
  // thickness=1, so y min=-0.5, center=0, max=0.5

  const constrained = makePart({ id: 'constrained', position: { x: 20, y: 10, z: 10 } })

  function makeConstraint(axis: 'x' | 'y' | 'z', anchorFace: 'min' | 'center' | 'max', constrainedFace: 'min' | 'center' | 'max', offset = 0) {
    return {
      id: 'c1',
      anchorPartId: 'anchor',
      constrainedPartId: 'constrained',
      axis,
      anchorFace,
      constrainedFace,
      offset,
    }
  }

  it('flush-min: aligns min faces on x, other axes unchanged', () => {
    const c = makeConstraint('x', 'min', 'min', 0)
    const pos = computeConstrainedPosition(c, anchor, constrained)
    // anchor min x = -5; constrained min x should be -5, so constrained center = -5 + 5 = 0
    expect(pos.x).toBeCloseTo(0)
    expect(pos.y).toBeCloseTo(10) // unchanged
    expect(pos.z).toBeCloseTo(10) // unchanged
  })

  it('flush-max: aligns max faces on x, other axes unchanged', () => {
    const c = makeConstraint('x', 'max', 'max', 0)
    const pos = computeConstrainedPosition(c, anchor, constrained)
    // anchor max x = 5; constrained max x should be 5, so constrained center = 5 - 5 = 0
    expect(pos.x).toBeCloseTo(0)
    expect(pos.y).toBeCloseTo(10)
    expect(pos.z).toBeCloseTo(10)
  })

  it('centered: aligns centers on z, other axes unchanged', () => {
    const c = makeConstraint('z', 'center', 'center', 0)
    const pos = computeConstrainedPosition(c, anchor, constrained)
    // anchor center z = 0; constrained center z = 0
    expect(pos.z).toBeCloseTo(0)
    expect(pos.x).toBeCloseTo(20) // unchanged
    expect(pos.y).toBeCloseTo(10) // unchanged
  })

  it('offset: anchor max + offset = constrained min', () => {
    const c = makeConstraint('x', 'max', 'min', 2)
    const pos = computeConstrainedPosition(c, anchor, constrained)
    // anchor max x = 5, offset = 2; target = 7; constrained min = 7 → center = 7 + 5 = 12
    expect(pos.x).toBeCloseTo(12)
    expect(pos.y).toBeCloseTo(10)
    expect(pos.z).toBeCloseTo(10)
  })
})

describe('propagateConstraints', () => {
  it('re-applies a single constraint when the anchor part changes', () => {
    const anchor = makePart({ id: 'a', position: { x: 0, y: 0, z: 0 } })
    const constrained = makePart({ id: 'b', position: { x: 20, y: 0, z: 0 } })
    const constraint = {
      id: 'c1',
      anchorPartId: 'a',
      constrainedPartId: 'b',
      axis: 'x' as const,
      anchorFace: 'max' as const,
      constrainedFace: 'min' as const,
      offset: 0,
    }
    // Move anchor to x=10; anchor max x = 10 + 5 = 15; constrained min x = 15 → center = 20
    const movedAnchor = { ...anchor, position: { x: 10, y: 0, z: 0 } }
    const result = propagateConstraints([movedAnchor, constrained], [constraint], 'a')
    const resultB = result.find((p) => p.id === 'b')!
    expect(resultB.position.x).toBeCloseTo(20) // center = 15 + 5 = 20
  })

  it('propagates a chain: A constrains B, B constrains C', () => {
    const a = makePart({ id: 'a', position: { x: 0, y: 0, z: 0 } })
    const b = makePart({ id: 'b', position: { x: 100, y: 0, z: 0 } })
    const c = makePart({ id: 'c', position: { x: 200, y: 0, z: 0 } })
    // A max → B min (flush, no gap); then B max → C min (flush, no gap)
    const c1 = { id: 'c1', anchorPartId: 'a', constrainedPartId: 'b', axis: 'x' as const, anchorFace: 'max' as const, constrainedFace: 'min' as const, offset: 0 }
    const c2 = { id: 'c2', anchorPartId: 'b', constrainedPartId: 'c', axis: 'x' as const, anchorFace: 'max' as const, constrainedFace: 'min' as const, offset: 0 }
    // Move A to x=10; A max = 15; B min = 15 → B center = 20; B max = 25; C min = 25 → C center = 30
    const movedA = { ...a, position: { x: 10, y: 0, z: 0 } }
    const result = propagateConstraints([movedA, b, c], [c1, c2], 'a')
    expect(result.find((p) => p.id === 'b')!.position.x).toBeCloseTo(20)
    expect(result.find((p) => p.id === 'c')!.position.x).toBeCloseTo(30)
  })

  it('does not infinite-loop on a cycle (A→B→A)', () => {
    const a = makePart({ id: 'a', position: { x: 0, y: 0, z: 0 } })
    const b = makePart({ id: 'b', position: { x: 20, y: 0, z: 0 } })
    const c1 = { id: 'c1', anchorPartId: 'a', constrainedPartId: 'b', axis: 'x' as const, anchorFace: 'max' as const, constrainedFace: 'min' as const, offset: 0 }
    const c2 = { id: 'c2', anchorPartId: 'b', constrainedPartId: 'a', axis: 'x' as const, anchorFace: 'max' as const, constrainedFace: 'min' as const, offset: 0 }
    // Should not throw or loop indefinitely
    expect(() => propagateConstraints([a, b], [c1, c2], 'a')).not.toThrow()
  })
})

describe('projectStore addConstraint / removeConstraint', () => {
  beforeEach(() => {
    useProjectStore.setState({
      project: {
        id: 'p1',
        name: 'Test',
        parts: [],
        assemblies: [],
        constraints: [],
        gridSize: 10,
      },
      history: [],
      future: [],
    })
  })

  function addTestParts() {
    const anchor: Part = makePart({ id: 'anchor', position: { x: 0, y: 0, z: 0 } })
    const constrained: Part = makePart({ id: 'constrained', position: { x: 20, y: 0, z: 0 } })
    useProjectStore.setState((state) => ({
      project: { ...state.project, parts: [anchor, constrained] },
    }))
    return { anchor, constrained }
  }

  it('adds constraint to project.constraints and moves constrained part', () => {
    const { anchor, constrained } = addTestParts()
    // anchor min x = -5; constrained min x should also be -5 → constrained center x = 0
    useProjectStore.getState().addConstraint({
      anchorPartId: anchor.id,
      constrainedPartId: constrained.id,
      axis: 'x',
      anchorFace: 'min',
      constrainedFace: 'min',
      offset: 0,
    })
    const { project } = useProjectStore.getState()
    expect(project.constraints).toHaveLength(1)
    expect(project.constraints[0].anchorPartId).toBe(anchor.id)
    const movedPart = project.parts.find((p) => p.id === constrained.id)!
    expect(movedPart.position.x).toBeCloseTo(0)
  })

  it('removeConstraint removes the constraint', () => {
    addTestParts()
    useProjectStore.getState().addConstraint({
      anchorPartId: 'anchor',
      constrainedPartId: 'constrained',
      axis: 'x',
      anchorFace: 'min',
      constrainedFace: 'min',
      offset: 0,
    })
    const id = useProjectStore.getState().project.constraints[0].id
    useProjectStore.getState().removeConstraint(id)
    expect(useProjectStore.getState().project.constraints).toHaveLength(0)
  })
})

describe('projectStore movePart propagation', () => {
  beforeEach(() => {
    useProjectStore.setState({
      project: {
        id: 'p1',
        name: 'Test',
        parts: [],
        assemblies: [],
        constraints: [],
        gridSize: 10,
      },
      history: [],
      future: [],
    })
  })

  it('moving an anchor repositions a constrained part', () => {
    const anchor: Part = makePart({ id: 'anchor', position: { x: 0, y: 0, z: 0 } })
    const constrained: Part = makePart({ id: 'constrained', position: { x: 0, y: 0, z: 0 } })
    useProjectStore.setState((state) => ({
      project: {
        ...state.project,
        parts: [anchor, constrained],
        // anchor max → constrained min, flush: when anchor is at x=0, constrained center = 10
        constraints: [{
          id: 'c1',
          anchorPartId: 'anchor',
          constrainedPartId: 'constrained',
          axis: 'x' as const,
          anchorFace: 'max' as const,
          constrainedFace: 'min' as const,
          offset: 0,
        }],
      },
    }))

    // Move anchor to x=10; anchor max = 15; constrained min = 15 → center = 20
    useProjectStore.getState().movePart('anchor', { x: 10, y: 0, z: 0 })
    const { parts } = useProjectStore.getState().project
    expect(parts.find((p) => p.id === 'constrained')!.position.x).toBeCloseTo(20)
  })
})

describe('projectStore updatePart propagation', () => {
  beforeEach(() => {
    useProjectStore.setState({
      project: {
        id: 'p1',
        name: 'Test',
        parts: [],
        assemblies: [],
        constraints: [],
        gridSize: 10,
      },
      history: [],
      future: [],
    })
  })

  it('changing anchor length repositions the constrained part on the constrained axis', () => {
    const anchor: Part = makePart({ id: 'anchor', length: 10, position: { x: 0, y: 0, z: 0 } })
    const constrained: Part = makePart({ id: 'constrained', length: 10, position: { x: 0, y: 0, z: 0 } })
    useProjectStore.setState((state) => ({
      project: {
        ...state.project,
        parts: [anchor, constrained],
        constraints: [{
          id: 'c1',
          anchorPartId: 'anchor',
          constrainedPartId: 'constrained',
          axis: 'x' as const,
          anchorFace: 'max' as const,
          constrainedFace: 'min' as const,
          offset: 0,
        }],
      },
    }))

    // Grow anchor from length=10 to length=20; anchor max = 0 + 10 = 10; constrained min = 10 → center = 15
    useProjectStore.getState().updatePart('anchor', { length: 20 })
    const { parts } = useProjectStore.getState().project
    expect(parts.find((p) => p.id === 'constrained')!.position.x).toBeCloseTo(15)
  })
})
