import type { Part } from '../models/Part'
import { toFractionalInches } from '../utils/units'

interface PartPanelProps {
  part: Part | null
}

export default function PartPanel({ part }: PartPanelProps) {
  if (!part) return null

  return (
    <div id="part-panel">
      <div className="part-panel-name">{part.name}</div>
      <div className="part-panel-dims">
        <span>L: {toFractionalInches(part.length)}</span>
        <span>W: {toFractionalInches(part.width)}</span>
        <span>T: {toFractionalInches(part.thickness)}</span>
      </div>
    </div>
  )
}
