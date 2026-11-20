package com.motolens.app.data.repository

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.motolens.app.data.local.SessionManager
import com.motolens.app.data.model.*
import com.motolens.app.data.remote.MotoLensApiService
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import retrofit2.Response
import java.io.File

class MotoLensRepository(
    private val apiService: MotoLensApiService,
    private val sessionManager: SessionManager
) {
    private val gson = Gson()

    fun getActiveBaseUrl(): String = sessionManager.getBaseUrl()

    fun updateBaseUrl(url: String) = sessionManager.setBaseUrl(url)

    fun getSavedUser(): UserDto? = sessionManager.getSavedUser()

    fun isLoggedIn(): Boolean = !sessionManager.getAuthToken().isNullOrBlank()

    suspend fun checkServerHealth(): Result<HealthCheckDataDto> = safeApiCall {
        apiService.getHealth()
    }

    suspend fun login(email: String, password: String): Result<UserDto> {
        val res = safeApiCall {
            apiService.login(LoginRequestDto(email = email.trim(), password = password))
        }
        return res.map { authData ->
            sessionManager.saveSession(authData.token, authData.user)
            authData.user
        }
    }

    suspend fun register(
        name: String,
        email: String,
        password: String,
        phoneWhatsapp: String
    ): Result<UserDto> {
        val res = safeApiCall {
            apiService.register(
                RegisterRequestDto(
                    name = name.trim(),
                    email = email.trim(),
                    password = password,
                    passwordConfirmation = password,
                    phoneWhatsapp = phoneWhatsapp.trim()
                )
            )
        }
        return res.map { authData ->
            sessionManager.saveSession(authData.token, authData.user)
            authData.user
        }
    }

    suspend fun logout() {
        try {
            apiService.logout()
        } catch (_: Exception) {
            // Always clear local token even if server is unreachable
        } finally {
            sessionManager.clearSession()
        }
    }

    suspend fun refreshProfile(): Result<UserDto> {
        val res = safeApiCall { apiService.getMe() }
        res.onSuccess { user ->
            val currentToken = sessionManager.getAuthToken()
            if (!currentToken.isNullOrBlank()) {
                sessionManager.saveSession(currentToken, user)
            }
        }
        return res
    }

    suspend fun getMotorcycleModels(brand: String? = null): Result<List<MotorcycleModelRefDto>> =
        safeApiCall {
            apiService.getMotorcycleModels(brand = brand)
        }

    suspend fun getCatalog(
        search: String? = null,
        brand: String? = null,
        priceLabel: String? = null,
        conditionGrade: String? = null,
        sort: String = "newest"
    ): Result<List<MotorcycleListItemDto>> = safeApiCall {
        apiService.getCatalog(
            search = search?.takeIf { it.isNotBlank() },
            brand = brand?.takeIf { it.isNotBlank() },
            priceLabel = priceLabel?.takeIf { it.isNotBlank() },
            conditionGrade = conditionGrade?.takeIf { it.isNotBlank() },
            sort = sort
        )
    }

    suspend fun getMotorcycleDetail(id: Int): Result<MotorcycleDetailDto> = safeApiCall {
        apiService.getMotorcycleDetail(id)
    }

    suspend fun getMyMotorcycles(): Result<List<MotorcycleListItemDto>> = safeApiCall {
        apiService.getMyMotorcycles()
    }

    /**
     * Sends live CameraX JPEG photo (`source_type = "android_camera"`) to `POST /api/v1/motorcycles/inspect`
     */
    suspend fun inspectFromCameraX(
        photoFile: File,
        motorcycleModelId: Int,
        year: Int,
        odometerKm: Int,
        taxStatus: String,
        sellerPrice: Long? = null,
        latitude: Double? = null,
        longitude: Double? = null,
        locationAccuracyM: Float? = null
    ): Result<MotorcycleInspectionDto> = safeApiCall {
        val textPlain = "text/plain".toMediaTypeOrNull()
        val imageJpeg = "image/jpeg".toMediaTypeOrNull()

        val photoPart = MultipartBody.Part.createFormData(
            "photo",
            photoFile.name,
            photoFile.asRequestBody(imageJpeg)
        )

        apiService.inspectMotorcycle(
            photo = photoPart,
            motorcycleModelId = motorcycleModelId.toString().toRequestBody(textPlain),
            year = year.toString().toRequestBody(textPlain),
            odometerKm = odometerKm.toString().toRequestBody(textPlain),
            taxStatus = taxStatus.toRequestBody(textPlain),
            sourceType = "android_camera".toRequestBody(textPlain),
            sellerPrice = sellerPrice?.toString()?.toRequestBody(textPlain),
            latitude = latitude?.toString()?.toRequestBody(textPlain),
            longitude = longitude?.toString()?.toRequestBody(textPlain),
            locationAccuracyM = locationAccuracyM?.toString()?.toRequestBody(textPlain)
        )
    }

    suspend fun publishMotorcycle(
        inspectionId: Int,
        title: String,
        description: String?,
        sellerPrice: Long,
        locationAddress: String,
        latitude: Double? = null,
        longitude: Double? = null
    ): Result<MotorcycleDetailDto> = safeApiCall {
        apiService.publishMotorcycle(
            PublishMotorcycleRequestDto(
                inspectionId = inspectionId,
                title = title.trim(),
                description = description?.trim()?.takeIf { it.isNotBlank() },
                sellerPrice = sellerPrice,
                locationAddress = locationAddress.trim(),
                latitude = latitude,
                longitude = longitude
            )
        )
    }

    suspend fun updateMotorcycle(
        id: Int,
        sellerPrice: Long,
        status: String
    ): Result<MotorcycleDetailDto> = safeApiCall {
        apiService.updateMotorcycle(
            id = id,
            payload = UpdateMotorcycleRequestDto(
                sellerPrice = sellerPrice,
                status = status
            )
        )
    }

    suspend fun deleteMotorcycle(id: Int): Result<Unit> = safeApiCallUnit {
        apiService.deleteMotorcycle(id)
    }

    suspend fun submitInspectionFeedback(
        inspectionId: Int,
        feedbackType: String,
        comment: String
    ): Result<Any> = safeApiCall {
        apiService.submitInspectionFeedback(
            inspectionId = inspectionId,
            payload = SubmitFeedbackRequestDto(feedbackType = feedbackType, comment = comment)
        )
    }

    suspend fun toggleFavorite(motorcycleId: Int): Result<ToggleFavoriteResponseDto> =
        safeApiCall {
            apiService.toggleFavorite(motorcycleId)
        }

    suspend fun getInquiries(role: String): Result<List<InquiryItemDto>> = safeApiCall {
        apiService.getInquiries(role = role)
    }

    suspend fun createInquiry(
        motorcycleId: Int,
        appointmentDate: String,
        offeredPrice: Long?,
        notes: String?
    ): Result<InquiryItemDto> = safeApiCall {
        apiService.createInquiry(
            CreateInquiryRequestDto(
                motorcycleId = motorcycleId,
                appointmentDate = appointmentDate,
                offeredPrice = offeredPrice,
                notes = notes?.takeIf { it.isNotBlank() }
            )
        )
    }

    suspend fun updateInquiryStatus(inquiryId: Int, status: String): Result<InquiryItemDto> =
        safeApiCall {
            apiService.updateInquiryStatus(inquiryId, UpdateInquiryStatusRequestDto(status))
        }

    suspend fun cancelInquiry(inquiryId: Int): Result<InquiryItemDto> = safeApiCall {
        apiService.cancelInquiry(inquiryId)
    }

    suspend fun getNotifications(): Result<Pair<List<NotificationItemDto>, Int>> {
        return try {
            val response = apiService.getNotifications()
            if (response.isSuccessful && response.body()?.success == true) {
                val items = response.body()?.data ?: emptyList()
                val unread = response.body()?.meta?.unreadCount
                    ?: items.count { !it.isRead }
                Result.success(items to unread)
            } else {
                Result.failure(Exception(parseErrorMessage(response)))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Gagal memuat notifikasi: ${e.localizedMessage ?: "Jaringan bermasalah"}"))
        }
    }

    suspend fun markAllNotificationsRead(): Result<Any> = safeApiCall {
        apiService.markAllNotificationsRead()
    }

    private suspend fun <T> safeApiCall(call: suspend () -> Response<ApiResponse<T>>): Result<T> {
        return try {
            val response = call()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success && body.data != null) {
                Result.success(body.data)
            } else {
                Result.failure(Exception(parseErrorMessage(response)))
            }
        } catch (e: Exception) {
            Result.failure(
                Exception(
                    "Koneksi ke server API gagal (${sessionManager.getBaseUrl()}). " +
                        "Pastikan container motolens-backend menyala atau cek Pengaturan Server URL. Detail: ${e.localizedMessage}"
                )
            )
        }
    }

    private suspend fun safeApiCallUnit(call: suspend () -> Response<ApiResponse<Unit>>): Result<Unit> {
        return try {
            val response = call()
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(parseErrorMessage(response)))
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.localizedMessage ?: "Koneksi gagal"))
        }
    }

    fun parseErrorMessage(response: Response<*>): String {
        return try {
            val errorJson = response.errorBody()?.string()
            if (!errorJson.isNullOrBlank()) {
                val type = object : TypeToken<ApiResponse<Any>>() {}.type
                val parsed: ApiResponse<Any>? = gson.fromJson(errorJson, type)
                val firstFieldError = parsed?.errors?.values?.flatten()?.firstOrNull()
                firstFieldError ?: parsed?.message?.takeIf { it.isNotBlank() }
                    ?: "HTTP ${response.code()} Error"
            } else {
                "HTTP ${response.code()}: ${response.message()}"
            }
        } catch (_: Exception) {
            "HTTP ${response.code()} Error"
        }
    }
}
