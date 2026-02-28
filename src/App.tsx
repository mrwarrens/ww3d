import { useState, useEffect, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import Scene from './components/Scene'
import PartPanel from './components/PartPanel'
import PartOutliner from './components/PartOutliner'
import { useProjectStore } from './stores/projectStore'
import { serializeProject, deserializeProject } from './models/Project'
import type { CAMERA_PRESETS } from './utils/constants'

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const project = useProjectStore((s) => s.project)
  const parts = useProjectStore((s) => s.project.parts)
  const gridSize = useProjectStore((s) => s.project.gridSize)
  const setGridSize = useProjectStore((s) => s.setGridSize)
  const loadProject = useProjectStore((s) => s.loadProject)
  const updatePart = useProjectStore((s) => s.updatePart)
  const togglePartVisibility = useProjectStore((s) => s.togglePartVisibility)
  const selectedPart = project.parts.find((p) => p.id === selectedId) ?? null
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraPresetRef = useRef<((name: keyof typeof CAMERA_PRESETS) => void) | null>(null)

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

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text !== 'string') return
      loadProject(deserializeProject(text))
      setSelectedId(null)
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [loadProject])

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
      <button id="help-btn" onClick={() => setHelpOpen((o) => !o)}>?</button>
      {helpOpen && (
        <div id="help-pane">
          Left-drag: draw board &middot; Right-drag: orbit &middot; Middle-drag or Shift+drag: pan &middot; Scroll: zoom
        </div>
      )}
      <button id="save-btn" onClick={saveProject}>Save</button>
      <button id="load-btn" onClick={() => fileInputRef.current?.click()}>Load</button>
      <div id="camera-presets">
        <button onClick={() => cameraPresetRef.current?.('front')}>1 Front</button>
        <button onClick={() => cameraPresetRef.current?.('right')}>2 Right</button>
        <button onClick={() => cameraPresetRef.current?.('top')}>3 Top</button>
        <button onClick={() => cameraPresetRef.current?.('iso')}>4 Iso</button>
      </div>
      <div id="grid-controls">
        <button onClick={() => setGridSize(Math.max(5, gridSize - 5))}>Grid −</button>
        <span>Grid: {gridSize}</span>
        <button onClick={() => setGridSize(gridSize + 5)}>Grid +</button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <PartPanel
        part={selectedPart}
        onUpdate={(changes) => selectedId && updatePart(selectedId, changes)}
      />
      <PartOutliner parts={parts} selectedId={selectedId} onSelectId={setSelectedId} onToggleVisibility={togglePartVisibility} />
      <Canvas
        camera={{ fov: 60, near: 0.1, far: 100, position: [3, 2, 3] }}
        gl={{ antialias: true }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <Scene selectedId={selectedId} onSelectId={setSelectedId} cameraPresetRef={cameraPresetRef} />
      </Canvas>
    </>
  )
}
