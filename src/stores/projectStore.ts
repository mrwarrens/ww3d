import { create } from 'zustand'
import { type Part, type PartInit, createPart } from '../models/Part'
import { type Project, createProject } from '../models/Project'

interface ProjectStore {
  project: Project
  history: Project[]
  future: Project[]
  addPart: (init: PartInit) => void
  removePart: (id: string) => void
  duplicatePart: (id: string) => string | null
  movePart: (id: string, position: { x: number; y: number; z: number }) => void
  updatePart: (id: string, changes: Partial<Pick<Part, 'name' | 'length' | 'width' | 'thickness' | 'rotation' | 'color' | 'position'>>) => void
  togglePartVisibility: (id: string) => void
  setProjectName: (name: string) => void
  setGridSize: (size: number) => void
  loadProject: (project: Project) => void
  undo: () => void
  redo: () => void
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: createProject(),
  history: [],
  future: [],
  addPart: (init) => {
    const current = get().project
    set((state) => ({
      history: [...state.history, current],
      future: [],
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
    }))
  },
  removePart: (id) => {
    const current = get().project
    set((state) => ({
      history: [...state.history, current],
      future: [],
      project: {
        ...state.project,
        parts: state.project.parts.filter((p) => p.id !== id),
      },
    }))
  },
  duplicatePart: (id) => {
    const source = get().project.parts.find((p) => p.id === id)
    if (!source) return null
    const newId = crypto.randomUUID()
    const newPart: Part = {
      ...source,
      id: newId,
      position: { ...source.position, x: source.position.x + 1, z: source.position.z + 1 },
    }
    const current = get().project
    set((state) => ({
      history: [...state.history, current],
      future: [],
      project: {
        ...state.project,
        parts: [...state.project.parts, newPart],
      },
    }))
    return newId
  },
  movePart: (id, position) => {
    const current = get().project
    set((state) => ({
      history: [...state.history, current],
      future: [],
      project: {
        ...state.project,
        parts: state.project.parts.map((p) => p.id === id ? { ...p, position } : p),
      },
    }))
  },
  updatePart: (id, changes) => {
    const current = get().project
    set((state) => ({
      history: [...state.history, current],
      future: [],
      project: {
        ...state.project,
        parts: state.project.parts.map((p) =>
          p.id === id ? { ...p, ...changes } : p
        ),
      },
    }))
  },
  togglePartVisibility: (id) => {
    const current = get().project
    set((state) => ({
      history: [...state.history, current],
      future: [],
      project: {
        ...state.project,
        parts: state.project.parts.map((p) =>
          p.id === id ? { ...p, visible: !p.visible } : p
        ),
      },
    }))
  },
  setProjectName: (name) => {
    const current = get().project
    set((state) => ({
      history: [...state.history, current],
      future: [],
      project: { ...state.project, name },
    }))
  },
  setGridSize: (size) => {
    const current = get().project
    set((state) => ({
      history: [...state.history, current],
      future: [],
      project: { ...state.project, gridSize: size },
    }))
  },
  loadProject: (project) => set(() => ({ project, history: [], future: [] })),
  undo: () => {
    const { history, project, future } = get()
    if (history.length === 0) return
    const previous = history[history.length - 1]
    set({
      history: history.slice(0, -1),
      future: [project, ...future],
      project: previous,
    })
  },
  redo: () => {
    const { future, project, history } = get()
    if (future.length === 0) return
    const next = future[0]
    set({
      future: future.slice(1),
      history: [...history, project],
      project: next,
    })
  },
}))
