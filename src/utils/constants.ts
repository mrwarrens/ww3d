export const BOARD_THICKNESS = 0.75 // 3/4"
export const SNAP_INCREMENT = 1 / 16 // 1/16"

export function snapToGrid(v: number): number {
  return Math.round(v / SNAP_INCREMENT) * SNAP_INCREMENT
}

export const CAMERA_PRESETS = {
  front: { position: [0, 5, 15] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
  right: { position: [15, 5, 0] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
  top:   { position: [0, 20, 0.001] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
  iso:   { position: [8, 6, 8] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
} as const
