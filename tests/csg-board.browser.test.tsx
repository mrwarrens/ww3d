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

async function waitFor(fn: () => void, timeout = 8000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try {
      fn()
      return
    } catch {
      await new Promise((r) => setTimeout(r, 50))
    }
  }
  fn()
}

beforeEach(() => {
  useProjectStore.setState({ project: createProject(), history: [], future: [] })
})

describe('CSG rendering in Board', () => {
  it('renders BoxGeometry when part has no children', async () => {
    useProjectStore.getState().addPart({
      length: 6, width: 4,
      position: { x: 0, y: BOARD_THICKNESS / 2, z: 0 },
    })
    const part = useProjectStore.getState().project.parts[0]

    const state = await renderInCanvas(
      <Board
        {...part}
        isSelected={false}
        onSelect={() => {}}
      />
    )

    // Give R3F time to render
    await new Promise(r => setTimeout(r, 100))

    const mesh = state.scene.children.find(c => (c as THREE.Mesh).isMesh) as THREE.Mesh
    expect(mesh).toBeDefined()
    expect(mesh.geometry.type).toBe('BoxGeometry')
  })

  it('switches to CSG geometry when part has a child', async () => {
    useProjectStore.getState().addPart({
      length: 6, width: 4,
      position: { x: 0, y: BOARD_THICKNESS / 2, z: 0 },
    })
    const parent = useProjectStore.getState().project.parts[0]

    // Add a subtract child (dado cut)
    useProjectStore.getState().addChildPart(parent.id, {
      length: 0.5, width: 4, thickness: 0.375,
      position: { x: 0, y: 0, z: 0 },
      operation: 'subtract',
    })

    const state = await renderInCanvas(
      <Board
        {...parent}
        isSelected={false}
        onSelect={() => {}}
      />
    )

    // Wait for async Manifold WASM load + CSG computation
    await waitFor(() => {
      const mesh = state.scene.children.find(c => (c as THREE.Mesh).isMesh) as THREE.Mesh
      expect(mesh).toBeDefined()
      expect(mesh.geometry.type).not.toBe('BoxGeometry')
    }, 10000)

    const mesh = state.scene.children.find(c => (c as THREE.Mesh).isMesh) as THREE.Mesh
    // CSG result is a non-indexed BufferGeometry with vertex data
    expect(mesh.geometry).toBeInstanceOf(THREE.BufferGeometry)
    expect(mesh.geometry.getAttribute('position')).toBeDefined()
  })

  it('hides edge wireframe when CSG is active', async () => {
    useProjectStore.getState().addPart({
      length: 6, width: 4,
      position: { x: 0, y: BOARD_THICKNESS / 2, z: 0 },
    })
    const parent = useProjectStore.getState().project.parts[0]

    useProjectStore.getState().addChildPart(parent.id, {
      length: 0.5, width: 4, thickness: 0.375,
      position: { x: 0, y: 0, z: 0 },
      operation: 'subtract',
    })

    const state = await renderInCanvas(
      <Board
        {...parent}
        isSelected={false}
        onSelect={() => {}}
      />
    )

    // Wait for CSG computation
    await waitFor(() => {
      const mesh = state.scene.children.find(c => (c as THREE.Mesh).isMesh) as THREE.Mesh
      expect(mesh.geometry.type).not.toBe('BoxGeometry')
    }, 10000)

    const mesh = state.scene.children.find(c => (c as THREE.Mesh).isMesh) as THREE.Mesh
    const wireframes = mesh.children.filter(c => (c as THREE.LineSegments).isLineSegments)
    expect(wireframes).toHaveLength(0)
  })
})
