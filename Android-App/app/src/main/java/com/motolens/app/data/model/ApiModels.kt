package com.motolens.app.data.model

import com.google.gson.JsonElement
import com.google.gson.annotations.SerializedName
import com.motolens.app.util.BoundingBoxScaler
import com.motolens.app.util.NormalizedBbox

/**
 * Standard API Envelope from Laravel `/api/v1` (PRD Bab 6.1)
 */
data class ApiResponse<T>(
    @SerializedName("success") val success: Boolean = false,
    @SerializedName("message") val message: String = "",
    @SerializedName("data") val data: T? = null,
    @SerializedName("meta") val meta: PaginationMeta? = null,
    @SerializedName("errors") val errors: Map<String, List<String>>? = null
)

data class PaginationMeta(
    @SerializedName("current_page") val currentPage: Int? = null,
    @SerializedName("last_page") val lastPage: Int? = null,
    @SerializedName("per_page") val perPage: Int? = null,
    @SerializedName("total") val total: Int? = null,
    @SerializedName("unread_count") val unreadCount: Int? = null
)

// =========================================================================
// 1. AUTH MODELS
// =========================================================================

data class UserDto(
    @SerializedName("id") val id: Int = 0,
    @SerializedName("name") val name: String = "",
    @SerializedName("email") val email: String = "",
    @SerializedName("phone_whatsapp") val phoneWhatsapp: String? = null,
    @SerializedName("avatar_url") val avatarUrl: String? = null,
    @SerializedName("is_active") val isActive: Boolean = true,
    @SerializedName("roles") val roles: List<String> = emptyList()
) {
    val isAdmin: Boolean
        get() = roles.any { it.equals("admin", ignoreCase = true) }
}

data class AuthDataDto(
    @SerializedName("user") val user: UserDto,
    @SerializedName("token") val token: String,
    @SerializedName("token_type") val tokenType: String = "Bearer"
)

data class LoginRequestDto(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String,
    @SerializedName("device_name") val deviceName: String = "MotoLens-Android-CameraX"
)

data class RegisterRequestDto(
    @SerializedName("name") val name: String,
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String,
    @SerializedName("password_confirmation") val passwordConfirmation: String,
    @SerializedName("phone_whatsapp") val phoneWhatsapp: String
)

// =========================================================================
// 2. REFERENCE MOTORCYCLE MODELS & CATALOG
// =========================================================================

data class MotorcycleModelRefDto(
    @SerializedName("id") val id: Int = 0,
    @SerializedName("brand") val brand: String = "",
    @SerializedName("model_name") val modelName: String = "",
    @SerializedName("full_name") val fullName: String? = null,
    @SerializedName("category") val category: String = "matic",
    @SerializedName("engine_cc") val engineCc: Int = 150,
    @SerializedName("standard_price") val standardPrice: Long = 0L,
    @SerializedName("is_active") val isActive: Boolean = true
) {
    val displayTitle: String
        get() = fullName ?: "$brand $modelName (${engineCc}cc)"
}

data class InspectionSummaryDto(
    @SerializedName("scratch_count") val scratchCount: Int = 0,
    @SerializedName("dent_count") val dentCount: Int = 0,
    @SerializedName("accident_count") val accidentCount: Int = 0,
    @SerializedName("total_damages") val totalDamages: Int = 0,
    @SerializedName("damage_penalty_percent") val damagePenaltyPercent: Double = 0.0
)

data class SellerBasicDto(
    @SerializedName("id") val id: Int = 0,
    @SerializedName("name") val name: String = "",
    @SerializedName("phone_whatsapp") val phoneWhatsapp: String? = null,
    @SerializedName("avatar_url") val avatarUrl: String? = null
)

