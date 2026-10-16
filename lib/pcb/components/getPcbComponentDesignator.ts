import {
  type AltiumComponentRecord,
  type AltiumPcbDocument,
  AltiumTextRecord,
} from "altiumts"

export function getPcbComponentDesignator({
  component,
  componentIndex,
  document,
}: {
  component: AltiumComponentRecord
  componentIndex: number
  document: AltiumPcbDocument
}): string {
  const componentDesignator = component.designator?.trim()
  if (componentDesignator) return componentDesignator

  for (const record of document.getRecordsOwnedByComponent(component)) {
    if (!(record instanceof AltiumTextRecord) || !record.isDesignator) continue
    const textDesignator = record.text?.trim()
    if (textDesignator && textDesignator.toLowerCase() !== ".designator") {
      return textDesignator
    }
  }

  return `component_${componentIndex}`
}
