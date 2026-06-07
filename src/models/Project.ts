import { type Part } from './Part'
import { type Assembly } from './Assembly'

export interface CutListSettings {
  sheetGoods: Record<string, { sheetWidth: number; sheetHeight: number }>
  hardwood: Record<string, { boardWidth: number; boardLength: number }>
  dimensional: Record<string, { availableLengths: number[] }>
}

export interface Project {
  id: string
  name: string
  parts: Part[]
  assemblies: Assembly[]
  gridSize: number
  schemaVersion?: number
  cutListSettings?: CutListSettings
}

export function createProject(name = 'Untitled Project'): Project {
  return {
    id: crypto.randomUUID(),
    name,
    parts: [],
    assemblies: [],
    gridSize: 10,
    schemaVersion: 1,
    cutListSettings: { sheetGoods: {}, hardwood: {}, dimensional: {} },
  }
}

export function serializeProject(project: Project): string {
  return JSON.stringify(project)
}

export function deserializeProject(json: string): Project {
  const parsed = JSON.parse(json)
  const assemblies = (parsed.assemblies ?? []).map((a: any) => ({ ...a, visible: a.visible ?? true }))
  let parts = (parsed.parts ?? []).map((p: any) => ({ materialType: 'hardwood', ...p }))

  if (!parsed.schemaVersion) {
    // Old projects stored part positions as world-absolute. Convert member parts to local.
    const assemblyPosMap = new Map<string, { x: number; y: number; z: number }>(
      assemblies.map((a: any) => [a.id, a.position])
    )
    parts = parts.map((p: any) => {
      if (p.assemblyId) {
        const asmPos = assemblyPosMap.get(p.assemblyId)
        if (asmPos) {
          return {
            ...p,
            position: {
              x: p.position.x - asmPos.x,
              y: p.position.y - asmPos.y,
              z: p.position.z - asmPos.z,
            },
          }
        }
      }
      return p
    })
  }

  return {
    ...parsed,
    schemaVersion: 1,
    parts,
    assemblies,
    cutListSettings: parsed.cutListSettings ?? { sheetGoods: {}, hardwood: {}, dimensional: {} },
  } as Project
}
