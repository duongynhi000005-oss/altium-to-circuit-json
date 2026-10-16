import { type AltiumPcbDocument, AltiumViaRecord } from "altiumts"
import { milsToMillimeters } from "../geometry"
import type { PcbCopperLayerMap } from "../layers"
import type { PcbRoutingConstraints } from "../model"
import { getHighestPriorityGlobalRule } from "./getHighestPriorityGlobalRule"
import { usesViaInPad } from "./usesViaInPad"

export function getPcbRoutingConstraints({
  document,
  layerMap,
}: {
  document: AltiumPcbDocument
  layerMap: PcbCopperLayerMap
}): PcbRoutingConstraints {
  const widthRule = getHighestPriorityGlobalRule({
    document,
    ruleKind: "Width",
  })
  const routingViasRule = getHighestPriorityGlobalRule({
    document,
    ruleKind: "RoutingVias",
  })
  const clearanceRule = getHighestPriorityGlobalRule({
    document,
    ruleKind: "Clearance",
  })
  const minimumTraceWidthMils = widthRule?.widthConstraint?.minimumMils
  const preferredTraceWidthMils = widthRule?.widthConstraint?.preferredMils
  const minimumCopperClearanceMils = clearanceRule?.clearanceMils
  const minimumViaHoleDiameterMils =
    routingViasRule?.viaHoleConstraint?.minimumMils
  const minimumViaPadDiameterMils =
    routingViasRule?.viaDiameterConstraint?.minimumMils
  const pcbBoard: PcbRoutingConstraints["pcbBoard"] = {}
  const routingConstraints: PcbRoutingConstraints = { pcbBoard }

  const hasBlindOrBuriedVia = document.records.some(
    (record) =>
      record instanceof AltiumViaRecord && record.kind === "blind-buried",
  )
  if (hasBlindOrBuriedVia) {
    pcbBoard.allow_blind_and_buried_vias = true
  }

  if (usesViaInPad({ document, layerMap })) {
    pcbBoard.is_via_in_pad_allowed = true
  }

  if (minimumTraceWidthMils !== undefined) {
    pcbBoard.min_trace_width = milsToMillimeters(minimumTraceWidthMils)
  }

  if (minimumCopperClearanceMils !== undefined) {
    const minimumCopperClearance = milsToMillimeters(minimumCopperClearanceMils)
    pcbBoard.min_trace_to_pad_edge_clearance = minimumCopperClearance
    pcbBoard.min_pad_edge_to_pad_edge_clearance = minimumCopperClearance
    pcbBoard.min_different_net_trace_edge_to_trace_edge_clearance =
      minimumCopperClearance
    pcbBoard.min_via_edge_to_pad_edge_clearance = minimumCopperClearance
  }

  if (minimumViaHoleDiameterMils !== undefined) {
    pcbBoard.min_via_hole_diameter = milsToMillimeters(
      minimumViaHoleDiameterMils,
    )
  }

  if (minimumViaPadDiameterMils !== undefined) {
    pcbBoard.min_via_pad_diameter = milsToMillimeters(minimumViaPadDiameterMils)
  }

  if (preferredTraceWidthMils !== undefined) {
    routingConstraints.sourceNetTraceWidthMillimeters = milsToMillimeters(
      preferredTraceWidthMils,
    )
  }

  return routingConstraints
}
