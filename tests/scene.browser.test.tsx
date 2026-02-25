import { describe, it, expect, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import type { RootState } from '@react-three/fiber'
import * as THREE from 'three'
import Scene from '../src/components/Scene'
import Board from '../src/components/Board'
import { BOARD_THICKNESS } from '../src/utils/constants'
import { useProjectStore } from '../src/stores/projectStore'
import { createProject } from '../src/models/Project'

async function renderInCanvas(children: React.ReactNode, canvasProps = {}) {
  let resolveState: (state: RootState) => void
  const statePromise = new Promise<RootState>((resolve) => { resolveState = resolve })
  await render(
    <Canvas
      camera={{ fov: 60, near: 0.1, far: 100, position: [3, 2, 3] }}
      gl={{ antialias: true }}
      onCreated={(s) => resolveState(s)}
      {...canvasProps}
    >
      {children}
    </Canvas>
  )
  return statePromise
}

describe('App scene setup', () => {
  it('creates a scene with the correct background color', async () => {
    const state = await renderInCanvas(<Scene selectedId={null} onSelectId={() => {}} />)
    expect(state.scene).toBeInstanceOf(THREE.Scene)
    expect((state.scene.background as THREE.Color).getHexString()).toBe('1a1a2e')
  })

  it('configures a perspective camera at the expected position', async () => {
    const state = await renderInCanvas(<Scene selectedId={null} onSelectId={() => {}} />)
    const camera = state.camera as THREE.PerspectiveCamera
    expect(camera).toBeInstanceOf(THREE.PerspectiveCamera)
    expect(camera.fov).toBe(60)
    expect(camera.position.x).toBeCloseTo(3, 1)
    expect(camera.position.y).toBeCloseTo(2, 1)
    expect(camera.position.z).toBeCloseTo(3, 1)
  })

  it('attaches a WebGL canvas to the document', async () => {
    const state = await renderInCanvas(<Scene selectedId={null} onSelectId={() => {}} />)
    const canvas = state.gl.domElement
    expect(canvas.tagName).toBe('CANVAS')
    expect(document.body.contains(canvas)).toBe(true)
  })

  it('sets up orbit controls with damping', async () => {
    const state = await renderInCanvas(<Scene selectedId={null} onSelectId={() => {}} />)
    // OrbitControls with makeDefault registers after onCreated, wait for it
    await new Promise<{ enableDamping: boolean; dampingFactor: number }>((resolve) => {
      const check = () => {
        const controls = state.get().controls as { enableDamping: boolean; dampingFactor: number } | null
        if (controls) resolve(controls)
        else requestAnimationFrame(check)
      }
      check()
    }).then((controls) => {
      expect(controls.enableDamping).toBe(true)
      expect(controls.dampingFactor).toBe(0.08)
    })
  })

  it('includes a grid helper in the scene', async () => {
    const state = await renderInCanvas(<Scene selectedId={null} onSelectId={() => {}} />)
    const grids = state.scene.children.filter(c => c.type === 'GridHelper')
    expect(grids).toHaveLength(1)
  })

  it('includes ambient and directional lights', async () => {
    const state = await renderInCanvas(<Scene selectedId={null} onSelectId={() => {}} />)
    const lights = state.scene.children.filter(c => (c as THREE.Light).isLight)
    expect(lights).toHaveLength(2)

    const ambient = lights.find(l => (l as THREE.AmbientLight).isAmbientLight)
    const directional = lights.find(l => (l as THREE.DirectionalLight).isDirectionalLight)
    expect(ambient).toBeDefined()
    expect(directional).toBeDefined()
    expect(directional!.position.x).toBe(5)
    expect(directional!.position.y).toBe(8)
    expect(directional!.position.z).toBe(4)
  })
})

const boardProps = {
  id: '1', name: 'Test', length: 4, width: 3, thickness: BOARD_THICKNESS,
  position: { x: 1, y: BOARD_THICKNESS / 2, z: 2 },
  rotation: { x: 0, y: 0, z: 0 }, color: '#ff0000',
  isSelected: false, onSelect: () => {},
}

describe('Board component', () => {
  it('creates a board mesh with correct dimensions', async () => {
    const state = await renderInCanvas(<Board {...boardProps} />)
    const meshes = state.scene.children.filter(c => (c as THREE.Mesh).isMesh)
    expect(meshes.length).toBeGreaterThanOrEqual(1)

    const board = meshes[0] as THREE.Mesh
    const params = (board.geometry as THREE.BoxGeometry).parameters
    expect(params.width).toBe(4)
    expect(params.height).toBe(BOARD_THICKNESS)
    expect(params.depth).toBe(3)
  })

  it('positions the board at the given position', async () => {
    const state = await renderInCanvas(
      <Board {...boardProps} length={5} width={3}
             position={{ x: 2.5, y: BOARD_THICKNESS / 2, z: 1.5 }} />
    )
    const board = state.scene.children.find(c => (c as THREE.Mesh).isMesh) as THREE.Mesh
    expect(board.position.x).toBe(2.5)
    expect(board.position.y).toBeCloseTo(BOARD_THICKNESS / 2)
    expect(board.position.z).toBe(1.5)
  })

  it('board has a wireframe edge child', async () => {
    const state = await renderInCanvas(<Board {...boardProps} length={3} width={2} />)
    const board = state.scene.children.find(c => (c as THREE.Mesh).isMesh) as THREE.Mesh
    const wireframes = board.children.filter(c => (c as THREE.LineSegments).isLineSegments)
    expect(wireframes).toHaveLength(1)
  })

  it('unselected board has no extra children beyond the wireframe', async () => {
    const state = await renderInCanvas(<Board {...boardProps} isSelected={false} />)
    const board = state.scene.children.find(c => (c as THREE.Mesh).isMesh) as THREE.Mesh
    expect(board.children).toHaveLength(1) // only the LineSegments wireframe
  })

  it('selected board has additional outline child', async () => {
    const state = await renderInCanvas(<Board {...boardProps} isSelected={true} />)
    const board = state.scene.children.find(c => (c as THREE.Mesh).isMesh) as THREE.Mesh
    expect(board.children.length).toBeGreaterThan(1) // wireframe + Outlines group
  })
})

describe('Delete a Part', () => {
  beforeEach(() => {
    useProjectStore.setState({ project: createProject() })
  })

  it('Delete key with no selection leaves store unchanged', async () => {
    useProjectStore.getState().addPart({
      length: 4, width: 3,
      position: { x: 0, y: BOARD_THICKNESS / 2, z: 0 },
      color: '#ff0000',
    })
    await renderInCanvas(<Scene selectedId={null} onSelectId={() => {}} />)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }))

    expect(useProjectStore.getState().project.parts).toHaveLength(1)
  })

  it('Backspace key with no selection leaves store unchanged', async () => {
    useProjectStore.getState().addPart({
      length: 4, width: 3,
      position: { x: 0, y: BOARD_THICKNESS / 2, z: 0 },
      color: '#ff0000',
    })
    await renderInCanvas(<Scene selectedId={null} onSelectId={() => {}} />)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }))

    expect(useProjectStore.getState().project.parts).toHaveLength(1)
  })
})
