import { create } from 'zustand'
import { type Part, type PartInit, createPart } from '../models/Part'
import { type Project, createProject } from '../models/Project'

interface ProjectStore {
  project: Project
  addPart: (init: PartInit) => void
  removePart: (id: string) => void
  duplicatePart: (id: string) => string | null
  movePart: (id: string, position: { x: number; y: number; z: number }) => void
  updatePart: (id: string, changes: Partial<Pick<Part, 'name' | 'length' | 'width' | 'thickness' | 'rotation'>>) => void
  togglePartVisibility: (id: string) => void
  setProjectName: (name: string) => void
  setGridSize: (size: number) => void
  loadProject: (project: Project) => void
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: createProject(),
  addPart: (init) =>
    set((state) => ({
      project: {
        ...state.project,
        parts: [
          ...state.project.parts,
          createPart({
            ...init,
            name: init.name ?? `Board ${state.project.parts.length + 1}`,
          }),
        ],
      },
    })),
  removePart: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        parts: state.project.parts.filter((p) => p.id !== id),
      },
    })),
  duplicatePart: (id) => {
    const source = get().project.parts.find((p) => p.id === id)
    if (!source) return null
    const newId = crypto.randomUUID()
    const newPart: Part = {
      ...source,
      id: newId,
      position: { ...source.position, x: source.position.x + 1, z: source.position.z + 1 },
    }
    set((state) => ({
      project: {
        ...state.project,
        parts: [...state.project.parts, newPart],
      },
    }))
    return newId
  },
  movePart: (id, position) =>
    set((state) => ({
      project: {
        ...state.project,
        parts: state.project.parts.map((p) => p.id === id ? { ...p, position } : p),
      },
    })),
  updatePart: (id, changes) =>
    set((state) => ({
      project: {
        ...state.project,
        parts: state.project.parts.map((p) =>
          p.id === id ? { ...p, ...changes } : p
        ),
      },
    })),
  togglePartVisibility: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        parts: state.project.parts.map((p) =>
          p.id === id ? { ...p, visible: !p.visible } : p
        ),
      },
    })),
  setProjectName: (name) =>
    set((state) => ({
      project: { ...state.project, name },
    })),
  setGridSize: (size) =>
    set((state) => ({
      project: { ...state.project, gridSize: size },
    })),
  loadProject: (project) => set(() => ({ project })),
}))