data class MotorcycleListItemDto(
    @SerializedName("id") val id: Int = 0,
    @SerializedName("title") val title: String = "",
    @SerializedName("brand") val brand: String = "",
    @SerializedName("model_name") val modelName: String = "",
    @SerializedName("category") val category: String = "",
    @SerializedName("engine_cc") val engineCc: Int = 0,
    @SerializedName("year") val year: Int = 2022,
    @SerializedName("odometer_km") val odometerKm: Int = 0,
    @SerializedName("tax_status") val taxStatus: String = "active",
    @SerializedName("seller_price") val sellerPrice: Long = 0L,
    @SerializedName("base_depreciated_price") val baseDepreciatedPrice: Long = 0L,
    @SerializedName("ml_predicted_price") val mlPredictedPrice: Long = 0L,
    @SerializedName("price_label") val priceLabel: String? = null,
    @SerializedName("condition_grade") val conditionGrade: String? = null,
    @SerializedName("location_address") val locationAddress: String = "Denpasar, Bali",
    @SerializedName("status") val status: String = "available",
    @SerializedName("moderation_status") val moderationStatus: String = "approved",
    @SerializedName("verification_status") val verificationStatus: String = "submitted",
    @SerializedName("source_type") val sourceType: String? = "android_camera",
    @SerializedName("is_camera_verified") val isCameraVerified: Boolean = false,
    @SerializedName("is_favorited") val isFavorited: Boolean = false,
    @SerializedName("inspection_summary") val inspectionSummary: InspectionSummaryDto? = null,
    @SerializedName("main_image_url") val mainImageUrl: String? = null,
    @SerializedName("seller") val seller: SellerBasicDto? = null,
    @SerializedName("created_at") val createdAt: String? = null
)

// =========================================================================
// 3. DETAIL, CERTIFICATE & EXPLAINABLE PRICE BREAKDOWN (Bab 4.8)
// =========================================================================

data class DetectionCountsDto(
    @SerializedName("scratch") val scratch: Int = 0,
    @SerializedName("dent") val dent: Int = 0,
    @SerializedName("accident") val accident: Int = 0,
    @SerializedName("total") val total: Int = 0
)

data class DetectionItemDto(
    @SerializedName("class_id") val classId: Int? = null,
    @SerializedName("class_name") val className: String = "Scratch",
    @SerializedName("confidence") val confidence: Float = 0f,
    @SerializedName("bbox") val rawBbox: JsonElement? = null
) {
    val parsedBbox: NormalizedBbox?
        get() = BoundingBoxScaler.parseBbox(rawBbox)
}

data class ExplainablePriceBreakdownDto(
    @SerializedName("standard_price") val standardPrice: Long = 0L,
    @SerializedName("vehicle_year") val vehicleYear: Int = 2022,
    @SerializedName("vehicle_age_years") val vehicleAgeYears: Int = 0,
    @SerializedName("age_depreciation_percent") val ageDepreciationPercent: Double = 0.0,
    @SerializedName("age_depreciation_amount") val ageDepreciationAmount: Long = 0L,
    @SerializedName("odometer_km") val odometerKm: Int = 0,
    @SerializedName("odometer_penalty") val odometerPenalty: Long = 0L,
    @SerializedName("tax_status") val taxStatus: String = "active",
    @SerializedName("tax_penalty") val taxPenalty: Long = 0L,
    @SerializedName("base_depreciated_price") val baseDepreciatedPrice: Long = 0L,
    @SerializedName("detection_counts") val detectionCounts: DetectionCountsDto? = null,
    @SerializedName("damage_penalty_percent") val damagePenaltyPercent: Double = 0.0,
    @SerializedName("ml_predicted_price") val mlPredictedPrice: Long = 0L,
    @SerializedName("seller_price") val sellerPrice: Long? = null,
    @SerializedName("price_label") val priceLabel: String? = null,
    @SerializedName("condition_grade") val conditionGrade: String? = null,
    @SerializedName("confidence_threshold") val confidenceThreshold: Double = 0.35,
    @SerializedName("model_version") val modelVersion: String = "v1.0.0"
)

data class InspectionCertificateDto(
    @SerializedName("id") val id: Int = 0,
    @SerializedName("certificate_number") val certificateNumber: String = "",
    @SerializedName("inspected_at") val inspectedAt: String? = null,
    @SerializedName("model_name") val modelName: String = "YOLOv8n-ONNX",
    @SerializedName("model_version") val modelVersion: String = "v1.0.0",
    @SerializedName("model_sha256") val modelSha256: String? = null,
    @SerializedName("confidence_threshold") val confidenceThreshold: Double = 0.35,
    @SerializedName("nms_iou_threshold") val nmsIouThreshold: Double = 0.45,
    @SerializedName("source_type") val sourceType: String = "android_camera",
    @SerializedName("verification_status") val verificationStatus: String = "submitted",
    @SerializedName("image_width") val imageWidth: Int? = null,
    @SerializedName("image_height") val imageHeight: Int? = null,
    @SerializedName("inference_time_ms") val inferenceTimeMs: Int? = null,
    @SerializedName("annotated_image_url") val annotatedImageUrl: String? = null,
    @SerializedName("annotated_photo_url") val annotatedPhotoUrl: String? = null,
    @SerializedName("raw_image_url") val rawImageUrl: String? = null,
    @SerializedName("raw_photo_url") val rawPhotoUrl: String? = null,
    @SerializedName("detections") val detections: List<DetectionItemDto>? = null,
    @SerializedName("detections_json") val detectionsJson: List<DetectionItemDto>? = null,
    @SerializedName("counts") val counts: DetectionCountsDto? = null
) {
    val allDetections: List<DetectionItemDto>
        get() = detections ?: detectionsJson ?: emptyList()

    val bestPhotoUrl: String?
        get() = rawImageUrl ?: rawPhotoUrl ?: annotatedImageUrl ?: annotatedPhotoUrl
}

