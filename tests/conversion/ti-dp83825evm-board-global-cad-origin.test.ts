import { expect, test } from "bun:test"
import { parseAltiumBinaryPcbDoc } from "altiumts"
import type { CadComponent } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"
import { expectTiEvmConversion3dSnapshot } from "../helpers/expect-ti-evm-conversion-3d-snapshot"
import { readReferenceBytes } from "../helpers/read-reference"

test("DP83825EVM places J9 from its component-body projection", async () => {
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
  const rotatedTopCadModel = circuitJson.find(
    (element): element is CadComponent =>
      element.type === "cad_component" &&
      element.cad_component_id === "cad_component_altium_416",
  )
  const rotatedBottomCadModel = circuitJson.find(
    (element): element is CadComponent =>
      element.type === "cad_component" &&
      element.cad_component_id === "cad_component_altium_423",
  )

  expect(j9CadModel).toBeDefined()
  expect(j9CadModel?.position.x).toBeCloseTo(59.7408, 4)
  expect(j9CadModel?.position.y).toBeCloseTo(42.0116, 4)
  expect(j9CadModel?.model_origin_position).toEqual({ x: 0, y: 0, z: 0 })
  expect(rotatedTopCadModel?.layer).toBe("top")
  expect(rotatedTopCadModel?.position.x).toBeCloseTo(30.63082266, 8)
  expect(rotatedTopCadModel?.position.y).toBeCloseTo(73.25351872, 8)
  expect(rotatedTopCadModel?.model_origin_position).toEqual({
    x: 0,
    y: 0,
    z: 0,
  })
  expect(rotatedBottomCadModel?.layer).toBe("bottom")
  expect(rotatedBottomCadModel?.position.x).toBeCloseTo(39.23885472, 8)
  expect(rotatedBottomCadModel?.position.y).toBeCloseTo(51.0997454, 8)
  expect(rotatedBottomCadModel?.model_origin_position).toEqual({
    x: 0,
    y: 0,
    z: 0,
  })

  await expectTiEvmConversion3dSnapshot({
    circuitJson,
    pcbFilename,
    testPath: import.meta.path,
  })
}, 40_000)
