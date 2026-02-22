import { create } from 'zustand'
import { type Part, type PartInit, createPart } from '../models/Part'

interface ProjectStore {
  parts: Part[]
  addPart: (init: PartInit) => void
  removePart: (id: string) => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  parts: [],
  addPart: (init) =>
    set((state) => ({
      parts: [...state.parts, createPart(init)],
    })),
  removePart: (id) =>
    set((state) => ({
      parts: state.parts.filter((p) => p.id !== id),
    })),
}))
