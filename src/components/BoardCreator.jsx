import { useRef, useState, useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import { BOARD_THICKNESS } from '../constants'

export default function BoardCreator({ addBoard }) {
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState(null)
  const dragStart = useRef(null)
  const controls = useThree((s) => s.controls)

  const snap = (v) => Math.round(v)

  const onPointerDown = useCallback((e) => {
    if (e.button !== 0) return
    e.stopPropagation()
    const point = e.point
    const start = { x: snap(point.x), z: snap(point.z) }
    dragStart.current = start
    setDragging(true)
    setPreview({ x: start.x, z: start.z, width: 0.01, depth: 0.01 })
    if (controls) controls.enabled = false
    e.target.setPointerCapture(e.pointerId)
  }, [controls])

  const onPointerMove = useCallback((e) => {
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

  const onPointerUp = useCallback((e) => {
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
