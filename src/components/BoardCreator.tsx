import { useRef, useState, useCallback } from 'react'
import { useThree, ThreeEvent } from '@react-three/fiber'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { BOARD_THICKNESS } from '../constants'
import type { BoardData } from './Board'

interface BoardCreatorProps {
  addBoard: (board: BoardData) => void
}

interface DragPoint {
  x: number
  z: number
}

interface Preview {
  x: number
  z: number
  width: number
  depth: number
}

export default function BoardCreator({ addBoard }: BoardCreatorProps) {
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const dragStart = useRef<DragPoint | null>(null)
  const gl = useThree((s) => s.gl)
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null

  const snap = (v: number) => Math.round(v)

  const onPointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return
    e.stopPropagation()
    const point = e.point
    const start = { x: snap(point.x), z: snap(point.z) }
    dragStart.current = start
    setDragging(true)
    setPreview({ x: start.x, z: start.z, width: 0.01, depth: 0.01 })
    if (controls) controls.enabled = false
    gl.domElement.setPointerCapture(e.pointerId)
  }, [controls, gl])

  const onPointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!dragging || !dragStart.current) return
    const point = e.point
    const hitX = snap(point.x)
    const hitZ = snap(point.z)
    const w = hitX - dragStart.current.x
    const d = hitZ - dragStart.current.z
    setPreview({
      x: dragStart.current.x + w / 2,
      z: dragStart.current.z + d / 2,
      width: w || 0.01,
      depth: d || 0.01,
    })
  }, [dragging])

  const onPointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0 || !dragging) return
    if (controls) controls.enabled = true
    setDragging(false)

    if (dragStart.current) {
      const point = e.point
      const hitX = snap(point.x)
      const hitZ = snap(point.z)
      const width = Math.abs(hitX - dragStart.current.x)
      const depth = Math.abs(hitZ - dragStart.current.z)
      if (width > 0.1 || depth > 0.1) {
        const cx = (dragStart.current.x + hitX) / 2
        const cz = (dragStart.current.z + hitZ) / 2
        const hue = Math.random()
        const color = `hsl(${hue * 360}, 70%, 60%)`
        addBoard({ x: cx, z: cz, width, depth, color })
      }
    }

    dragStart.current = null
    setPreview(null)
  }, [dragging, controls, addBoard])

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
              scale={[preview.width, 1, preview.depth]}>
          <boxGeometry args={[1, BOARD_THICKNESS, 1]} />
          <meshStandardMaterial color={0x4488ff} transparent opacity={0.3} />
        </mesh>
      )}
    </>
  )
}
