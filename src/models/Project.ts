import { type Part } from './Part'
import { type Assembly } from './Assembly'

export interface Project {
  id: string
  name: string
  parts: Part[]
  assemblies: Assembly[]
  gridSize: number
}

export function createProject(name = 'Untitled Project'): Project {
  return {
    id: crypto.randomUUID(),
    name,
    parts: [],
    assemblies: [],
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
    assemblies: parsed.assemblies ?? [],
  } as Project
}
