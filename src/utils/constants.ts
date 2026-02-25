export const BOARD_THICKNESS = 0.75 // 3/4"
export const SNAP_INCREMENT = 1 / 16 // 1/16"

export function snapToGrid(v: number): number {
  return Math.round(v / SNAP_INCREMENT) * SNAP_INCREMENT
}
