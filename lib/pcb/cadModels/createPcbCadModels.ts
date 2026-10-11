import { AltiumBinaryPcbDoc } from "altiumts"
import type { CadComponent } from "circuit-json"
import type { PcbConversionContext } from "../model"
import { createEmbeddedPcbCadModels } from "./createEmbeddedPcbCadModels"
import { createPrimitivePcbCadModels } from "./createPrimitivePcbCadModels"

export function createPcbCadModels(
  context: PcbConversionContext,
): CadComponent[] {
  if (!(context.document instanceof AltiumBinaryPcbDoc)) return []
  const binaryContext = { ...context, document: context.document }

  return [
    ...createEmbeddedPcbCadModels(binaryContext),
    ...createPrimitivePcbCadModels(binaryContext),
  ]
}