data class PriceHistoryItemDto(
    @SerializedName("id") val id: Int = 0,
    @SerializedName("old_price") val oldPrice: Long = 0L,
    @SerializedName("new_price") val newPrice: Long = 0L,
    @SerializedName("created_at") val createdAt: String = ""
)

data class MotorcycleDetailDto(
    @SerializedName("id") val id: Int = 0,
    @SerializedName("title") val title: String = "",
    @SerializedName("description") val description: String? = null,
    @SerializedName("brand") val brand: String = "",
    @SerializedName("model_name") val modelName: String = "",
    @SerializedName("category") val category: String = "",
    @SerializedName("engine_cc") val engineCc: Int = 0,
    @SerializedName("year") val year: Int = 2022,
    @SerializedName("odometer_km") val odometerKm: Int = 0,
    @SerializedName("tax_status") val taxStatus: String = "active",
    @SerializedName("seller_price") val sellerPrice: Long = 0L,
    @SerializedName("base_depreciated_price") val baseDepreciatedPrice: Long = 0L,
    @SerializedName("ml_predicted_price") val mlPredictedPrice: Long = 0L,
    @SerializedName("damage_penalty_percent") val damagePenaltyPercent: Double = 0.0,
    @SerializedName("price_label") val priceLabel: String? = null,
    @SerializedName("condition_grade") val conditionGrade: String? = null,
    @SerializedName("location_address") val locationAddress: String = "",
    @SerializedName("status") val status: String = "available",
    @SerializedName("moderation_status") val moderationStatus: String = "approved",
    @SerializedName("verification_status") val verificationStatus: String = "submitted",
    @SerializedName("source_type") val sourceType: String? = "android_camera",
    @SerializedName("is_camera_verified") val isCameraVerified: Boolean = false,
    @SerializedName("is_favorited") val isFavorited: Boolean = false,
    @SerializedName("main_image_url") val mainImageUrl: String? = null,
    @SerializedName("seller") val seller: SellerBasicDto? = null,
    @SerializedName("price_breakdown") val priceBreakdown: ExplainablePriceBreakdownDto? = null,
    @SerializedName("price_histories") val priceHistories: List<PriceHistoryItemDto>? = null,
    @SerializedName("inspection_certificate") val inspectionCertificate: InspectionCertificateDto? = null
)

// =========================================================================
// 4. INSPECTION RESPONSE & PUBLISH LISTING
// =========================================================================

data class MotorcycleInspectionDto(
    @SerializedName("id") val id: Int = 0,
    @SerializedName("certificate_number") val certificateNumber: String = "",
    @SerializedName("motorcycle_id") val motorcycleId: Int? = null,
    @SerializedName("user_id") val userId: Int = 0,
    @SerializedName("model_name") val modelName: String = "YOLOv8n-ONNX",
    @SerializedName("model_version") val modelVersion: String = "v1.0.0",
    @SerializedName("model_sha256") val modelSha256: String? = null,
    @SerializedName("confidence_threshold") val confidenceThreshold: Double = 0.35,
    @SerializedName("nms_iou_threshold") val nmsIouThreshold: Double = 0.45,
    @SerializedName("source_type") val sourceType: String = "android_camera",
    @SerializedName("inspection_status") val inspectionStatus: String = "completed",
    @SerializedName("verification_status") val verificationStatus: String = "submitted",
    @SerializedName("image_width") val imageWidth: Int? = null,
    @SerializedName("image_height") val imageHeight: Int? = null,
    @SerializedName("scratch_count") val scratchCount: Int = 0,
    @SerializedName("dent_count") val dentCount: Int = 0,
    @SerializedName("accident_count") val accidentCount: Int = 0,
    @SerializedName("total_damages_detected") val totalDamagesDetected: Int = 0,
    @SerializedName("average_confidence") val averageConfidence: Double? = null,
    @SerializedName("inference_time_ms") val inferenceTimeMs: Int? = null,
    @SerializedName("base_depreciated_price") val baseDepreciatedPrice: Long = 0L,
    @SerializedName("ml_predicted_price") val mlPredictedPrice: Long = 0L,
    @SerializedName("damage_penalty_percent") val damagePenaltyPercent: Double = 0.0,
    @SerializedName("annotated_image_url") val annotatedImageUrl: String? = null,
    @SerializedName("annotated_photo_url") val annotatedPhotoUrl: String? = null,
    @SerializedName("raw_image_url") val rawImageUrl: String? = null,
    @SerializedName("raw_photo_url") val rawPhotoUrl: String? = null,
    @SerializedName("detections") val detections: List<DetectionItemDto>? = null,
    @SerializedName("detections_json") val detectionsJson: List<DetectionItemDto>? = null,
    @SerializedName("price_breakdown") val priceBreakdown: ExplainablePriceBreakdownDto? = null,
    @SerializedName("inspected_at") val inspectedAt: String? = null
) {
    val allDetections: List<DetectionItemDto>
        get() = detections ?: detectionsJson ?: emptyList()
}

