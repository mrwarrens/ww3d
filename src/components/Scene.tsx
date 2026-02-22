import { useState, useEffect } from 'react'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import Board from './Board'
import BoardCreator from './BoardCreator'
import { useProjectStore } from '../stores/projectStore'

export default function Scene() {
  const parts = useProjectStore((s) => s.project.parts)
  const removePart = useProjectStore((s) => s.removePart)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        removePart(selectedId)
        setSelectedId(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, removePart])

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

      <BoardCreator onClearSelection={() => setSelectedId(null)} />

      {parts.map((p) => (
        <Board
          key={p.id}
          {...p}
          isSelected={p.id === selectedId}
          onSelect={() => setSelectedId(p.id)}
        />
      ))}
    </>
  )
}
