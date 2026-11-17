import type { DetectionBbox, DetectionItem } from '@/types/inspection';

export interface ScaledBox {
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
  heightPercent: number;
  leftPx: number;
  topPx: number;
  widthPx: number;
  heightPx: number;
}

/**
 * Normalisasi struktur bbox dari array [x1, y1, x2, y2] atau objek {x1, y1, x2, y2}
 */
export function normalizeBbox(
  bbox: DetectionBbox | [number, number, number, number]
): DetectionBbox {
  if (Array.isArray(bbox)) {
    return {
      x1: Number(bbox[0] ?? 0),
      y1: Number(bbox[1] ?? 0),
      x2: Number(bbox[2] ?? 0),
      y2: Number(bbox[3] ?? 0),
    };
  }
  return {
    x1: Number(bbox.x1 ?? 0),
    y1: Number(bbox.y1 ?? 0),
    x2: Number(bbox.x2 ?? 0),
    y2: Number(bbox.y2 ?? 0),
  };
}

/**
 * Kalkulasi skala proporsional koordinat bounding box terhadap ukuran gambar asli
 * (image_width, image_height) dan ukuran kontainer render (PRD Bab 3.5).
 */
export function scaleBoundingBox(
  item: DetectionItem,
  imageWidth: number,
  imageHeight: number,
  renderedWidth: number = imageWidth,
  renderedHeight: number = imageHeight
): ScaledBox {
  const safeImgW = Math.max(1, imageWidth || 640);
  const safeImgH = Math.max(1, imageHeight || 640);
  const box = normalizeBbox(item.bbox);

  const clampedX1 = Math.max(0, Math.min(safeImgW, box.x1));
  const clampedY1 = Math.max(0, Math.min(safeImgH, box.y1));
  const clampedX2 = Math.max(clampedX1, Math.min(safeImgW, box.x2));
  const clampedY2 = Math.max(clampedY1, Math.min(safeImgH, box.y2));

  const rawWidth = clampedX2 - clampedX1;
  const rawHeight = clampedY2 - clampedY1;

  const scaleX = renderedWidth / safeImgW;
  const scaleY = renderedHeight / safeImgH;

  return {
    leftPercent: (clampedX1 / safeImgW) * 100,
    topPercent: (clampedY1 / safeImgH) * 100,
    widthPercent: (rawWidth / safeImgW) * 100,
    heightPercent: (rawHeight / safeImgH) * 100,
    leftPx: clampedX1 * scaleX,
    topPx: clampedY1 * scaleY,
    widthPx: rawWidth * scaleX,
    heightPx: rawHeight * scaleY,
  };
}

/**
 * Warna dan label untuk setiap kelas kerusakan YOLOv8 (Accident, Dent, Scratch)
 */
export function getDamageClassMeta(className: string): {
  labelId: string;
  strokeColor: string;
  bgBadge: string;
  borderClass: string;
} {
  const normalized = className.toLowerCase();
  if (normalized === 'accident') {
    return {
      labelId: 'Accident (Benturan)',
      strokeColor: '#ef4444', // Rose/Red
      bgBadge: 'bg-rose-600 text-white',
      borderClass: 'border-rose-500 bg-rose-500/15',
    };
  }
  if (normalized === 'dent') {
    return {
      labelId: 'Dent (Penyok)',
      strokeColor: '#f59e0b', // Amber
      bgBadge: 'bg-amber-500 text-slate-950',
      borderClass: 'border-amber-500 bg-amber-500/15',
    };
  }
  return {
    labelId: 'Scratch (Baret)',
    strokeColor: '#0ea5e9', // Sky Blue
    bgBadge: 'bg-sky-500 text-white',
    borderClass: 'border-sky-400 bg-sky-500/15',
  };
}