data class PublishMotorcycleRequestDto(
    @SerializedName("inspection_id") val inspectionId: Int,
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String?,
    @SerializedName("seller_price") val sellerPrice: Long,
    @SerializedName("location_address") val locationAddress: String,
    @SerializedName("latitude") val latitude: Double? = null,
    @SerializedName("longitude") val longitude: Double? = null
)

data class UpdateMotorcycleRequestDto(
    @SerializedName("seller_price") val sellerPrice: Long? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("location_address") val locationAddress: String? = null
)

data class SubmitFeedbackRequestDto(
    @SerializedName("feedback_type") val feedbackType: String,
    @SerializedName("comment") val comment: String
)

// =========================================================================
// 5. INQUIRIES, NOTIFICATIONS & FAVORITES
// =========================================================================

data class InquiryMotorcycleSummaryDto(
    @SerializedName("id") val id: Int = 0,
    @SerializedName("title") val title: String = "",
    @SerializedName("brand") val brand: String = "",
    @SerializedName("model_name") val modelName: String = "",
    @SerializedName("year") val year: Int = 2022,
    @SerializedName("seller_price") val sellerPrice: Long = 0L,
    @SerializedName("location_address") val locationAddress: String = ""
)

data class InquiryPartyDto(
    @SerializedName("id") val id: Int = 0,
    @SerializedName("name") val name: String = "",
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("phone_whatsapp") val phoneWhatsapp: String? = null
)

data class InquiryItemDto(
    @SerializedName("id") val id: Int = 0,
    @SerializedName("motorcycle_id") val motorcycleId: Int = 0,
    @SerializedName("motorcycle") val motorcycle: InquiryMotorcycleSummaryDto? = null,
    @SerializedName("buyer") val buyer: InquiryPartyDto? = null,
    @SerializedName("seller") val seller: InquiryPartyDto? = null,
    @SerializedName("appointment_date") val appointmentDate: String = "",
    @SerializedName("offered_price") val offeredPrice: Long? = null,
    @SerializedName("notes") val notes: String? = null,
    @SerializedName("status") val status: String = "pending",
    @SerializedName("created_at") val createdAt: String? = null
)

data class CreateInquiryRequestDto(
    @SerializedName("motorcycle_id") val motorcycleId: Int,
    @SerializedName("appointment_date") val appointmentDate: String,
    @SerializedName("offered_price") val offeredPrice: Long? = null,
    @SerializedName("notes") val notes: String? = null
)

data class UpdateInquiryStatusRequestDto(
    @SerializedName("status") val status: String
)

data class NotificationItemDto(
    @SerializedName("id") val id: String = "",
    @SerializedName("type") val type: String = "",
    @SerializedName("title") val title: String = "",
    @SerializedName("message") val message: String? = null,
    @SerializedName("is_read") val isRead: Boolean = false,
    @SerializedName("read_at") val readAt: String? = null,
    @SerializedName("created_at") val createdAt: String? = null
)

data class ToggleFavoriteResponseDto(
    @SerializedName("motorcycle_id") val motorcycleId: Int = 0,
    @SerializedName("is_favorited") val isFavorited: Boolean = false
)

data class HealthCheckDataDto(
    @SerializedName("status") val status: String = "unknown",
    @SerializedName("version") val version: String? = null
)
