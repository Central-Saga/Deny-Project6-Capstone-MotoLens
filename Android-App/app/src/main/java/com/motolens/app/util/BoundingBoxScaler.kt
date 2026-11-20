package com.motolens.app.util

import com.google.gson.JsonElement
import kotlin.math.max
import kotlin.math.min

data class NormalizedBbox(
    val x1: Float,
    val y1: Float,
    val x2: Float,
    val y2: Float
)

data class ScaledCanvasRect(
    val left: Float,
    val top: Float,
    val right: Float,
    val bottom: Float,
    val width: Float,
    val height: Float
)

data class FitViewport(
    val scale: Float,
    val offsetX: Float,
    val offsetY: Float,
    val renderedWidth: Float,
    val renderedHeight: Float
)

object BoundingBoxScaler {

    /**
     * Parses a bounding box from either a JSON array `[x1, y1, x2, y2]`
     * or a JSON object `{"x1": ..., "y1": ..., "x2": ..., "y2": ...}`.
     */
    fun parseBbox(element: JsonElement?): NormalizedBbox? {
        if (element == null || element.isJsonNull) return null
        return try {
            when {
                element.isJsonArray -> {
                    val arr = element.asJsonArray
                    if (arr.size() >= 4) {
                        NormalizedBbox(
                            x1 = arr[0].asFloat,
                            y1 = arr[1].asFloat,
                            x2 = arr[2].asFloat,
                            y2 = arr[3].asFloat
                        )
                    } else null
                }
                element.isJsonObject -> {
                    val obj = element.asJsonObject
                    if (obj.has("x1") && obj.has("y1") && obj.has("x2") && obj.has("y2")) {
                        NormalizedBbox(
                            x1 = obj.get("x1").asFloat,
                            y1 = obj.get("y1").asFloat,
                            x2 = obj.get("x2").asFloat,
                            y2 = obj.get("y2").asFloat
                        )
                    } else null
                }
                else -> null
            }
        } catch (_: Exception) {
            null
        }
    }

    /**
     * Calculates the ContentScale.Fit viewport (scale + letterbox offsets)
     * so bounding boxes align 1:1 with the rendered photo on any screen size (PRD Bab 3.5).
     */
    fun computeFitViewport(
        imageWidth: Int,
        imageHeight: Int,
        canvasWidth: Float,
        canvasHeight: Float
    ): FitViewport {
        val safeImgW = max(1, imageWidth).toFloat()
        val safeImgH = max(1, imageHeight).toFloat()
        val safeCanvasW = max(1f, canvasWidth)
        val safeCanvasH = max(1f, canvasHeight)

        val scale = min(safeCanvasW / safeImgW, safeCanvasH / safeImgH)
        val renderedW = safeImgW * scale
        val renderedH = safeImgH * scale
        val offsetX = (safeCanvasW - renderedW) / 2f
        val offsetY = (safeCanvasH - renderedH) / 2f

        return FitViewport(
            scale = scale,
            offsetX = offsetX,
            offsetY = offsetY,
            renderedWidth = renderedW,
            renderedHeight = renderedH
        )
    }

    /**
     * Scales raw `[x1, y1, x2, y2]` coordinates proportionally to the target canvas
     * while clamping values inside the original image bounds.
     */
    fun scaleToFitCanvas(
        bbox: NormalizedBbox,
        imageWidth: Int,
        imageHeight: Int,
        canvasWidth: Float,
        canvasHeight: Float
    ): ScaledCanvasRect {
        val safeImgW = max(1, imageWidth).toFloat()
        val safeImgH = max(1, imageHeight).toFloat()

        val clampedX1 = bbox.x1.coerceIn(0f, safeImgW)
        val clampedY1 = bbox.y1.coerceIn(0f, safeImgH)
        val clampedX2 = max(clampedX1, bbox.x2.coerceIn(0f, safeImgW))
        val clampedY2 = max(clampedY1, bbox.y2.coerceIn(0f, safeImgH))

        val viewport = computeFitViewport(imageWidth, imageHeight, canvasWidth, canvasHeight)

        val left = viewport.offsetX + clampedX1 * viewport.scale
        val top = viewport.offsetY + clampedY1 * viewport.scale
        val right = viewport.offsetX + clampedX2 * viewport.scale
        val bottom = viewport.offsetY + clampedY2 * viewport.scale

        return ScaledCanvasRect(
            left = left,
            top = top,
            right = right,
            bottom = bottom,
            width = max(0f, right - left),
            height = max(0f, bottom - top)
        )
    }
}
