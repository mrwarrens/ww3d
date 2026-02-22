export interface Part {
  id: string
  name: string
  length: number      // x-axis extent, inches
  width: number       // z-axis extent, inches
  thickness: number   // y-axis extent, inches
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }  // Euler angles, radians
  color: string       // hex string
}

export type PartInit = {
  length: number
  width: number
  position: { x: number; y: number; z: number }
  name?: string
  thickness?: number
  rotation?: { x: number; y: number; z: number }
  color?: string
}

export function createPart(init: PartInit): Part {
  return {
    id: crypto.randomUUID(),
    name: init.name ?? 'Board',
    length: init.length,
    width: init.width,
    thickness: init.thickness ?? 0.75,
    position: init.position,
    rotation: init.rotation ?? { x: 0, y: 0, z: 0 },
    color: init.color ?? '#8B6914',
  }
}
