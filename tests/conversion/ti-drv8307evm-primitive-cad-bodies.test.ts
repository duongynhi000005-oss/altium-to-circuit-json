import { expect, test } from "bun:test"
import { parseAltiumBinaryPcbDoc } from "altiumts"
import type { CadComponent } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { readReferenceBytes } from "../helpers/read-reference"

test("DRV8307EVM converts primitive ComponentBody geometry", async () => {
  const pcbFilename = "ti-drv8307evm.PcbDoc"
  const document = parseAltiumBinaryPcbDoc(
    await readReferenceBytes(pcbFilename),
  )
  const circuitJson = convertAltiumPcbDocToCircuitJson(document, {
    resolveEmbeddedModelUrl: ({ embeddedModel }) =>
      `/cad-models/${pcbFilename}/${embeddedModel.index}.step`,
  })
  const primitiveCadModels = circuitJson.filter(
    (element): element is CadComponent =>
      element.type === "cad_component" && element.model_jscad !== undefined,
  )

  expect(primitiveCadModels.length).toBeGreaterThan(100)
  expect(
    primitiveCadModels.every(
      (cadModel) => cadModel.model_step_url === undefined,
    ),
  ).toBeTrue()
  expect(
    primitiveCadModels.every((cadModel) => cadModel.pcb_component_id),
  ).toBeTrue()
})
