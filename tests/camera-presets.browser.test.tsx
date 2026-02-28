import { describe, it, expect } from 'vitest'
import { render } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import type { RootState } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useRef, useEffect } from 'react'
import Scene from '../src/components/Scene'
import { CAMERA_PRESETS } from '../src/utils/constants'
import { useCameraPreset } from '../src/hooks/useCameraPreset'

async function renderSceneInCanvas(
  cameraPresetRef?: React.MutableRefObject<((name: keyof typeof CAMERA_PRESETS) => void) | null>
) {
  let resolveState: (state: RootState) => void
  const statePromise = new Promise<RootState>((resolve) => { resolveState = resolve })
  await render(
    <Canvas
      camera={{ fov: 60, near: 0.1, far: 100, position: [3, 2, 3] }}
      gl={{ antialias: true }}
      onCreated={(s) => resolveState(s)}
    >
      <Scene selectedId={null} onSelectId={() => {}} cameraPresetRef={cameraPresetRef} />
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

describe('Camera presets via goToPreset', () => {
  it('front preset positions camera so Z dominates over X', async () => {
    const presetRef = { current: null } as React.MutableRefObject<((name: keyof typeof CAMERA_PRESETS) => void) | null>
    const state = await renderSceneInCanvas(presetRef)
    await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    presetRef.current?.('front')

    const cam = state.camera
    expect(cam.position.z).toBeGreaterThan(cam.position.x)
    expect(cam.position.z).toBeCloseTo(CAMERA_PRESETS.front.position[2], 0)
  })

  it('right preset positions camera so X dominates', async () => {
    const presetRef = { current: null } as React.MutableRefObject<((name: keyof typeof CAMERA_PRESETS) => void) | null>
    const state = await renderSceneInCanvas(presetRef)
    await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    presetRef.current?.('right')

    const cam = state.camera
    expect(cam.position.x).toBeGreaterThan(cam.position.z)
    expect(cam.position.x).toBeCloseTo(CAMERA_PRESETS.right.position[0], 0)
  })

  it('top preset positions camera so Y dominates', async () => {
    const presetRef = { current: null } as React.MutableRefObject<((name: keyof typeof CAMERA_PRESETS) => void) | null>
    const state = await renderSceneInCanvas(presetRef)
    await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    presetRef.current?.('top')

    const cam = state.camera
    expect(cam.position.y).toBeGreaterThan(cam.position.x)
    expect(cam.position.y).toBeGreaterThan(cam.position.z)
    expect(cam.position.y).toBeCloseTo(CAMERA_PRESETS.top.position[1], 0)
  })
})

describe('Camera preset keyboard shortcuts', () => {
  it('key "1" moves camera to front preset', async () => {
    const presetRef = { current: null } as React.MutableRefObject<((name: keyof typeof CAMERA_PRESETS) => void) | null>
    const state = await renderSceneInCanvas(presetRef)
    await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    document.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }))

    const cam = state.camera
    expect(cam.position.z).toBeCloseTo(CAMERA_PRESETS.front.position[2], 0)
  })

  it('key "2" moves camera to right preset', async () => {
    const presetRef = { current: null } as React.MutableRefObject<((name: keyof typeof CAMERA_PRESETS) => void) | null>
    const state = await renderSceneInCanvas(presetRef)
    await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    document.dispatchEvent(new KeyboardEvent('keydown', { key: '2', bubbles: true }))

    const cam = state.camera
    expect(cam.position.x).toBeCloseTo(CAMERA_PRESETS.right.position[0], 0)
  })

  it('key "3" moves camera to top preset', async () => {
    const presetRef = { current: null } as React.MutableRefObject<((name: keyof typeof CAMERA_PRESETS) => void) | null>
    const state = await renderSceneInCanvas(presetRef)
    await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    document.dispatchEvent(new KeyboardEvent('keydown', { key: '3', bubbles: true }))

    const cam = state.camera
    expect(cam.position.y).toBeCloseTo(CAMERA_PRESETS.top.position[1], 0)
  })

  it('key "1" does not fire when target is an input element', async () => {
    const presetRef = { current: null } as React.MutableRefObject<((name: keyof typeof CAMERA_PRESETS) => void) | null>
    const state = await renderSceneInCanvas(presetRef)
    await waitForControls(state)
    await new Promise(resolve => setTimeout(resolve, 50))

    // Start at iso so we can tell if front is applied
    presetRef.current?.('iso')
    const isoPosZ = state.camera.position.z

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true, target: input } as KeyboardEventInit))
    document.body.removeChild(input)

    // Camera should still be at iso Z, not front Z
    expect(state.camera.position.z).toBeCloseTo(isoPosZ, 0)
  })
})
