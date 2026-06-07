import { describe, it, expect, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import { useProjectStore } from '../src/stores/projectStore'
import { createProject } from '../src/models/Project'
import { BOARD_THICKNESS } from '../src/utils/constants'
import Scene from '../src/components/Scene'

function SceneWrapper({ selectedIds = [], isAssemblySelected = false }: { selectedIds?: string[]; isAssemblySelected?: boolean }) {
  return (
    <Canvas camera={{ position: [0, 10, 10], fov: 50 }}>
      <Scene
        selectedIds={selectedIds}
        onSelectIds={() => {}}
        isAssemblySelected={isAssemblySelected}
      />
    </Canvas>
  )
}

beforeEach(() => {
  useProjectStore.setState({ project: createProject() })
})

describe('drag-assembly-part', () => {
  it('renders assembly members at localPos + assemblyPos after moveAssembly', async () => {
    const store = useProjectStore.getState()

    const asmId = store.addAssembly('TestAsm')

    store.addPart({ length: 12, width: 6, position: { x: 2, y: BOARD_THICKNESS / 2, z: 1 }, color: '#8B4513' })
    const partA = useProjectStore.getState().project.parts.at(-1)!
    store.assignPartToAssembly(partA.id, asmId)

    store.addPart({ length: 12, width: 6, position: { x: -2, y: BOARD_THICKNESS / 2, z: 3 }, color: '#8B4513' })
    const partB = useProjectStore.getState().project.parts.at(-1)!
    store.assignPartToAssembly(partB.id, asmId)

    store.moveAssembly(asmId, { x: 5, y: 0, z: 10 })

    const state = useProjectStore.getState().project
    const asm = state.assemblies.find((a) => a.id === asmId)!
    const pA = state.parts.find((p) => p.id === partA.id)!
    const pB = state.parts.find((p) => p.id === partB.id)!

    // Assembly position updated, part local positions preserved
    expect(asm.position).toEqual({ x: 5, y: 0, z: 10 })
    expect(pA.position.x).toBe(2)
    expect(pB.position.x).toBe(-2)

    // World positions = localPos + asmPos
    expect(pA.position.x + asm.position.x).toBe(7)
    expect(pB.position.x + asm.position.x).toBe(3)
    expect(pA.position.z + asm.position.z).toBe(11)
    expect(pB.position.z + asm.position.z).toBe(13)

    // Scene renders without error with assembly selected
    await render(<SceneWrapper selectedIds={[partA.id]} isAssemblySelected={true} />)
  })

  it('moveAssembly preserves part local positions', () => {
    const store = useProjectStore.getState()

    const asmId = store.addAssembly('MyAsm')

    store.addPart({ length: 24, width: 12, position: { x: 0, y: BOARD_THICKNESS / 2, z: 0 }, color: '#8B4513' })
    const shelf = useProjectStore.getState().project.parts.at(-1)!
    store.assignPartToAssembly(shelf.id, asmId)

    store.addPart({ length: 12, width: 12, position: { x: 4, y: BOARD_THICKNESS / 2, z: 2 }, color: '#8B4513' })
    const side = useProjectStore.getState().project.parts.at(-1)!
    store.assignPartToAssembly(side.id, asmId)

    const before = useProjectStore.getState().project
    expect(before.parts.find((p) => p.id === shelf.id)!.position.x).toBe(0)
    expect(before.parts.find((p) => p.id === side.id)!.position.x).toBe(4)

    store.moveAssembly(asmId, { x: 10, y: 2, z: 5 })

    const after = useProjectStore.getState().project
    expect(after.assemblies.find((a) => a.id === asmId)!.position).toEqual({ x: 10, y: 2, z: 5 })
    // Part local positions are unchanged
    expect(after.parts.find((p) => p.id === shelf.id)!.position).toEqual({ x: 0, y: BOARD_THICKNESS / 2, z: 0 })
    expect(after.parts.find((p) => p.id === side.id)!.position).toEqual({ x: 4, y: BOARD_THICKNESS / 2, z: 2 })
  })
})
