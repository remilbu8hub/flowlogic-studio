// src/components/GraphCanvas.jsx

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Boxes, Cog, PackageCheck, Pencil, Wrench } from "lucide-react";
import { THEME } from "../config/theme";
import { getTransportTypeConfig } from "../config/transportTypes";
import { NodeType } from "../model/networkTypes";
import { graphLayers } from "../sim/graphHelpers";
import { scaleMin, scaleNum } from "../theme/uiScale";
import { riskColor } from "../ui/formatters";

const GRID = 40;
const NODE_WIDTH = scaleMin(216, 208);
const NODE_HEIGHT = scaleMin(112, 108);
const STAGE_X_STEP = 420;
const MIN_CANVAS_WIDTH = 2400;
const MIN_CANVAS_HEIGHT = 900;
const MIN_VIEWPORT_HEIGHT = 420;
const MAX_VIEWPORT_HEIGHT = 1200;
const BOUNDARY_LABEL_WIDTH = scaleNum(110);
const BOUNDARY_LABEL_HEIGHT = scaleNum(24);
const BOUNDARY_SKIP_PADDING = scaleNum(10);
const HORIZONTAL_BAND_OFFSET = scaleNum(120);
const RUN_BOX_UNITS = 50;
const RUN_BOX_MAX_VISIBLE = 10;

function nodeTypeLabel(type) {
  if (type === NodeType.SUPPLIER) return "Supplier";
  if (type === NodeType.FACTORY) return "Factory";
  if (type === NodeType.DC) return "DC";
  if (type === NodeType.RETAIL) return "Retail";
  if (type === NodeType.CUSTOMER) return "Customer";
  return type;
}

function stageRank(type) {
  if (type === NodeType.SUPPLIER) return 0;
  if (type === NodeType.FACTORY) return 1;
  if (type === NodeType.DC) return 2;
  if (type === NodeType.RETAIL) return 3;
  if (type === NodeType.CUSTOMER) return 4;
  return 99;
}

function stageColumnX(stage) {
  return 120 + stage * STAGE_X_STEP;
}

function stageColumnCenterX(stage) {
  return stageColumnX(stage) + NODE_WIDTH / 2;
}

function boundaryMidpointX(boundaryColumn) {
  const leftStage = boundaryColumn;
  const rightStage = boundaryColumn + 1;
  return (stageColumnCenterX(leftStage) + stageColumnCenterX(rightStage)) / 2;
}

function nodeModeValue(node) {
  const raw = String(node?.mode ?? "").trim().toLowerCase();
  if (raw === "push" || raw === "pull") return raw;
  return node?.type === NodeType.CUSTOMER ? "pull" : "push";
}

function nodeColor(type) {
  if (THEME.colors.background === "#0B1220") {
    if (type === NodeType.SUPPLIER) return "#182633";
    if (type === NodeType.FACTORY) return "#1B3142";
    if (type === NodeType.DC) return "#2F2C3A";
    if (type === NodeType.RETAIL) return "#2F3227";
    if (type === NodeType.CUSTOMER) return "#252E3C";
    return THEME.colors.surface;
  }

  if (type === NodeType.SUPPLIER) return "#dff3df";
  if (type === NodeType.FACTORY) return "#dceeff";
  if (type === NodeType.DC) return "#ffe6d6";
  if (type === NodeType.RETAIL) return "#fff1cc";
  if (type === NodeType.CUSTOMER) return "#ececec";
  return THEME.colors.surface;
}

function safeNum(x, fallback = 0) {
  return typeof x === "number" && Number.isFinite(x) ? x : fallback;
}

function snap(value, grid = GRID) {
  return Math.round(value / grid) * grid;
}

function findNode(nodes, nodeId) {
  return nodes.find((n) => n.id === nodeId) ?? null;
}

function findSimulationNode(result, nodeId) {
  return result?.perNode?.find((row) => row.id === nodeId) ?? null;
}

function displayInventoryType(node, simNode, autoInventoryType) {
  if (autoInventoryType) {
    return simNode?.inventoryType ?? node.stockForm ?? "generic";
  }
  return node.type === NodeType.CUSTOMER ? "none" : (node.stockForm ?? "generic");
}

