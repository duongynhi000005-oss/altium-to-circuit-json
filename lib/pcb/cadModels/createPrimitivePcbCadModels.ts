import {
  type AltiumBinaryPcbDoc,
  AltiumComponentBodyRecord,
  type AltiumPcbContour,
  getPcbRegionGeometry,
} from "altiumts"
import type { CadComponent, PcbBoard, Point } from "circuit-json"
import { applyToPoint, translate } from "transformation-matrix"
import {
  milsToMillimeters,
  removeClosingPoint,
  toMillimeterPoint,
} from "../geometry"
import type { PcbConversionContext } from "../model"
import { getCadModelLayer } from "./getCadModelLayer"
import type { JscadColor, JscadOperation, JscadPoint2 } from "./jscadOperation"

const DEFAULT_PCB_THICKNESS_MM = 1.6
const MINIMUM_BODY_HEIGHT_MM = 0.001

type ComponentIndex = number

function getComponentsWithEmbeddedModels(
  context: PcbConversionContext & { document: AltiumBinaryPcbDoc },
): Set<ComponentIndex> {
  const componentIndexes = new Set<ComponentIndex>()
  for (const componentBody of context.document.componentBodies) {
    if (!(componentBody instanceof AltiumComponentBodyRecord)) continue
    if (!context.document.getEmbeddedModelForComponentBody(componentBody))
      continue
    if (componentBody.componentIndex !== undefined) {
      componentIndexes.add(componentBody.componentIndex)
    }
  }
  return componentIndexes
}

function getLocalContourPoints({
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

function createBodyColor(componentBody: AltiumComponentBodyRecord): JscadColor {
  const color = componentBody.getNumber("BODYCOLOR3D") ?? 0x808080
  return [
    (color & 0xff) / 255,
    ((color >> 8) & 0xff) / 255,
    ((color >> 16) & 0xff) / 255,
  ]
}

function createPrimitiveBodyPlan({
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
    color: createBodyColor(componentBody),
    shape: solid,
  }
}

export function createPrimitivePcbCadModels(
  context: PcbConversionContext & { document: AltiumBinaryPcbDoc },
): CadComponent[] {
  const componentsWithEmbeddedModels = getComponentsWithEmbeddedModels(context)
  const pcbBoard = context.elements.find(
    (element): element is PcbBoard => element.type === "pcb_board",
  )
  const boardSurfaceZ = (pcbBoard?.thickness ?? DEFAULT_PCB_THICKNESS_MM) / 2

  return context.document.componentBodies.flatMap(
    (componentBody, bodyIndex) => {
      if (!(componentBody instanceof AltiumComponentBodyRecord)) return []
      const componentIndex = componentBody.componentIndex
      if (
        componentIndex === undefined ||
        componentsWithEmbeddedModels.has(componentIndex)
      ) {
        return []
      }

      const component = context.document.getComponentForRecord(componentBody)
      const componentPosition = component?.position
      const pcbComponentId =
        context.componentContext.getPcbComponentId(componentBody)
      if (!component || !componentPosition || !pcbComponentId) return []

      const layer = getCadModelLayer({
        body: componentBody,
        componentSide: component.side,
      })
      const componentPositionMillimeters = toMillimeterPoint(componentPosition)
      const modelJscad = createPrimitiveBodyPlan({
        componentBody,
        componentPosition: componentPositionMillimeters,
        layer,
      })
      if (!modelJscad) return []

      return [
        {
          type: "cad_component",
          cad_component_id: `cad_component_altium_primitive_${bodyIndex}`,
          pcb_component_id: pcbComponentId,
          source_component_id: `source_component_altium_${componentIndex}`,
          position: {
            ...componentPositionMillimeters,
            z: layer === "bottom" ? -boardSurfaceZ : boardSurfaceZ,
          },
          rotation: { x: 0, y: 0, z: 0 },
          layer,
          model_jscad: modelJscad,
          model_unit_to_mm_scale_factor: 1,
          model_board_normal_direction: "z+",
          model_origin_position: { x: 0, y: 0, z: 0 },
          model_object_fit: "contain_within_bounds",
          anchor_alignment: "center",
          ...(componentBody.opacity !== undefined && componentBody.opacity < 1
            ? { show_as_translucent_model: true }
            : {}),
        } satisfies CadComponent,
      ]
    },
  )
}
