import type { AltiumComponentRecord } from "altiumts"
import type { SourceSimpleChip } from "circuit-json"

export function createPcbSourceComponent({
  component,
  componentName,
  componentIndex,
  displayDesignator,
}: {
  component: AltiumComponentRecord
  componentName: string
  componentIndex: number
  displayDesignator: string
}): SourceSimpleChip {
  const displayText = component.comment?.trim()
  return {
    type: "source_component",
    ftype: "simple_chip",
    source_component_id: `source_component_altium_${componentIndex}`,
    name: componentName,
    display_name: displayDesignator,
    ...(displayText ? { display_value: displayText } : {}),
  }
}
