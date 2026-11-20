package com.motolens.app

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.motolens.app.data.model.ApiResponse
import com.motolens.app.data.model.MotorcycleDetailDto
import com.motolens.app.util.Formatters
import org.junit.Assert.*
import org.junit.Test

class ApiModelAndRepositoryTest {

    private val gson = Gson()

    @Test
    fun `normalizeBaseUrl ensures trailing api v1 slash and http scheme`() {
        assertEquals(
            "http://10.0.2.2:8000/api/v1/",
            Formatters.normalizeBaseUrl("10.0.2.2:8000")
        )
        assertEquals(
            "https://demo-motolens.trycloudflare.com/api/v1/",
            Formatters.normalizeBaseUrl("https://demo-motolens.trycloudflare.com")
        )
        assertEquals(
            "http://192.168.1.25:8000/api/v1/",
            Formatters.normalizeBaseUrl("http://192.168.1.25:8000/api/v1")
        )
    }

    @Test
    fun `resolveMediaUrl rewrites localhost 8000 to active emulator or tunnel host`() {
        val rawUrl = "http://localhost:8000/storage/inspections/annotated_1.jpg"
        val resolvedEmulator = Formatters.resolveMediaUrl(rawUrl, "http://10.0.2.2:8000/api/v1/")
        assertEquals("http://10.0.2.2:8000/storage/inspections/annotated_1.jpg", resolvedEmulator)

        val resolvedTunnel = Formatters.resolveMediaUrl(
            rawUrl,
            "https://bali-motolens.trycloudflare.com/api/v1/"
        )
        assertEquals(
            "https://bali-motolens.trycloudflare.com/storage/inspections/annotated_1.jpg",
            resolvedTunnel
        )
    }

    @Test
    fun `Gson deserializes MotorcycleDetailDto and ExplainablePriceBreakdownDto accurately`() {
        val sampleJson = """
            {
              "success": true,
              "message": "Detail motor berhasil dimuat.",
              "data": {
                "id": 15,
                "title": "Honda PCX 160 ABS 2023 Mulus",
                "brand": "Honda",
                "model_name": "PCX 160",
                "category": "matic",
                "engine_cc": 160,
                "year": 2023,
                "odometer_km": 12000,
                "tax_status": "active",
                "seller_price": 27500000,
                "base_depreciated_price": 29000000,
                "ml_predicted_price": 28130000,
                "damage_penalty_percent": 3.0,
                "price_label": "good_deal",
                "condition_grade": "mulus",
                "location_address": "Denpasar Selatan, Bali",
                "status": "available",
                "moderation_status": "approved",
                "verification_status": "verified",
                "source_type": "android_camera",
                "is_camera_verified": true,
                "price_breakdown": {
                  "standard_price": 33000000,
                  "vehicle_year": 2023,
                  "vehicle_age_years": 3,
                  "age_depreciation_percent": 12.12,
                  "age_depreciation_amount": 4000000,
                  "odometer_km": 12000,
                  "odometer_penalty": 0,
                  "tax_status": "active",
                  "tax_penalty": 0,
                  "base_depreciated_price": 29000000,
                  "damage_penalty_percent": 3.0,
                  "ml_predicted_price": 28130000,
                  "seller_price": 27500000,
                  "price_label": "good_deal",
                  "condition_grade": "mulus",
                  "confidence_threshold": 0.35,
                  "model_version": "v2.0.0"
                },
                "inspection_certificate": {
                  "id": 99,
                  "certificate_number": "MTL-2026-00099",
                  "model_name": "YOLOv8n-ONNX",
                  "model_version": "v2.0.0",
                  "image_width": 640,
                  "image_height": 640,
                  "inference_time_ms": 48,
                  "detections": [
                    {
                      "class_name": "Scratch",
                      "confidence": 0.87,
                      "bbox": [110, 140, 220, 260]
                    }
                  ],
                  "counts": {
                    "scratch": 1,
                    "dent": 0,
                    "accident": 0,
                    "total": 1
                  }
                }
              }
            }
        """.trimIndent()

        val type = object : TypeToken<ApiResponse<MotorcycleDetailDto>>() {}.type
        val parsed: ApiResponse<MotorcycleDetailDto> = gson.fromJson(sampleJson, type)

        assertTrue(parsed.success)
        val detail = parsed.data
        assertNotNull(detail)
        assertEquals(15, detail!!.id)
        assertEquals("good_deal", detail.priceLabel)
        assertTrue(detail.isCameraVerified)

        val breakdown = detail.priceBreakdown
        assertNotNull(breakdown)
        assertEquals(33000000L, breakdown!!.standardPrice)
        assertEquals(28130000L, breakdown.mlPredictedPrice)
        assertEquals(3.0, breakdown.damagePenaltyPercent, 0.01)

        val cert = detail.inspectionCertificate
        assertNotNull(cert)
        assertEquals("MTL-2026-00099", cert!!.certificateNumber)
        assertEquals(1, cert.allDetections.size)
        val bbox = cert.allDetections.first().parsedBbox
        assertNotNull(bbox)
        assertEquals(110f, bbox!!.x1, 0.01f)
    }
}
