import { useMemo } from 'react'
import * as THREE from 'three'
import { BOARD_THICKNESS } from '../utils/constants'

const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })

export interface BoardData {
  x: number
  z: number
  width: number
  depth: number
  color: string
}

export default function Board({ x, z, width, depth, color }: BoardData) {
  const edgesGeo = useMemo(() => {
    const box = new THREE.BoxGeometry(width, BOARD_THICKNESS, depth)
    const edges = new THREE.EdgesGeometry(box)
    box.dispose()
    return edges
  }, [width, depth])

  return (
    <mesh position={[x, BOARD_THICKNESS / 2, z]}>
      <boxGeometry args={[width, BOARD_THICKNESS, depth]} />
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
      <lineSegments geometry={edgesGeo} material={lineMat} />
    </mesh>
  )
}
