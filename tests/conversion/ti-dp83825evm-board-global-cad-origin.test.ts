import { expect, test } from "bun:test"
import { parseAltiumBinaryPcbDoc } from "altiumts"
import type { CadComponent } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { readReferenceBytes } from "../helpers/read-reference"

test("DP83825EVM keeps board-global STEP geometry on J9", async () => {
  const pcbFilename = "ti-dp83825evm.PcbDoc"
  const document = parseAltiumBinaryPcbDoc(
    await readReferenceBytes(pcbFilename),
  )
  const circuitJson = convertAltiumPcbDocToCircuitJson(document, {
    resolveEmbeddedModelUrl: ({ embeddedModel }) =>
      `/cad-models/${pcbFilename}/${embeddedModel.index}.step`,
  })
  const j9CadModel = circuitJson.find(
    (element): element is CadComponent =>
      element.type === "cad_component" &&
      element.source_component_id === "source_component_altium_82",
  )

  expect(j9CadModel).toBeDefined()
  expect(j9CadModel?.position.x).toBeCloseTo(59.7408, 4)
  expect(j9CadModel?.position.y).toBeCloseTo(42.0116, 4)
  expect(j9CadModel?.model_origin_position?.x).toBeCloseTo(281.4747, 4)
  expect(j9CadModel?.model_origin_position?.y).toBeCloseTo(403.1852, 4)
})
