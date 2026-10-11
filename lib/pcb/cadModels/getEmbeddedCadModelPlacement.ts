import type { AltiumComponentBodyRecord, AltiumComponentRecord } from "altiumts"
import type { PcbBoard, Point } from "circuit-json"
import { toMillimeterPoint } from "../geometry"
import { getPcbBoardDiagonal } from "./getPcbBoardDiagonal"

interface EmbeddedCadModelPlacement {
  modelOriginPosition: Point
  position: Point
}

export function getEmbeddedCadModelPlacement({
  component,
  componentBody,
  pcbBoard,
}: {
  component: AltiumComponentRecord
  componentBody: AltiumComponentBodyRecord
  pcbBoard: PcbBoard | undefined
}): EmbeddedCadModelPlacement {
  const componentPosition = component.position
  const modelPosition = componentBody.modelPosition
  if (!componentPosition || !modelPosition) {
    throw new Error("Embedded CAD model placement requires model coordinates")
  }

  const componentPositionMillimeters = toMillimeterPoint(componentPosition)
  const modelPositionMillimeters = toMillimeterPoint(modelPosition)
  const distanceFromComponent = Math.hypot(
    modelPositionMillimeters.x - componentPositionMillimeters.x,
    modelPositionMillimeters.y - componentPositionMillimeters.y,
  )
  const boardDiagonal = getPcbBoardDiagonal(pcbBoard)
  const hasBoardGlobalModelOrigin =
    boardDiagonal !== undefined && distanceFromComponent > boardDiagonal

  if (!hasBoardGlobalModelOrigin) {
    return {
      modelOriginPosition: { x: 0, y: 0 },
      position: modelPositionMillimeters,
    }
  }

  return {
    modelOriginPosition: {
      x: modelPositionMillimeters.x - componentPositionMillimeters.x,
      y: modelPositionMillimeters.y - componentPositionMillimeters.y,
    },
    position: componentPositionMillimeters,
  }
}
