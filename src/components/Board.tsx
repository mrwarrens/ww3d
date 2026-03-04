import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { Part } from '../models/Part'
import { useProjectStore } from '../stores/projectStore'
import { getManifold, manifoldMeshToThreeGeometry } from '../utils/manifold'

const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })

interface BoardProps extends Part {
  isSelected: boolean
  onSelect: () => void
  onDragStart?: (e: ThreeEvent<PointerEvent>) => void
  onDoubleClick?: () => void
  onEyedropperClick?: (color: string) => void
  dimmed?: boolean
}

const Board = forwardRef<THREE.Mesh, BoardProps>(function Board({ id, length, width, thickness, position, rotation, color, isSelected, onSelect, onDragStart, onDoubleClick, onEyedropperClick, dimmed }, ref) {
  const allParts = useProjectStore(s => s.project.parts)
  const children = useMemo(() => allParts.filter(p => p.parentId === id), [allParts, id])

  const edgesGeo = useMemo(() => {
    const box = new THREE.BoxGeometry(length, thickness, width)
    const edges = new THREE.EdgesGeometry(box)
    box.dispose()
    return edges
  }, [length, width, thickness])

  useEffect(() => {
    return () => edgesGeo.dispose()
  }, [edgesGeo])

  const [csgGeo, setCsgGeo] = useState<THREE.BufferGeometry | null>(null)
  const prevCsgGeoRef = useRef<THREE.BufferGeometry | null>(null)

  // Stable string key — only recompute CSG when child geometry/transform actually changes
  const childKey = useMemo(
    () => children.map(c => `${c.id}:${c.length}:${c.width}:${c.thickness}:${c.position.x},${c.position.y},${c.position.z}:${c.rotation.x},${c.rotation.y},${c.rotation.z}:${c.operation ?? 'subtract'}`).join('|'),
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

    getManifold().then(({ Manifold }) => {
      if (cancelled) return

      let result = Manifold.cube([length, thickness, width], true)

      for (const child of currentChildren) {
        let childMf = Manifold.cube([child.length, child.thickness, child.width], true)

        const euler = new THREE.Euler(child.rotation.x, child.rotation.y, child.rotation.z)
        const mat4 = new THREE.Matrix4().makeRotationFromEuler(euler)
        mat4.setPosition(child.position.x, child.position.y, child.position.z)
        const e = mat4.elements
        const mat4x3: [number, number, number, number, number, number, number, number, number, number, number, number] = [
          e[0], e[1], e[2],
          e[4], e[5], e[6],
          e[8], e[9], e[10],
          e[12], e[13], e[14],
        ]
        childMf = childMf.transform(mat4x3)

        if ((child.operation ?? 'subtract') === 'subtract') {
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
  }, [childKey, length, width, thickness]) // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!isSelected) return
    e.stopPropagation()
    onDragStart?.(e)
  }

  return (
    <mesh ref={ref} position={[position.x, position.y, position.z]} rotation={[rotation.x, rotation.y, rotation.z]} onClick={handleClick} onDoubleClick={handleDoubleClick} onPointerDown={handlePointerDown}>
      {csgGeo
        ? <primitive object={csgGeo} attach="geometry" />
        : <boxGeometry args={[length, thickness, width]} />
      }
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} transparent={dimmed} opacity={dimmed ? 0.2 : 1} />
      {!csgGeo && <lineSegments geometry={edgesGeo} material={lineMat} />}
    </mesh>
  )
})

export default Board
