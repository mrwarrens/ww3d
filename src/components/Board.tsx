import { useMemo } from 'react'
import * as THREE from 'three'
import type { Part } from '../models/Part'

const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })

export default function Board({ length, width, thickness, position, color }: Part) {
  const edgesGeo = useMemo(() => {
    const box = new THREE.BoxGeometry(length, thickness, width)
    const edges = new THREE.EdgesGeometry(box)
    box.dispose()
    return edges
  }, [length, width, thickness])

  return (
    <mesh position={[position.x, position.y, position.z]}>
      <boxGeometry args={[length, thickness, width]} />
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
      <lineSegments geometry={edgesGeo} material={lineMat} />
    </mesh>
  )
}
