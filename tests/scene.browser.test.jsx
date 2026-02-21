import { describe, it, expect } from 'vitest'
import { render } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import Scene from '../src/components/Scene'
import Board from '../src/components/Board'
import { BOARD_THICKNESS } from '../src/constants'

async function renderInCanvas(children, canvasProps = {}) {
  let resolveState
  const statePromise = new Promise((resolve) => { resolveState = resolve })
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
    const state = await renderInCanvas(<Scene />)
    expect(state.scene).toBeInstanceOf(THREE.Scene)
    expect(state.scene.background.getHexString()).toBe('1a1a2e')
  })

  it('configures a perspective camera at the expected position', async () => {
    const state = await renderInCanvas(<Scene />)
    const camera = state.camera
    expect(camera).toBeInstanceOf(THREE.PerspectiveCamera)
    expect(camera.fov).toBe(60)
    expect(camera.position.x).toBeCloseTo(3, 1)
    expect(camera.position.y).toBeCloseTo(2, 1)
    expect(camera.position.z).toBeCloseTo(3, 1)
  })

  it('attaches a WebGL canvas to the document', async () => {
    const state = await renderInCanvas(<Scene />)
    const canvas = state.gl.domElement
    expect(canvas.tagName).toBe('CANVAS')
    expect(document.body.contains(canvas)).toBe(true)
  })

  it('sets up orbit controls with damping', async () => {
    const state = await renderInCanvas(<Scene />)
    // OrbitControls with makeDefault registers after onCreated, wait for it
    await new Promise((resolve) => {
      const check = () => {
        const controls = state.get().controls
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
    const state = await renderInCanvas(<Scene />)
    const grids = state.scene.children.filter(c => c.type === 'GridHelper')
    expect(grids).toHaveLength(1)
  })

  it('includes ambient and directional lights', async () => {
    const state = await renderInCanvas(<Scene />)
    const lights = state.scene.children.filter(c => c.isLight)
    expect(lights).toHaveLength(2)

    const ambient = lights.find(l => l.isAmbientLight)
    const directional = lights.find(l => l.isDirectionalLight)
    expect(ambient).toBeDefined()
    expect(directional).toBeDefined()
    expect(directional.position.x).toBe(5)
    expect(directional.position.y).toBe(8)
    expect(directional.position.z).toBe(4)
  })
})

describe('Board component', () => {
  it('creates a board mesh with correct dimensions', async () => {
    const state = await renderInCanvas(
      <Board x={1} z={2} width={4} depth={3} color="#ff0000" />
    )
    const meshes = state.scene.children.filter(c => c.isMesh)
    expect(meshes.length).toBeGreaterThanOrEqual(1)

    const board = meshes[0]
    const params = board.geometry.parameters
    expect(params.width).toBe(4)
    expect(params.height).toBe(BOARD_THICKNESS)
    expect(params.depth).toBe(3)
  })

  it('positions the board centered at (x, BOARD_THICKNESS/2, z)', async () => {
    const state = await renderInCanvas(
      <Board x={2.5} z={1.5} width={5} depth={3} color="#ff0000" />
    )
    const board = state.scene.children.find(c => c.isMesh)
    expect(board.position.x).toBe(2.5)
    expect(board.position.y).toBeCloseTo(BOARD_THICKNESS / 2)
    expect(board.position.z).toBe(1.5)
  })

  it('board has a wireframe edge child', async () => {
    const state = await renderInCanvas(
      <Board x={0} z={0} width={3} depth={2} color="#ff0000" />
    )
    const board = state.scene.children.find(c => c.isMesh)
    const wireframes = board.children.filter(c => c.isLineSegments)
    expect(wireframes).toHaveLength(1)
  })
})
