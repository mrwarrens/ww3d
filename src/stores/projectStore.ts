import { create } from 'zustand'
import { type PartInit, createPart } from '../models/Part'
import { type Project, createProject } from '../models/Project'

interface ProjectStore {
  project: Project
  addPart: (init: PartInit) => void
  removePart: (id: string) => void
  setProjectName: (name: string) => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  project: createProject(),
  addPart: (init) =>
    set((state) => ({
      project: {
        ...state.project,
        parts: [...state.project.parts, createPart(init)],
      },
    })),
  removePart: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        parts: state.project.parts.filter((p) => p.id !== id),
      },
    })),
  setProjectName: (name) =>
    set((state) => ({
      project: { ...state.project, name },
    })),
}))
