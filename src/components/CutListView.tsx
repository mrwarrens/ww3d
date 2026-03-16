import { useRef, useCallback } from 'react'
import { useProjectStore } from '../stores/projectStore'
import { deserializeProject } from '../models/Project'

export default function CutListView() {
  const projectName = useProjectStore((s) => s.project.name)
  const loadProject = useProjectStore((s) => s.loadProject)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text !== 'string') return
      loadProject(deserializeProject(text))
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [loadProject])

  return (
    <div className="cutlist-page">
      <div className="cutlist-header">
        <a href="#/" className="cutlist-back">← Design</a>
        <span className="cutlist-project-name">{projectName}</span>
        <button className="cutlist-load-btn" onClick={() => fileInputRef.current?.click()}>Load</button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      <p>Cut list coming soon</p>
    </div>
  )
}
