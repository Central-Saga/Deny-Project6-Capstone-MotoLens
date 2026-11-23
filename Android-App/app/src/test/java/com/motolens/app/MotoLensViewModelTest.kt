package com.motolens.app

import com.motolens.app.ui.viewmodel.MotoLensUiState
import com.motolens.app.util.Formatters
import org.junit.Assert.*
import org.junit.Test
import java.io.File

class MotoLensViewModelTest {

    @Test
    fun `initial MotoLensUiState holds valid default emulator base url and empty lists`() {
        val state = MotoLensUiState()
        assertEquals("http://10.0.2.2:8000/api/v1/", state.activeBaseUrl)
        assertFalse(state.isAuthenticated)
        assertTrue(state.catalogItems.isEmpty())
        assertNull(state.capturedPhotoFile)
    }

    @Test
    fun `camera capture updates state with photo file and optional GPS coordinates`() {
        val dummyFile = File("motolens_camerax_test.jpg")
        val initial = MotoLensUiState()
        val updated = initial.copy(
            capturedPhotoFile = dummyFile,
            capturedLatitude = -8.6705,
            capturedLongitude = 115.2126,
            capturedAccuracyM = 12.5f
        )

        assertEquals("motolens_camerax_test.jpg", updated.capturedPhotoFile?.name)
        assertEquals(-8.6705, updated.capturedLatitude!!, 0.0001)
        assertEquals(115.2126, updated.capturedLongitude!!, 0.0001)
        assertEquals(12.5f, updated.capturedAccuracyM!!, 0.01f)
    }

    @Test
    fun `formatters format Indonesian Rupiah and semantic labels accurately`() {
        assertTrue(Formatters.formatRupiah(28500000L).startsWith("Rp "))
        assertEquals("Good Deal (Di Bawah Pasar)", Formatters.formatPriceLabelText("good_deal"))
        assertEquals("Fair Price (Harga Wajar)", Formatters.formatPriceLabelText("fair_price"))
        assertEquals("Overpriced (Di Atas Pasar)", Formatters.formatPriceLabelText("overpriced"))
        assertEquals("Kamera Android Terverifikasi", Formatters.formatSourceBadgeText("android_camera", true))
        assertEquals("6281200000001", Formatters.formatWhatsappPhone("081200000001"))
        val waUrl = Formatters.buildWhatsAppSurveyUrl("081200000001", "Honda PCX 160", "2026-12-01 10:00")
        assertNotNull(waUrl)
        assertTrue(waUrl!!.startsWith("https://wa.me/6281200000001?text="))
    }
}
