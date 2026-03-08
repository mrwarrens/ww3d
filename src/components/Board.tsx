import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import type { Part } from '../models/Part'
import { useProjectStore } from '../stores/projectStore'
import { getManifold, manifoldMeshToThreeGeometry, manifoldEllipse } from '../utils/manifold'

const ghostLineMat = new THREE.LineBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.8 })
const ghostSolidMat = new THREE.MeshBasicMaterial({ color: 0x44ff88, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide })

function makeEllipseExtrude(length: number, width: number, thickness: number): THREE.ExtrudeGeometry {
  const curve = new THREE.EllipseCurve(0, 0, length / 2, width / 2)
  const ellipseShape = new THREE.Shape(curve.getPoints(64))
  const geo = new THREE.ExtrudeGeometry(ellipseShape, { depth: thickness, bevelEnabled: false })
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, -thickness / 2, 0)
  return geo
}

function ChildGhost({ child, onSelect, onMeshRef }: { child: Part; onSelect: () => void; onMeshRef?: (mesh: THREE.Mesh | null) => void }) {
  const isEllipse = child.shape === 'ellipse'

  // EdgesGeometry for the subtract wireframe
  const edgesGeo = useMemo(() => {
    if (isEllipse) {
      const extrude = makeEllipseExtrude(child.length, child.width, child.thickness)
      const edges = new THREE.EdgesGeometry(extrude)
      extrude.dispose()
      return edges
    }
    const box = new THREE.BoxGeometry(child.length, child.thickness, child.width)
    const edges = new THREE.EdgesGeometry(box)
    box.dispose()
    return edges
  }, [isEllipse, child.length, child.thickness, child.width])

  // Solid ExtrudeGeometry for ellipse add-mesh and invisible hit-mesh
  const solidGeo = useMemo(() => {
    if (isEllipse) return makeEllipseExtrude(child.length, child.width, child.thickness)
    return null
  }, [isEllipse, child.length, child.width, child.thickness])

  useEffect(() => () => edgesGeo.dispose(), [edgesGeo])
  useEffect(() => () => solidGeo?.dispose(), [solidGeo])

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onSelect()
  }

  if ((child.operation ?? 'subtract') === 'add') {
    return (
      <mesh
        ref={(m) => onMeshRef?.(m)}
        name="child-ghost"
        position={[child.position.x, child.position.y, child.position.z]}
        rotation={[child.rotation.x, child.rotation.y, child.rotation.z]}
        onClick={handleClick}
      >
        {solidGeo
          ? <primitive object={solidGeo} attach="geometry" />
          : <boxGeometry args={[child.length, child.thickness, child.width]} />
        }
        <primitive object={ghostSolidMat} attach="material" />
      </mesh>
    )
  }

  // subtract case: lineSegments can't be used by Outline, so render an invisible
  // sibling mesh purely for the selection highlight effect
  return (
    <>
      <lineSegments
        name="child-ghost"
        geometry={edgesGeo}
        material={ghostLineMat}
        position={[child.position.x, child.position.y, child.position.z]}
        rotation={[child.rotation.x, child.rotation.y, child.rotation.z]}
        onClick={handleClick}
      />
      <mesh
        ref={(m) => onMeshRef?.(m)}
        position={[child.position.x, child.position.y, child.position.z]}
        rotation={[child.rotation.x, child.rotation.y, child.rotation.z]}
        raycast={() => null}
      >
        {solidGeo
          ? <primitive object={solidGeo} attach="geometry" />
          : <boxGeometry args={[child.length, child.thickness, child.width]} />
        }
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  )
}

interface BoardProps extends Part {
  isSelected: boolean
  onSelect: () => void
  onDragStart?: (e: ThreeEvent<PointerEvent>) => void
  onDoubleClick?: () => void
  onEyedropperClick?: (color: string) => void
  dimmed?: boolean
  isModifying?: boolean
  onChildSelect?: (childId: string) => void
  onChildMeshRef?: (childId: string, mesh: THREE.Mesh | null) => void
}

