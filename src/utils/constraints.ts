import type { Part } from '../models/Part'
import type { Constraint } from '../models/Constraint'

// Re-applies all constraints where changedPartId is the anchor, updating
// constrained parts in the returned array. Recurses into each newly-moved part
// to propagate chains. A visited Set guards against cycles.
export function propagateConstraints(
  parts: Part[],
  constraints: Constraint[],
  changedPartId: string,
  visited: Set<string> = new Set()
): Part[] {
  if (visited.has(changedPartId)) return parts
  visited.add(changedPartId)

  let updated = parts
  const downstream = constraints.filter((c) => c.anchorPartId === changedPartId)
  for (const constraint of downstream) {
    const anchorPart = updated.find((p) => p.id === constraint.anchorPartId)
    const constrainedPart = updated.find((p) => p.id === constraint.constrainedPartId)
    if (!anchorPart || !constrainedPart) continue
    const newPosition = computeConstrainedPosition(constraint, anchorPart, constrainedPart)
    updated = updated.map((p) =>
      p.id === constraint.constrainedPartId ? { ...p, position: newPosition } : p
    )
    updated = propagateConstraints(updated, constraints, constraint.constrainedPartId, visited)
  }
  return updated
}

// Returns the world-space position of a face on a given axis.
// Axis → half-dimension: x → length/2, z → width/2, y → thickness/2
export function getPartFacePosition(
  part: Part,
  axis: 'x' | 'y' | 'z',
  face: 'min' | 'center' | 'max'
): number {
  const center = part.position[axis]
  const halfDim = axis === 'x' ? part.length / 2
    : axis === 'z' ? part.width / 2
    : part.thickness / 2
  if (face === 'min') return center - halfDim
  if (face === 'max') return center + halfDim
  return center
}

// Computes the new position for the constrained part such that its constrainedFace
// on the given axis aligns with the anchor's anchorFace (plus offset).
// Only the constrained axis changes; other axes remain as-is.
export function computeConstrainedPosition(
  constraint: Constraint,
  anchorPart: Part,
  constrainedPart: Part
): { x: number; y: number; z: number } {
  const { axis, anchorFace, constrainedFace, offset } = constraint

  const anchorFacePos = getPartFacePosition(anchorPart, axis, anchorFace)
  const targetFacePos = anchorFacePos + offset

  // Back-solve: constrained part center so that its constrainedFace is at targetFacePos
  const halfDim = axis === 'x' ? constrainedPart.length / 2
    : axis === 'z' ? constrainedPart.width / 2
    : constrainedPart.thickness / 2

  let newCenter: number
  if (constrainedFace === 'min') newCenter = targetFacePos + halfDim
  else if (constrainedFace === 'max') newCenter = targetFacePos - halfDim
  else newCenter = targetFacePos

  return {
    ...constrainedPart.position,
    [axis]: newCenter,
  }
}
