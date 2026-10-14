import { expect, test } from "bun:test"
import { parseAltiumBinaryPcbDoc } from "altiumts"
import type { CadComponent } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { readReferenceBytes } from "../helpers/read-reference"

type PcbComponentId = NonNullable<CadComponent["pcb_component_id"]>

test("DP83825EVM preserves primitive bodies beside an embedded model", async () => {
  const pcbFilename = "ti-dp83825evm.PcbDoc"
  const document = parseAltiumBinaryPcbDoc(
    await readReferenceBytes(pcbFilename),
  )
  const circuitJson = convertAltiumPcbDocToCircuitJson(document, {
    resolveEmbeddedModelUrl: ({ embeddedModel }) =>
      `/cad-models/${pcbFilename}/${embeddedModel.index}.step`,
  })
  const cadComponents = circuitJson.filter(
    (element): element is CadComponent => element.type === "cad_component",
  )
  const embeddedModelOwnerIds = new Set<PcbComponentId>(
    cadComponents
      .filter((cadComponent) => cadComponent.model_step_url !== undefined)
      .map((cadComponent) => cadComponent.pcb_component_id)
      .filter(
        (pcbComponentId): pcbComponentId is PcbComponentId =>
          pcbComponentId !== undefined,
      ),
  )
  const mixedCadModelGroups = [...embeddedModelOwnerIds]
    .map((pcbComponentId) =>
      cadComponents.filter(
        (cadComponent) => cadComponent.pcb_component_id === pcbComponentId,
      ),
    )
    .filter((group) =>
      group.some((cadComponent) => cadComponent.model_jscad !== undefined),
    )

  expect(mixedCadModelGroups).toHaveLength(1)
  expect(
    mixedCadModelGroups[0]?.filter(
      (cadComponent) => cadComponent.model_step_url !== undefined,
    ),
  ).toHaveLength(1)
  expect(
    mixedCadModelGroups[0]?.filter(
      (cadComponent) => cadComponent.model_jscad !== undefined,
    ),
  ).toHaveLength(20)

  const mixedPcbComponentId = mixedCadModelGroups[0]?.[0]?.pcb_component_id
  const circuitJsonWithoutModelUrls = convertAltiumPcbDocToCircuitJson(document)
  expect(
    circuitJsonWithoutModelUrls.filter(
      (element): element is CadComponent =>
        element.type === "cad_component" &&
        element.pcb_component_id === mixedPcbComponentId &&
        element.model_jscad !== undefined,
    ),
  ).toHaveLength(20)
})
