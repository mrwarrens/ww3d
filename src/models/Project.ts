import { type Part } from './Part'

export interface Project {
  id: string
  name: string
  parts: Part[]
  gridSize: number
}

export function createProject(name = 'Untitled Project'): Project {
  return {
    id: crypto.randomUUID(),
    name,
    parts: [],
    gridSize: 10,
  }
}

export function serializeProject(project: Project): string {
  return JSON.stringify(project)
}

export function deserializeProject(json: string): Project {
  return JSON.parse(json) as Project
}
