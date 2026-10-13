import type { AltiumPcbContour } from "altiumts"
import type { Point } from "circuit-json"
import { applyToPoint, translate } from "transformation-matrix"
import { removeClosingPoint, toMillimeterPoint } from "../geometry"
import type { JscadPoint2 } from "./jscadOperation"

export function getLocalContourPoints({
  componentPosition,
  contour,
}: {
  componentPosition: Point
  contour: AltiumPcbContour
}): JscadPoint2[] {
  const toComponentCoordinates = translate(
    -componentPosition.x,
    -componentPosition.y,
  )
  return removeClosingPoint({
    points: contour.points,
    maxEndpointGapMils: 0.0001,
  }).map((point) => {
    const pointMillimeters = toMillimeterPoint(point)
    const localPoint = applyToPoint(toComponentCoordinates, pointMillimeters)
    return [localPoint.x, localPoint.y]
  })
}
