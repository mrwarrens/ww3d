import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { OrbitControls, Html } from '@react-three/drei'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { EffectComposer, Outline } from '@react-three/postprocessing'
import Board from './Board'
import BoardCreator from './BoardCreator'
import { useProjectStore } from '../stores/projectStore'
import type { Part } from '../models/Part'
import { snapToGrid, CAMERA_PRESETS } from '../utils/constants'
import { useCameraPreset } from '../hooks/useCameraPreset'

interface SceneProps {
  selectedIds: string[]
  onSelectIds: (ids: string[]) => void
  onSelectAssembly?: (assemblyId: string) => void
  cameraPresetRef?: React.MutableRefObject<((name: keyof typeof CAMERA_PRESETS) => void) | null>
  frameAllRef?: React.MutableRefObject<(() => void) | null>
  isAssemblySelected?: boolean
  eyedropperActive?: boolean
  onColorSample?: (color: string) => void
  onEyedropperCancel?: () => void
  showAxes?: boolean
  modifyingPartId?: string | null
  onExitModifyMode?: () => void
}

function AxisLines({ length }: { length: number }) {
  const arrows = useMemo(() => {
    const origin = new THREE.Vector3(0, 0, 0)
    return {
      xPos: new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), origin, length, 0xff2020),
      xNeg: new THREE.ArrowHelper(new THREE.Vector3(-1, 0, 0), origin, length, 0xff2020, 0, 0),
      yPos: new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), origin, length, 0x20ff20),
      yNeg: new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), origin, length, 0x20ff20, 0, 0),
      zPos: new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, length, 0x2020ff),
      zNeg: new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), origin, length, 0x2020ff, 0, 0),
    }
  }, [length])

  useEffect(() => {
    return () => {
      for (const arrow of Object.values(arrows)) {
        arrow.line.geometry.dispose();
        (arrow.line.material as THREE.Material).dispose()
        arrow.cone.geometry.dispose();
        (arrow.cone.material as THREE.Material).dispose()
      }
    }
  }, [arrows])

  return (
    <>
      <primitive object={arrows.xPos} />
      <primitive object={arrows.xNeg} />
      <primitive object={arrows.yPos} />
      <primitive object={arrows.yNeg} />
      <primitive object={arrows.zPos} />
      <primitive object={arrows.zNeg} />
      <Html position={[length + 0.3, 0, 0]}><span style={{ color: '#ff4040', fontWeight: 'bold', fontSize: '12px' }}>X</span></Html>
      <Html position={[0, length + 0.3, 0]}><span style={{ color: '#40ff40', fontWeight: 'bold', fontSize: '12px' }}>Y</span></Html>
      <Html position={[0, 0, length + 0.3]}><span style={{ color: '#4040ff', fontWeight: 'bold', fontSize: '12px' }}>Z</span></Html>
    </>
  )
}

