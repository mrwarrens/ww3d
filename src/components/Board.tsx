import { useMemo } from 'react'
import * as THREE from 'three'
import { Outlines } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { Part } from '../models/Part'

const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })

interface BoardProps extends Part {
  isSelected: boolean
  onSelect: () => void
}

export default function Board({ length, width, thickness, position, color, isSelected, onSelect }: BoardProps) {
  const edgesGeo = useMemo(() => {
    const box = new THREE.BoxGeometry(length, thickness, width)
    const edges = new THREE.EdgesGeometry(box)
    box.dispose()
    return edges
  }, [length, width, thickness])

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onSelect()
  }

  return (
    <mesh position={[position.x, position.y, position.z]} onClick={handleClick}>
      <boxGeometry args={[length, thickness, width]} />
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
      <lineSegments geometry={edgesGeo} material={lineMat} />
      {isSelected && <Outlines color="white" thickness={2} />}
    </mesh>
  )
}
