import { useRef, useCallback, useState, useMemo } from 'react'
import { useProjectStore } from '../stores/projectStore'
import { deserializeProject } from '../models/Project'
import { getCutListParts, groupByMaterialType, groupByThickness, packSheets, decimalBoardsForPart, toQuarterNotation, boardFeet, toNominalSize, assignBoardLength } from '../utils/cutlist'
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

  const totalBoards = useMemo(
    () => Math.ceil(parts.reduce((sum, p) => sum + decimalBoardsForPart(p, boardWidth, boardLength), 0)),
    [parts, boardWidth, boardLength]
  )
  const totalBoardFeet = totalBoards * boardFeet(boardLength, boardWidth, thickness)

  return (
    <section className="cutlist-hardwood-section">
      <h2 className="cutlist-section-header">{quarterKey} stock</h2>
      <div className="cutlist-settings-row">
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
      </div>
      <table className="cutlist-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Length</th>
            <th>Width</th>
            <th>Boards</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((part) => {
            const decimal = decimalBoardsForPart(part, boardWidth, boardLength)
            const tooLong = part.length > boardLength
            return (
              <tr key={part.id}>
                <td>{part.name}</td>
                <td>
                  {toFractionalInches(part.length)}
                  {tooLong && <span className="cutlist-warning"> ⚠ part exceeds board length</span>}
                </td>
                <td>{toFractionalInches(part.width)}</td>
                <td>{decimal.toFixed(2)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p>Total: {totalBoards} board{totalBoards !== 1 ? 's' : ''}, {totalBoardFeet.toFixed(2)} board-feet</p>
    </section>
  )
}

interface DimensionalSectionProps {
  nominalSize: string
  parts: Part[]
  initialLengths: number[]
  onSettingsChange: (nominalSize: string, lengths: number[]) => void
}

function DimensionalSection({ nominalSize, parts, initialLengths, onSettingsChange }: DimensionalSectionProps) {
  const [lengths, setLengths] = useState(initialLengths)
  const [newLength, setNewLength] = useState(96)

  function updateLengths(next: number[]) {
    setLengths(next)
    onSettingsChange(nominalSize, next)
  }

  const assignments = parts.map(p => assignBoardLength(p.length, lengths))

  const lengthCounts = new Map<number, number>()
  for (const assigned of assignments) {
    if (assigned !== null) {
      lengthCounts.set(assigned, (lengthCounts.get(assigned) ?? 0) + 1)
    }
  }

  const footerCounts = Array.from(lengthCounts.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([len, count]) => `${count}× ${len / 12}'`)
    .join(',  ')

  const totalLinearFeet = assignments
    .filter((a): a is number => a !== null)
    .reduce((sum, a) => sum + a / 12, 0)

  return (
    <section className="cutlist-dim-section">
      <h2>{nominalSize}</h2>
      <div className="cutlist-dim-lengths">
        {lengths.map((len, i) => (
          <span key={i} className="cutlist-dim-length-item">
            {len / 12}'
            <button onClick={() => updateLengths(lengths.filter((_, j) => j !== i))}>✕</button>
          </span>
        ))}
        <span className="cutlist-dim-length-add">
          <input
            type="number"
            value={newLength}
            onChange={e => setNewLength(Number(e.target.value))}
            min={1}
          />
          <button onClick={() => updateLengths([...lengths, newLength])}>Add</button>
        </span>
      </div>
      <table className="cutlist-dim-table">
        <thead>
          <tr>
            <th>Part Name</th>
            <th>Required Length</th>
            <th>Assigned Board</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((part, i) => {
            const assigned = assignments[i]
            return (
              <tr key={part.id}>
                <td>{part.name}</td>
                <td>{toFractionalInches(part.length)}</td>
                <td>
                  {assigned === null
                    ? <span className="cutlist-dim-warning">No board fits</span>
                    : `${assigned / 12}'`}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="cutlist-dim-footer">
        {footerCounts || 'No boards assigned'}
        {totalLinearFeet > 0 && ` — ${totalLinearFeet.toFixed(1)} linear ft total`}
      </p>
    </section>
  )
}

interface CutListViewProps {
  onClose?: () => void
}

export default function CutListView({ onClose }: CutListViewProps = {}) {
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

  const dimensionalParts = useMemo(() => materialGroups.dimensional, [materialGroups])
  const dimensionalByNominal = useMemo(() => {
    const map = new Map<string, Part[]>()
    for (const part of dimensionalParts) {
      const key = toNominalSize(part.thickness, part.width)
      const existing = map.get(key)
      if (existing) existing.push(part)
      else map.set(key, [part])
    }
    return map
  }, [dimensionalParts])
  const sortedNominalSizes = useMemo(
    () => Array.from(dimensionalByNominal.keys()).sort(),
    [dimensionalByNominal]
  )

  const handleDimensionalSettingsChange = useCallback((nominalSize: string, lengths: number[]) => {
    updateCutListSettings({
      sheetGoods: cutListSettings?.sheetGoods ?? {},
      hardwood: cutListSettings?.hardwood ?? {},
      dimensional: {
        ...(cutListSettings?.dimensional ?? {}),
        [nominalSize]: { availableLengths: lengths },
      },
    })
  }, [cutListSettings, updateCutListSettings])

  return (
    <div className="cutlist-page">
      <div className="cutlist-header">
        {onClose
          ? <button className="cutlist-close-btn" onClick={onClose}>✕</button>
          : <a href="#/" className="cutlist-back">← Design</a>
        }
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
      {sortedNominalSizes.length > 0 && (
        <div className="cutlist-dimensional-groups">
          {sortedNominalSizes.map((nominalSize) => (
            <DimensionalSection
              key={nominalSize}
              nominalSize={nominalSize}
              parts={dimensionalByNominal.get(nominalSize)!}
              initialLengths={cutListSettings?.dimensional[nominalSize]?.availableLengths ?? [96, 120, 144]}
              onSettingsChange={handleDimensionalSettingsChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
