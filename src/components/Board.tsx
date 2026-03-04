import { forwardRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { Part } from '../models/Part'

const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })

interface BoardProps extends Part {
  isSelected: boolean
  onSelect: () => void
  onDragStart?: (e: ThreeEvent<PointerEvent>) => void
  onDoubleClick?: () => void
  onEyedropperClick?: (color: string) => void
}

const Board = forwardRef<THREE.Mesh, BoardProps>(function Board({ length, width, thickness, position, rotation, color, isSelected, onSelect, onDragStart, onDoubleClick, onEyedropperClick }, ref) {
  const edgesGeo = useMemo(() => {
    const box = new THREE.BoxGeometry(length, thickness, width)
    const edges = new THREE.EdgesGeometry(box)
    box.dispose()
    return edges
  }, [length, width, thickness])

  useEffect(() => {
    return () => edgesGeo.dispose()
  }, [edgesGeo])

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
      <boxGeometry args={[length, thickness, width]} />
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
      <lineSegments geometry={edgesGeo} material={lineMat} />
    </mesh>
  )
})

export default Board
