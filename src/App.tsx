import { useState, useEffect, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import Scene from './components/Scene'
import PartPanel from './components/PartPanel'
import PartOutliner from './components/PartOutliner'
import { useProjectStore } from './stores/projectStore'
import { serializeProject, deserializeProject } from './models/Project'
import type { CAMERA_PRESETS } from './utils/constants'

export default function App() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const selectedId = selectedIds[0] ?? null
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [gridPaneOpen, setGridPaneOpen] = useState(false)
  const project = useProjectStore((s) => s.project)
  const parts = useProjectStore((s) => s.project.parts)
  const assemblies = useProjectStore((s) => s.project.assemblies)
  const gridSize = useProjectStore((s) => s.project.gridSize)
  const setGridSize = useProjectStore((s) => s.setGridSize)
  const loadProject = useProjectStore((s) => s.loadProject)
  const updatePart = useProjectStore((s) => s.updatePart)
  const togglePartVisibility = useProjectStore((s) => s.togglePartVisibility)
  const addAssembly = useProjectStore((s) => s.addAssembly)
  const assignPartToAssembly = useProjectStore((s) => s.assignPartToAssembly)
  const removePartFromAssembly = useProjectStore((s) => s.removePartFromAssembly)
  const groupPartsIntoAssembly = useProjectStore((s) => s.groupPartsIntoAssembly)
  const moveAssembly = useProjectStore((s) => s.moveAssembly)
  const addConstraint = useProjectStore((s) => s.addConstraint)
  const removeConstraint = useProjectStore((s) => s.removeConstraint)
  const undo = useProjectStore((s) => s.undo)
  const redo = useProjectStore((s) => s.redo)
  const selectedPart = project.parts.find((p) => p.id === selectedId) ?? null
  const selectedAssembly = assemblies.find((a) => a.id === selectedAssemblyId) ?? null
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraPresetRef = useRef<((name: keyof typeof CAMERA_PRESETS) => void) | null>(null)

  const handleSelectIds = useCallback((ids: string[]) => {
    setSelectedIds(ids)
    setSelectedAssemblyId(null)
  }, [])

  const handleSelectAssembly = useCallback((id: string | null) => {
    setSelectedAssemblyId(id)
    setSelectedIds([])
  }, [])

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
      setSelectedIds([])
      setSelectedAssemblyId(null)
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
      const tag = (document.activeElement as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault()
        redo()
      } else if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        undo()
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault()
        if (selectedIds.length > 0) {
          groupPartsIntoAssembly(selectedIds, 'Assembly ' + (assemblies.length + 1))
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [saveProject, undo, redo, selectedIds, assemblies, groupPartsIntoAssembly, handleSelectIds])

  return (
    <>
      <button id="help-btn" onClick={() => setHelpOpen((o) => !o)}>?</button>
      {helpOpen && (
        <div id="help-pane" style={{ zIndex: 10, background: 'rgba(20,20,20,1)' }}>
          <div className="help-section">Mouse / Drag</div>
          <div className="help-row"><span>Left-drag on empty grid</span><span>Draw board</span></div>
          <div className="help-row"><span>Left-drag on board</span><span>Move part</span></div>
          <div className="help-row"><span>Double-click board</span><span>Select its assembly</span></div>
          <div className="help-row"><span>Right-drag</span><span>Orbit</span></div>
          <div className="help-row"><span>Middle-drag / Shift+drag</span><span>Pan</span></div>
          <div className="help-row"><span>Scroll</span><span>Zoom</span></div>
          <div className="help-section">Selection</div>
          <div className="help-row"><span>Click outliner row</span><span>Select part</span></div>
          <div className="help-row"><span>Shift+click / Cmd+click</span><span>Multi-select</span></div>
          <div className="help-row"><span>Click assembly row</span><span>Select assembly</span></div>
          <div className="help-row"><span>Escape</span><span>Deselect</span></div>
          <div className="help-section">Edit</div>
          <div className="help-row"><span>Delete / Backspace</span><span>Delete selected part</span></div>
          <div className="help-row"><span>Cmd+D</span><span>Duplicate selected part</span></div>
          <div className="help-row"><span>Cmd+G</span><span>Group selection into assembly</span></div>
          <div className="help-row"><span>Cmd+Z</span><span>Undo</span></div>
          <div className="help-row"><span>Cmd+Shift+Z</span><span>Redo</span></div>
          <div className="help-row"><span>Cmd+S</span><span>Save project</span></div>
          <div className="help-section">Outliner</div>
          <div className="help-row"><span>Drag part onto assembly</span><span>Assign to assembly</span></div>
          <div className="help-row"><span>Right-click member part</span><span>Remove from assembly</span></div>
          <div className="help-row"><span>● / ○ button</span><span>Toggle visibility</span></div>
          <div className="help-row"><span>New Assembly button</span><span>Create empty assembly</span></div>
          <div className="help-section">View</div>
          <div className="help-row"><span>1 / 2 / 3 / 4</span><span>Front / Right / Top / Iso view</span></div>
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
        <button id="grid-toggle-btn" onClick={() => setGridPaneOpen((o) => !o)}>
          Grid: {gridSize}
        </button>
        {gridPaneOpen && (
          <div id="grid-pane">
            <button onClick={() => setGridSize(Math.max(5, gridSize - 5))}>Grid −</button>
            <button onClick={() => setGridSize(gridSize + 5)}>Grid +</button>
          </div>
        )}
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
        assembly={selectedAssembly}
        onMoveAssembly={(position) => selectedAssemblyId && moveAssembly(selectedAssemblyId, position)}
        constraints={project.constraints.filter((c) => c.constrainedPartId === selectedId)}
        allParts={parts}
        onAddConstraint={(c) => addConstraint(c)}
        onRemoveConstraint={(id) => removeConstraint(id)}
      />
      <PartOutliner
        parts={parts}
        assemblies={assemblies}
        selectedIds={selectedIds}
        onSelectIds={handleSelectIds}
        selectedAssemblyId={selectedAssemblyId}
        onSelectAssembly={handleSelectAssembly}
        onToggleVisibility={togglePartVisibility}
        onAddAssembly={() => addAssembly('Assembly ' + (assemblies.length + 1))}
        onAssignPart={assignPartToAssembly}
        onRemoveFromAssembly={removePartFromAssembly}
      />
      <Canvas
        camera={{ fov: 60, near: 0.1, far: 100, position: [3, 2, 3] }}
        gl={{ antialias: true }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <Scene selectedId={selectedId} onSelectId={(id) => handleSelectIds(id ? [id] : [])} onSelectAssembly={handleSelectAssembly} cameraPresetRef={cameraPresetRef} />
      </Canvas>
    </>
  )
}
