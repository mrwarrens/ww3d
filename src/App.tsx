import { useState, useEffect, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import Scene from './components/Scene'
import PropertiesPanel from './components/PropertiesPanel'
import PartsList from './components/PartsList'
import CutListView from './components/CutListView'
import { useProjectStore } from './stores/projectStore'
import { serializeProject, deserializeProject } from './models/Project'
import type { CAMERA_PRESETS } from './utils/constants'

export default function App() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const selectedId = selectedIds[0] ?? null
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [showAxes, setShowAxes] = useState(false)
  const [eyedropperActive, setEyedropperActive] = useState(false)
  const [cutListOpen, setCutListOpen] = useState(false)
  const [modifyingPartId, setModifyingPartId] = useState<string | null>(null)
  const project = useProjectStore((s) => s.project)
  const parts = useProjectStore((s) => s.project.parts)
  const assemblies = useProjectStore((s) => s.project.assemblies)
  const gridSize = useProjectStore((s) => s.project.gridSize)
  const setGridSize = useProjectStore((s) => s.setGridSize)
  const loadProject = useProjectStore((s) => s.loadProject)
  const updatePart = useProjectStore((s) => s.updatePart)
  const togglePartVisibility = useProjectStore((s) => s.togglePartVisibility)
  const toggleAssemblyVisibility = useProjectStore((s) => s.toggleAssemblyVisibility)
  const addAssembly = useProjectStore((s) => s.addAssembly)
  const assignPartToAssembly = useProjectStore((s) => s.assignPartToAssembly)
  const removePartFromAssembly = useProjectStore((s) => s.removePartFromAssembly)
  const groupPartsIntoAssembly = useProjectStore((s) => s.groupPartsIntoAssembly)
  const removeAssembly = useProjectStore((s) => s.removeAssembly)
  const duplicateAssembly = useProjectStore((s) => s.duplicateAssembly)
  const renameAssembly = useProjectStore((s) => s.renameAssembly)
  const moveAssembly = useProjectStore((s) => s.moveAssembly)
  const undo = useProjectStore((s) => s.undo)
  const redo = useProjectStore((s) => s.redo)
  const selectedPart = project.parts.find((p) => p.id === selectedId) ?? null
  const selectedAssembly = assemblies.find((a) => a.id === selectedAssemblyId) ?? null
  const topLevelParts = parts.filter((p) => !p.parentId)
  const childParts = parts.filter((p) => p.parentId === (modifyingPartId ?? selectedId ?? ''))
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraPresetRef = useRef<((name: keyof typeof CAMERA_PRESETS) => void) | null>(null)

  const handleSelectIds = useCallback((ids: string[]) => {
    setSelectedIds(ids)
    setSelectedAssemblyId(null)
    setModifyingPartId((prev) => {
      if (!prev) return null
      if (ids.length === 0) return prev
      if (ids.includes(prev)) return prev
      // Keep modify mode if selecting a single child of the modifying part.
      // Read directly from the store (not the closure) so we always see the latest state,
      // even if a child was just added and React hasn't re-rendered yet.
      const latestParts = useProjectStore.getState().project.parts
      if (ids.length === 1 && latestParts.find((p) => p.id === ids[0])?.parentId === prev) return prev
      return null
    })
  }, [])

  const handleEnterModifyModeForCut = useCallback((cutId: string) => {
    if (!selectedId) return
    setModifyingPartId(selectedId)
    setSelectedIds([cutId])
    setSelectedAssemblyId(null)
  }, [selectedId])

  const handleExitModifyMode = useCallback(() => {
    setModifyingPartId((prev) => {
      if (prev) setSelectedIds([prev])
      else setSelectedIds([])
      return null
    })
  }, [])

  const handleSelectAssembly = useCallback((id: string | null) => {
    setSelectedAssemblyId(id)
    setSelectedIds([])
    setModifyingPartId(null)
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
      if (e.key === 'Escape' && cutListOpen) {
        setCutListOpen(false)
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        saveProject()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault()
        fileInputRef.current?.click()
      }
      const tag = (document.activeElement as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAssemblyId) {
        removeAssembly(selectedAssemblyId)
        handleSelectAssembly(null)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedAssemblyId && selectedIds.length === 0) {
        e.preventDefault()
        const newId = duplicateAssembly(selectedAssemblyId)
        if (newId) handleSelectAssembly(newId)
      }
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
  }, [saveProject, undo, redo, selectedIds, assemblies, groupPartsIntoAssembly, handleSelectIds, selectedAssemblyId, removeAssembly, handleSelectAssembly, duplicateAssembly, cutListOpen])

  return (
    <>
      <div id="top-bar">
        <div className="dropdown-group">
          <button className="dropdown-btn" id="menu-btn" onClick={() => { setMenuOpen((o) => !o); setCameraOpen(false) }}>Menu ▾</button>
          {menuOpen && (
            <>
              <div className="dropdown-backdrop" onClick={() => setMenuOpen(false)} />
              <div id="menu-dropdown" className="dropdown-menu">
                <div className="dropdown-section">Project</div>
                <button className="dropdown-item" onClick={() => { fileInputRef.current?.click(); setMenuOpen(false) }}>
                  <span>Load</span><span>⌘O</span>
                </button>
                <button className="dropdown-item" onClick={() => { saveProject(); setMenuOpen(false) }}>
                  <span>Save</span><span>⌘S</span>
                </button>
                <div className="dropdown-section">View</div>
                <div className="dropdown-grid-row">
                  <span>Grid: {gridSize}</span>
                  <button onClick={(e) => { e.stopPropagation(); setGridSize(Math.max(5, gridSize - 5)) }}>−</button>
                  <button onClick={(e) => { e.stopPropagation(); setGridSize(gridSize + 5) }}>+</button>
                </div>
                <button className="dropdown-item" onClick={() => setShowAxes((o) => !o)}>
                  Axes {showAxes ? 'On' : 'Off'}
                </button>
                <button className="dropdown-item" onClick={() => { setCutListOpen(true); setMenuOpen(false) }}>
                  Cut List
                </button>
                <div className="dropdown-section">Help</div>
                <button className="dropdown-item" onClick={() => { setHelpOpen((o) => !o); setMenuOpen(false) }}>
                  Keyboard Shortcuts
                </button>
              </div>
            </>
          )}
        </div>
        <div className="dropdown-group">
          <button className="dropdown-btn" id="camera-btn" onClick={() => { setCameraOpen((o) => !o); setMenuOpen(false) }}>Camera ▾</button>
          {cameraOpen && (
            <>
              <div className="dropdown-backdrop" onClick={() => setCameraOpen(false)} />
              <div id="camera-dropdown" className="dropdown-menu">
                <button className="dropdown-item" onClick={() => { cameraPresetRef.current?.('front'); setCameraOpen(false) }}>
                  <span>Front</span><span>1</span>
                </button>
                <button className="dropdown-item" onClick={() => { cameraPresetRef.current?.('right'); setCameraOpen(false) }}>
                  <span>Right</span><span>2</span>
                </button>
                <button className="dropdown-item" onClick={() => { cameraPresetRef.current?.('top'); setCameraOpen(false) }}>
                  <span>Top</span><span>3</span>
                </button>
                <button className="dropdown-item" onClick={() => { cameraPresetRef.current?.('iso'); setCameraOpen(false) }}>
                  <span>Iso</span><span>4</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {helpOpen && (
        <div id="help-pane" style={{ zIndex: 10, background: 'rgba(20,20,20,1)' }}>
          <button id="help-pane-close" onClick={() => setHelpOpen(false)} style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 16 }}>✕</button>
          <div className="help-section">Mouse / Drag</div>
          <div className="help-row"><span>Left-drag on empty grid</span><span>Draw board</span></div>
          <div className="help-row"><span>Left-drag on board</span><span>Move part</span></div>
          <div className="help-row"><span>Double-click board</span><span>Select its assembly</span></div>
          <div className="help-row"><span>Right-drag</span><span>Orbit</span></div>
          <div className="help-row"><span>Middle-drag / Shift+drag</span><span>Pan</span></div>
          <div className="help-row"><span>Scroll</span><span>Zoom</span></div>
          <div className="help-section">Selection</div>
          <div className="help-row"><span>Click parts list row</span><span>Select part</span></div>
          <div className="help-row"><span>Shift+click / Cmd+click</span><span>Multi-select</span></div>
          <div className="help-row"><span>Click assembly row</span><span>Select assembly</span></div>
          <div className="help-row"><span>Escape</span><span>Deselect</span></div>
          <div className="help-section">Edit</div>
          <div className="help-row"><span>Delete / Backspace</span><span>Delete selected part or assembly</span></div>
          <div className="help-row"><span>Cmd+D</span><span>Duplicate selected part or assembly</span></div>
          <div className="help-row"><span>Cmd+G</span><span>Group selection into assembly</span></div>
          <div className="help-row"><span>Cmd+Z</span><span>Undo</span></div>
          <div className="help-row"><span>Cmd+Shift+Z</span><span>Redo</span></div>
          <div className="help-row"><span>Cmd+S</span><span>Save project</span></div>
          <div className="help-section">Parts List</div>
          <div className="help-row"><span>Drag part onto assembly</span><span>Assign to assembly</span></div>
          <div className="help-row"><span>Right-click member part</span><span>Remove from assembly</span></div>
          <div className="help-row"><span>● / ○ button</span><span>Toggle visibility</span></div>
          <div className="help-row"><span>New Assembly button</span><span>Create empty assembly</span></div>
          <div className="help-section">View</div>
          <div className="help-row"><span>1 / 2 / 3 / 4</span><span>Front / Right / Top / Iso view</span></div>
          <div className="help-row"><span>Arrow keys</span><span>Orbit camera</span></div>
          <div className="help-row"><span>Shift+Arrow keys</span><span>Pan camera</span></div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {(selectedPart || (selectedAssembly && !selectedPart)) && (
        <PropertiesPanel
          part={selectedPart}
          assembly={selectedAssembly}
          onUpdate={(changes) => selectedId && updatePart(selectedId, changes)}
          onMoveAssembly={(position) => selectedAssemblyId && moveAssembly(selectedAssemblyId, position)}
          onRenameAssembly={(name) => selectedAssemblyId && renameAssembly(selectedAssemblyId, name)}
          onEyedropperActivate={() => setEyedropperActive(true)}
          onClose={() => { handleSelectIds([]); handleSelectAssembly(null) }}
        />
      )}
      <PartsList
        parts={topLevelParts}
        assemblies={assemblies}
        selectedIds={selectedIds}
        onSelectIds={handleSelectIds}
        selectedAssemblyId={selectedAssemblyId}
        onSelectAssembly={handleSelectAssembly}
        onToggleVisibility={togglePartVisibility}
        onToggleAssemblyVisibility={toggleAssemblyVisibility}
        onAddAssembly={() => addAssembly('Assembly ' + (assemblies.length + 1))}
        onAssignPart={assignPartToAssembly}
        onRemoveFromAssembly={removePartFromAssembly}
        modifyingPartId={modifyingPartId}
        childParts={childParts}
        selectedPartId={selectedId}
        onEnterModifyMode={() => selectedId && setModifyingPartId(selectedId)}
        onExitModifyMode={handleExitModifyMode}
        onEnterModifyModeForCut={handleEnterModifyModeForCut}
      />
      {cutListOpen && (
        <div className="cutlist-modal-backdrop" onClick={() => setCutListOpen(false)}>
          <div className="cutlist-modal-card" onClick={(e) => e.stopPropagation()}>
            <CutListView onClose={() => setCutListOpen(false)} />
          </div>
        </div>
      )}
      <Canvas
        camera={{ fov: 60, near: 0.1, far: 200, position: [3, 2, 3] }}
        gl={{ antialias: true }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <Scene
          selectedIds={
            selectedIds.length > 0
              ? selectedIds
              : selectedAssemblyId
                ? parts.filter((p) => p.assemblyId === selectedAssemblyId).map((p) => p.id)
                : []
          }
          onSelectIds={handleSelectIds}
          onSelectAssembly={handleSelectAssembly}
          cameraPresetRef={cameraPresetRef}
          isAssemblySelected={!!selectedAssemblyId}
          eyedropperActive={eyedropperActive}
          onColorSample={(color) => { if (selectedId) updatePart(selectedId, { color }); setEyedropperActive(false) }}
          onEyedropperCancel={() => setEyedropperActive(false)}
          showAxes={showAxes}
          modifyingPartId={modifyingPartId}
          onExitModifyMode={handleExitModifyMode}
        />
      </Canvas>
    </>
  )
}
