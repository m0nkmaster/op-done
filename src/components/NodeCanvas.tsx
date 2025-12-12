/**
 * NodeCanvas - Canvas rendering component for the visual node synthesizer
 * Handles rendering of nodes, connections, grid, and visual feedback
 */

import { useEffect, useRef } from 'react';
import type { Node, Connection, CanvasState } from '../types/nodeGraph';

interface NodeCanvasProps {
  state: CanvasState;
  width: number;
  height: number;
  onMouseDown?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
}

export function NodeCanvas({
  state,
  width,
  height,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
}: NodeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Apply zoom and pan transformations
    ctx.save();
    ctx.translate(state.panX, state.panY);
    ctx.scale(state.zoom, state.zoom);

    // Render grid
    renderGrid(ctx, width, height, state.zoom, state.panX, state.panY);

    // Render connections
    state.connections.forEach(connection => {
      renderConnection(ctx, connection, state.nodes, state.selectedNodeId);
    });

    // Render nodes
    state.nodes.forEach(node => {
      renderNode(ctx, node, state.selectedNodeId === node.id);
    });

    ctx.restore();
  }, [state, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      style={{
        border: '2px solid #2a2a2a',
        borderRadius: '12px',
        cursor: state.draggingNodeId ? 'grabbing' : 'grab',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      }}
    />
  );
};

/**
 * Render grid background
 */
function renderGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  zoom: number,
  panX: number,
  panY: number
): void {
  const gridSize = 50;
  
  // Calculate visible grid bounds accounting for zoom and pan
  const startX = Math.floor(-panX / zoom / gridSize) * gridSize;
  const startY = Math.floor(-panY / zoom / gridSize) * gridSize;
  const endX = Math.ceil((width - panX) / zoom / gridSize) * gridSize;
  const endY = Math.ceil((height - panY) / zoom / gridSize) * gridSize;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1 / zoom;

  // Vertical lines
  for (let x = startX; x <= endX; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = startY; y <= endY; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
  }
}

/**
 * Render a connection between two nodes
 */
function renderConnection(
  ctx: CanvasRenderingContext2D,
  connection: Connection,
  nodes: Node[],
  selectedNodeId: string | null
): void {
  const fromNode = nodes.find(n => n.id === connection.from);
  const toNode = nodes.find(n => n.id === connection.to);
  
  if (!fromNode || !toNode) return;

  // Find the specific connection points
  const fromPoint = fromNode.outputs.find(p => p.id === connection.fromPoint);
  const toPoint = toNode.inputs.find(p => p.id === connection.toPoint);

  if (!fromPoint || !toPoint) return;

  // Calculate absolute positions
  const startX = fromNode.x + fromPoint.x;
  const startY = fromNode.y + fromPoint.y;
  const endX = toNode.x + toPoint.x;
  const endY = toNode.y + toPoint.y;

  // Create gradient from source to destination color
  const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
  gradient.addColorStop(0, fromNode.color);
  gradient.addColorStop(1, toNode.color);

  // Determine if connection should be highlighted
  const isHighlighted = 
    selectedNodeId === connection.from || 
    selectedNodeId === connection.to;

  ctx.strokeStyle = gradient;
  ctx.lineWidth = isHighlighted ? 4 : 3;
  
  if (isHighlighted) {
    ctx.shadowBlur = 15;
    ctx.shadowColor = fromNode.color;
  }

  // Draw Bezier curve
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  
  const controlOffset = Math.abs(endX - startX) * 0.5;
  
  ctx.bezierCurveTo(
    startX + controlOffset, startY,
    endX - controlOffset, endY,
    endX, endY
  );
  
  ctx.stroke();
  
  // Reset shadow
  ctx.shadowBlur = 0;

  // Render active state animation if connection is active
  if (connection.active) {
    renderActiveConnection(ctx, startX, startY, endX, endY, fromNode.color);
  }
}

/**
 * Render active connection animation
 */
function renderActiveConnection(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  color: string
): void {
  // Pulsing effect for active connections
  const time = Date.now() / 1000;
  const pulse = Math.sin(time * 3) * 0.5 + 0.5;
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 + pulse * 2;
  ctx.globalAlpha = 0.6 + pulse * 0.4;
  
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  
  const controlOffset = Math.abs(endX - startX) * 0.5;
  
  ctx.bezierCurveTo(
    startX + controlOffset, startY,
    endX - controlOffset, endY,
    endX, endY
  );
  
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/**
 * Render a node
 */
function renderNode(
  ctx: CanvasRenderingContext2D,
  node: Node,
  isSelected: boolean
): void {
  // Apply selection glow
  if (isSelected) {
    ctx.shadowBlur = 20;
    ctx.shadowColor = node.color;
  }

  // Draw node body
  ctx.fillStyle = isSelected ? node.color : `${node.color}88`;
  ctx.strokeStyle = node.color;
  ctx.lineWidth = isSelected ? 3 : 2;
  
  ctx.beginPath();
  ctx.roundRect(node.x, node.y, node.width, node.height, 12);
  ctx.fill();
  ctx.stroke();
  
  // Reset shadow
  ctx.shadowBlur = 0;

  // Draw node type label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(
    node.type.toUpperCase(),
    node.x + node.width / 2,
    node.y + 12
  );

  // Draw parameter preview
  const paramText = getParameterPreview(node);
  if (paramText) {
    ctx.font = '10px monospace';
    ctx.fillStyle = '#dddddd';
    ctx.fillText(
      paramText,
      node.x + node.width / 2,
      node.y + 32
    );
  }

  // Draw connection points
  renderConnectionPoints(ctx, node);
}

/**
 * Get parameter preview text for a node
 */
function getParameterPreview(node: Node): string {
  switch (node.type) {
    case 'oscillator':
      if (node.data.waveform && node.data.frequency) {
        return `${node.data.waveform} ${node.data.frequency}Hz`;
      }
      return node.data.waveform || '';
      
    case 'filter':
      if (node.data.filterType && node.data.cutoff) {
        return `${node.data.filterType} ${node.data.cutoff}Hz`;
      }
      return node.data.filterType || '';
      
    case 'envelope':
      return 'ADSR';
      
    case 'lfo':
      if (node.data.lfoFrequency) {
        return `${node.data.lfoFrequency}Hz`;
      }
      return 'LFO';
      
    case 'effect':
      return node.data.effectType || 'FX';
      
    case 'output':
      return 'OUT';
      
    default:
      return '';
  }
}

/**
 * Render connection points on a node
 */
function renderConnectionPoints(
  ctx: CanvasRenderingContext2D,
  node: Node
): void {
  ctx.fillStyle = node.color;
  
  // Draw input connection points
  node.inputs.forEach(point => {
    ctx.beginPath();
    ctx.arc(
      node.x + point.x,
      node.y + point.y,
      5,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });
  
  // Draw output connection points
  node.outputs.forEach(point => {
    ctx.beginPath();
    ctx.arc(
      node.x + point.x,
      node.y + point.y,
      5,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });
}
