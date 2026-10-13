import type { AltiumComponentBodyRecord } from "altiumts"
import type { JscadColor } from "./jscadOperation"

export function createPrimitiveBodyColor(
  componentBody: AltiumComponentBodyRecord,
): JscadColor {
  const color = componentBody.getNumber("BODYCOLOR3D") ?? 0x808080
  return [
    (color & 0xff) / 255,
    ((color >> 8) & 0xff) / 255,
    ((color >> 16) & 0xff) / 255,
  ]
}
