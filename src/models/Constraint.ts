export interface Constraint {
  id: string
  anchorPartId: string
  constrainedPartId: string
  axis: 'x' | 'y' | 'z'
  anchorFace: 'min' | 'center' | 'max'
  constrainedFace: 'min' | 'center' | 'max'
  offset: number  // inches
}

export function createConstraint(init: Omit<Constraint, 'id'>): Constraint {
  return {
    id: crypto.randomUUID(),
    ...init,
  }
}
