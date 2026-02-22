import { create } from 'zustand'
import type { BoardData } from '../components/Board'

export interface StoredBoard extends BoardData {
  id: string
}

interface ProjectStore {
  boards: StoredBoard[]
  addBoard: (board: BoardData) => void
  removeBoard: (id: string) => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  boards: [],
  addBoard: (board) =>
    set((state) => ({
      boards: [...state.boards, { ...board, id: crypto.randomUUID() }],
    })),
  removeBoard: (id) =>
    set((state) => ({
      boards: state.boards.filter((b) => b.id !== id),
    })),
}))