interface DragState {
  partId: string
  assemblyId?: string
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

export default function Scene({ selectedIds, onSelectIds, onSelectAssembly, cameraPresetRef, frameAllRef, isAssemblySelected, eyedropperActive, onColorSample, onEyedropperCancel, showAxes, modifyingPartId, onExitModifyMode }: SceneProps) {
  const parts = useProjectStore((s) => s.project.parts)
  const assemblies = useProjectStore((s) => s.project.assemblies)
  const gridSize = useProjectStore((s) => s.project.gridSize)
  const removeParts = useProjectStore((s) => s.removeParts)
  const removeChildPart = useProjectStore((s) => s.removeChildPart)
  const duplicateParts = useProjectStore((s) => s.duplicateParts)
  const movePart = useProjectStore((s) => s.movePart)
  const moveAssembly = useProjectStore((s) => s.moveAssembly)
  const gl = useThree((s) => s.gl)
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null
  const camera = useThree((s) => s.camera)
  const raycaster = useThree((s) => s.raycaster)

  const { goToPreset, frameAll } = useCameraPreset(camera, controls, parts, assemblies)

  useEffect(() => {
    if (cameraPresetRef) cameraPresetRef.current = goToPreset
    if (frameAllRef) frameAllRef.current = frameAll
  }, [cameraPresetRef, frameAllRef, goToPreset, frameAll])

  useEffect(() => {
    gl.domElement.style.cursor = eyedropperActive ? 'crosshair' : ''
    return () => { gl.domElement.style.cursor = '' }
  }, [eyedropperActive, gl.domElement])

  const meshRefs = useRef<Map<string, THREE.Mesh>>(new Map())
  const childMeshRefs = useRef<Map<string, THREE.Mesh>>(new Map())

  const handleChildMeshRef = useCallback((childId: string, mesh: THREE.Mesh | null) => {
    if (mesh) childMeshRefs.current.set(childId, mesh)
    else childMeshRefs.current.delete(childId)
  }, [])

  const assemblyPositionMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number; z: number }>()
    for (const a of assemblies) map.set(a.id, a.position)
    return map
  }, [assemblies])
  const assemblyPositionMapRef = useRef(assemblyPositionMap)
  assemblyPositionMapRef.current = assemblyPositionMap

  // Refs for values used in the keydown handler so it never reads stale closures.
  // The handler is registered once (or when stable deps change), but always reads
  // current selectedIds/parts via these refs.
  const selectedIdsRef = useRef(selectedIds)
  selectedIdsRef.current = selectedIds
  const partsRef = useRef(parts)
  partsRef.current = parts
  const isAssemblySelectedRef = useRef(isAssemblySelected)
  isAssemblySelectedRef.current = isAssemblySelected

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
      // Read current values from refs to avoid stale closure issues
      const selectedIds = selectedIdsRef.current
      const parts = partsRef.current
      const isTyping = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0 && !isTyping) {
        if (selectedIds.length === 1 && parts.find((p) => p.id === selectedIds[0])?.parentId) {
          removeChildPart(selectedIds[0])
        } else {
          removeParts(selectedIds)
        }
        onSelectIds([])
      }
      if (e.key === 'Escape') {
        onSelectIds([])
        onEyedropperCancel?.()
        onExitModifyMode?.()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedIds.length > 0 && !isAssemblySelected) {
        e.preventDefault()
        const newIds = duplicateParts(selectedIds)
        if (newIds.length > 0) onSelectIds(newIds)
      }
      if (isTyping) return
      if (e.key === 'f' || e.key === 'F') frameAll()
      else if (e.key === '1') goToPreset('front')
      else if (e.key === '2') goToPreset('right')
      else if (e.key === '3') goToPreset('top')
      else if (e.key === '4') goToPreset('iso')
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (!controls) return
        e.preventDefault()
        const ORBIT_STEP = Math.PI / 36
        if (e.shiftKey) {
          const distance = camera.position.distanceTo(controls.target)
          const panStep = distance * 0.02
          const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0)
          const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1)
          let delta = new THREE.Vector3()
          if (e.key === 'ArrowRight') delta = right.multiplyScalar(panStep)
          else if (e.key === 'ArrowLeft') delta = right.multiplyScalar(-panStep)
          else if (e.key === 'ArrowUp') delta = up.multiplyScalar(panStep)
          else if (e.key === 'ArrowDown') delta = up.multiplyScalar(-panStep)
          camera.position.add(delta)
          controls.target.add(delta)
          controls.update()
        } else {
          const spherical = new THREE.Spherical().setFromVector3(
            camera.position.clone().sub(controls.target)
          )
          if (e.key === 'ArrowLeft') spherical.theta -= ORBIT_STEP
          else if (e.key === 'ArrowRight') spherical.theta += ORBIT_STEP
          else if (e.key === 'ArrowUp') spherical.phi -= ORBIT_STEP
          else if (e.key === 'ArrowDown') spherical.phi += ORBIT_STEP
          spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, spherical.phi))
          const newPos = new THREE.Vector3().setFromSpherical(spherical)
          newPos.add(controls.target)
          camera.position.copy(newPos)
          controls.update()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
    // selectedIds and parts are read via refs — excluded from deps intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAssemblySelected, removeParts, removeChildPart, duplicateParts, onSelectIds, goToPreset, frameAll, onEyedropperCancel, onExitModifyMode, camera, controls])

  const handleDragStart = useCallback((e: ThreeEvent<PointerEvent>, part: Part) => {
    const planeNormal = getDragPlaneNormal(camera)

    // Compute world position — part.position is local when part belongs to an assembly
    const asmPos = part.assemblyId ? assemblyPositionMapRef.current.get(part.assemblyId) : null
    const partWorldPos = asmPos
      ? { x: part.position.x + asmPos.x, y: part.position.y + asmPos.y, z: part.position.z + asmPos.z }
      : part.position

    // Build the THREE.Plane through the board's center with the chosen normal
    const normalVec = new THREE.Vector3(
      planeNormal === 'x' ? 1 : 0,
      planeNormal === 'y' ? 1 : 0,
      planeNormal === 'z' ? 1 : 0,
    )
    const boardCenter = new THREE.Vector3(partWorldPos.x, partWorldPos.y, partWorldPos.z)
    dragPlaneRef.current = new THREE.Plane().setFromNormalAndCoplanarPoint(normalVec, boardCenter)

    // Project the initial click ray onto the drag plane so that the grab
    // offset is measured at the same depth as subsequent move hits.
    // Using e.point (board mesh surface) instead would cause a jump on the
    // first move because the mesh surface and the drag plane are at different depths.
    const grabHit = new THREE.Vector3()
    e.ray.intersectPlane(dragPlaneRef.current, grabHit)

    if (isAssemblySelectedRef.current && part.assemblyId && asmPos) {
      // Assembly drag: livePos tracks the assembly position; offsets are relative to asmPos
      draggingRef.current = {
        partId: part.id,
        assemblyId: part.assemblyId,
        planeNormal,
        boardStartPos: { ...asmPos },
        offsetX: grabHit.x - asmPos.x,
        offsetY: grabHit.y - asmPos.y,
        offsetZ: grabHit.z - asmPos.z,
      }
      setLivePos({ ...asmPos })
    } else {
      draggingRef.current = {
        partId: part.id,
        planeNormal,
        boardStartPos: { ...partWorldPos },
        offsetX: grabHit.x - partWorldPos.x,
        offsetY: grabHit.y - partWorldPos.y,
        offsetZ: grabHit.z - partWorldPos.z,
      }
      setLivePos({ ...partWorldPos })
    }

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

      const sx = snapToGrid(hit.x)
      const sy = snapToGrid(hit.y)
      const sz = snapToGrid(hit.z)

      if (d.planeNormal === 'y') {
        setLivePos({ x: sx - d.offsetX, y: d.boardStartPos.y, z: sz - d.offsetZ })
      } else if (d.planeNormal === 'z') {
        setLivePos({ x: sx - d.offsetX, y: sy - d.offsetY, z: d.boardStartPos.z })
      } else {
        setLivePos({ x: d.boardStartPos.x, y: sy - d.offsetY, z: sz - d.offsetZ })
      }
    }

    const up = (_ev: PointerEvent) => {
      const d = draggingRef.current
      const pos = livePosRef.current
      if (d && pos) {
        if (d.assemblyId) {
          moveAssembly(d.assemblyId, { x: pos.x, y: pos.y, z: pos.z })
        } else {
          movePart(d.partId, { x: pos.x, y: pos.y, z: pos.z })
        }
      }
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
  }, [camera, controls, gl, moveAssembly, movePart, raycaster])

  return (
    <>
      <color attach="background" args={['#1a1a2e']} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 4]} intensity={1} />

      <gridHelper args={[gridSize, gridSize, 0x444466, 0x333355]} />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        mouseButtons={{
          LEFT: null,
          MIDDLE: THREE.MOUSE.PAN,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
      />

      <BoardCreator
        gridSize={gridSize}
        onClearSelection={() => { onSelectIds([]); onEyedropperCancel?.() }}
        modifyingPart={modifyingPartId ? parts.find((p) => p.id === modifyingPartId) ?? null : null}
        onChildPartCreated={(childId) => onSelectIds([childId])}
      />

      {showAxes && <AxisLines length={gridSize / 2} />}

      {parts.filter((p) => p.visible !== false && p.parentId == null && (p.assemblyId == null || assemblies.find((a) => a.id === p.assemblyId)?.visible !== false)).map((p) => {
        const asmPos = p.assemblyId ? assemblyPositionMap.get(p.assemblyId) : null
        const worldPos = asmPos
          ? { x: p.position.x + asmPos.x, y: p.position.y + asmPos.y, z: p.position.z + asmPos.z }
          : p.position
        let displayPos = worldPos
        if (livePos) {
          if (draggingRef.current?.assemblyId && draggingRef.current.assemblyId === p.assemblyId) {
            displayPos = { x: p.position.x + livePos.x, y: p.position.y + livePos.y, z: p.position.z + livePos.z }
          } else if (draggingRef.current?.partId === p.id && !draggingRef.current.assemblyId) {
            displayPos = livePos
          }
        }
        return (
          <Board
            key={p.id}
            ref={(mesh) => { if (mesh) meshRefs.current.set(p.id, mesh); else meshRefs.current.delete(p.id) }}
            {...p}
            position={displayPos}
            isSelected={selectedIds.includes(p.id)}
            onSelect={() => onSelectIds([p.id])}
            onDragStart={(e) => handleDragStart(e, p)}
            onDoubleClick={() => { if (p.assemblyId) onSelectAssembly?.(p.assemblyId) }}
            onEyedropperClick={eyedropperActive && onColorSample ? (c) => { onColorSample(c); onEyedropperCancel?.() } : undefined}
            dimmed={modifyingPartId != null && p.id !== modifyingPartId}
            isModifying={modifyingPartId === p.id}
            onChildSelect={(childId) => onSelectIds([childId])}
            onChildMeshRef={handleChildMeshRef}
          />
        )
      })}

      <EffectComposer autoClear={false}>
        <Outline selection={selectedIds.flatMap((id) => { const m = meshRefs.current.get(id) ?? childMeshRefs.current.get(id); return m ? [m] : [] })} edgeStrength={5} />
      </EffectComposer>
    </>
  )
}
