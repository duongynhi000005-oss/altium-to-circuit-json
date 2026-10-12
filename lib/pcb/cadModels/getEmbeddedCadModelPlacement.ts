import type { AltiumComponentBodyRecord, AltiumComponentRecord } from "altiumts"
import type { Point } from "circuit-json"
import { toMillimeterPoint } from "../geometry"
import { isModelPositionOutsideBodyProjection } from "./isModelPositionOutsideBodyProjection"

interface EmbeddedCadModelPlacement {
  modelOriginPosition: Point
  position: Point
}

export function getEmbeddedCadModelPlacement({
  component,
  componentBody,
}: {
  component: AltiumComponentRecord
  componentBody: AltiumComponentBodyRecord
}): EmbeddedCadModelPlacement {
  const componentPosition = component.position
  const modelPosition = componentBody.modelPosition
  if (!componentPosition || !modelPosition) {
    throw new Error("Embedded CAD model placement requires model coordinates")
  }

  const componentPositionMillimeters = toMillimeterPoint(componentPosition)
  const modelPositionMillimeters = toMillimeterPoint(modelPosition)
  const shouldUseComponentPosition = isModelPositionOutsideBodyProjection({
    componentBody,
    modelPosition: modelPositionMillimeters,
  })

  return {
    modelOriginPosition: { x: 0, y: 0 },
    position: shouldUseComponentPosition
      ? componentPositionMillimeters
      : modelPositionMillimeters,
  }
}
