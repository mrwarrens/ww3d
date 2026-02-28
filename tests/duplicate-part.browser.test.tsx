import { describe, it, expect, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import type { RootState } from '@react-three/fiber'
import Scene from '../src/components/Scene'
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
  useProjectStore.setState({ project: createProject() })
})

describe('Duplicate a Part (Cmd+D)', () => {
  it('Cmd+D with a selected part creates a second part in the store', async () => {
    useProjectStore.getState().addPart({
      length: 4, width: 3,
      position: { x: 0, y: BOARD_THICKNESS / 2, z: 0 },
      color: '#ff0000',
    })
    const id = useProjectStore.getState().project.parts[0].id

    await renderInCanvas(<Scene selectedId={id} onSelectId={() => {}} />)
    await new Promise((resolve) => setTimeout(resolve, 50))

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', metaKey: true, bubbles: true }))

    expect(useProjectStore.getState().project.parts).toHaveLength(2)
  })

  it('Cmd+D new part has offset position from the original', async () => {
    useProjectStore.getState().addPart({
      length: 6, width: 4,
      position: { x: 2, y: BOARD_THICKNESS / 2, z: 3 },
      color: '#00ff00',
    })
    const original = useProjectStore.getState().project.parts[0]

    await renderInCanvas(<Scene selectedId={original.id} onSelectId={() => {}} />)
    await new Promise((resolve) => setTimeout(resolve, 50))

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', metaKey: true, bubbles: true }))

    const parts = useProjectStore.getState().project.parts
    expect(parts).toHaveLength(2)
    const newPart = parts[1]
    expect(newPart.position.x).not.toBe(original.position.x)
    expect(newPart.position.z).not.toBe(original.position.z)
  })

  it('Cmd+D with no selection does nothing', async () => {
    useProjectStore.getState().addPart({
      length: 4, width: 3,
      position: { x: 0, y: BOARD_THICKNESS / 2, z: 0 },
      color: '#ff0000',
    })

    await renderInCanvas(<Scene selectedId={null} onSelectId={() => {}} />)
    await new Promise((resolve) => setTimeout(resolve, 50))

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', metaKey: true, bubbles: true }))

    expect(useProjectStore.getState().project.parts).toHaveLength(1)
  })
})
