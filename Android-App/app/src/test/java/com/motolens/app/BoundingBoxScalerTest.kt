package com.motolens.app

import com.google.gson.JsonParser
import com.motolens.app.util.BoundingBoxScaler
import com.motolens.app.util.NormalizedBbox
import org.junit.Assert.*
import org.junit.Test

class BoundingBoxScalerTest {

    @Test
    fun `parseBbox parses JSON array format correctly`() {
        val json = JsonParser.parseString("[120.5, 80.0, 340.5, 260.0]")
        val bbox = BoundingBoxScaler.parseBbox(json)

        assertNotNull(bbox)
        assertEquals(120.5f, bbox!!.x1, 0.01f)
        assertEquals(80.0f, bbox.y1, 0.01f)
        assertEquals(340.5f, bbox.x2, 0.01f)
        assertEquals(260.0f, bbox.y2, 0.01f)
    }

    @Test
    fun `parseBbox parses JSON object format correctly`() {
        val json = JsonParser.parseString("""{"x1": 50, "y1": 60, "x2": 250, "y2": 300}""")
        val bbox = BoundingBoxScaler.parseBbox(json)

        assertNotNull(bbox)
        assertEquals(50f, bbox!!.x1, 0.01f)
        assertEquals(60f, bbox.y1, 0.01f)
        assertEquals(250f, bbox.x2, 0.01f)
        assertEquals(300f, bbox.y2, 0.01f)
    }

    @Test
    fun `scaleToFitCanvas scales 1 to 1 when image and canvas have identical dimensions`() {
        val bbox = NormalizedBbox(100f, 150f, 300f, 450f)
        val scaled = BoundingBoxScaler.scaleToFitCanvas(
            bbox = bbox,
            imageWidth = 640,
            imageHeight = 640,
            canvasWidth = 640f,
            canvasHeight = 640f
        )

        assertEquals(100f, scaled.left, 0.01f)
        assertEquals(150f, scaled.top, 0.01f)
        assertEquals(300f, scaled.right, 0.01f)
        assertEquals(450f, scaled.bottom, 0.01f)
        assertEquals(200f, scaled.width, 0.01f)
        assertEquals(300f, scaled.height, 0.01f)
    }

    @Test
    fun `scaleToFitCanvas applies letterbox offset accurately for landscape image in square canvas`() {
        // Image: 1000x500, Canvas: 500x500 -> scale = 0.5, rendered = 500x250, offsetX = 0, offsetY = 125
        val bbox = NormalizedBbox(200f, 100f, 600f, 300f)
        val scaled = BoundingBoxScaler.scaleToFitCanvas(
            bbox = bbox,
            imageWidth = 1000,
            imageHeight = 500,
            canvasWidth = 500f,
            canvasHeight = 500f
        )

        assertEquals(100f, scaled.left, 0.01f)
        assertEquals(125f + 50f, scaled.top, 0.01f)
        assertEquals(300f, scaled.right, 0.01f)
        assertEquals(125f + 150f, scaled.bottom, 0.01f)
        assertEquals(200f, scaled.width, 0.01f)
        assertEquals(100f, scaled.height, 0.01f)
    }

    @Test
    fun `scaleToFitCanvas clamps out-of-bounds coordinates inside image dimensions`() {
        val bbox = NormalizedBbox(-50f, -20f, 900f, 800f)
        val scaled = BoundingBoxScaler.scaleToFitCanvas(
            bbox = bbox,
            imageWidth = 640,
            imageHeight = 640,
            canvasWidth = 320f,
            canvasHeight = 320f
        )

        assertEquals(0f, scaled.left, 0.01f)
        assertEquals(0f, scaled.top, 0.01f)
        assertEquals(320f, scaled.right, 0.01f)
        assertEquals(320f, scaled.bottom, 0.01f)
    }
}
