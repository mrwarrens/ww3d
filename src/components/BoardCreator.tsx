import { useRef, useState, useCallback } from 'react'
import { useThree, ThreeEvent } from '@react-three/fiber'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { BOARD_THICKNESS, snapToGrid } from '../utils/constants'
import { useProjectStore } from '../stores/projectStore'

interface DragPoint {
  x: number
  z: number
}

interface Preview {
  x: number
  z: number
  length: number
  width: number
}

interface BoardCreatorProps {
  onClearSelection: () => void
}

export default function BoardCreator({ onClearSelection }: BoardCreatorProps) {
  const addPart = useProjectStore((s) => s.addPart)
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const dragStart = useRef<DragPoint | null>(null)
  const gl = useThree((s) => s.gl)
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null

  const onPointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return
    e.stopPropagation()
    onClearSelection()
    const point = e.point
    const start = { x: snapToGrid(point.x), z: snapToGrid(point.z) }
    dragStart.current = start
    setDragging(true)
    setPreview({ x: start.x, z: start.z, length: 0.01, width: 0.01 })
    if (controls) controls.enabled = false
    gl.domElement.setPointerCapture(e.pointerId)
  }, [controls, gl])

  const onPointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!dragging || !dragStart.current) return
    const point = e.point
    const hitX = snapToGrid(point.x)
    const hitZ = snapToGrid(point.z)
    const l = hitX - dragStart.current.x
    const w = hitZ - dragStart.current.z
    setPreview({
      x: dragStart.current.x + l / 2,
      z: dragStart.current.z + w / 2,
      length: l || 0.01,
      width: w || 0.01,
    })
  }, [dragging])

  const onPointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0 || !dragging) return
    if (controls) controls.enabled = true
    setDragging(false)

    if (dragStart.current) {
      const point = e.point
      const hitX = snapToGrid(point.x)
      const hitZ = snapToGrid(point.z)
      const length = Math.abs(hitX - dragStart.current.x)
      const width = Math.abs(hitZ - dragStart.current.z)
      if (length > 0.1 || width > 0.1) {
        const cx = (dragStart.current.x + hitX) / 2
        const cz = (dragStart.current.z + hitZ) / 2
        const hue = Math.random()
        const color = `hsl(${hue * 360}, 70%, 60%)`
        addPart({
          length,
          width,
          position: { x: cx, y: BOARD_THICKNESS / 2, z: cz },
          color,
        })
      }
    }

    dragStart.current = null
    setPreview(null)
  }, [dragging, controls, addPart])

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial />
      </mesh>
      {preview && (
        <mesh position={[preview.x, BOARD_THICKNESS / 2, preview.z]}
              scale={[preview.length, 1, preview.width]}>
          <boxGeometry args={[1, BOARD_THICKNESS, 1]} />
          <meshStandardMaterial color={0x4488ff} transparent opacity={0.3} />
        </mesh>
      )}
    </>
  )
}
