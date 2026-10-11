import type { PcbBoard } from "circuit-json"

export function getPcbBoardDiagonal(
  pcbBoard: PcbBoard | undefined,
): number | undefined {
  if (!pcbBoard?.width || !pcbBoard.height) return undefined
  return Math.hypot(pcbBoard.width, pcbBoard.height)
}
