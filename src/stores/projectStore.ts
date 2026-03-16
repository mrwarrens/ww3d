import { create } from 'zustand'
import { type Part, type PartInit, createPart } from '../models/Part'
import { type Assembly, createAssembly } from '../models/Assembly'
import { type Project, type CutListSettings, createProject } from '../models/Project'

interface ProjectStore {
  project: Project
  history: Project[]
  future: Project[]
  addPart: (init: PartInit) => void
  removePart: (id: string) => void
  removeParts: (ids: string[]) => void
  duplicatePart: (id: string) => string | null
  duplicateParts: (ids: string[]) => string[]
  movePart: (id: string, position: { x: number; y: number; z: number }) => void
  updatePart: (id: string, changes: Partial<Pick<Part, 'name' | 'length' | 'width' | 'thickness' | 'rotation' | 'color' | 'position' | 'operation' | 'shape' | 'materialType'>>) => void
  togglePartVisibility: (id: string) => void
  toggleAssemblyVisibility: (id: string) => void
  duplicateAssembly: (id: string) => string | null
  addAssembly: (name: string) => string
  assignPartToAssembly: (partId: string, assemblyId: string) => void
  removePartFromAssembly: (partId: string) => void
  groupPartsIntoAssembly: (partIds: string[], name: string) => string
  removeAssembly: (id: string) => void
  renameAssembly: (id: string, name: string) => void
  moveAssembly: (id: string, position: { x: number; y: number; z: number }) => void
  addChildPart: (parentId: string, init: PartInit) => string
  removeChildPart: (childId: string) => void
  setProjectName: (name: string) => void
  setGridSize: (size: number) => void
  updateCutListSettings: (settings: CutListSettings) => void
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
        parts: state.project.parts.filter((p) => p.id !== id && p.parentId !== id),
      },
    }))
  },
  removeParts: (ids) => {
    const current = get().project
    const idSet = new Set(ids)
    set((state) => ({
      history: [...state.history, current],
      future: [],
      project: {
        ...state.project,
        parts: state.project.parts.filter((p) => !idSet.has(p.id) && (p.parentId === undefined || !idSet.has(p.parentId))),
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
      position: { ...source.position },
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
  duplicateParts: (ids) => {
    const current = get().project
    const newParts: Part[] = ids.flatMap((id) => {
      const source = current.parts.find((p) => p.id === id)
      if (!source) return []
      return [{
        ...source,
        id: crypto.randomUUID(),
        position: { ...source.position },
      }]
    })
    const newIds = newParts.map((p) => p.id)
    set((state) => ({
      history: [...state.history, current],
      future: [],
      project: {
        ...state.project,
        parts: [...state.project.parts, ...newParts],
      },
    }))
    return newIds
  },
  duplicateAssembly: (id) => {
    const source = get().project.assemblies.find((a) => a.id === id)
    if (!source) return null
    const newAssembly = createAssembly(source.name)
    const memberParts = get().project.parts.filter((p) => p.assemblyId === id)
    const newParts = memberParts.map((p) => ({
      ...p,
      id: crypto.randomUUID(),
      assemblyId: newAssembly.id,
      position: { ...p.position, x: p.position.x + 1, z: p.position.z + 1 },
    }))
    const current = get().project
    set((state) => ({
      history: [...state.history, current],
      future: [],
      project: {
        ...state.project,
        assemblies: [...state.project.assemblies, newAssembly],
        parts: [...state.project.parts, ...newParts],
      },
    }))
    return newAssembly.id
  },
  addChildPart: (parentId, init) => {
    const child = createPart({ ...init, parentId, operation: init.operation ?? 'subtract' })
    const current = get().project
    set((state) => ({
      history: [...state.history, current],
      future: [],
      project: {
        ...state.project,
        parts: [...state.project.parts, child],
      },
    }))
    return child.id
  },
  removeChildPart: (childId) => {
    const current = get().project
    set((state) => ({
      history: [...state.history, current],
      future: [],
      project: {
        ...state.project,
        parts: state.project.parts.filter((p) => p.id !== childId),
      },
    }))
  },
  movePart: (id, position) => {
    const current = get().project
    set((state) => {
      const parts = state.project.parts.map((p) => p.id === id ? { ...p, position } : p)
      return {
        history: [...state.history, current],
        future: [],
        project: { ...state.project, parts },
      }
    })
  },
  updatePart: (id, changes) => {
    const current = get().project
    set((state) => {
      const parts = state.project.parts.map((p) => p.id === id ? { ...p, ...changes } : p)
      return {
        history: [...state.history, current],
        future: [],
        project: { ...state.project, parts },
      }
    })
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
  toggleAssemblyVisibility: (id) => {
    const current = get().project
    set((state) => ({
      history: [...state.history, current],
      future: [],
      project: {
        ...state.project,
        assemblies: state.project.assemblies.map((a) =>
          a.id === id ? { ...a, visible: !a.visible } : a
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
  removeAssembly: (id) => {
    const current = get().project
    set((state) => ({
      history: [...state.history, current],
      future: [],
      project: {
        ...state.project,
        assemblies: state.project.assemblies.filter((a) => a.id !== id),
        parts: state.project.parts.filter((p) => p.assemblyId !== id),
      },
    }))
  },
  renameAssembly: (id, name) => {
    const current = get().project
    set((state) => ({
      history: [...state.history, current],
      future: [],
      project: {
        ...state.project,
        assemblies: state.project.assemblies.map((a) =>
          a.id === id ? { ...a, name } : a
        ),
      },
    }))
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
  updateCutListSettings: (settings) => {
    const current = get().project
    set((state) => ({
      history: [...state.history, current],
      future: [],
      project: { ...state.project, cutListSettings: settings },
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
