import { create } from 'zustand'
import { type Part, type PartInit, createPart } from '../models/Part'
import { type Assembly, createAssembly } from '../models/Assembly'
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
  addAssembly: (name: string) => string
  assignPartToAssembly: (partId: string, assemblyId: string) => void
  removePartFromAssembly: (partId: string) => void
  groupPartsIntoAssembly: (partIds: string[], name: string) => string
  moveAssembly: (id: string, position: { x: number; y: number; z: number }) => void
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
  addAssembly: (name) => {
    const assembly = createAssembly(name)
    const current = get().project
    set((state) => ({
      history: [...state.history, current],
      future: [],
      project: {
        ...state.project,
        assemblies: [...state.project.assemblies, assembly],
      },
    }))
    return assembly.id
  },
  assignPartToAssembly: (partId, assemblyId) => {
    const current = get().project
    set((state) => ({
      history: [...state.history, current],
      future: [],
      project: {
        ...state.project,
        parts: state.project.parts.map((p) =>
          p.id === partId ? { ...p, assemblyId } : p
        ),
      },
    }))
  },
  removePartFromAssembly: (partId) => {
    const current = get().project
    set((state) => ({
      history: [...state.history, current],
      future: [],
      project: {
        ...state.project,
        parts: state.project.parts.map((p) =>
          p.id === partId ? { ...p, assemblyId: undefined } : p
        ),
      },
    }))
  },
  groupPartsIntoAssembly: (partIds, name) => {
    const assembly = createAssembly(name)
    const current = get().project
    set((state) => ({
      history: [...state.history, current],
      future: [],
      project: {
        ...state.project,
        assemblies: [...state.project.assemblies, assembly],
        parts: state.project.parts.map((p) =>
          partIds.includes(p.id) ? { ...p, assemblyId: assembly.id } : p
        ),
      },
    }))
    return assembly.id
  },
  moveAssembly: (id, position) => {
    const current = get().project
    const assembly = current.assemblies.find((a) => a.id === id)
    if (!assembly) return
    const dx = position.x - assembly.position.x
    const dy = position.y - assembly.position.y
    const dz = position.z - assembly.position.z
    set((state) => ({
      history: [...state.history, current],
      future: [],
      project: {
        ...state.project,
        assemblies: state.project.assemblies.map((a) =>
          a.id === id ? { ...a, position } : a
        ),
        parts: state.project.parts.map((p) =>
          p.assemblyId === id
            ? { ...p, position: { x: p.position.x + dx, y: p.position.y + dy, z: p.position.z + dz } }
            : p
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
