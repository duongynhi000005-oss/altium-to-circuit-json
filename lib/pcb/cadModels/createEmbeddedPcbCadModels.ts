import { type AltiumBinaryPcbDoc, AltiumComponentBodyRecord } from "altiumts"
import type { CadComponent, PcbBoard } from "circuit-json"
import type { PcbConversionContext } from "../model"
import { getBoardFrameModelCcwRotationDegrees } from "./getBoardFrameModelCcwRotationDegrees"
import { getCadModelLayer } from "./getCadModelLayer"
import { getEmbeddedCadModelPlacement } from "./getEmbeddedCadModelPlacement"

const DEFAULT_PCB_THICKNESS_MM = 1.6

export function createEmbeddedPcbCadModels(
  context: PcbConversionContext & { document: AltiumBinaryPcbDoc },
): CadComponent[] {
  const resolveEmbeddedModelUrl = context.options.resolveEmbeddedModelUrl
  if (!resolveEmbeddedModelUrl) return []

  const pcbBoard = context.elements.find(
    (element): element is PcbBoard => element.type === "pcb_board",
  )

  return context.document.componentBodies.flatMap(
    (componentBody, bodyIndex) => {
      if (!(componentBody instanceof AltiumComponentBodyRecord)) return []
      const componentIndex = componentBody.componentIndex
      if (componentIndex === undefined || !componentBody.modelPosition)
        return []

      const embeddedModel =
        context.document.getEmbeddedModelForComponentBody(componentBody)
      if (!embeddedModel) return []
      const modelStepUrl = resolveEmbeddedModelUrl({ embeddedModel })
      if (!modelStepUrl) return []

      const pcbComponentId =
        context.componentContext.getPcbComponentId(componentBody)
      const component = context.document.getComponentForRecord(componentBody)
      if (!pcbComponentId || !component) return []

      const layer = getCadModelLayer({
        body: componentBody,
        componentSide: component.side,
      })
      const modelZOffsetMillimeters =
        componentBody.getAltiumMeasurement("MODEL.3D.DZ")?.toMillimeters() ?? 0
      const boardSurfaceZ =
        (pcbBoard?.thickness ?? DEFAULT_PCB_THICKNESS_MM) / 2
      const positionZ =
        layer === "bottom"
          ? -boardSurfaceZ - modelZOffsetMillimeters
          : boardSurfaceZ + modelZOffsetMillimeters
      const placement = getEmbeddedCadModelPlacement({
        component,
        componentBody,
      })

      return [
        {
          type: "cad_component",
          cad_component_id: `cad_component_altium_${bodyIndex}`,
          pcb_component_id: pcbComponentId,
          source_component_id: `source_component_altium_${componentIndex}`,
          position: { ...placement.position, z: positionZ },
          rotation: getBoardFrameModelCcwRotationDegrees({
            body: componentBody,
            layer,
          }),
          layer,
          model_step_url: modelStepUrl,
          model_unit_to_mm_scale_factor: 1,
          model_board_normal_direction: "z+",
          model_origin_position: { ...placement.modelOriginPosition, z: 0 },
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
