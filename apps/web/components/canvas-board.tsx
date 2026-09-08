'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Eraser,
  Highlighter,
  Pencil,
  Redo2,
  RotateCcw,
  Trash2,
  Undo2,
} from 'lucide-react';

type Point = { x: number; y: number };
type Stroke = { points: Point[]; color: string; width: number; alpha: number };

export function CanvasBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redo, setRedo] = useState<Stroke[]>([]);
  const [tool, setTool] = useState<'pen' | 'highlight' | 'eraser'>('pen');
  const drawing = useRef(false);
  const current = useRef<Stroke | null>(null);

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle =
      getComputedStyle(canvas).getPropertyValue('--canvas-paper').trim() ||
      '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle =
      getComputedStyle(canvas).getPropertyValue('--canvas-grid').trim() ||
      '#e8eee9';
    context.lineWidth = 1;
    for (let x = 24; x < canvas.width; x += 24) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.stroke();
    }
    for (let y = 24; y < canvas.height; y += 24) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      context.beginPath();
      context.globalAlpha = stroke.alpha;
      context.strokeStyle = stroke.color;
      context.lineWidth = stroke.width;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points
        .slice(1)
        .forEach((point) => context.lineTo(point.x, point.y));
      context.stroke();
      context.globalAlpha = 1;
    }
  };

  useEffect(render, [strokes]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (event.currentTarget.width / rect.width),
      y:
        (event.clientY - rect.top) * (event.currentTarget.height / rect.height),
    };
  };
  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    const style =
      tool === 'highlight'
        ? { color: '#e0b23d', width: 18, alpha: 0.28 }
        : tool === 'eraser'
          ? { color: '#ffffff', width: 24, alpha: 1 }
          : { color: '#234a39', width: 3, alpha: 1 };
    current.current = { points: [point(event)], ...style };
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !current.current) return;
    current.current.points.push(point(event));
    setStrokes((all) => [
      ...all.filter((stroke) => stroke !== current.current),
      current.current as Stroke,
    ]);
  };
  const end = () => {
    drawing.current = false;
    current.current = null;
    setRedo([]);
  };

  return (
    <div className="canvas-shell">
      <div className="canvas-toolbar" aria-label="Alat canvas">
        <button
          className={tool === 'pen' ? 'active' : ''}
          onClick={() => setTool('pen')}
          aria-label="Pena"
        >
          <Pencil size={18} />
        </button>
        <button
          className={tool === 'highlight' ? 'active' : ''}
          onClick={() => setTool('highlight')}
          aria-label="Highlighter"
        >
          <Highlighter size={18} />
        </button>
        <button
          className={tool === 'eraser' ? 'active' : ''}
          onClick={() => setTool('eraser')}
          aria-label="Penghapus"
        >
          <Eraser size={18} />
        </button>
        <span />
        <button
          onClick={() =>
            setStrokes((all) => {
              const last = all.at(-1);
              if (last) setRedo((items) => [last, ...items]);
              return all.slice(0, -1);
            })
          }
          disabled={!strokes.length}
          aria-label="Urungkan"
        >
          <Undo2 size={18} />
        </button>
        <button
          onClick={() =>
            setRedo((items) => {
              const first = items[0];
              if (first) setStrokes((all) => [...all, first]);
              return items.slice(1);
            })
          }
          disabled={!redo.length}
          aria-label="Ulangi"
        >
          <Redo2 size={18} />
        </button>
        <button
          onClick={() => {
            setStrokes([]);
            setRedo([]);
          }}
          aria-label="Bersihkan canvas"
        >
          <Trash2 size={18} />
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={1100}
        height={620}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        aria-label="Canvas catatan Statistika II"
      />
      <p className="canvas-hint">
        <RotateCcw size={14} /> Mendukung mouse, touch, dan stylus. Catatan
        disimpan sebagai stroke yang dapat diedit.
      </p>
    </div>
  );
}
