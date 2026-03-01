export interface Assembly {
  id: string
  name: string
  position: { x: number; y: number; z: number }
}

export function createAssembly(name: string): Assembly {
  return {
    id: crypto.randomUUID(),
    name,
    position: { x: 0, y: 0, z: 0 },
  }
}
