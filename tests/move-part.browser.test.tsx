import { describe, it, expect, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import type { RootState } from '@react-three/fiber'
import * as THREE from 'three'
import Board from '../src/components/Board'
import { BOARD_THICKNESS } from '../src/utils/constants'
import { useProjectStore } from '../src/stores/projectStore'
import { createProject } from '../src/models/Project'

async function renderInCanvas(children: React.ReactNode) {
  let resolveState: (state: RootState) => void
  const statePromise = new Promise<RootState>((resolve) => { resolveState = resolve })
  await render(
    <Canvas
      camera={{ fov: 60, near: 0.1, far: 100, position: [3, 2, 3] }}
      gl={{ antialias: true }}
      onCreated={(s) => resolveState(s)}
    >
      {children}
    </Canvas>
  )
  return statePromise
}

const basePart = {
  id: 'p1', name: 'Shelf', length: 4, width: 3, thickness: BOARD_THICKNESS,
  position: { x: 1, y: BOARD_THICKNESS / 2, z: 2 },
  rotation: { x: 0, y: 0, z: 0 }, color: '#ff0000',
  isSelected: false, onSelect: () => {},
}

describe('Move parts by dragging', () => {
  beforeEach(() => {
    useProjectStore.setState({ project: createProject() })
  })

  it('Board renders at the position provided by props', async () => {
    const state = await renderInCanvas(
      <Board {...basePart} position={{ x: 3, y: BOARD_THICKNESS / 2, z: 4 }} />
    )
    const board = state.scene.children.find(c => (c as THREE.Mesh).isMesh) as THREE.Mesh
    expect(board.position.x).toBe(3)
    expect(board.position.z).toBe(4)
  })

  it('Board renders at updated position after movePart is called on the store', async () => {
    useProjectStore.getState().addPart({
      length: 4, width: 3,
      position: { x: 1, y: BOARD_THICKNESS / 2, z: 2 },
      color: '#ff0000',
    })
    const part = useProjectStore.getState().project.parts[0]

    useProjectStore.getState().movePart(part.id, { x: 5, y: BOARD_THICKNESS / 2, z: 7 })
    const updatedPart = useProjectStore.getState().project.parts[0]

    const state = await renderInCanvas(
      <Board {...updatedPart} isSelected={false} onSelect={() => {}} />
    )
    const board = state.scene.children.find(c => (c as THREE.Mesh).isMesh) as THREE.Mesh
    expect(board.position.x).toBe(5)
    expect(board.position.z).toBe(7)
  })
})
