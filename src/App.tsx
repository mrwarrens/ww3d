import { useState, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import Scene from './components/Scene'
import PartPanel from './components/PartPanel'
import { useProjectStore } from './stores/projectStore'
import { serializeProject } from './models/Project'

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const project = useProjectStore((s) => s.project)
  const selectedPart = project.parts.find((p) => p.id === selectedId) ?? null

  const saveProject = useCallback(() => {
    const json = serializeProject(project)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [project])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        saveProject()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [saveProject])

  return (
    <>
      <div id="info">
        Left-click drag: draw board &middot; Right-click drag: orbit &middot; Scroll: zoom
      </div>
      <button id="save-btn" onClick={saveProject}>Save</button>
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
