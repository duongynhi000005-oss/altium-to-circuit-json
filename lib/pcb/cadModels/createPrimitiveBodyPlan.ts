import { type AltiumComponentBodyRecord, getPcbRegionGeometry } from "altiumts"
import type { Point } from "circuit-json"
import { milsToMillimeters } from "../geometry"
import { createPrimitiveBodyColor } from "./createPrimitiveBodyColor"
import { getLocalContourPoints } from "./getLocalContourPoints"
import type { JscadOperation } from "./jscadOperation"

const MINIMUM_BODY_HEIGHT_MM = 0.001

export function createPrimitiveBodyPlan({
  componentBody,
  componentPosition,
  layer,
}: {
  componentBody: AltiumComponentBodyRecord
  componentPosition: Point
  layer: "bottom" | "top"
}): JscadOperation | undefined {
  const bodyGeometry = getPcbRegionGeometry(componentBody)
  const outlinePoints = getLocalContourPoints({
    componentPosition,
    contour: bodyGeometry.outline,
  })
  if (outlinePoints.length < 3) return undefined

  const standoffHeight = milsToMillimeters(
    componentBody.standoffHeightMils ?? 0,
  )
  const overallHeight = milsToMillimeters(componentBody.overallHeightMils ?? 0)
  const bodyHeight = overallHeight - standoffHeight
  if (bodyHeight < MINIMUM_BODY_HEIGHT_MM) return undefined

  let profile: JscadOperation = {
    type: "fromPointsGeom2",
    points: outlinePoints,
  }
  const holeProfiles = bodyGeometry.holes.flatMap((hole) => {
    const points = getLocalContourPoints({ componentPosition, contour: hole })
    return points.length < 3
      ? []
      : [{ type: "fromPointsGeom2", points } satisfies JscadOperation]
  })
  if (holeProfiles.length > 0) {
    profile = { type: "subtract", shapes: [profile, ...holeProfiles] }
  }

  let solid: JscadOperation = {
    type: "extrudeLinear",
    options: { height: layer === "bottom" ? -bodyHeight : bodyHeight },
    shape: profile,
  }
  const standoffFromBoard =
    layer === "bottom" ? -standoffHeight : standoffHeight
  if (standoffFromBoard !== 0) {
    solid = {
      type: "translate",
      vector: [0, 0, standoffFromBoard],
      shape: solid,
    }
  }
  return {
    type: "colorize",
    color: createPrimitiveBodyColor(componentBody),
    shape: solid,
  }
}
