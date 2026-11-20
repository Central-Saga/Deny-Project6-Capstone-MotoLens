package com.motolens.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.motolens.app.data.model.*
import com.motolens.app.data.repository.MotoLensRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.File

data class MotoLensUiState(
    val activeBaseUrl: String = "http://10.0.2.2:8000/api/v1/",
    val healthCheckMessage: String? = null,
    val currentUser: UserDto? = null,
    val isAuthenticated: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null,

    // Catalog & Filters
    val catalogItems: List<MotorcycleListItemDto> = emptyList(),
    val motorcycleModels: List<MotorcycleModelRefDto> = emptyList(),
    val searchQuery: String = "",
    val selectedBrand: String = "",
    val selectedPriceLabel: String = "",
    val selectedConditionGrade: String = "",

    // Selected Motorcycle Detail
    val selectedDetail: MotorcycleDetailDto? = null,

    // CameraX Live Capture & AI Inspection State
    val capturedPhotoFile: File? = null,
    val capturedLatitude: Double? = null,
    val capturedLongitude: Double? = null,
    val capturedAccuracyM: Float? = null,
    val latestInspection: MotorcycleInspectionDto? = null,
    val isInspecting: Boolean = false,
    val isPublishing: Boolean = false,

    // Garage, Inquiries & Notifications
    val myMotorcycles: List<MotorcycleListItemDto> = emptyList(),
    val sellerInquiries: List<InquiryItemDto> = emptyList(),
    val buyerInquiries: List<InquiryItemDto> = emptyList(),
    val notifications: List<NotificationItemDto> = emptyList(),
    val unreadNotificationCount: Int = 0
)

