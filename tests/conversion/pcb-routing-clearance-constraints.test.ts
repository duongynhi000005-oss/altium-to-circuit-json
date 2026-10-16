import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

test("preserves the global copper clearance constraint", () => {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board",
      "|RECORD=Rule|RULEKIND=Clearance|SCOPE1EXPRESSION=All|SCOPE2EXPRESSION=All|ENABLED=TRUE|PRIORITY=1|GAP=4mil",
    ].join("\n"),
  )

  const circuitJson = convertAltiumPcbDocToCircuitJson(document)
  const board = circuitJson.find((element) => element.type === "pcb_board")

  expect(board).toMatchObject({
    min_trace_to_pad_edge_clearance: 0.1016,
    min_pad_edge_to_pad_edge_clearance: 0.1016,
    min_different_net_trace_edge_to_trace_edge_clearance: 0.1016,
    min_via_edge_to_pad_edge_clearance: 0.1016,
  })
})
