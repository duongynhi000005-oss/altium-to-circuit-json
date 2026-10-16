import { expect, test } from "bun:test"
import { parseAltiumPcbDoc } from "altiumts"
import type { SourceSimpleChip } from "circuit-json"
import { convertAltiumPcbDocToCircuitJson } from "../../lib"

test("recovers unique component names from owned designator text", () => {
  const document = parseAltiumPcbDoc(
    [
      "|RECORD=Board|KIND0=0|VX0=0mil|VY0=0mil|KIND1=0|VX1=500mil|VY1=0mil|KIND2=0|VX2=500mil|VY2=500mil|KIND3=0|VX3=0mil|VY3=500mil|KIND4=0|VX4=0mil|VY4=0mil",
      "|RECORD=Component|ID=0|LAYER=TOP|X=100mil|Y=100mil",
      "|RECORD=Text|COMPONENT=0|LAYER=TOPOVERLAY|X=100mil|Y=100mil|HEIGHT=30mil|WIDESTRING=U1|DESIGNATOR=TRUE",
      "|RECORD=Component|ID=1|LAYER=TOP|X=200mil|Y=100mil",
      "|RECORD=Text|COMPONENT=1|LAYER=TOPOVERLAY|X=200mil|Y=100mil|HEIGHT=30mil|WIDESTRING=U1|DESIGNATOR=TRUE",
      "|RECORD=Component|ID=2|LAYER=TOP|X=300mil|Y=100mil",
      "|RECORD=Component|ID=3|LAYER=TOP|X=400mil|Y=100mil",
      "|RECORD=Text|COMPONENT=3|LAYER=TOPOVERLAY|X=400mil|Y=100mil|HEIGHT=30mil|WIDESTRING=.Designator|DESIGNATOR=TRUE",
    ].join("\n"),
  )

  const sourceComponents = convertAltiumPcbDocToCircuitJson(document).filter(
    (element): element is SourceSimpleChip =>
      element.type === "source_component",
  )

  expect(
    sourceComponents.map(({ display_name, name }) => ({ display_name, name })),
  ).toEqual([
    { display_name: "U1", name: "U1" },
    { display_name: "U1", name: "U1_1" },
    { display_name: "component_2", name: "component_2" },
    { display_name: "component_3", name: "component_3" },
  ])
})
