import { type AltiumComponentBodyRecord, getPcbRegionGeometry } from "altiumts"
import type { Point } from "circuit-json"
import { toMillimeterPoint } from "../geometry"

export function isModelPositionOutsideBodyProjection({
  componentBody,
  modelPosition,
}: {
  componentBody: AltiumComponentBodyRecord
  modelPosition: Point
}): boolean {
  const bodyOutlinePoints =
    getPcbRegionGeometry(componentBody).outline.points.map(toMillimeterPoint)
  if (bodyOutlinePoints.length === 0) return false

  const outlineXs = bodyOutlinePoints.map((point) => point.x)
  const outlineYs = bodyOutlinePoints.map((point) => point.y)
  const minimumOutlineX = Math.min(...outlineXs)
  const maximumOutlineX = Math.max(...outlineXs)
  const minimumOutlineY = Math.min(...outlineYs)
  const maximumOutlineY = Math.max(...outlineYs)
  const projectedBodyDiagonal = Math.hypot(
    maximumOutlineX - minimumOutlineX,
    maximumOutlineY - minimumOutlineY,
  )
  const distanceOutsideProjectedBody = Math.hypot(
    Math.max(
      minimumOutlineX - modelPosition.x,
      0,
      modelPosition.x - maximumOutlineX,
    ),
    Math.max(
      minimumOutlineY - modelPosition.y,
      0,
      modelPosition.y - maximumOutlineY,
    ),
  )

  // Altium's component-body outline is the board-space projection of the
  // model. A MODEL.2D position displaced by more than the complete projection
  // span cannot be the placement that produced that projection.
  return (
    projectedBodyDiagonal > 0 &&
    distanceOutsideProjectedBody > projectedBodyDiagonal
  )
}
