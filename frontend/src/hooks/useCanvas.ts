'use client';

import { useRef, useCallback, useEffect } from 'react';
import { DrawPoint, DrawStroke } from '@/types';

interface UseCanvasOptions {
  color: string;
  brushSize: number;
  isDrawingEnabled: boolean;
  onStrokeComplete?: (stroke: DrawStroke) => void;
  replayStrokes?: DrawStroke[];
}

interface UseCanvasReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  clearCanvas: () => void;
  undo: () => void;
}

const THROTTLE_MS = 16; // ~60fps
const SMOOTHING_FACTOR = 0.5;

function getCanvasPoint(
  canvas: HTMLCanvasElement,
  e: React.PointerEvent<HTMLCanvasElement>,
): DrawPoint {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
    pressure: e.pressure ?? 0.5,
  };
}

function drawStrokeOnCanvas(
  ctx: CanvasRenderingContext2D,
  stroke: DrawStroke,
): void {
  if (stroke.points.length < 2) {
    // Single dot
    const p = stroke.points[0];
    if (!p) return;
    ctx.fillStyle = stroke.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, stroke.size / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();

  for (let i = 0; i < stroke.points.length; i++) {
    const p = stroke.points[i];
    if (i === 0) {
      ctx.moveTo(p.x, p.y);
    } else {
      const prev = stroke.points[i - 1];
      if (prev) {
        const midX = (prev.x + p.x) / 2;
        const midY = (prev.y + p.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
      }
    }
  }

  ctx.stroke();
}

export function useCanvas({
  color,
  brushSize,
  isDrawingEnabled,
  onStrokeComplete,
  replayStrokes,
}: UseCanvasOptions): UseCanvasReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const currentPoints = useRef<DrawPoint[]>([]);
  const lastDrawTime = useRef(0);
  const optionsRef = useRef({ color, brushSize, isDrawingEnabled });
  const onStrokeCompleteRef = useRef(onStrokeComplete);

  // Keep refs in sync
  optionsRef.current = { color, brushSize, isDrawingEnabled };
  onStrokeCompleteRef.current = onStrokeComplete;

  // Render replay strokes whenever they change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (replayStrokes && replayStrokes.length > 0) {
      for (const stroke of replayStrokes) {
        drawStrokeOnCanvas(ctx, stroke);
      }
    }
  }, [replayStrokes]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!optionsRef.current.isDrawingEnabled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.setPointerCapture(e.pointerId);
      isDrawing.current = true;
      const point = getCanvasPoint(canvas, e);
      currentPoints.current = [point];
      lastDrawTime.current = Date.now();
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current || !optionsRef.current.isDrawingEnabled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const now = Date.now();
      if (now - lastDrawTime.current < THROTTLE_MS) return;
      lastDrawTime.current = now;

      const point = getCanvasPoint(canvas, e);
      const prev =
        currentPoints.current[currentPoints.current.length - 1];

      if (prev) {
        // Apply smoothing
        const smoothed: DrawPoint = {
          x: prev.x + (point.x - prev.x) * SMOOTHING_FACTOR,
          y: prev.y + (point.y - prev.y) * SMOOTHING_FACTOR,
          pressure: point.pressure,
        };
        currentPoints.current.push(smoothed);
      } else {
        currentPoints.current.push(point);
      }

      // Draw incrementally
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const { color: curColor, brushSize: curBrushSize } =
        optionsRef.current;
      const pts = currentPoints.current;

      if (pts.length >= 2) {
        const lastPts = pts.slice(-2);
        const p0 = lastPts[0];
        const p1 = lastPts[1];
        if (p0 && p1) {
          ctx.strokeStyle = curColor;
          ctx.lineWidth = curBrushSize;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();
        }
      }
    },
    [],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current) return;
      isDrawing.current = false;

      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.releasePointerCapture(e.pointerId);

      // Flush remaining points
      const { color: curColor, brushSize: curBrushSize } =
        optionsRef.current;

      if (currentPoints.current.length > 0) {
        // If we have remaining points in buffer, submit the final stroke
        if (currentPoints.current.length > 1) {
          const stroke: DrawStroke = {
            points: [...currentPoints.current],
            color: curColor,
            size: curBrushSize,
          };
          const ctx = canvas.getContext('2d');
          if (ctx) drawStrokeOnCanvas(ctx, stroke);
          if (onStrokeCompleteRef.current) {
            onStrokeCompleteRef.current(stroke);
          }
        } else if (currentPoints.current.length === 1) {
          // Single click/dot
          const stroke: DrawStroke = {
            points: [...currentPoints.current],
            color: curColor,
            size: curBrushSize,
          };
          const ctx = canvas.getContext('2d');
          if (ctx) drawStrokeOnCanvas(ctx, stroke);
          if (onStrokeCompleteRef.current) {
            onStrokeCompleteRef.current(stroke);
          }
        }
      }

      currentPoints.current = [];
    },
    [],
  );

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Re-draw all but the last stroke
    if (replayStrokes && replayStrokes.length > 0) {
      const strokesToRedraw = replayStrokes.slice(0, -1);
      for (const stroke of strokesToRedraw) {
        drawStrokeOnCanvas(ctx, stroke);
      }
    }
  }, [replayStrokes]);

  return {
    canvasRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    clearCanvas,
    undo,
  };
}
