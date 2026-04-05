import { describe, it, expect, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import type { RootState } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import Scene from '../src/components/Scene'
import { CAMERA_PRESETS } from '../src/utils/constants'
import { useProjectStore } from '../src/stores/projectStore'
import { createPart } from '../src/models/Part'

function resetStore() {
  useProjectStore.getState().loadProject({
    id: 'test', name: 'test', gridSize: 10, assemblies: [], parts: [],
    cutListSettings: { sheetGoods: {}, hardwood: {}, dimensional: {} },
  })
}

async function renderSceneInCanvas(
  cameraPresetRef?: React.MutableRefObject<((name: keyof typeof CAMERA_PRESETS) => void) | null>,
  frameAllRef?: React.MutableRefObject<(() => void) | null>,
) {
  let resolveState: (state: RootState) => void
  const statePromise = new Promise<RootState>((resolve) => { resolveState = resolve })
  await render(
    <Canvas
      camera={{ fov: 60, near: 0.1, far: 200, position: [3, 2, 3] }}
      gl={{ antialias: true }}
      onCreated={(s) => resolveState(s)}
    >
      <Scene
        selectedIds={[]}
        onSelectIds={() => {}}
        cameraPresetRef={cameraPresetRef}
        frameAllRef={frameAllRef}
      />
    </Canvas>
  )
  return statePromise
}

async function waitForControls(state: RootState): Promise<OrbitControlsImpl> {
  return new Promise((resolve) => {
    const check = () => {
      const controls = state.get().controls as OrbitControlsImpl | null
      if (controls) resolve(controls)
      else requestAnimationFrame(check)
    }
    check()
  })
}

describe('Camera presets via goToPreset — direction invariants', () => {
  it('front preset positions camera so Z dominates over X', async () => {
    const presetRef = { current: null } as React.MutableRefObject<((name: keyof typeof CAMERA_PRESETS) => void) | null>
    const state = await renderSceneInCanvas(presetRef)
    await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    presetRef.current?.('front')

    const cam = state.camera
    expect(Math.abs(cam.position.z)).toBeGreaterThan(Math.abs(cam.position.x))
    expect(cam.position.z).toBeGreaterThan(0)
  })

  it('right preset positions camera so X dominates', async () => {
    const presetRef = { current: null } as React.MutableRefObject<((name: keyof typeof CAMERA_PRESETS) => void) | null>
    const state = await renderSceneInCanvas(presetRef)
    await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    presetRef.current?.('right')

    const cam = state.camera
    expect(cam.position.x).toBeGreaterThan(Math.abs(cam.position.z))
    expect(cam.position.x).toBeGreaterThan(0)
  })

  it('top preset positions camera so Y dominates', async () => {
    const presetRef = { current: null } as React.MutableRefObject<((name: keyof typeof CAMERA_PRESETS) => void) | null>
    const state = await renderSceneInCanvas(presetRef)
    await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    presetRef.current?.('top')

    const cam = state.camera
    expect(cam.position.y).toBeGreaterThan(Math.abs(cam.position.x))
    expect(cam.position.y).toBeGreaterThan(Math.abs(cam.position.z))
  })
})

describe('Camera presets target scene centroid when parts are present', () => {
  beforeEach(() => resetStore())

  it('front preset looks at centroid of loaded parts, not origin', async () => {
    const presetRef = { current: null } as React.MutableRefObject<((name: keyof typeof CAMERA_PRESETS) => void) | null>
    const state = await renderSceneInCanvas(presetRef)
    const controls = await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    // Add a part at x=50 (far from origin)
    useProjectStore.getState().addPart(createPart({ length: 10, width: 5, thickness: 1, position: { x: 50, y: 0.5, z: 0 } }))
    await new Promise(resolve => setTimeout(resolve, 50))

    presetRef.current?.('front')

    // Controls target should be near the part's centroid (x≈50), not at origin
    expect(controls.target.x).toBeGreaterThan(10)
    expect(controls.target.x).toBeCloseTo(50, 0)
  })

  it('right preset looks at centroid of loaded parts', async () => {
    const presetRef = { current: null } as React.MutableRefObject<((name: keyof typeof CAMERA_PRESETS) => void) | null>
    const state = await renderSceneInCanvas(presetRef)
    const controls = await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    useProjectStore.getState().addPart(createPart({ length: 5, width: 5, thickness: 1, position: { x: 0, y: 0.5, z: 30 } }))
    await new Promise(resolve => setTimeout(resolve, 50))

    presetRef.current?.('right')

    // Target z should be near the part (z≈30)
    expect(controls.target.z).toBeCloseTo(30, 0)
  })
})

describe('Frame All — F key', () => {
  beforeEach(() => resetStore())

  it('F key does not throw with no parts', async () => {
    const state = await renderSceneInCanvas()
    await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', bubbles: true }))
    }).not.toThrow()
  })

  it('frameAll moves camera to look at scene centroid', async () => {
    const frameRef = { current: null } as React.MutableRefObject<(() => void) | null>
    const state = await renderSceneInCanvas(undefined, frameRef)
    const controls = await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    // Add a part at a known off-origin position
    useProjectStore.getState().addPart(createPart({ length: 20, width: 10, thickness: 1, position: { x: 0, y: 5, z: 0 } }))
    await new Promise(resolve => setTimeout(resolve, 50))

    // Place camera somewhere arbitrary
    state.camera.position.set(3, 2, 3)

    frameRef.current?.()

    // Controls target should now be near the part's center y (y=5)
    expect(controls.target.y).toBeCloseTo(5, 0)
    // Camera should be farther away than the default preset distance
    const distFromTarget = state.camera.position.distanceTo(controls.target)
    expect(distFromTarget).toBeGreaterThan(5)
  })

  it('F key frames scene (same as frameAll via ref)', async () => {
    const frameRef = { current: null } as React.MutableRefObject<(() => void) | null>
    const state = await renderSceneInCanvas(undefined, frameRef)
    const controls = await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    useProjectStore.getState().addPart(createPart({ length: 10, width: 5, thickness: 1, position: { x: 0, y: 3, z: 0 } }))
    await new Promise(resolve => setTimeout(resolve, 50))

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', bubbles: true }))

    expect(controls.target.y).toBeCloseTo(3, 0)
  })

  it('frameAll preserves current orbit direction', async () => {
    const frameRef = { current: null } as React.MutableRefObject<(() => void) | null>
    const state = await renderSceneInCanvas(undefined, frameRef)
    const controls = await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    useProjectStore.getState().addPart(createPart({ length: 10, width: 5, thickness: 1, position: { x: 0, y: 0.5, z: 0 } }))
    await new Promise(resolve => setTimeout(resolve, 50))

    // Set camera to be purely in +x direction from origin
    state.camera.position.set(10, 0, 0)
    controls.target.set(0, 0, 0)
    controls.update()

    frameRef.current?.()

    // Camera should still be primarily in +x direction relative to new target
    const newTarget = controls.target.clone()
    const dirFromTarget = state.camera.position.clone().sub(newTarget).normalize()
    expect(dirFromTarget.x).toBeGreaterThan(0.5)
  })
})