function formatLabel(value, fallback = "-") {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;

  return raw
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function stockIndicator(stockForm) {
  const key = String(stockForm ?? "none").toLowerCase();

  if (key === "components") return { Icon: Cog, label: "Components" };
  if (key === "generic") return { Icon: Box, label: "Generic" };
  if (key === "configured") return { Icon: Wrench, label: "Configured" };
  if (key === "finished") return { Icon: PackageCheck, label: "Finished" };
  if (key === "packed") return { Icon: Boxes, label: "Packed" };
  if (key === "none") return { Icon: null, label: "None" };

  return { Icon: Box, label: formatLabel(key) };
}

function showsSourcingPosture(type) {
  return type === NodeType.SUPPLIER || type === NodeType.FACTORY || type === NodeType.DC;
}

function badgeStyle({
  textColor = THEME.colors.textPrimary,
  background = THEME.colors.surface,
  borderColor = THEME.colors.border,
}) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: scaleNum(5),
    minHeight: scaleMin(22, 22),
    maxWidth: "100%",
    padding: `${scaleNum(3)}px ${scaleNum(8)}px`,
    borderRadius: 999,
    fontSize: scaleMin(11, 11),
    fontWeight: 700,
    color: textColor,
    background,
    border: `1px solid ${borderColor}`,
    lineHeight: 1.1,
    whiteSpace: "nowrap",
  };
}

function inventoryBoxCount(quantity) {
  return Math.max(0, Math.min(RUN_BOX_MAX_VISIBLE, Math.ceil(Math.max(0, Number(quantity) || 0) / RUN_BOX_UNITS)));
}

function getNodeBox(node) {
  const x = safeNum(node.x, stageColumnX(stageRank(node.type)));
  const y = safeNum(node.y, 100);
  return {
    x,
    y,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    centerX: x + NODE_WIDTH / 2,
    centerY: y + NODE_HEIGHT / 2,
    left: x,
    right: x + NODE_WIDTH,
    top: y,
    bottom: y + NODE_HEIGHT,
  };
}

function getEdgePath(fromNode, toNode) {
  const from = getNodeBox(fromNode);
  const to = getNodeBox(toNode);

  const startX = from.right;
  const startY = from.centerY;
  const endX = to.left;
  const endY = to.centerY;

  const dx = Math.max(80, Math.abs(endX - startX) * 0.45);

  return {
    d: `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`,
    midX: (startX + endX) / 2,
    midY: (startY + endY) / 2,
  };
}

function gridBackground() {
  const lineColor =
    THEME.colors.background === "#0B1220" ? "rgba(229,231,235,0.08)" : "rgba(31,35,40,0.06)";

  return {
    backgroundColor: THEME.colors.surfacePanel ?? THEME.colors.surface,
    backgroundImage: `
      linear-gradient(to right, ${lineColor} 1px, transparent 1px),
      linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)
    `,
    backgroundSize: `${GRID}px ${GRID}px`,
    backgroundPosition: "0 0",
  };
}

function canvasSize(nodes) {
  const maxX = Math.max(0, ...nodes.map((n) => safeNum(n.x, 0)));
  const maxY = Math.max(0, ...nodes.map((n) => safeNum(n.y, 0)));

  return {
    width: Math.max(MIN_CANVAS_WIDTH, maxX + NODE_WIDTH + 320),
    height: Math.max(MIN_CANVAS_HEIGHT, maxY + NODE_HEIGHT + 240),
  };
}

function clampHeight(height) {
  return Math.max(MIN_VIEWPORT_HEIGHT, Math.min(MAX_VIEWPORT_HEIGHT, height));
}

function horizontalBandForType(type) {
  const stage = stageRank(type);
  if (stage === 99) return { minX: 40, maxX: 1900 };

  const columnX = stageColumnX(stage);
  return {
    minX: Math.max(40, columnX - HORIZONTAL_BAND_OFFSET),
    maxX: columnX + HORIZONTAL_BAND_OFFSET,
  };
}

function clampNodePosition(node, x, y) {
  const band = horizontalBandForType(node.type);
  return {
    x: snap(Math.max(band.minX, Math.min(band.maxX, x))),
    y: snap(Math.max(20, y)),
  };
}

function computeBoundaryX(nodes, boundaryColumn) {
  const fallbackBoundaryX = boundaryMidpointX(boundaryColumn);
  const pushBoxes = nodes
    .filter((node) => nodeModeValue(node) === "push")
    .map((node) => getNodeBox(node));
  const pullBoxes = nodes
    .filter((node) => nodeModeValue(node) === "pull")
    .map((node) => getNodeBox(node));

  if (pushBoxes.length > 0 && pullBoxes.length > 0) {
    const rightMostPushX = Math.max(...pushBoxes.map((box) => box.right));
    const leftMostPullX = Math.min(...pullBoxes.map((box) => box.left));
    return (rightMostPushX + leftMostPullX) / 2;
  }

  if (pushBoxes.length > 0) {
    const rightMostPushX = Math.max(...pushBoxes.map((box) => box.right));
    return rightMostPushX + 80;
  }

  if (pullBoxes.length > 0) {
    const leftMostPullX = Math.min(...pullBoxes.map((box) => box.left));
    return leftMostPullX - 80;
  }

  return fallbackBoundaryX;
}

