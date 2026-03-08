import { describe, it, expect, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import type { RootState } from '@react-three/fiber'
import * as THREE from 'three'
import Board from '../src/components/Board'
import { useProjectStore } from '../src/stores/projectStore'
import { createProject } from '../src/models/Project'
import { BOARD_THICKNESS } from '../src/utils/constants'

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

beforeEach(() => {
  useProjectStore.setState({ project: createProject(), history: [], future: [] })
})

describe('ellipse geometry in Board', () => {
  it('renders BoxGeometry when shape is box', async () => {
    useProjectStore.getState().addPart({
      length: 6, width: 4,
      position: { x: 0, y: BOARD_THICKNESS / 2, z: 0 },
    })
    const part = useProjectStore.getState().project.parts[0]

    const state = await renderInCanvas(
      <Board
        {...part}
        shape="box"
        isSelected={false}
        onSelect={() => {}}
      />
    )

    await new Promise(r => setTimeout(r, 100))

    const mesh = state.scene.children.find(c => (c as THREE.Mesh).isMesh) as THREE.Mesh
    expect(mesh).toBeDefined()
    expect(mesh.geometry.type).toBe('BoxGeometry')
  })

  it('does not render BoxGeometry when shape is ellipse', async () => {
    useProjectStore.getState().addPart({
      length: 6, width: 4,
      position: { x: 0, y: BOARD_THICKNESS / 2, z: 0 },
    })
    const part = useProjectStore.getState().project.parts[0]

    const state = await renderInCanvas(
      <Board
        {...part}
        shape="ellipse"
        isSelected={false}
        onSelect={() => {}}
      />
    )

    await new Promise(r => setTimeout(r, 100))

    const mesh = state.scene.children.find(c => (c as THREE.Mesh).isMesh) as THREE.Mesh
    expect(mesh).toBeDefined()
    expect(mesh.geometry.type).not.toBe('BoxGeometry')
  })

  it('ellipse geometry has a valid non-zero vertex count', async () => {
    useProjectStore.getState().addPart({
      length: 6, width: 4,
      position: { x: 0, y: BOARD_THICKNESS / 2, z: 0 },
    })
    const part = useProjectStore.getState().project.parts[0]

    const state = await renderInCanvas(
      <Board
        {...part}
        shape="ellipse"
        isSelected={false}
        onSelect={() => {}}
      />
    )

    await new Promise(r => setTimeout(r, 100))

    const mesh = state.scene.children.find(c => (c as THREE.Mesh).isMesh) as THREE.Mesh
    expect(mesh).toBeDefined()
    expect(mesh.geometry).toBeInstanceOf(THREE.BufferGeometry)
    const posAttr = mesh.geometry.getAttribute('position')
    expect(posAttr).toBeDefined()
    expect(posAttr.count).toBeGreaterThan(0)
  })

  it('ellipse board has an Edges LineSegments child', async () => {
    useProjectStore.getState().addPart({
      length: 6, width: 4,
      position: { x: 0, y: BOARD_THICKNESS / 2, z: 0 },
    })
    const part = useProjectStore.getState().project.parts[0]

    const state = await renderInCanvas(
      <Board
        {...part}
        shape="ellipse"
        isSelected={false}
        onSelect={() => {}}
      />
    )

    await new Promise(r => setTimeout(r, 100))

    const mesh = state.scene.children.find(c => (c as THREE.Mesh).isMesh) as THREE.Mesh
    expect(mesh).toBeDefined()
    // <Edges> from drei renders a LineSegments2 (from three-stdlib), not THREE.LineSegments
    const lineChild = mesh.children.find(c => c.type === 'LineSegments2')
    expect(lineChild).toBeDefined()
  })
})
