import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from 'vitest-browser-react'
import { userEvent } from '@vitest/browser/context'
import { Canvas } from '@react-three/fiber'
import type { RootState } from '@react-three/fiber'
import PropertiesPanel from '../src/components/PropertiesPanel'
import Board from '../src/components/Board'
import { createPart } from '../src/models/Part'

const testPart = createPart({
  name: 'Shelf',
  length: 24,
  width: 8,
  thickness: 0.75,
  position: { x: 0, y: 0.375, z: 0 },
})

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

afterEach(() => cleanup())

describe('Eyedropper', () => {
  it('renders Pick button when onEyedropperActivate is provided', async () => {
    const screen = await render(
      <PropertiesPanel
        part={testPart}
        onUpdate={vi.fn()}
        assembly={null}
        onMoveAssembly={vi.fn()}
        onEyedropperActivate={vi.fn()}
      />
    )
    const btn = screen.getByRole('button', { name: /eyedropper/i })
    await expect.element(btn).toBeInTheDocument()
  })

  it('calls onEyedropperActivate when Pick button is clicked', async () => {
    const onEyedropperActivate = vi.fn()
    const screen = await render(
      <PropertiesPanel
        part={testPart}
        onUpdate={vi.fn()}
        assembly={null}
        onMoveAssembly={vi.fn()}
        onEyedropperActivate={onEyedropperActivate}
      />
    )
    const btn = screen.getByRole('button', { name: /eyedropper/i })
    await userEvent.click(btn)
    expect(onEyedropperActivate).toHaveBeenCalledOnce()
  })

  it('does not render Pick button when onEyedropperActivate is not provided', async () => {
    const { container } = await render(
      <PropertiesPanel
        part={testPart}
        onUpdate={vi.fn()}
        assembly={null}
        onMoveAssembly={vi.fn()}
      />
    )
    const btn = container.querySelector('button[aria-label="Eyedropper"]')
    expect(btn).toBeNull()
  })
})

describe('Board eyedropper propagation guard', () => {
  it('renders inside Canvas with onEyedropperClick defined and isSelected false (smoke test)', async () => {
    const state = await renderInCanvas(
      <Board
        {...testPart}
        isSelected={false}
        onSelect={vi.fn()}
        onEyedropperClick={vi.fn()}
      />
    )
    expect(state.scene).toBeDefined()
    // Board mesh must be present in the scene
    let found = false
    state.scene.traverse((obj) => {
      if (obj.type === 'Mesh') found = true
    })
    expect(found).toBe(true)
  })

  it('does not call onClearSelection when pointerdown fires on canvas while eyedropper is active', async () => {
    const onClearSelection = vi.fn()
    const state = await renderInCanvas(
      <>
        <Board
          {...testPart}
          isSelected={false}
          onSelect={vi.fn()}
          onEyedropperClick={vi.fn()}
        />
        {/* Sentinel mesh behind the board that calls onClearSelection on pointerdown */}
        <mesh
          position={[testPart.position.x, testPart.position.y, testPart.position.z]}
          onPointerDown={() => onClearSelection()}
        >
          <boxGeometry args={[100, 0.01, 100]} />
          <meshStandardMaterial />
        </mesh>
      </>
    )
    // Dispatch a synthetic pointerdown on the canvas DOM element
    const canvas = state.gl.domElement
    canvas.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, clientX: canvas.width / 2, clientY: canvas.height / 2 }))
    // Give R3F a tick to process
    await new Promise((r) => setTimeout(r, 50))
    // Because the Board stopped propagation in handlePointerDown, the sentinel should not be called
    expect(onClearSelection).not.toHaveBeenCalled()
  })
})