function segmentedButtonStyle(isActive) {
  return {
    border: "none",
    background: isActive ? THEME.colors.primary : "transparent",
    color: isActive ? THEME.colors.surface : THEME.colors.textMuted,
    borderRadius: THEME.radius.sm,
    padding: `${scaleMin(7, 6)}px ${scaleMin(10, 10)}px`,
    fontSize: scaleMin(12, 12),
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

function activeToolLabel(activeTool) {
  if (activeTool === "connectNodes") return "Connect Nodes";
  if (activeTool === "delete") return "Delete";
  if (activeTool === "editNode") return "Inspect";
  return "Select";
}

function activeToolDescription(activeTool, connectSourceNodeId) {
  if (activeTool === "connectNodes") {
    return connectSourceNodeId
      ? "Click a second node to create a lane from the selected source."
      : "Click a source node, then click a target node to create a lane.";
  }

  if (activeTool === "delete") {
    return "Click a node or lane to remove it from the current graph.";
  }

  if (activeTool === "editNode") {
    return "Click a node to inspect it and reveal contextual controls in the left sidebar.";
  }

  return "Drag nodes to reposition them within their allowed stage band. Double click a node to edit it. Click a lane to inspect it.";
}

function laneLabelText(edge) {
  const transportLabel = getTransportTypeConfig(edge.transportType).label;
  return `${transportLabel} | LT: ${safeNum(edge.L)} | σ: ${safeNum(edge.s, 1)}`;
}

function laneTooltipText(edge, fromNode, toNode) {
  const transportLabel = getTransportTypeConfig(edge.transportType).label;
  const outsourcingLabel = edge.isOutsourced ? "Yes (3PL)" : "No";

  return [
    `${fromNode?.name ?? edge.from} → ${toNode?.name ?? edge.to}`,
    `Transport: ${transportLabel}`,
    `Lead time: ${safeNum(edge.L)}`,
    `Variance: ${safeNum(edge.s, 1)}`,
    `Outsourced: ${outsourcingLabel}`,
  ].join("\n");
}

function laneLabelWidth(edge) {
  return edge.isOutsourced ? 196 : 162;
}

function computeBoundaryLineSegments(nodes, edges, boundaryX, boundaryTopY, boundaryBottomY) {
  const blockedIntervals = edges
    .map((edge) => {
      const fromNode = findNode(nodes, edge.from);
      const toNode = findNode(nodes, edge.to);
      if (!fromNode || !toNode) return null;

      const path = getEdgePath(fromNode, toNode);
      const labelWidth = laneLabelWidth(edge);
      const labelLeft = path.midX - labelWidth / 2 - BOUNDARY_SKIP_PADDING;
      const labelRight = path.midX + labelWidth / 2 + BOUNDARY_SKIP_PADDING;

      if (boundaryX < labelLeft || boundaryX > labelRight) return null;

      return {
        startY: Math.max(boundaryTopY, path.midY - 14 - BOUNDARY_SKIP_PADDING),
        endY: Math.min(boundaryBottomY, path.midY + 14 + BOUNDARY_SKIP_PADDING),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.startY - b.startY);

  if (blockedIntervals.length === 0) {
    return [{ startY: boundaryTopY, endY: boundaryBottomY }];
  }

  const mergedIntervals = [];

  blockedIntervals.forEach((interval) => {
    const previous = mergedIntervals[mergedIntervals.length - 1];

    if (!previous || interval.startY > previous.endY) {
      mergedIntervals.push({ ...interval });
      return;
    }

    previous.endY = Math.max(previous.endY, interval.endY);
  });

  const segments = [];
  let cursorY = boundaryTopY;

  mergedIntervals.forEach((interval) => {
    if (interval.startY > cursorY) {
      segments.push({ startY: cursorY, endY: interval.startY });
    }

    cursorY = Math.max(cursorY, interval.endY);
  });

  if (cursorY < boundaryBottomY) {
    segments.push({ startY: cursorY, endY: boundaryBottomY });
  }

  return segments;
}

export default function GraphCanvas({
  title = "Supply Chain Workspace",
  nodes,
  edges,
  result,
  runNodeStateById = null,
  boundaryColumn = 2,
  autoInventoryType,
  selectedNodeId,
  selectedEdgeId,
  activeTool = "select",
  connectSourceNodeId = null,
  viewMode = "graph",
  costView = null,
  onViewModeChange,
  onSelectNode,
  onSelectEdge,
  onCreateConnection,
  onDeleteNode,
  onDeleteEdge,
  onSetConnectSourceNodeId,
  onAutoLayout,
  onMoveNode,
  onOpenNodeEditor,
  onOpenLaneEditor,
  onEditTitle,
  preferredViewportHeight,
}) {
  const scrollRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const hasManualResizeRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(
    clampHeight(preferredViewportHeight ?? 760)
  );

  const levels = useMemo(() => graphLayers(nodes, edges), [nodes, edges]);
  const size = useMemo(() => canvasSize(nodes), [nodes]);
  const boundaryX = useMemo(() => computeBoundaryX(nodes, boundaryColumn), [nodes, boundaryColumn]);
  const boundarySegments = useMemo(() => {
    return computeBoundaryLineSegments(nodes, edges, boundaryX, 120, size.height - 120);
  }, [nodes, edges, boundaryX, size.height]);
  const isGraphView = viewMode === "graph";

  useEffect(() => {
    if (preferredViewportHeight == null || hasManualResizeRef.current) return;
    setViewportHeight(clampHeight(preferredViewportHeight));
  }, [preferredViewportHeight]);

  function handlePointerDown(event, node) {
    if (!onMoveNode || !isGraphView || activeTool !== "select") return;

    event.preventDefault();
    event.stopPropagation();

    const container = scrollRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const nodeBox = getNodeBox(node);

    dragRef.current = {
      nodeId: node.id,
      offsetX: event.clientX - rect.left + container.scrollLeft - nodeBox.x,
      offsetY: event.clientY - rect.top + container.scrollTop - nodeBox.y,
    };

    setIsDragging(true);
    onSelectNode?.(node.id);
    onSelectEdge?.(null);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  function handlePointerMove(event) {
    if (!dragRef.current || !scrollRef.current || !onMoveNode || !isGraphView) return;

    const container = scrollRef.current;
    const rect = container.getBoundingClientRect();
    const node = findNode(nodes, dragRef.current.nodeId);
    if (!node) return;

    const rawX =
      event.clientX - rect.left + container.scrollLeft - dragRef.current.offsetX;
    const rawY =
      event.clientY - rect.top + container.scrollTop - dragRef.current.offsetY;

    const clamped = clampNodePosition(node, rawX, rawY);
    onMoveNode(dragRef.current.nodeId, clamped.x, clamped.y);
  }

  function handlePointerUp() {
    dragRef.current = null;
    setIsDragging(false);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }

  function handleResizePointerDown(event) {
    event.preventDefault();
    event.stopPropagation();

    resizeRef.current = {
      startY: event.clientY,
      startHeight: viewportHeight,
    };

    window.addEventListener("pointermove", handleResizePointerMove);
    window.addEventListener("pointerup", handleResizePointerUp);
  }

  function handleResizePointerMove(event) {
    if (!resizeRef.current) return;
    const deltaY = event.clientY - resizeRef.current.startY;
    hasManualResizeRef.current = true;
    setViewportHeight(clampHeight(resizeRef.current.startHeight + deltaY));
  }

  function handleResizePointerUp() {
    resizeRef.current = null;
    window.removeEventListener("pointermove", handleResizePointerMove);
    window.removeEventListener("pointerup", handleResizePointerUp);
  }

  function handleCanvasClick(event) {
    if (!isGraphView) return;

    if (activeTool === "connectNodes") {
      onSetConnectSourceNodeId?.(null);
      onSelectEdge?.(null);
      return;
    }

    onSelectEdge?.(null);
    onSelectNode?.(null);
  }

  function handleCanvasDoubleClick(event) {
    if (!isGraphView || activeTool !== "select" || !onMoveNode || !selectedNodeId || !scrollRef.current) return;

    const selectedNode = findNode(nodes, selectedNodeId);
    if (!selectedNode) return;

    const rect = scrollRef.current.getBoundingClientRect();
    const rawY =
      event.clientY - rect.top + scrollRef.current.scrollTop - NODE_HEIGHT / 2;

    const currentX = safeNum(selectedNode.x, stageColumnX(stageRank(selectedNode.type)));
    const clamped = clampNodePosition(selectedNode, currentX, rawY);
    onMoveNode(selectedNodeId, clamped.x, clamped.y);
  }

  return (
    <div
      style={{
        border: `1px solid ${THEME.colors.border}`,
        borderRadius: THEME.radius.lg,
        padding: scaleNum(10),
        background: THEME.colors.surface,
        boxShadow: THEME.shadow.card,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        minWidth: 0,
      }}
    >
      <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: scaleNum(14),
            marginBottom: scaleNum(8),
            flexWrap: "wrap",
          }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: scaleNum(10),
              flexWrap: "wrap",
            }}
          >
            <h2 style={{ margin: 0, color: THEME.colors.textPrimary, fontSize: scaleNum(22) }}>
              {title}
            </h2>
            <button
              type="button"
              onClick={onEditTitle}
              title="Rename workspace"
              aria-label="Rename workspace"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: scaleMin(34, 34),
                height: scaleMin(34, 34),
                borderRadius: THEME.radius.md,
                border: `1px solid ${THEME.colors.border}`,
                background: THEME.colors.surface,
                color: THEME.colors.textMuted,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Pencil size={scaleMin(16, 16)} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
          <p
            style={{
              marginTop: scaleNum(6),
              marginBottom: 0,
              color: THEME.colors.textMuted,
              fontSize: scaleNum(13),
              lineHeight: 1.45,
            }}
          >
            {isGraphView
              ? activeToolDescription(activeTool, connectSourceNodeId)
              : "Review cumulative cost buildup in supply chain order without leaving the canvas workspace."}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: scaleNum(12),
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              gap: scaleNum(4),
              padding: scaleNum(4),
              borderRadius: THEME.radius.md,
              background: THEME.colors.surfacePanel ?? THEME.colors.background,
              border: `1px solid ${THEME.colors.border}`,
            }}
          >
            <button
              type="button"
              onClick={() => onViewModeChange?.("graph")}
              style={segmentedButtonStyle(isGraphView)}
            >
              Graph View
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange?.("cost")}
              style={segmentedButtonStyle(!isGraphView)}
            >
              Cost View
            </button>
          </div>

          <button
            type="button"
            onClick={onAutoLayout}
            style={{
              border: `1px solid ${THEME.colors.primary}`,
              background: THEME.colors.primary,
              color: THEME.colors.surface,
              borderRadius: THEME.radius.md,
              padding: `${scaleMin(8, 6)}px ${scaleMin(12, 10)}px`,
              fontSize: scaleMin(13, 12),
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Auto Layout
          </button>
        </div>
      </div>

      <div style={{ position: "relative", minWidth: 0 }}>
        <div
          ref={scrollRef}
          onClick={isGraphView ? handleCanvasClick : undefined}
          onDoubleClick={isGraphView ? handleCanvasDoubleClick : undefined}
          style={{
            position: "relative",
            width: "100%",
            height: viewportHeight,
            overflow: isGraphView ? "auto" : "hidden",
            border: `1px solid ${THEME.colors.border}`,
            borderRadius: THEME.radius.lg,
            background: isGraphView ? undefined : THEME.colors.surface,
            display: isGraphView ? "block" : "flex",
            ...(isGraphView ? gridBackground() : {}),
            cursor: isGraphView && isDragging ? "grabbing" : "default",
          }}
        >
          {isGraphView ? (
            <div
              style={{
                position: "relative",
                width: size.width,
                height: size.height,
                minWidth: "100%",
                minHeight: "100%",
              }}
            >
              <svg
                width={size.width}
                height={size.height}
                style={{
                  position: "absolute",
                  inset: 0,
                  overflow: "visible",
                }}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="context-stroke" />
                  </marker>
                </defs>

                {edges.map((edge) => {
                  const fromNode = findNode(nodes, edge.from);
                  const toNode = findNode(nodes, edge.to);
                  if (!fromNode || !toNode) return null;

                  const path = getEdgePath(fromNode, toNode);
                  const isSelected = edge.id === selectedEdgeId;
                  const transportConfig = getTransportTypeConfig(edge.transportType);
                  const transportColor = transportConfig.color;
                  const labelText = laneLabelText(edge);
                  const labelWidth = laneLabelWidth(edge);
                  const labelX = path.midX - labelWidth / 2;
                  const labelTextX = edge.isOutsourced ? path.midX - 14 : path.midX;
                  const tooltipText = laneTooltipText(edge, fromNode, toNode);

                return (
                  <g key={edge.id}>
                      {isSelected ? (
                        <path
                          d={path.d}
                          fill="none"
                          stroke={THEME.colors.primary}
                          strokeWidth="8"
                          strokeOpacity="0.18"
                          style={{ pointerEvents: "none" }}
                        />
                      ) : null}

                      <path
                        d={path.d}
                        fill="none"
                        stroke={transportColor}
                        strokeWidth={isSelected ? 4.5 : 2.5}
                        markerEnd="url(#arrowhead)"
                        style={{ pointerEvents: "none" }}
                      />

                      <path
                        d={path.d}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="18"
                        style={{ cursor: "pointer" }}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (activeTool === "delete") {
                            onDeleteEdge?.(edge.id);
                            onSetConnectSourceNodeId?.(null);
                            return;
                          }
                          onSelectEdge?.(edge.id);
                          onSelectNode?.(null);
                          if (activeTool === "connectNodes") {
                            onSetConnectSourceNodeId?.(null);
                          }
                        }}
                        onDoubleClick={(event) => {
                          event.stopPropagation();
                          if (activeTool === "delete") return;
                          onSelectEdge?.(edge.id);
                          onOpenLaneEditor?.();
                        }}
                      >
                        <title>{tooltipText}</title>
                      </path>

                      <rect
                        x={labelX}
                        y={path.midY - 14}
                        width={labelWidth}
                        height={28}
                        rx={8}
                        fill={THEME.colors.surface}
                        stroke={isSelected ? THEME.colors.primary : THEME.colors.border}
                        strokeWidth={isSelected ? "1.5" : "1"}
                        style={{ pointerEvents: "none" }}
                      />
                      <text
                        x={labelTextX}
                        y={path.midY + 4}
                        textAnchor="middle"
                        fontSize={scaleNum(11)}
                        fontWeight="700"
                        fill="transparent"
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        LT:{edge.L} σ:{edge.s}
                      </text>
                      <text
                        x={labelTextX}
                        y={path.midY + 4}
                        textAnchor="middle"
                        fontSize={scaleNum(11)}
                        fontWeight="700"
                        fill={THEME.colors.textPrimary}
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {labelText}
                      </text>
                      {edge.isOutsourced ? (
                        <g style={{ pointerEvents: "none", userSelect: "none" }}>
                          <rect
                            x={labelX + labelWidth - 40}
                            y={path.midY - 10}
                            width={28}
                            height={20}
                            rx={999}
                            fill={THEME.colors.background}
                            stroke={transportColor}
                            strokeWidth="1"
                          />
                          <text
                            x={labelX + labelWidth - 26}
                            y={path.midY + 4}
                            textAnchor="middle"
                            fontSize={scaleNum(10)}
                            fontWeight="700"
                            fill={transportColor}
                          >
                            3PL
                          </text>
                        </g>
                      ) : null}
                    </g>
                  );
                })}

                <g>
                  {boundarySegments.map((segment, index) => (
                    <line
                      key={`boundary-segment-${index}`}
                      x1={boundaryX}
                      y1={segment.startY}
                      x2={boundaryX}
                      y2={segment.endY}
                      stroke={THEME.colors.secondary}
                      strokeWidth="3"
                      strokeDasharray="8 6"
                    />
                  ))}
                  <rect
                    x={boundaryX - BOUNDARY_LABEL_WIDTH / 2}
                    y={18}
                    width={BOUNDARY_LABEL_WIDTH}
                    height={BOUNDARY_LABEL_HEIGHT}
                    rx={999}
                    fill={THEME.colors.surface}
                    stroke={THEME.colors.border}
                    strokeWidth="1"
                  />
                  <text
                    x={boundaryX}
                    y={34}
                    textAnchor="middle"
                    fontSize={scaleNum(12)}
                    fontWeight="700"
                    fill={THEME.colors.textPrimary}
                  >
                    PUSH-PULL
                  </text>
                </g>
              </svg>

              {nodes.map((node) => {
                const isSelected = node.id === selectedNodeId;
                const isConnectSource = node.id === connectSourceNodeId;
                const box = getNodeBox(node);
                const simNode = findSimulationNode(result, node.id);
                const inventoryType = displayInventoryType(node, simNode, autoInventoryType);
                const stock = stockIndicator(inventoryType);
                const StockIcon = stock.Icon;
                const locationLabel = formatLabel(node.location, "Location N/A");
                const postureLabel =
                  showsSourcingPosture(node.type) && node.sourcingPosture
                    ? formatLabel(node.sourcingPosture)
                    : null;
                const riskLabel = simNode?.riskLabel ?? node.riskLevel ?? null;
                const runNodeState = runNodeStateById?.[node.id] ?? null;
                const carriesRunInventory = Boolean(runNodeState?.carriesInventory);
                const hasRunBacklog = carriesRunInventory && Number(runNodeState?.backlog ?? 0) > 0;
                const hasHighRunInventory = Boolean(runNodeState?.inventoryHot) && !hasRunBacklog;
                const unmetCustomerDemand = Number(runNodeState?.unmetCustomerDemand ?? 0);
                const hasServiceFailure = !carriesRunInventory && unmetCustomerDemand > 0;
                const visibleRunBoxes = carriesRunInventory
                  ? inventoryBoxCount(runNodeState?.inventory ?? 0)
                  : 0;
                const runSurfaceTint = hasRunBacklog
                  ? "linear-gradient(180deg, rgba(220,38,38,0.10), rgba(220,38,38,0.04))"
                  : hasHighRunInventory
                    ? "linear-gradient(180deg, rgba(37,99,235,0.10), rgba(37,99,235,0.04))"
                    : nodeColor(node.type);
                const runAccentShadow = hasRunBacklog
                  ? `0 0 0 1px ${THEME.colors.danger}, 0 8px 18px rgba(220,38,38,0.16)`
                  : hasHighRunInventory
                    ? `0 0 0 1px ${THEME.colors.primary}, 0 8px 18px rgba(37,99,235,0.14)`
                    : null;

                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (activeTool === "delete") {
                        onDeleteNode?.(node.id);
                        return;
                      }

                      if (activeTool === "connectNodes") {
                        onSelectNode?.(node.id);
                        onSelectEdge?.(null);

                        if (connectSourceNodeId && connectSourceNodeId !== node.id) {
                          onCreateConnection?.(connectSourceNodeId, node.id);
                          onSetConnectSourceNodeId?.(null);
                          return;
                        }

                        onSetConnectSourceNodeId?.(
                          connectSourceNodeId === node.id ? null : node.id
                        );
                        return;
                      }

                      onSelectNode?.(node.id);
                      onSelectEdge?.(null);

                      if (activeTool === "editNode") {
                        onOpenNodeEditor?.(node.id);
                      }
                    }}
                    onDoubleClick={(event) => {
                      event.stopPropagation();
                      if (activeTool === "delete") return;
                      onSelectNode?.(node.id);
                      onSelectEdge?.(null);
                      onOpenNodeEditor?.(node.id);
                    }}
                    onPointerDown={(event) => handlePointerDown(event, node)}
                    style={{
                      position: "absolute",
                      left: box.x,
                      top: box.y,
                      width: NODE_WIDTH,
                      minHeight: NODE_HEIGHT,
                      borderRadius: 16,
                      border: isSelected
                        ? `3px solid ${THEME.colors.primary}`
                        : isConnectSource
                          ? `3px dashed ${THEME.colors.primary}`
                        : hasRunBacklog
                          ? `2px solid ${THEME.colors.danger}`
                          : hasHighRunInventory
                            ? `2px solid ${THEME.colors.primary}`
                            : `2px solid ${THEME.colors.secondary}`,
                      background: runSurfaceTint,
                      padding: scaleNum(12),
                      textAlign: "left",
                      cursor:
                        activeTool === "select"
                          ? isDragging && isSelected
                            ? "grabbing"
                            : "grab"
                          : activeTool === "delete"
                            ? "not-allowed"
                            : "pointer",
                      color: THEME.colors.textPrimary,
                      boxShadow:
                        isSelected || isConnectSource
                          ? THEME.shadow.focus
                          : runAccentShadow ?? THEME.shadow.card,
                      userSelect: "none",
                      display: "flex",
                      flexDirection: "column",
                      gap: scaleNum(8),
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: scaleNum(10),
                      }}
                    >
                      <div
                        style={{
                          minWidth: 0,
                          flex: 1,
                          fontSize: `clamp(${scaleMin(14, 14)}px, 1vw, ${scaleMin(16, 16)}px)`,
                          fontWeight: 700,
                          lineHeight: 1.15,
                          color: THEME.colors.textPrimary,
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          minHeight: scaleNum(34),
                        }}
                      >
                        {node.name}
                      </div>

                      <span
                        title={stock.label}
                        style={badgeStyle({
                          textColor: THEME.colors.textPrimary,
                          background: THEME.colors.surface,
                          borderColor: THEME.colors.border,
                        })}
                      >
                        {StockIcon ? (
                          <StockIcon size={22} strokeWidth={2} aria-hidden="true" />
                        ) : (
                          <span style={{ color: THEME.colors.textMuted }}>-</span>
                        )}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: scaleNum(2),
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          fontSize: scaleMin(12, 12),
                          fontWeight: 700,
                          color: THEME.colors.textMuted,
                          lineHeight: 1.2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {nodeTypeLabel(node.type)}
                      </div>
                      <div
                        style={{
                          fontSize: scaleMin(12, 12),
                          color: THEME.colors.textMuted,
                          lineHeight: 1.2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {locationLabel}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: scaleNum(6),
                        alignItems: "center",
                        marginTop: "auto",
                      }}
                    >
                      <span
                        style={badgeStyle({
                          background: THEME.colors.surfaceRow ?? THEME.colors.background,
                        })}
                      >
                        {StockIcon ? (
                          <StockIcon size={22} strokeWidth={2} aria-hidden="true" />
                        ) : (
                          <span style={{ color: THEME.colors.textMuted }}>-</span>
                        )}
                        <span>{stock.label}</span>
                      </span>

                      {postureLabel ? (
                        <span
                          style={badgeStyle({
                            background: THEME.colors.surfaceRow ?? THEME.colors.background,
                          })}
                        >
                          {postureLabel}
                        </span>
                      ) : null}

                      {riskLabel ? (
                        <span
                          style={badgeStyle({
                            textColor: riskColor(riskLabel),
                            background: THEME.colors.surface,
                            borderColor: riskColor(riskLabel),
                          })}
                        >
                          {riskLabel}
                        </span>
                      ) : null}

                      {carriesRunInventory ? (
                        <span
                          style={badgeStyle({
                            background: THEME.colors.surfaceRow ?? THEME.colors.background,
                          })}
                        >
                          Inv {Math.round(runNodeState.inventory ?? 0)}
                        </span>
                      ) : null}

                      {carriesRunInventory ? (
                        <span
                          style={badgeStyle({
                            textColor:
                              Number(runNodeState.backlog ?? 0) > 0
                                ? THEME.colors.danger
                                : THEME.colors.textPrimary,
                            background: THEME.colors.surfaceRow ?? THEME.colors.background,
                            borderColor:
                              Number(runNodeState.backlog ?? 0) > 0
                                ? THEME.colors.danger
                                : THEME.colors.border,
                          })}
                        >
                          Backlog {Math.round(runNodeState.backlog ?? 0)}
                        </span>
                      ) : null}

                      {hasHighRunInventory ? (
                        <span
                          style={badgeStyle({
                            textColor: THEME.colors.primary,
                            background: THEME.colors.surface,
                            borderColor: THEME.colors.primary,
                          })}
                        >
                          High stock
                        </span>
                      ) : null}

                      {hasServiceFailure ? (
                        <span
                          style={badgeStyle({
                            textColor: THEME.colors.danger,
                            background: THEME.colors.surface,
                            borderColor: THEME.colors.danger,
                          })}
                        >
                          Missed {Math.round(unmetCustomerDemand)}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}

              {nodes.map((node) => {
                const box = getNodeBox(node);
                const runNodeState = runNodeStateById?.[node.id] ?? null;
                const carriesRunInventory = Boolean(runNodeState?.carriesInventory);
                const visibleRunBoxes = carriesRunInventory
                  ? inventoryBoxCount(runNodeState?.inventory ?? 0)
                  : 0;

                if (!carriesRunInventory || visibleRunBoxes <= 0) return null;

                const isCapped = Math.ceil(Math.max(0, Number(runNodeState?.inventory ?? 0)) / RUN_BOX_UNITS) > RUN_BOX_MAX_VISIBLE;

                return (
                  <div
                    key={`${node.id}-run-box-pile`}
                    style={{
                      position: "absolute",
                      left: box.x,
                      top: box.bottom + scaleNum(8),
                      width: NODE_WIDTH,
                      display: "grid",
                      justifyItems: "center",
                      gap: scaleNum(4),
                      pointerEvents: "none",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                        gap: scaleNum(4),
                        justifyItems: "center",
                        maxWidth: scaleNum(104),
                      }}
                    >
                      {Array.from({ length: visibleRunBoxes }, (_, index) => (
                        <span
                          key={`${node.id}-run-box-${index}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: scaleNum(14),
                            height: scaleNum(14),
                            borderRadius: 4,
                            background: THEME.colors.surface,
                            border: `1px solid ${THEME.colors.border}`,
                            color: THEME.colors.primary,
                          }}
                        >
                          <Box size={10} strokeWidth={2} aria-hidden="true" />
                        </span>
                      ))}
                    </div>
                    <div
                      style={{
                        fontSize: scaleNum(11),
                        fontWeight: 700,
                        color: THEME.colors.textMuted,
                        background: THEME.colors.surface,
                        border: `1px solid ${THEME.colors.border}`,
                        borderRadius: 999,
                        padding: `${scaleNum(2)}px ${scaleNum(8)}px`,
                      }}
                    >
                      {Math.round(runNodeState.inventory ?? 0)} units
                      {isCapped ? " +" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                display: "flex",
                alignItems: "stretch",
              }}
            >
              {costView}
            </div>
          )}
        </div>

        <div
          onPointerDown={handleResizePointerDown}
          title="Resize graph viewport"
          style={{
            position: "absolute",
            right: scaleNum(10),
            bottom: scaleNum(10),
            width: scaleNum(18),
            height: scaleNum(18),
            cursor: "nwse-resize",
            background:
              "linear-gradient(135deg, transparent 0 35%, #8c959f 35% 45%, transparent 45% 55%, #8c959f 55% 65%, transparent 65% 75%, #8c959f 75% 85%, transparent 85% 100%)",
            opacity: 0.9,
            borderRadius: 2,
          }}
        />
      </div>

      <div
        style={{
          marginTop: scaleNum(12),
          display: "flex",
          gap: scaleNum(18),
          flexWrap: "wrap",
          color: THEME.colors.textMuted,
          fontSize: scaleNum(14),
        }}
      >
        <div>
          <b>Nodes:</b> {nodes.length}
        </div>
        <div>
          <b>Edges:</b> {edges.length}
        </div>
        <div>
          <b>Grid:</b> {GRID}px snap
        </div>
        <div>
          <b>Active tool:</b> {activeToolLabel(activeTool)}
        </div>
        {isGraphView ? (
          <div>
            <b>Push-pull position:</b> {boundaryX}px
          </div>
        ) : (
          <div>
            <b>View:</b> Cost accumulation
          </div>
        )}
        <div>
          <b>Viewport height:</b> {Math.round(viewportHeight)}px
        </div>
      </div>
    </div>
  );
}
