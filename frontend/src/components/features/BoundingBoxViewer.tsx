'use client';

import React, { useState } from 'react';
import { Eye, Layers, Image as ImageIcon, Crosshair, Info } from 'lucide-react';
import type { DetectionItem } from '@/types/inspection';
import { getDamageClassMeta, scaleBoundingBox } from '@/utils/boundingBox';

interface BoundingBoxViewerProps {
  rawImageUrl: string | null;
  annotatedImageUrl: string | null;
  fallbackImageUrl?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  detections?: DetectionItem[];
  title?: string;
}

type ViewMode = 'interactive' | 'annotated' | 'raw';

export function BoundingBoxViewer({
  rawImageUrl,
  annotatedImageUrl,
  fallbackImageUrl,
  imageWidth = 640,
  imageHeight = 640,
  detections = [],
  title = 'Inspeksi Visual YOLOv8',
}: BoundingBoxViewerProps) {
  const [mode, setMode] = useState<ViewMode>('interactive');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const safeW = imageWidth && imageWidth > 0 ? imageWidth : 640;
  const safeH = imageHeight && imageHeight > 0 ? imageHeight : 640;

  const baseRawUrl =
    rawImageUrl ||
    fallbackImageUrl ||
    annotatedImageUrl ||
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80';

  const baseAnnotatedUrl = annotatedImageUrl || baseRawUrl;
  const activeUrl = mode === 'annotated' ? baseAnnotatedUrl : baseRawUrl;

  return (
    <div className="bg-slate-900 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-lg">
      {/* Toolbar Header */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold tracking-tight">{title}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
            {safeW}×{safeH}px
          </span>
        </div>

        {/* Toggle Modes */}
        <div
          className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800"
          role="group"
          aria-label="Mode tampilan foto inspeksi"
        >
          <button
            type="button"
            onClick={() => setMode('interactive')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              mode === 'interactive'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Overlay Interaktif ({detections.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('annotated')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              mode === 'annotated'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Foto Anotasi AI</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('raw')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              mode === 'raw'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Foto Asli (Raw)</span>
          </button>
        </div>
      </div>

      {/* Image Canvas Container with Proportional Aspect Ratio */}
      <div className="relative bg-slate-950 flex items-center justify-center overflow-hidden">
        <div
          className="relative w-full max-h-[520px] mx-auto"
          style={{ aspectRatio: `${safeW} / ${safeH}` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeUrl}
            alt={title}
            className="w-full h-full object-contain select-none"
          />

          {/* Proportional Bounding Boxes Overlay (Bab 3.5) */}
          {mode === 'interactive' &&
            detections.map((det, idx) => {
              const scaled = scaleBoundingBox(det, safeW, safeH);
              const meta = getDamageClassMeta(det.class_name);
              const isSelected = selectedIdx === idx;
              const confPercent = Math.round((det.confidence || 0) * 100);

              return (
                <div
                  key={`${det.class_name}-${idx}`}
                  onClick={() =>
                    setSelectedIdx(isSelected ? null : idx)
                  }
                  style={{
                    left: `${scaled.leftPercent}%`,
                    top: `${scaled.topPercent}%`,
                    width: `${scaled.widthPercent}%`,
                    height: `${scaled.heightPercent}%`,
                  }}
                  className={`absolute border-2 cursor-pointer transition-all ${
                    meta.borderClass
                  } ${
                    isSelected
                      ? 'ring-2 ring-white z-20 scale-[1.01]'
                      : 'hover:z-10'
                  }`}
                  title={`${det.class_name} (${confPercent}%)`}
                >
                  <span
                    className={`absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shadow-sm ${meta.bgBadge}`}
                  >
                    {det.class_name} {confPercent}%
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Detection Legend & Coordinate Inspector */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-sky-400 inline-block" />
              <span>Scratch (Baret)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 inline-block" />
              <span>Dent (Penyok)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
              <span>Accident (Benturan)</span>
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-slate-400">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              Skala koordinat proporsional terhadap dimensi asli {safeW}×{safeH}
            </span>
          </span>
        </div>

        {detections.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
            {detections.map((det, idx) => {
              const meta = getDamageClassMeta(det.class_name);
              const scaled = scaleBoundingBox(det, safeW, safeH);
              const isSelected = selectedIdx === idx;
              return (
                <button
                  key={`pill-${idx}`}
                  type="button"
                  onClick={() => {
                    setMode('interactive');
                    setSelectedIdx(isSelected ? null : idx);
                  }}
                  className={`flex items-center justify-between p-2 rounded-xl border text-left text-xs transition ${
                    isSelected
                      ? 'bg-slate-800 border-indigo-400 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${meta.bgBadge}`}
                    >
                      #{idx + 1} {det.class_name}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      [{Math.round(scaled.leftPx)},{Math.round(scaled.topPx)} →{' '}
                      {Math.round(scaled.leftPx + scaled.widthPx)},
                      {Math.round(scaled.topPx + scaled.heightPx)}]
                    </span>
                  </div>
                  <span className="font-semibold text-indigo-300">
                    {Math.round((det.confidence || 0) * 100)}%
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-emerald-400 font-medium">
            Tidak ditemukan deteksi kerusakan visual di atas ambang confidence
            model pada citra ini.
          </p>
        )}
      </div>
    </div>
  );
}
