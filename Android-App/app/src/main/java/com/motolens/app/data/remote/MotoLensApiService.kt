package com.motolens.app.data.remote

import com.motolens.app.data.model.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface MotoLensApiService {

    // 1. Health Check
    @GET("health")
    suspend fun getHealth(): Response<ApiResponse<HealthCheckDataDto>>

    // 2. Authentication
    @POST("auth/login")
    suspend fun login(@Body payload: LoginRequestDto): Response<ApiResponse<AuthDataDto>>

    @POST("auth/register")
    suspend fun register(@Body payload: RegisterRequestDto): Response<ApiResponse<AuthDataDto>>

    @POST("auth/logout")
    suspend fun logout(): Response<ApiResponse<Unit>>

    @GET("auth/me")
    suspend fun getMe(): Response<ApiResponse<UserDto>>

    // 3. Reference Motorcycle Models
    @GET("motorcycle-models")
    suspend fun getMotorcycleModels(
        @Query("brand") brand: String? = null,
        @Query("search") search: String? = null
    ): Response<ApiResponse<List<MotorcycleModelRefDto>>>

    // 4. Catalog, Detail & Garage
    @GET("motorcycles")
    suspend fun getCatalog(
        @Query("search") search: String? = null,
        @Query("brand") brand: String? = null,
        @Query("price_label") priceLabel: String? = null,
        @Query("condition_grade") conditionGrade: String? = null,
        @Query("sort") sort: String = "newest",
        @Query("page") page: Int = 1,
        @Query("per_page") perPage: Int = 20
    ): Response<ApiResponse<List<MotorcycleListItemDto>>>

    @GET("motorcycles/{id}")
    suspend fun getMotorcycleDetail(
        @Path("id") id: Int
    ): Response<ApiResponse<MotorcycleDetailDto>>

    @GET("my-motorcycles")
    suspend fun getMyMotorcycles(
        @Query("page") page: Int = 1,
        @Query("per_page") perPage: Int = 30
    ): Response<ApiResponse<List<MotorcycleListItemDto>>>

    @POST("motorcycles")
    suspend fun publishMotorcycle(
        @Body payload: PublishMotorcycleRequestDto
    ): Response<ApiResponse<MotorcycleDetailDto>>

    @PATCH("motorcycles/{id}")
    suspend fun updateMotorcycle(
        @Path("id") id: Int,
        @Body payload: UpdateMotorcycleRequestDto
    ): Response<ApiResponse<MotorcycleDetailDto>>

    @DELETE("motorcycles/{id}")
    suspend fun deleteMotorcycle(
        @Path("id") id: Int
    ): Response<ApiResponse<Unit>>

    // 5. CameraX AI Inspection (Multipart Form-Data)
    @Multipart
    @POST("motorcycles/inspect")
    suspend fun inspectMotorcycle(
        @Part photo: MultipartBody.Part,
        @Part("motorcycle_model_id") motorcycleModelId: RequestBody,
        @Part("year") year: RequestBody,
        @Part("odometer_km") odometerKm: RequestBody,
        @Part("tax_status") taxStatus: RequestBody,
        @Part("source_type") sourceType: RequestBody,
        @Part("seller_price") sellerPrice: RequestBody? = null,
        @Part("latitude") latitude: RequestBody? = null,
        @Part("longitude") longitude: RequestBody? = null,
        @Part("location_accuracy_m") locationAccuracyM: RequestBody? = null
    ): Response<ApiResponse<MotorcycleInspectionDto>>

    @POST("inspections/{id}/feedback")
    suspend fun submitInspectionFeedback(
        @Path("id") inspectionId: Int,
        @Body payload: SubmitFeedbackRequestDto
    ): Response<ApiResponse<Any>>

    // 6. Favorites
    @POST("motorcycles/{id}/favorite")
    suspend fun toggleFavorite(
        @Path("id") motorcycleId: Int
    ): Response<ApiResponse<ToggleFavoriteResponseDto>>

    @GET("favorites")
    suspend fun getFavorites(): Response<ApiResponse<List<MotorcycleListItemDto>>>

    // 7. Inquiries (Survey Booking)
    @GET("inquiries")
    suspend fun getInquiries(
        @Query("role") role: String = "buyer"
    ): Response<ApiResponse<List<InquiryItemDto>>>

    @POST("inquiries")
    suspend fun createInquiry(
        @Body payload: CreateInquiryRequestDto
    ): Response<ApiResponse<InquiryItemDto>>

    @PATCH("inquiries/{id}/status")
    suspend fun updateInquiryStatus(
        @Path("id") inquiryId: Int,
        @Body payload: UpdateInquiryStatusRequestDto
    ): Response<ApiResponse<InquiryItemDto>>

    @POST("inquiries/{id}/cancel")
    suspend fun cancelInquiry(
        @Path("id") inquiryId: Int
    ): Response<ApiResponse<InquiryItemDto>>

    // 8. Notifications
    @GET("notifications")
    suspend fun getNotifications(): Response<ApiResponse<List<NotificationItemDto>>>

    @PATCH("notifications/{id}/read")
    suspend fun markNotificationRead(
        @Path("id") notificationId: String
    ): Response<ApiResponse<Any>>

    @POST("notifications/read-all")
    suspend fun markAllNotificationsRead(): Response<ApiResponse<Any>>
}
