import { type AltiumBinaryPcbDoc, AltiumComponentBodyRecord } from "altiumts"
import type { CadComponent, PcbBoard } from "circuit-json"
import { toMillimeterPoint } from "../geometry"
import type { PcbConversionContext } from "../model"
import { createPrimitiveBodyPlan } from "./createPrimitiveBodyPlan"
import { getCadModelLayer } from "./getCadModelLayer"
import { getComponentsWithEmbeddedModels } from "./getComponentsWithEmbeddedModels"

const DEFAULT_PCB_THICKNESS_MM = 1.6

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
