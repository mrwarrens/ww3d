import { describe, it, expect } from 'vitest'
import { render } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import type { RootState } from '@react-three/fiber'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import Scene from '../src/components/Scene'

async function renderSceneInCanvas() {
  let resolveState: (state: RootState) => void
  const statePromise = new Promise<RootState>((resolve) => { resolveState = resolve })
  await render(
    <Canvas
      camera={{ fov: 60, near: 0.1, far: 200, position: [3, 2, 3] }}
      gl={{ antialias: true }}
      onCreated={(s) => resolveState(s)}
    >
      <Scene selectedIds={[]} onSelectIds={() => {}} />
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

describe('Arrow key orbit', () => {
  it('ArrowLeft changes camera azimuth (theta)', async () => {
    const state = await renderSceneInCanvas()
    await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    const before = state.camera.position.clone()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))

    const after = state.camera.position
    // Position should have changed
    expect(after.distanceTo(before)).toBeGreaterThan(0)
    // Distance from origin should be preserved (orbit, not zoom)
    expect(after.length()).toBeCloseTo(before.length(), 1)
  })

  it('ArrowRight changes camera in opposite azimuth direction vs ArrowLeft', async () => {
    const state = await renderSceneInCanvas()
    await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    const initial = state.camera.position.clone()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    const afterLeft = state.camera.position.clone()

    // Reset to initial by setting position manually — just compare x change direction
    const leftDeltaX = afterLeft.x - initial.x

    // Now render fresh and go right
    const state2 = await renderSceneInCanvas()
    await waitForControls(state2)
    await new Promise(resolve => setTimeout(resolve, 50))

    const initial2 = state2.camera.position.clone()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    const afterRight = state2.camera.position.clone()
    const rightDeltaX = afterRight.x - initial2.x

    // Left and right should produce opposite x-axis changes
    expect(Math.sign(leftDeltaX)).not.toBe(0)
    expect(Math.sign(rightDeltaX)).not.toBe(0)
    expect(Math.sign(leftDeltaX)).not.toBe(Math.sign(rightDeltaX))
  })

  it('ArrowUp changes camera elevation (phi)', async () => {
    const state = await renderSceneInCanvas()
    await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    const before = state.camera.position.clone()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))

    const after = state.camera.position
    expect(after.distanceTo(before)).toBeGreaterThan(0)
    // Distance from origin should be preserved
    expect(after.length()).toBeCloseTo(before.length(), 1)
  })

  it('arrow key while input is focused does NOT change camera position', async () => {
    const state = await renderSceneInCanvas()
    await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    const before = state.camera.position.clone()

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    document.body.removeChild(input)

    const after = state.camera.position
    expect(after.x).toBeCloseTo(before.x, 5)
    expect(after.y).toBeCloseTo(before.y, 5)
    expect(after.z).toBeCloseTo(before.z, 5)
  })
})

describe('Shift+Arrow pan', () => {
  it('Shift+ArrowRight moves both camera position and controls target together', async () => {
    const state = await renderSceneInCanvas()
    const controls = await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    const camBefore = state.camera.position.clone()
    const targetBefore = controls.target.clone()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true }))

    const camDelta = state.camera.position.clone().sub(camBefore)
    const targetDelta = controls.target.clone().sub(targetBefore)

    // Both should have moved
    expect(camDelta.length()).toBeGreaterThan(0)
    // Camera and target should have moved by the same vector (pan, not orbit)
    expect(camDelta.x).toBeCloseTo(targetDelta.x, 5)
    expect(camDelta.y).toBeCloseTo(targetDelta.y, 5)
    expect(camDelta.z).toBeCloseTo(targetDelta.z, 5)
  })

  it('Shift+ArrowUp moves camera and target upward', async () => {
    const state = await renderSceneInCanvas()
    const controls = await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    const camBefore = state.camera.position.clone()
    const targetBefore = controls.target.clone()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true, bubbles: true }))

    const camDelta = state.camera.position.clone().sub(camBefore)
    const targetDelta = controls.target.clone().sub(targetBefore)

    expect(camDelta.length()).toBeGreaterThan(0)
    expect(camDelta.x).toBeCloseTo(targetDelta.x, 5)
    expect(camDelta.y).toBeCloseTo(targetDelta.y, 5)
    expect(camDelta.z).toBeCloseTo(targetDelta.z, 5)
  })
})
