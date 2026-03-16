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
  cutListSettings?: CutListSettings
}

export function createProject(name = 'Untitled Project'): Project {
  return {
    id: crypto.randomUUID(),
    name,
    parts: [],
    assemblies: [],
    gridSize: 10,
    cutListSettings: { sheetGoods: {}, hardwood: {}, dimensional: {} },
  }
}

export function serializeProject(project: Project): string {
  return JSON.stringify(project)
}

export function deserializeProject(json: string): Project {
  const parsed = JSON.parse(json)
  return {
    ...parsed,
    parts: (parsed.parts ?? []).map((p: any) => ({ materialType: 'hardwood', ...p })),
    assemblies: (parsed.assemblies ?? []).map((a: any) => ({ ...a, visible: a.visible ?? true })),
    cutListSettings: parsed.cutListSettings ?? { sheetGoods: {}, hardwood: {}, dimensional: {} },
  } as Project
}