class MotoLensViewModel(
    private val repository: MotoLensRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(
        MotoLensUiState(
            activeBaseUrl = repository.getActiveBaseUrl(),
            currentUser = repository.getSavedUser(),
            isAuthenticated = repository.isLoggedIn()
        )
    )
    val uiState: StateFlow<MotoLensUiState> = _uiState.asStateFlow()

    init {
        loadReferenceModels()
        loadCatalog()
        if (repository.isLoggedIn()) {
            refreshGarageAndActivity()
        }
    }

    fun clearBannerMessages() {
        _uiState.update { it.copy(errorMessage = null, successMessage = null) }
    }

    // =========================================================================
    // 1. DYNAMIC SERVER BASE URL & HEALTH CHECK
    // =========================================================================

    fun saveServerBaseUrl(newUrl: String) {
        repository.updateBaseUrl(newUrl)
        val normalized = repository.getActiveBaseUrl()
        _uiState.update {
            it.copy(
                activeBaseUrl = normalized,
                successMessage = "Base URL diperbarui ke: $normalized"
            )
        }
        loadReferenceModels()
        loadCatalog()
    }

    fun testServerHealth(candidateUrl: String) {
        repository.updateBaseUrl(candidateUrl)
        val normalized = repository.getActiveBaseUrl()
        _uiState.update {
            it.copy(activeBaseUrl = normalized, healthCheckMessage = "Memeriksa koneksi ke $normalized...")
        }
        viewModelScope.launch {
            repository.checkServerHealth()
                .onSuccess { health ->
                    _uiState.update {
                        it.copy(
                            healthCheckMessage = "Server Online & Healthy (${health.status} • ${health.version ?: "v1.0.0"})"
                        )
                    }
                }
                .onFailure { err ->
                    _uiState.update {
                        it.copy(healthCheckMessage = "Gagal terhubung: ${err.message}")
                    }
                }
        }
    }

    // =========================================================================
    // 2. AUTHENTICATION (LOGIN, REGISTER, DEMO ACCOUNTS, LOGOUT)
    // =========================================================================

    fun login(email: String, password: String, onSuccess: () -> Unit = {}) {
        if (email.isBlank() || password.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Email dan password wajib diisi.") }
            return
        }
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            repository.login(email, password)
                .onSuccess { user ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            currentUser = user,
                            isAuthenticated = true,
                            successMessage = "Selamat datang kembali, ${user.name}!"
                        )
                    }
                    refreshGarageAndActivity()
                    onSuccess()
                }
                .onFailure { err ->
                    _uiState.update {
                        it.copy(isLoading = false, errorMessage = err.message)
                    }
                }
        }
    }

    fun register(
        name: String,
        email: String,
        password: String,
        phoneWhatsapp: String,
        onSuccess: () -> Unit = {}
    ) {
        if (name.isBlank() || email.isBlank() || password.length < 8 || phoneWhatsapp.isBlank()) {
            _uiState.update {
                it.copy(errorMessage = "Lengkapi seluruh data registrasi (password minimal 8 karakter).")
            }
            return
        }
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            repository.register(name, email, password, phoneWhatsapp)
                .onSuccess { user ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            currentUser = user,
                            isAuthenticated = true,
                            successMessage = "Akun ${user.name} berhasil dibuat!"
                        )
                    }
                    refreshGarageAndActivity()
                    onSuccess()
                }
                .onFailure { err ->
                    _uiState.update {
                        it.copy(isLoading = false, errorMessage = err.message)
                    }
                }
        }
    }

    fun logout() {
        viewModelScope.launch {
            repository.logout()
            _uiState.update {
                it.copy(
                    currentUser = null,
                    isAuthenticated = false,
                    myMotorcycles = emptyList(),
                    sellerInquiries = emptyList(),
                    buyerInquiries = emptyList(),
                    notifications = emptyList(),
                    unreadNotificationCount = 0,
                    successMessage = "Anda telah keluar dari sesi."
                )
            }
        }
    }

    // =========================================================================
    // 3. CATALOG, FILTERS & DETAIL
    // =========================================================================

    fun loadReferenceModels() {
        viewModelScope.launch {
            repository.getMotorcycleModels().onSuccess { models ->
                _uiState.update { it.copy(motorcycleModels = models) }
            }
        }
    }

    fun updateCatalogFilters(
        search: String = _uiState.value.searchQuery,
        brand: String = _uiState.value.selectedBrand,
        priceLabel: String = _uiState.value.selectedPriceLabel,
        conditionGrade: String = _uiState.value.selectedConditionGrade
    ) {
        _uiState.update {
            it.copy(
                searchQuery = search,
                selectedBrand = brand,
                selectedPriceLabel = priceLabel,
                selectedConditionGrade = conditionGrade
            )
        }
        loadCatalog()
    }

    fun loadCatalog() {
        val state = _uiState.value
        _uiState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            repository.getCatalog(
                search = state.searchQuery,
                brand = state.selectedBrand,
                priceLabel = state.selectedPriceLabel,
                conditionGrade = state.selectedConditionGrade
            ).onSuccess { list ->
                _uiState.update { it.copy(isLoading = false, catalogItems = list) }
            }.onFailure { err ->
                _uiState.update { it.copy(isLoading = false, errorMessage = err.message) }
            }
        }
    }

    fun loadMotorcycleDetail(id: Int) {
        _uiState.update { it.copy(isLoading = true, selectedDetail = null, errorMessage = null) }
        viewModelScope.launch {
            repository.getMotorcycleDetail(id)
                .onSuccess { detail ->
                    _uiState.update { it.copy(isLoading = false, selectedDetail = detail) }
                }
                .onFailure { err ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = err.message) }
                }
        }
    }

    fun toggleFavorite(motorcycleId: Int) {
        viewModelScope.launch {
            repository.toggleFavorite(motorcycleId).onSuccess { favRes ->
                _uiState.update { state ->
                    val updatedDetail = state.selectedDetail?.let {
                        if (it.id == motorcycleId) it.copy(isFavorited = favRes.isFavorited) else it
                    }
                    state.copy(
                        selectedDetail = updatedDetail,
                        successMessage = if (favRes.isFavorited) "Disimpan ke Favorit" else "Dihapus dari Favorit"
                    )
                }
            }
        }
    }

    // =========================================================================
    // 4. CAMERAX CAPTURE, YOLOv8 ONNX INSPECTION & PUBLISH LISTING
    // =========================================================================

    fun onCameraPhotoCaptured(
        photoFile: File,
        latitude: Double? = null,
        longitude: Double? = null,
        accuracyM: Float? = null
    ) {
        _uiState.update {
            it.copy(
                capturedPhotoFile = photoFile,
                capturedLatitude = latitude,
                capturedLongitude = longitude,
                capturedAccuracyM = accuracyM,
                errorMessage = null
            )
        }
    }

    fun runCameraInspection(
        motorcycleModelId: Int,
        year: Int,
        odometerKm: Int,
        taxStatus: String,
        sellerPrice: Long?,
        onSuccess: (MotorcycleInspectionDto) -> Unit
    ) {
        val photoFile = _uiState.value.capturedPhotoFile
        if (photoFile == null || !photoFile.exists()) {
            _uiState.update {
                it.copy(errorMessage = "Foto kamera belum tersedia. Silakan ambil foto melalui CameraX.")
            }
            return
        }

        _uiState.update { it.copy(isInspecting = true, errorMessage = null) }
        viewModelScope.launch {
            repository.inspectFromCameraX(
                photoFile = photoFile,
                motorcycleModelId = motorcycleModelId,
                year = year,
                odometerKm = odometerKm,
                taxStatus = taxStatus,
                sellerPrice = sellerPrice,
                latitude = _uiState.value.capturedLatitude,
                longitude = _uiState.value.capturedLongitude,
                locationAccuracyM = _uiState.value.capturedAccuracyM
            ).onSuccess { inspection ->
                _uiState.update {
                    it.copy(
                        isInspecting = false,
                        latestInspection = inspection,
                        successMessage = "Inspeksi YOLOv8 selesai! Sertifikat ${inspection.certificateNumber} diterbitkan."
                    )
                }
                onSuccess(inspection)
            }.onFailure { err ->
                _uiState.update {
                    it.copy(isInspecting = false, errorMessage = err.message)
                }
            }
        }
    }

    fun submitInspectionFeedback(
        inspectionId: Int,
        feedbackType: String,
        comment: String
    ) {
        if (comment.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Komentar feedback wajib diisi.") }
            return
        }
        viewModelScope.launch {
            repository.submitInspectionFeedback(inspectionId, feedbackType, comment)
                .onSuccess {
                    _uiState.update {
                        it.copy(successMessage = "Feedback deteksi AI berhasil dikirim ke tim reviewer.")
                    }
                }
                .onFailure { err ->
                    _uiState.update { it.copy(errorMessage = err.message) }
                }
        }
    }

    fun publishListingFromInspection(
        inspectionId: Int,
        title: String,
        description: String?,
        sellerPrice: Long,
        locationAddress: String,
        onPublished: () -> Unit
    ) {
        if (title.isBlank() || sellerPrice < 500_000L || locationAddress.isBlank()) {
            _uiState.update {
                it.copy(errorMessage = "Judul, harga jual (>= Rp 500.000), dan lokasi di Bali wajib diisi.")
            }
            return
        }

        _uiState.update { it.copy(isPublishing = true, errorMessage = null) }
        viewModelScope.launch {
            repository.publishMotorcycle(
                inspectionId = inspectionId,
                title = title,
                description = description,
                sellerPrice = sellerPrice,
                locationAddress = locationAddress,
                latitude = _uiState.value.capturedLatitude,
                longitude = _uiState.value.capturedLongitude
            ).onSuccess {
                _uiState.update {
                    it.copy(
                        isPublishing = false,
                        successMessage = "Iklan motor berhasil diterbitkan dan masuk antrean moderasi!"
                    )
                }
                refreshGarageAndActivity()
                loadCatalog()
                onPublished()
            }.onFailure { err ->
                _uiState.update {
                    it.copy(isPublishing = false, errorMessage = err.message)
                }
            }
        }
    }

    // =========================================================================
    // 5. GARAGE, INQUIRIES & NOTIFICATIONS
    // =========================================================================

    fun refreshGarageAndActivity() {
        if (!repository.isLoggedIn()) return
        viewModelScope.launch {
            repository.getMyMotorcycles().onSuccess { list ->
                _uiState.update { it.copy(myMotorcycles = list) }
            }
            repository.getInquiries("seller").onSuccess { list ->
                _uiState.update { it.copy(sellerInquiries = list) }
            }
            repository.getInquiries("buyer").onSuccess { list ->
                _uiState.update { it.copy(buyerInquiries = list) }
            }
            repository.getNotifications().onSuccess { (items, unread) ->
                _uiState.update {
                    it.copy(notifications = items, unreadNotificationCount = unread)
                }
            }
        }
    }

    fun updateMyMotorcycle(id: Int, sellerPrice: Long, status: String) {
        viewModelScope.launch {
            repository.updateMotorcycle(id, sellerPrice, status)
                .onSuccess {
                    _uiState.update { it.copy(successMessage = "Harga & status motor berhasil diperbarui.") }
                    refreshGarageAndActivity()
                    loadCatalog()
                }
                .onFailure { err ->
                    _uiState.update { it.copy(errorMessage = err.message) }
                }
        }
    }

    fun deleteMyMotorcycle(id: Int) {
        viewModelScope.launch {
            repository.deleteMotorcycle(id)
                .onSuccess {
                    _uiState.update { it.copy(successMessage = "Listing motor berhasil diarsipkan.") }
                    refreshGarageAndActivity()
                    loadCatalog()
                }
                .onFailure { err ->
                    _uiState.update { it.copy(errorMessage = err.message) }
                }
        }
    }

    fun submitSurveyInquiry(
        motorcycleId: Int,
        appointmentDate: String,
        offeredPrice: Long?,
        notes: String?
    ) {
        if (appointmentDate.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Tanggal dan jam survei wajib diisi.") }
            return
        }
        viewModelScope.launch {
            repository.createInquiry(motorcycleId, appointmentDate, offeredPrice, notes)
                .onSuccess {
                    _uiState.update {
                        it.copy(successMessage = "Jadwal survei berhasil diajukan ke penjual!")
                    }
                    refreshGarageAndActivity()
                }
                .onFailure { err ->
                    _uiState.update { it.copy(errorMessage = err.message) }
                }
        }
    }

    fun respondToSellerInquiry(inquiryId: Int, status: String) {
        viewModelScope.launch {
            repository.updateInquiryStatus(inquiryId, status)
                .onSuccess {
                    _uiState.update {
                        it.copy(successMessage = "Status survei diperbarui menjadi '$status'.")
                    }
                    refreshGarageAndActivity()
                }
                .onFailure { err ->
                    _uiState.update { it.copy(errorMessage = err.message) }
                }
        }
    }

    fun cancelBuyerInquiry(inquiryId: Int) {
        viewModelScope.launch {
            repository.cancelInquiry(inquiryId)
                .onSuccess {
                    _uiState.update { it.copy(successMessage = "Pengajuan survei dibatalkan.") }
                    refreshGarageAndActivity()
                }
                .onFailure { err ->
                    _uiState.update { it.copy(errorMessage = err.message) }
                }
        }
    }

    fun markAllNotificationsRead() {
        viewModelScope.launch {
            repository.markAllNotificationsRead().onSuccess {
                refreshGarageAndActivity()
            }
        }
    }

    class Factory(private val repository: MotoLensRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return MotoLensViewModel(repository) as T
        }
    }
}