const Board = forwardRef<THREE.Mesh, BoardProps>(function Board({ id, length, width, thickness, position, rotation, color, shape, isSelected, onSelect, onDragStart, onDoubleClick, onEyedropperClick, dimmed, isModifying, onChildSelect, onChildMeshRef }, ref) {
  const allParts = useProjectStore(s => s.project.parts)
  const children = useMemo(() => allParts.filter(p => p.parentId === id), [allParts, id])

  const ellipseGeo = useMemo(() => {
    if (shape !== 'ellipse') return null
    const curve = new THREE.EllipseCurve(0, 0, length / 2, width / 2)
    const ellipseShape = new THREE.Shape(curve.getPoints(64))
    const geo = new THREE.ExtrudeGeometry(ellipseShape, { depth: thickness, bevelEnabled: false })
    geo.rotateX(-Math.PI / 2)
    geo.translate(0, -thickness / 2, 0)
    return geo
  }, [shape, length, width, thickness])

  useEffect(() => {
    return () => ellipseGeo?.dispose()
  }, [ellipseGeo])

  const [csgGeo, setCsgGeo] = useState<THREE.BufferGeometry | null>(null)
  const prevCsgGeoRef = useRef<THREE.BufferGeometry | null>(null)

  // Stable string key — only recompute CSG when child geometry/transform actually changes
  const childKey = useMemo(
    () => children.map(c => `${c.id}:${c.length}:${c.width}:${c.thickness}:${c.position.x},${c.position.y},${c.position.z}:${c.rotation.x},${c.rotation.y},${c.rotation.z}:${c.operation ?? 'subtract'}:${c.shape ?? 'box'}`).join('|'),
    [children]
  )

  const childrenRef = useRef<Part[]>([])
  childrenRef.current = children

  useEffect(() => {
    const currentChildren = childrenRef.current

    if (currentChildren.length === 0) {
      prevCsgGeoRef.current?.dispose()
      prevCsgGeoRef.current = null
      setCsgGeo(null)
      return
    }

    let cancelled = false

    getManifold().then((manifoldModule) => {
      if (cancelled) return
      const { Manifold } = manifoldModule

      // Build parent Manifold — use ellipse geometry if shape === 'ellipse'
      let result
      if (shape === 'ellipse') {
        result = manifoldEllipse(manifoldModule, length, width, thickness)
      } else {
        result = Manifold.cube([length, thickness, width], true)
      }

      for (const child of currentChildren) {
        const op = child.operation ?? 'subtract'
        let childMf
        if (child.shape === 'ellipse') {
          childMf = manifoldEllipse(manifoldModule, child.length, child.width, child.thickness)
        } else {
          // For subtract ops, extend child slightly beyond parent in Z (width) and Y
          // (thickness) to avoid coplanar face issues. child.width always equals
          // parent.width (dado spans full board depth) and the child top often lands
          // exactly on the parent top face, both causing coplanar faces that Manifold
          // can't cleanly subtract. A small extension avoids this.
          const cWid = op === 'subtract' ? child.width + 0.01 : child.width
          const cThk = op === 'subtract' ? child.thickness + 0.01 : child.thickness
          childMf = Manifold.cube([child.length, cThk, cWid], true)
        }

        // Manifold v3 transform() takes a full 4×4 column-major Mat4 (16 elements),
        // same layout as THREE.Matrix4.elements — do NOT use the old 12-element mat4x3.
        const mat4 = new THREE.Matrix4()
          .makeRotationFromEuler(new THREE.Euler(child.rotation.x, child.rotation.y, child.rotation.z))
          .setPosition(child.position.x, child.position.y, child.position.z)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        childMf = childMf.transform(mat4.elements as any)

        if (op === 'subtract') {
          result = result.subtract(childMf)
        } else {
          result = result.add(childMf)
        }
      }

      const newGeo = manifoldMeshToThreeGeometry(result.getMesh())

      if (cancelled) {
        newGeo.dispose()
        return
      }

      prevCsgGeoRef.current?.dispose()
      prevCsgGeoRef.current = newGeo
      setCsgGeo(newGeo)
    })

    return () => { cancelled = true }
  }, [childKey, length, width, thickness, shape]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      prevCsgGeoRef.current?.dispose()
      prevCsgGeoRef.current = null
    }
  }, [])

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (onEyedropperClick) {
      onEyedropperClick(color)
      return
    }
    onSelect()
  }

  const handleDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onDoubleClick?.()
  }

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return
    if (onEyedropperClick) {
      e.stopPropagation()
      return
    }
    if (!isSelected || isModifying) return
    e.stopPropagation()
    onDragStart?.(e)
  }

  return (
    <mesh ref={ref} position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]} onClick={handleClick} onDoubleClick={handleDoubleClick} onPointerDown={handlePointerDown}>
      {csgGeo
        ? <primitive object={csgGeo} attach="geometry" />
        : ellipseGeo
          ? <primitive object={ellipseGeo} attach="geometry" />
          : <boxGeometry args={[length, thickness, width]} />
      }
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} transparent={dimmed} opacity={dimmed ? 0.2 : 1} />
      {!csgGeo && <Edges color="white" transparent opacity={0.3} />}
      {isModifying && children.map(child => (
        <ChildGhost key={child.id} child={child} onSelect={() => onChildSelect?.(child.id)} onMeshRef={(mesh) => onChildMeshRef?.(child.id, mesh)} />
      ))}
    </mesh>
  )
})

export default Board
