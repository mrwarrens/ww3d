import { useEffect, useRef, useState, useCallback } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import Board from './Board'
import BoardCreator from './BoardCreator'
import { useProjectStore } from '../stores/projectStore'
import type { Part } from '../models/Part'

interface SceneProps {
  selectedId: string | null
  onSelectId: (id: string | null) => void
}

interface DragState {
  partId: string
  planeNormal: 'x' | 'y' | 'z'
  boardStartPos: { x: number; y: number; z: number }
  offsetX: number
  offsetY: number
  offsetZ: number
}

/**
 * Pick the cardinal drag plane whose normal is most aligned with the camera's
 * view direction — i.e. the plane the camera is most "looking through".
 *
 *   camera mostly looking along Y  →  XZ (ground) plane
 *   camera mostly looking along Z  →  XY (front)  plane
 *   camera mostly looking along X  →  YZ (side)   plane
 *
 * Prefer Y when tied so the default top-ish view stays on the ground plane.
 */
function getDragPlaneNormal(camera: THREE.Camera): 'x' | 'y' | 'z' {
  const dir = new THREE.Vector3()
  camera.getWorldDirection(dir)
  const ax = Math.abs(dir.x)
  const ay = Math.abs(dir.y)
  const az = Math.abs(dir.z)
  if (ay >= ax && ay >= az) return 'y'
  if (az >= ax) return 'z'
  return 'x'
}

export default function Scene({ selectedId, onSelectId }: SceneProps) {
  const parts = useProjectStore((s) => s.project.parts)
  const removePart = useProjectStore((s) => s.removePart)
  const movePart = useProjectStore((s) => s.movePart)
  const gl = useThree((s) => s.gl)
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null
  const camera = useThree((s) => s.camera)
  const raycaster = useThree((s) => s.raycaster)

  // Only livePos is state — it drives re-renders during drag.
  // Everything else is in refs so handlers never go stale.
  const [livePos, setLivePos] = useState<{ x: number; y: number; z: number } | null>(null)
  const draggingRef = useRef<DragState | null>(null)
  const dragPlaneRef = useRef<THREE.Plane | null>(null)
  const livePosRef = useRef<{ x: number; y: number; z: number } | null>(null)
  const activeListenersRef = useRef<{
    move: (e: PointerEvent) => void
    up: (e: PointerEvent) => void
  } | null>(null)

  livePosRef.current = livePos

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        removePart(selectedId)
        onSelectId(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, removePart, onSelectId])

  const handleDragStart = useCallback((e: ThreeEvent<PointerEvent>, part: Part) => {
    const planeNormal = getDragPlaneNormal(camera)

    // Build the THREE.Plane through the board's center with the chosen normal
    const normalVec = new THREE.Vector3(
      planeNormal === 'x' ? 1 : 0,
      planeNormal === 'y' ? 1 : 0,
      planeNormal === 'z' ? 1 : 0,
    )
    const boardCenter = new THREE.Vector3(part.position.x, part.position.y, part.position.z)
    dragPlaneRef.current = new THREE.Plane().setFromNormalAndCoplanarPoint(normalVec, boardCenter)

    // Project the initial click ray onto the drag plane so that the grab
    // offset is measured at the same depth as subsequent move hits.
    // Using e.point (board mesh surface) instead would cause a jump on the
    // first move because the mesh surface and the drag plane are at different depths.
    const grabHit = new THREE.Vector3()
    e.ray.intersectPlane(dragPlaneRef.current, grabHit)

    draggingRef.current = {
      partId: part.id,
      planeNormal,
      boardStartPos: { ...part.position },
      offsetX: grabHit.x - part.position.x,
      offsetY: grabHit.y - part.position.y,
      offsetZ: grabHit.z - part.position.z,
    }
    setLivePos({ x: part.position.x, y: part.position.y, z: part.position.z })

    // DOM-level handlers: raycasting against the THREE.Plane bypasses any
    // mesh-occlusion issues that arise with the invisible-plane approach.
    const move = (ev: PointerEvent) => {
      const d = draggingRef.current
      const plane = dragPlaneRef.current
      if (!d || !plane) return
      const rect = gl.domElement.getBoundingClientRect()
      const nx = ((ev.clientX - rect.left) / rect.width) * 2 - 1
      const ny = -((ev.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(new THREE.Vector2(nx, ny), camera)
      const hit = new THREE.Vector3()
      if (!raycaster.ray.intersectPlane(plane, hit)) return

      if (d.planeNormal === 'y') {
        setLivePos({ x: hit.x - d.offsetX, y: d.boardStartPos.y, z: hit.z - d.offsetZ })
      } else if (d.planeNormal === 'z') {
        setLivePos({ x: hit.x - d.offsetX, y: hit.y - d.offsetY, z: d.boardStartPos.z })
      } else {
        setLivePos({ x: d.boardStartPos.x, y: hit.y - d.offsetY, z: hit.z - d.offsetZ })
      }
    }

    const up = (_ev: PointerEvent) => {
      const d = draggingRef.current
      const pos = livePosRef.current
      if (d && pos) movePart(d.partId, { x: pos.x, y: pos.y, z: pos.z })
      if (controls) controls.enabled = true
      draggingRef.current = null
      dragPlaneRef.current = null
      setLivePos(null)
      if (activeListenersRef.current) {
        gl.domElement.removeEventListener('pointermove', activeListenersRef.current.move)
        gl.domElement.removeEventListener('pointerup', activeListenersRef.current.up)
        activeListenersRef.current = null
      }
    }

    activeListenersRef.current = { move, up }
    if (controls) controls.enabled = false
    gl.domElement.setPointerCapture(e.pointerId)
    gl.domElement.addEventListener('pointermove', move)
    gl.domElement.addEventListener('pointerup', up)
  }, [camera, controls, gl, movePart, raycaster])

  return (
    <>
      <color attach="background" args={['#1a1a2e']} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 4]} intensity={1} />

      <gridHelper args={[10, 10, 0x444466, 0x333355]} />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        mouseButtons={{
          LEFT: null,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
      />

      <BoardCreator onClearSelection={() => onSelectId(null)} />

      {parts.map((p) => (
        <Board
          key={p.id}
          {...p}
          position={draggingRef.current?.partId === p.id && livePos ? livePos : p.position}
          isSelected={p.id === selectedId}
          onSelect={() => onSelectId(p.id)}
          onDragStart={(e) => handleDragStart(e, p)}
        />
      ))}
    </>
  )
}