describe('Camera preset keyboard shortcuts', () => {
  it('key "1" moves camera to front direction (z dominant)', async () => {
    const state = await renderSceneInCanvas()
    await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    document.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }))

    expect(Math.abs(state.camera.position.z)).toBeGreaterThan(Math.abs(state.camera.position.x))
  })

  it('key "2" moves camera to right direction (x dominant)', async () => {
    const state = await renderSceneInCanvas()
    await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    document.dispatchEvent(new KeyboardEvent('keydown', { key: '2', bubbles: true }))

    expect(state.camera.position.x).toBeGreaterThan(Math.abs(state.camera.position.z))
  })

  it('key "3" moves camera to top direction (y dominant)', async () => {
    const state = await renderSceneInCanvas()
    await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    document.dispatchEvent(new KeyboardEvent('keydown', { key: '3', bubbles: true }))

    expect(state.camera.position.y).toBeGreaterThan(Math.abs(state.camera.position.x))
    expect(state.camera.position.y).toBeGreaterThan(Math.abs(state.camera.position.z))
  })

  it('key "1" does not fire when target is an input element', async () => {
    const presetRef = { current: null } as React.MutableRefObject<((name: keyof typeof CAMERA_PRESETS) => void) | null>
    const state = await renderSceneInCanvas(presetRef)
    await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    // Move to iso first so we know where we started
    presetRef.current?.('iso')
    const isoPosZ = state.camera.position.z

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true, target: input } as KeyboardEventInit))
    document.body.removeChild(input)

    // Camera should remain at iso Z
    expect(state.camera.position.z).toBeCloseTo(isoPosZ, 0)
  })
})

describe('Auto-frame after project load', () => {
  beforeEach(() => resetStore())

  it('frameAll after loadProject with off-origin parts moves target to part centroid', async () => {
    const frameRef = { current: null } as React.MutableRefObject<(() => void) | null>
    const state = await renderSceneInCanvas(undefined, frameRef)
    const controls = await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    // Simulate what handleFileChange does: load a project with a part far from origin
    useProjectStore.getState().loadProject({
      id: 'load-test', name: 'load-test', gridSize: 10, assemblies: [],
      parts: [createPart({ length: 10, width: 5, thickness: 1, position: { x: 80, y: 0.5, z: 0 } })],
      cutListSettings: { sheetGoods: {}, hardwood: {}, dimensional: {} },
    })
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    await new Promise(resolve => setTimeout(resolve, 50))

    frameRef.current?.()

    // Controls target should be near the part's x position (≈80), not at origin
    expect(controls.target.x).toBeGreaterThan(10)
    expect(controls.target.x).toBeCloseTo(80, 0)
  })

  it('frameAll after loadProject with no parts does not throw', async () => {
    const frameRef = { current: null } as React.MutableRefObject<(() => void) | null>
    const state = await renderSceneInCanvas(undefined, frameRef)
    await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    // Load empty project (simulates handleFileChange with a project that has no parts)
    useProjectStore.getState().loadProject({
      id: 'empty', name: 'empty', gridSize: 10, assemblies: [], parts: [],
      cutListSettings: { sheetGoods: {}, hardwood: {}, dimensional: {} },
    })
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

    expect(() => { frameRef.current?.() }).not.toThrow()
  })
})

describe('Camera far clip distance', () => {
  it('camera far clip is 200', async () => {
    const state = await renderSceneInCanvas()
    const cam = state.camera as THREE.PerspectiveCamera
    expect(cam.far).toBe(200)
  })
})
