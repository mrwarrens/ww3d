import { describe, it, expect, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import Board from '../src/components/Board'

const defaultProps = {
  id: 'test-board',
  name: 'Test Board',
  length: 4,
  width: 2,
  thickness: 0.75,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  color: '#8B4513',
  visible: true,
  isSelected: false,
  onSelect: () => {},
}

function BoardCanvas(props: typeof defaultProps) {
  return (
    <Canvas camera={{ position: [3, 2, 3] }}>
      <Board {...props} />
    </Canvas>
  )
}

async function waitFor(fn: () => void, timeout = 2000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try {
      fn()
      return
    } catch {
      await new Promise((r) => setTimeout(r, 16))
    }
  }
  fn()
}

describe('Board EdgesGeometry disposal', () => {
  it('calls dispose on unmount', async () => {
    // dispose is on BufferGeometry.prototype (EdgesGeometry inherits it)
    const disposeSpy = vi.spyOn(THREE.BufferGeometry.prototype, 'dispose')

    const { unmount } = await render(<BoardCanvas {...defaultProps} />)

    // Wait for R3F to process the initial render
    await new Promise((r) => setTimeout(r, 100))

    disposeSpy.mockClear()

    unmount()

    // Poll until the useEffect cleanup has run
    await waitFor(() => {
      expect(disposeSpy).toHaveBeenCalled()
    })

    disposeSpy.mockRestore()
  })

  it('calls dispose on dimension change and continues rendering', async () => {
    const disposeSpy = vi.spyOn(THREE.BufferGeometry.prototype, 'dispose')

    const { rerender } = await render(<BoardCanvas {...defaultProps} />)

    // Wait for initial render
    await new Promise((r) => setTimeout(r, 100))

    disposeSpy.mockClear()

    // Change length — triggers useMemo recompute → new edgesGeo → useEffect cleanup
    await rerender(<BoardCanvas {...defaultProps} length={8} />)

    // Poll until old geometry dispose has run
    await waitFor(() => {
      expect(disposeSpy).toHaveBeenCalled()
    })

    disposeSpy.mockRestore()
  })
})
