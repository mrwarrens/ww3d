import { describe, it, expect } from 'vitest'
import { render } from 'vitest-browser-react'
import { act } from 'react'
import { Canvas } from '@react-three/fiber'
import type { RootState } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import Scene from '../src/components/Scene'
import App from '../src/App'

async function renderSceneInCanvas() {
  let resolveState: (state: RootState) => void
  const statePromise = new Promise<RootState>((resolve) => { resolveState = resolve })
  await render(
    <Canvas
      camera={{ fov: 60, near: 0.1, far: 100, position: [3, 2, 3] }}
      gl={{ antialias: true }}
      onCreated={(s) => resolveState(s)}
    >
      <Scene selectedId={null} onSelectId={() => {}} />
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

describe('Camera pan configuration', () => {
  it('middle mouse button is configured for pan', async () => {
    const state = await renderSceneInCanvas()
    const controls = await waitForControls(state)
    expect(controls.mouseButtons.MIDDLE).toBe(THREE.MOUSE.PAN)
  })

  it('pan is enabled', async () => {
    const state = await renderSceneInCanvas()
    const controls = await waitForControls(state)
    expect(controls.enablePan).toBe(true)
  })
})

describe('Help pane mentions pan', () => {
  it('help pane contains the word "pan"', async () => {
    await render(<App />)
    await act(async () => { document.getElementById('help-btn')!.click() })
    const pane = document.getElementById('help-pane')
    expect(pane).not.toBeNull()
    expect(pane!.textContent?.toLowerCase()).toContain('pan')
  })
})
