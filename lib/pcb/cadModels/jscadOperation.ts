export type JscadPoint2 = [number, number]
export type JscadPoint3 = [number, number, number]
export type JscadColor = [number, number, number]

export type JscadOperation =
  | {
      type: "colorize"
      color: JscadColor
      shape: JscadOperation
    }
  | {
      type: "extrudeLinear"
      options: { height: number }
      shape: JscadOperation
    }
  | {
      type: "fromPointsGeom2"
      points: JscadPoint2[]
    }
  | {
      type: "subtract"
      shapes: JscadOperation[]
    }
  | {
      type: "translate"
      vector: JscadPoint3
      shape: JscadOperation
    }
