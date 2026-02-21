import { useState, useCallback } from 'react'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import Board from './Board'
import BoardCreator from './BoardCreator'

export default function Scene() {
  const [boards, setBoards] = useState([])

  const addBoard = useCallback((board) => {
    setBoards((prev) => [...prev, { ...board, id: crypto.randomUUID() }])
  }, [])

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

      <BoardCreator addBoard={addBoard} />

      {boards.map((b) => (
        <Board key={b.id} x={b.x} z={b.z} width={b.width} depth={b.depth} color={b.color} />
      ))}
    </>
  )
}
