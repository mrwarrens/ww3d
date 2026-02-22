import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import Scene from './components/Scene'
import PartPanel from './components/PartPanel'
import { useProjectStore } from './stores/projectStore'

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const parts = useProjectStore((s) => s.project.parts)
  const selectedPart = parts.find((p) => p.id === selectedId) ?? null

  return (
    <>
      <div id="info">
        Left-click drag: draw board &middot; Right-click drag: orbit &middot; Scroll: zoom
      </div>
      <PartPanel part={selectedPart} />
      <Canvas
        camera={{ fov: 60, near: 0.1, far: 100, position: [3, 2, 3] }}
        gl={{ antialias: true }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <Scene selectedId={selectedId} onSelectId={setSelectedId} />
      </Canvas>
    </>
  )
}
