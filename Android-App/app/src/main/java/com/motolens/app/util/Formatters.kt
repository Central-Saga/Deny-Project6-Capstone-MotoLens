package com.motolens.app.util

import java.text.NumberFormat
import java.util.Locale

object Formatters {

    private val indonesiaLocale = Locale.forLanguageTag("id-ID")

    fun formatRupiah(amount: Long?): String {
        if (amount == null) return "Rp 0"
        val formatter = NumberFormat.getNumberInstance(indonesiaLocale)
        return "Rp ${formatter.format(amount)}"
    }

    fun formatRupiah(amount: Double?): String {
        if (amount == null) return "Rp 0"
        return formatRupiah(amount.toLong())
    }

    fun formatNumber(value: Int?): String {
        if (value == null) return "0"
        return NumberFormat.getNumberInstance(indonesiaLocale).format(value)
    }

    fun formatPriceLabelText(label: String?): String {
        return when (label?.lowercase()) {
            "good_deal" -> "Good Deal (Di Bawah Pasar)"
            "fair_price" -> "Fair Price (Harga Wajar)"
            "overpriced", "above_market" -> "Overpriced (Di Atas Pasar)"
            else -> "Belum Dilabeli"
        }
    }

    fun formatConditionGradeText(grade: String?): String {
        return when (grade?.lowercase()) {
            "mulus", "a" -> "Grade A • Mulus"
            "lecet_ringan", "b" -> "Grade B • Lecet Ringan"
            "perlu_perbaikan", "c", "d" -> "Grade C • Perlu Perbaikan"
            else -> "Grade ${grade ?: "-"}"
        }
    }

    fun formatSourceBadgeText(sourceType: String?, isCameraVerified: Boolean): String {
        if (isCameraVerified || sourceType == "android_camera") {
            return "Kamera Android Terverifikasi"
        }
        return when (sourceType) {
            "web_upload" -> "Simulasi Web Upload"
            "seed_demo" -> "Data Demo Katalog"
            else -> "Terdaftar"
        }
    }

    /**
     * Ensures Base URL ends with `/api/v1/` and has a valid http/https scheme.
     */
    fun normalizeBaseUrl(rawUrl: String): String {
        var trimmed = rawUrl.trim()
        if (trimmed.isEmpty()) {
            return "http://10.0.2.2:8000/api/v1/"
        }
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            trimmed = "http://$trimmed"
        }
        if (!trimmed.endsWith("/")) {
            trimmed += "/"
        }
        if (!trimmed.contains("/api/v1/")) {
            trimmed = trimmed.trimEnd('/') + "/api/v1/"
        }
        return trimmed
    }

    /**
     * Rewrites localhost/127.0.0.1 media URLs returned by the backend container
     * so they resolve properly on the Android Emulator or LAN device based on the active API host.
     */
    fun resolveMediaUrl(mediaUrl: String?, activeBaseUrl: String): String? {
        if (mediaUrl.isNullOrBlank()) return null
        return try {
            val apiHostRegex = Regex("^(https?://[^/]+)")
            val apiOrigin = apiHostRegex.find(activeBaseUrl)?.groupValues?.get(1) ?: return mediaUrl
            when {
                mediaUrl.startsWith("http://localhost:8000") ->
                    mediaUrl.replaceFirst("http://localhost:8000", apiOrigin)
                mediaUrl.startsWith("http://127.0.0.1:8000") ->
                    mediaUrl.replaceFirst("http://127.0.0.1:8000", apiOrigin)
                mediaUrl.startsWith("/") ->
                    "$apiOrigin$mediaUrl"
                else -> mediaUrl
            }
        } catch (_: Exception) {
            mediaUrl
        }
    }
}
