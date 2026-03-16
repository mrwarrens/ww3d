import { useRef, useCallback, useState, useMemo } from 'react'
import { useProjectStore } from '../stores/projectStore'
import { deserializeProject } from '../models/Project'
import { getCutListParts, groupByMaterialType, groupByThickness, packSheets, toQuarterNotation, glueUpBoardCount, boardFeet } from '../utils/cutlist'
import { toFractionalInches } from '../utils/units'
import SheetNestingDiagram from './SheetNestingDiagram'
import type { Part } from '../models/Part'

const GAP = 0.5

function useSheetSizesState(
  thicknesses: number[],
  cutListSettings: import('../models/Project').CutListSettings | undefined
) {
  const initial: Record<string, { sheetWidth: number; sheetHeight: number }> = {}
  for (const t of thicknesses) {
    const key = String(t)
    initial[key] = cutListSettings?.sheetGoods[key] ?? { sheetWidth: 48, sheetHeight: 96 }
  }
  return useState(initial)
}

interface ThicknessSectionProps {
  thickness: number
  parts: Part[]
  partsById: Map<string, Part>
  initialWidth: number
  initialHeight: number
  onSettingsChange: (thickness: number, sheetWidth: number, sheetHeight: number) => void
}

function ThicknessSection({ thickness, parts, partsById, initialWidth, initialHeight, onSettingsChange }: ThicknessSectionProps) {
  const [sheetWidth, setSheetWidth] = useState(initialWidth)
  const [sheetHeight, setSheetHeight] = useState(initialHeight)

  const sheets = useMemo(
    () => packSheets(parts, sheetWidth, sheetHeight, GAP),
    [parts, sheetWidth, sheetHeight]
  )

  const avgWaste = sheets.length > 0
    ? Math.round((sheets.reduce((sum, s) => sum + s.wastePercent, 0) / sheets.length) * 100)
    : 0

  return (
    <section className="cutlist-section">
      <h2>{toFractionalInches(thickness)}</h2>
      <div className="cutlist-section-inputs">
        <label>
          W&nbsp;
          <input
            type="number"
            value={sheetWidth}
            onChange={(e) => setSheetWidth(Number(e.target.value))}
            onBlur={() => onSettingsChange(thickness, sheetWidth, sheetHeight)}
            min={1}
          />
        </label>
        <label>
          H&nbsp;
          <input
            type="number"
            value={sheetHeight}
            onChange={(e) => setSheetHeight(Number(e.target.value))}
            onBlur={() => onSettingsChange(thickness, sheetWidth, sheetHeight)}
            min={1}
          />
        </label>
      </div>
      {sheets.map((sheet, i) => (
        <SheetNestingDiagram
          key={i}
          sheet={sheet}
          sheetWidth={sheetWidth}
          sheetHeight={sheetHeight}
          partsById={partsById}
        />
      ))}
      <p>{sheets.length} sheet{sheets.length !== 1 ? 's' : ''}, {avgWaste}% waste avg</p>
    </section>
  )
}

interface HardwoodSectionProps {
  thickness: number
  parts: Part[]
  initialBoardWidth: number
  initialBoardLength: number
  onSettingsChange: (thickness: number, boardWidth: number, boardLength: number) => void
}

