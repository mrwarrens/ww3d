import { describe, it, expect, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { act } from 'react'
import App from '../src/App'
import { useProjectStore } from '../src/stores/projectStore'
import { createProject } from '../src/models/Project'
import { createAssembly } from '../src/models/Assembly'
import { createPart } from '../src/models/Part'

beforeEach(() => {
  useProjectStore.setState({ project: createProject(), history: [], future: [] })
})

describe('Delete key removes selected assembly', () => {
  it('removes the assembly row and member part rows from the outliner', async () => {
    const assembly = createAssembly('Cabinet')
    const part1 = { ...createPart({ name: 'Top', length: 4, width: 3, position: { x: 0, y: 0.375, z: 0 } }), assemblyId: assembly.id }
    const part2 = { ...createPart({ name: 'Bottom', length: 4, width: 3, position: { x: 0, y: 0.375, z: 2 } }), assemblyId: assembly.id }
    useProjectStore.setState((state) => ({
      project: { ...state.project, assemblies: [assembly], parts: [part1, part2] },
    }))

    await render(<App />)

    const assemblyRow = document.querySelector('li.assembly-row') as HTMLElement
    await act(async () => { assemblyRow.click() })

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }))
    await act(async () => {})

    expect(document.querySelector('li.assembly-row')).toBeNull()
    const outliner = document.getElementById('left-panel')!
    expect(outliner.textContent).not.toContain('Top')
    expect(outliner.textContent).not.toContain('Bottom')
  })
})
