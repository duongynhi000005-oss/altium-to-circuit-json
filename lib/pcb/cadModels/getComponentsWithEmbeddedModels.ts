import { type AltiumBinaryPcbDoc, AltiumComponentBodyRecord } from "altiumts"
import type { PcbConversionContext } from "../model"

type ComponentIndex = number

export function getComponentsWithEmbeddedModels(
  context: PcbConversionContext & { document: AltiumBinaryPcbDoc },
): Set<ComponentIndex> {
  const componentIndexes = new Set<ComponentIndex>()
  for (const componentBody of context.document.componentBodies) {
    if (!(componentBody instanceof AltiumComponentBodyRecord)) continue
    if (!context.document.getEmbeddedModelForComponentBody(componentBody))
      continue
    if (componentBody.componentIndex !== undefined) {
      componentIndexes.add(componentBody.componentIndex)
    }
  }
  return componentIndexes
}