function HardwoodSection({ thickness, parts, initialBoardWidth, initialBoardLength, onSettingsChange }: HardwoodSectionProps) {
  const [boardWidth, setBoardWidth] = useState(initialBoardWidth)
  const [boardLength, setBoardLength] = useState(initialBoardLength)

  const quarterKey = toQuarterNotation(thickness)

  const totalBoards = parts.reduce((sum, p) => sum + glueUpBoardCount(p.width, boardWidth), 0)
  const totalBoardFeet = parts.reduce((sum, p) => {
    const count = glueUpBoardCount(p.width, boardWidth)
    return sum + boardFeet(p.length, boardWidth * count, thickness)
  }, 0)

  return (
    <section className="cutlist-hardwood-section">
      <h2 className="cutlist-section-header">{quarterKey} stock</h2>
      <div className="cutlist-settings-row">
        <label>
          Board Width&nbsp;
          <input
            type="number"
            value={boardWidth}
            onChange={(e) => setBoardWidth(Number(e.target.value))}
            onBlur={() => onSettingsChange(thickness, boardWidth, boardLength)}
            min={1}
          />
        </label>
        <label>
          Board Length&nbsp;
          <input
            type="number"
            value={boardLength}
            onChange={(e) => setBoardLength(Number(e.target.value))}
            onBlur={() => onSettingsChange(thickness, boardWidth, boardLength)}
            min={1}
          />
        </label>
      </div>
      <table className="cutlist-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>L × W</th>
            <th>Boards</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((part) => {
            const count = glueUpBoardCount(part.width, boardWidth)
            const tooLong = part.length > boardLength
            return (
              <tr key={part.id}>
                <td>{part.name}</td>
                <td>
                  {toFractionalInches(part.length)} × {toFractionalInches(part.width)}
                  {tooLong && <span className="cutlist-warning"> ⚠ part exceeds board length</span>}
                </td>
                <td>{count}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p>Total: {totalBoards} board{totalBoards !== 1 ? 's' : ''}, {totalBoardFeet.toFixed(2)} board-feet</p>
    </section>
  )
}

export default function CutListView() {
  const projectName = useProjectStore((s) => s.project.name)
  const loadProject = useProjectStore((s) => s.loadProject)
  const parts = useProjectStore((s) => s.project.parts)
  const cutListSettings = useProjectStore((s) => s.project.cutListSettings)
  const updateCutListSettings = useProjectStore((s) => s.updateCutListSettings)
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

  const topLevel = useMemo(() => getCutListParts(parts), [parts])
  const materialGroups = useMemo(() => groupByMaterialType(topLevel), [topLevel])
  const sheetParts = useMemo(() => materialGroups.sheet, [materialGroups])
  const thicknessGroups = useMemo(() => groupByThickness(sheetParts), [sheetParts])
  const sortedThicknesses = useMemo(() => Array.from(thicknessGroups.keys()).sort((a, b) => a - b), [thicknessGroups])

  const hardwoodParts = useMemo(() => materialGroups.hardwood, [materialGroups])
  const hardwoodThicknessGroups = useMemo(() => groupByThickness(hardwoodParts), [hardwoodParts])
  const sortedHardwoodThicknesses = useMemo(
    () => Array.from(hardwoodThicknessGroups.keys()).sort((a, b) => b - a),
    [hardwoodThicknessGroups]
  )

  const partsById = useMemo(() => {
    const map = new Map<string, Part>()
    for (const p of parts) map.set(p.id, p)
    return map
  }, [parts])

  const handleSettingsChange = useCallback((thickness: number, sheetWidth: number, sheetHeight: number) => {
    const key = String(thickness)
    updateCutListSettings({
      sheetGoods: {
        ...(cutListSettings?.sheetGoods ?? {}),
        [key]: { sheetWidth, sheetHeight },
      },
      hardwood: cutListSettings?.hardwood ?? {},
      dimensional: cutListSettings?.dimensional ?? {},
    })
  }, [cutListSettings, updateCutListSettings])

  const handleHardwoodSettingsChange = useCallback((thickness: number, boardWidth: number, boardLength: number) => {
    const key = toQuarterNotation(thickness)
    updateCutListSettings({
      sheetGoods: cutListSettings?.sheetGoods ?? {},
      hardwood: {
        ...(cutListSettings?.hardwood ?? {}),
        [key]: { boardWidth, boardLength },
      },
      dimensional: cutListSettings?.dimensional ?? {},
    })
  }, [cutListSettings, updateCutListSettings])

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
      {sortedThicknesses.length === 0 ? null : (
        <div className="cutlist-sheet-section">
          {sortedThicknesses.map((thickness) => (
            <ThicknessSection
              key={thickness}
              thickness={thickness}
              parts={thicknessGroups.get(thickness)!}
              partsById={partsById}
              initialWidth={cutListSettings?.sheetGoods[String(thickness)]?.sheetWidth ?? 48}
              initialHeight={cutListSettings?.sheetGoods[String(thickness)]?.sheetHeight ?? 96}
              onSettingsChange={handleSettingsChange}
            />
          ))}
        </div>
      )}
      {sortedHardwoodThicknesses.length > 0 && (
        <div className="cutlist-hardwood-groups">
          {sortedHardwoodThicknesses.map((thickness) => {
            const quarterKey = toQuarterNotation(thickness)
            const settings = cutListSettings?.hardwood[quarterKey]
            return (
              <HardwoodSection
                key={thickness}
                thickness={thickness}
                parts={hardwoodThicknessGroups.get(thickness)!}
                initialBoardWidth={settings?.boardWidth ?? 6}
                initialBoardLength={settings?.boardLength ?? 96}
                onSettingsChange={handleHardwoodSettingsChange}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
