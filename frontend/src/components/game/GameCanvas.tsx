'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import clsx from 'clsx';
import type { DrawStroke, DrawPoint } from '@/types';

interface GameCanvasProps {
  strokes: DrawStroke[];
  onDraw: (stroke: DrawStroke) => void;
  isDrawingEnabled: boolean;
  color: string;
  brushSize: number;
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: DrawStroke) {
  if (stroke.points.length < 2) return;
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let i = 1; i < stroke.points.length - 1; i++) {
    const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
    const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
    ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
  }
  ctx.stroke();
}

export function GameCanvas({
  strokes,
  onDraw,
  isDrawingEnabled,
  color,
  brushSize,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const currentStroke = useRef<DrawPoint[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Resize canvas to fill container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = rect.width;
      const h = Math.max(rect.height, 300);

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      setIsReady(true);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Redraw all strokes whenever strokes change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isReady) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    for (const stroke of strokes) {
      drawStroke(ctx, stroke);
    }
  }, [strokes, isReady]);

  const getCanvasPoint = useCallback(
    (clientX: number, clientY: number): DrawPoint => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingEnabled) return;
      isDrawing.current = true;
      const point = getCanvasPoint(e.clientX, e.clientY);
      currentStroke.current = [point];

      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);
    },
    [isDrawingEnabled, getCanvasPoint],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current || !isDrawingEnabled) return;
      const point = getCanvasPoint(e.clientX, e.clientY);
      currentStroke.current.push(point);

      // Draw incrementally
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const pts = currentStroke.current;
      if (pts.length < 2) return;

      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const lastIdx = pts.length - 1;
      const secondLast = pts[lastIdx - 1];
      ctx.moveTo(secondLast.x, secondLast.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    },
    [isDrawingEnabled, color, brushSize, getCanvasPoint],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (currentStroke.current.length >= 2) {
      onDraw({
        points: [...currentStroke.current],
        color,
        size: brushSize,
      });
    }
    currentStroke.current = [];
  }, [color, brushSize, onDraw]);

  return (
    <div
      ref={containerRef}
      className={clsx(
        'canvas-container relative h-full min-h-[300px] w-full',
        isDrawingEnabled && 'cursor-crosshair',
      )}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ background: '#FFFFFF', borderRadius: 'inherit' }}
        aria-label={isDrawingEnabled ? 'Drawing canvas' : 'Drawing replay canvas'}
      />

      {/* Overlay banner */}
      <div
        className={clsx(
          'pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full px-4 py-1.5 text-xs font-semibold shadow-lg transition-opacity duration-300',
          isDrawingEnabled
            ? 'bg-accent/90 text-white'
            : 'bg-bg-secondary/80 text-text-secondary',
        )}
      >
        {isDrawingEnabled ? 'You are the doodler!' : 'Watching...'}
      </div>
    </div>
  );
}
