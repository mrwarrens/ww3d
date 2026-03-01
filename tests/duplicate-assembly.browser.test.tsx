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

describe('Duplicate an Assembly (Cmd+D)', () => {
  it('Cmd+D with isAssemblySelected=true does not duplicate any individual part', async () => {
    // Set up two parts grouped into an assembly
    useProjectStore.getState().addPart({
      length: 4, width: 3,
      position: { x: 0, y: BOARD_THICKNESS / 2, z: 0 },
      color: '#ff0000',
    })
    useProjectStore.getState().addPart({
      length: 4, width: 3,
      position: { x: 1, y: BOARD_THICKNESS / 2, z: 1 },
      color: '#00ff00',
    })
    const partIds = useProjectStore.getState().project.parts.map((p) => p.id)
    useProjectStore.getState().groupPartsIntoAssembly(partIds, 'Assembly 1')

    const assemblyId = useProjectStore.getState().project.assemblies[0].id
    const memberIds = useProjectStore.getState().project.parts
      .filter((p) => p.assemblyId === assemblyId)
      .map((p) => p.id)

    // Scene receives derived member IDs but isAssemblySelected=true
    await renderInCanvas(
      <Scene
        selectedIds={memberIds}
        onSelectId={() => {}}
        isAssemblySelected={true}
      />
    )
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Cmd+D fires — Scene should skip duplicatePart because isAssemblySelected=true
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', metaKey: true, bubbles: true }))

    // Parts should still be exactly 2 (no extra orphan created by Scene)
    expect(useProjectStore.getState().project.parts).toHaveLength(2)
  })

  it('Cmd+D with isAssemblySelected=false still duplicates the individual part', async () => {
    useProjectStore.getState().addPart({
      length: 4, width: 3,
      position: { x: 0, y: BOARD_THICKNESS / 2, z: 0 },
      color: '#ff0000',
    })
    const id = useProjectStore.getState().project.parts[0].id

    await renderInCanvas(
      <Scene
        selectedIds={[id]}
        onSelectId={() => {}}
        isAssemblySelected={false}
      />
    )
    await new Promise((resolve) => setTimeout(resolve, 50))

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', metaKey: true, bubbles: true }))

    expect(useProjectStore.getState().project.parts).toHaveLength(2)
  })

  it('after duplicateAssembly, no extra orphan parts exist', () => {
    // Set up two parts grouped into an assembly
    useProjectStore.getState().addPart({
      length: 4, width: 3,
      position: { x: 0, y: BOARD_THICKNESS / 2, z: 0 },
      color: '#ff0000',
    })
    useProjectStore.getState().addPart({
      length: 4, width: 3,
      position: { x: 1, y: BOARD_THICKNESS / 2, z: 1 },
      color: '#00ff00',
    })
    const partIds = useProjectStore.getState().project.parts.map((p) => p.id)
    useProjectStore.getState().groupPartsIntoAssembly(partIds, 'Assembly 1')

    const assemblyId = useProjectStore.getState().project.assemblies[0].id
    useProjectStore.getState().duplicateAssembly(assemblyId)

    const { parts, assemblies } = useProjectStore.getState().project

    // Should have exactly 2 assemblies and 4 parts total
    expect(assemblies).toHaveLength(2)
    expect(parts).toHaveLength(4)

    // Every part must belong to an assembly — no orphans
    const orphans = parts.filter((p) => !p.assemblyId)
    expect(orphans).toHaveLength(0)

    // Each assembly should have exactly 2 member parts
    for (const assembly of assemblies) {
      const members = parts.filter((p) => p.assemblyId === assembly.id)
      expect(members).toHaveLength(2)
    }
  })
})
