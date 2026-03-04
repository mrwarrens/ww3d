import { type Part } from './Part'
import { type Assembly } from './Assembly'
import { type Constraint } from './Constraint'

export interface Project {
  id: string
  name: string
  parts: Part[]
  assemblies: Assembly[]
  constraints: Constraint[]
  gridSize: number
}

export function createProject(name = 'Untitled Project'): Project {
  return {
    id: crypto.randomUUID(),
    name,
    parts: [],
    assemblies: [],
    constraints: [],
    gridSize: 10,
  }
}

export function serializeProject(project: Project): string {
  return JSON.stringify(project)
}

export function deserializeProject(json: string): Project {
  const parsed = JSON.parse(json)
  return {
    ...parsed,
    assemblies: (parsed.assemblies ?? []).map((a: any) => ({ ...a, visible: a.visible ?? true })),
    constraints: parsed.constraints ?? [],
  } as Project
}
