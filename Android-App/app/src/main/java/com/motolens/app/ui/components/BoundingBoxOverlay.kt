package com.motolens.app.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.motolens.app.data.model.DetectionItemDto
import com.motolens.app.ui.theme.BboxAccidentRed
import com.motolens.app.ui.theme.BboxDentOrange
import com.motolens.app.ui.theme.BboxScratchAmber
import com.motolens.app.ui.theme.CarbonBlack
import com.motolens.app.util.BoundingBoxScaler

/**
 * Renders the inspection photo with a proportional Jetpack Compose Canvas overlay
 * that scales `[x1, y1, x2, y2]` coordinates against `imageWidth` and `imageHeight` (PRD Bab 3.5).
 */
@Composable
fun BoundingBoxPhotoCanvas(
    imageModel: Any?,
    imageWidth: Int?,
    imageHeight: Int?,
    detections: List<DetectionItemDto>,
    modifier: Modifier = Modifier,
    showBoxes: Boolean = true
) {
    val textMeasurer = rememberTextMeasurer()
    val safeImgW = (imageWidth ?: 640).coerceAtLeast(1)
    val safeImgH = (imageHeight ?: 640).coerceAtLeast(1)

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(260.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(CarbonBlack)
    ) {
        AsyncImage(
            model = imageModel,
            contentDescription = "Foto Inspeksi YOLOv8",
            contentScale = ContentScale.Fit,
            modifier = Modifier.fillMaxSize()
        )

        if (showBoxes && detections.isNotEmpty()) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val canvasW = size.width
                val canvasH = size.height

                detections.forEach { det ->
                    val bbox = det.parsedBbox ?: return@forEach
                    val scaled = BoundingBoxScaler.scaleToFitCanvas(
                        bbox = bbox,
                        imageWidth = safeImgW,
                        imageHeight = safeImgH,
                        canvasWidth = canvasW,
                        canvasHeight = canvasH
                    )

                    val boxColor = when (det.className.lowercase()) {
                        "accident" -> BboxAccidentRed
                        "dent" -> BboxDentOrange
                        else -> BboxScratchAmber
                    }

                    // Draw translucent fill
                    drawRect(
                        color = boxColor.copy(alpha = 0.16f),
                        topLeft = Offset(scaled.left, scaled.top),
                        size = Size(scaled.width, scaled.height)
                    )

                    // Draw crisp bounding box border
                    drawRect(
                        color = boxColor,
                        topLeft = Offset(scaled.left, scaled.top),
                        size = Size(scaled.width, scaled.height),
                        style = Stroke(width = 2.5.dp.toPx())
                    )

                    // Draw class + confidence label pill
                    val confPct = (det.confidence * 100).toInt()
                    val labelText = "${det.className} $confPct%"
                    val measured = textMeasurer.measure(
                        text = labelText,
                        style = TextStyle(
                            color = Color.White,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    )
                    val labelY = (scaled.top - measured.size.height - 6f).coerceAtLeast(4f)
                    drawRect(
                        color = boxColor,
                        topLeft = Offset(scaled.left, labelY),
                        size = Size(
                            measured.size.width + 12f,
                            measured.size.height + 6f
                        )
                    )
                    drawText(
                        textLayoutResult = measured,
                        topLeft = Offset(scaled.left + 6f, labelY + 3f)
                    )
                }
            }
        }

        // Top Left HUD Pill
        Surface(
            color = CarbonBlack.copy(alpha = 0.85f),
            contentColor = Color.White,
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(10.dp)
        ) {
            Text(
                text = "YOLOv8n ONNX • ${detections.size} Deteksi (${safeImgW}x${safeImgH})",
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
            )
        }
    }
}
