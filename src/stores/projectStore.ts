import { create } from 'zustand'
import { type PartInit, createPart } from '../models/Part'
import { type Project, createProject } from '../models/Project'

interface ProjectStore {
  project: Project
  addPart: (init: PartInit) => void
  removePart: (id: string) => void
  movePart: (id: string, position: { x: number; y: number; z: number }) => void
  setProjectName: (name: string) => void
  loadProject: (project: Project) => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
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
  movePart: (id, position) =>
    set((state) => ({
      project: {
        ...state.project,
        parts: state.project.parts.map((p) => p.id === id ? { ...p, position } : p),
      },
    })),
  setProjectName: (name) =>
    set((state) => ({
      project: { ...state.project, name },
    })),
  loadProject: (project) => set(() => ({ project })),
}))
