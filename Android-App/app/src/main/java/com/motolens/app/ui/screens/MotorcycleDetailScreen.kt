package com.motolens.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.motolens.app.ui.components.*
import com.motolens.app.ui.theme.*
import com.motolens.app.ui.viewmodel.MotoLensUiState
import com.motolens.app.util.Formatters

@Composable
fun MotorcycleDetailScreen(
    uiState: MotoLensUiState,
    onBack: () -> Unit,
    onToggleFavorite: (Int) -> Unit,
    onSubmitInquiry: (motorcycleId: Int, appointmentDate: String, offeredPrice: Long?, notes: String?) -> Unit
) {
    val detail = uiState.selectedDetail
    var showBoxes by remember { mutableStateOf(true) }
    var showInquiryDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ShowroomWhite)
    ) {
        // Top Header Bar
        Surface(
            color = CarbonBlack,
            contentColor = Color.White,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Kembali",
                            tint = Color.White
                        )
                    }
                    Text(
                        text = "Detail & Sertifikat Inspeksi AI",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                }

                if (detail != null) {
                    IconButton(onClick = { onToggleFavorite(detail.id) }) {
                        Icon(
                            imageVector = if (detail.isFavorited) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                            contentDescription = "Favorit",
                            tint = if (detail.isFavorited) CrimsonRedPrimary else Color.White
                        )
                    }
                }
            }
        }

        if (uiState.isLoading || detail == null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = CrimsonRedPrimary)
            }
            return
        }

        val cert = detail.inspectionCertificate
        val rawPhotoUrl = Formatters.resolveMediaUrl(
            cert?.bestPhotoUrl ?: detail.mainImageUrl,
            uiState.activeBaseUrl
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // 1. Photo + Proportional Bounding Box Canvas (PRD Bab 3.5)
            BoundingBoxPhotoCanvas(
                imageModel = rawPhotoUrl,
                imageWidth = cert?.imageWidth ?: 640,
                imageHeight = cert?.imageHeight ?: 640,
                detections = cert?.allDetections ?: emptyList(),
                showBoxes = showBoxes
            )

            // Toggle BBox & Certificate Number Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Sertifikat: ${cert?.certificateNumber ?: "MTL-VERIFIED"}",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = ZincTextSecondary
                )
                FilterChip(
                    selected = showBoxes,
                    onClick = { showBoxes = !showBoxes },
                    label = {
                        Text(
                            text = if (showBoxes) "Sembunyikan BBox AI" else "Tampilkan BBox AI",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                )
            }

            // 2. Main Info Card
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CardSurfaceWhite),
                border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        PriceBadge(label = detail.priceLabel)
                        ConditionBadge(grade = detail.conditionGrade)
                        VerificationBadge(
                            sourceType = detail.sourceType,
                            isCameraVerified = detail.isCameraVerified
                        )
                    }

                    Text(
                        text = "${detail.brand} ${detail.modelName} (${detail.engineCc}cc)",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Black,
                        color = CrimsonRedPrimary
                    )
                    Text(
                        text = detail.title,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black,
                        color = ZincTextPrimary
                    )

                    Text(
                        text = Formatters.formatRupiah(detail.sellerPrice),
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Black,
                        color = CrimsonRedPrimary
                    )

                    Text(
                        text = "Tahun ${detail.year} • ${Formatters.formatNumber(detail.odometerKm)} km • Pajak ${detail.taxStatus.uppercase()} • ${detail.locationAddress}",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = ZincTextSecondary
                    )

                    if (!detail.description.isNullOrBlank()) {
                        Text(
                            text = detail.description,
                            fontSize = 12.sp,
                            color = ZincTextPrimary
                        )
                    }

                    cert?.counts?.let { counts ->
                        DamageSummaryPills(
                            scratchCount = counts.scratch,
                            dentCount = counts.dent,
                            accidentCount = counts.accident
                        )
                    }
                }
            }

            // 3. Explainable Price Breakdown (Bab 4.8)
            detail.priceBreakdown?.let { breakdown ->
                ExplainablePriceBreakdownCard(breakdown = breakdown)
            }

            // 4. AI Limitation Disclaimer Card (PRD Bab 3.3)
            Surface(
                color = Color(0xFFFFFBEB),
                border = BorderStroke(1.dp, Color(0xFFFDE68A)),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "BATASAN INSPEKSI VISUAL AI (BAB 3.3)",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        color = Color(0xFF92400E)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Model YOLOv8n ONNX hanya mendeteksi anomali visual bodi luar (Scratch, Dent, Accident). Sistem tidak memeriksa mesin internal, rangka tersembunyi, kelistrikan, atau dokumen STNK/BPKB. Gunakan fitur Booking Survei di bawah untuk pengecekan fisik langsung.",
                        fontSize = 11.sp,
                        color = Color(0xFF78350F)
                    )
                }
            }

            // 5. CTA Booking Survei Fisik
            Button(
                onClick = { showInquiryDialog = true },
                enabled = detail.status == "available",
                colors = ButtonDefaults.buttonColors(containerColor = CrimsonRedPrimary),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
            ) {
                Icon(Icons.Default.EventAvailable, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (detail.status == "available") "Ajukan Jadwal Survei Fisik (COD)" else "Unit Sudah ${detail.status.uppercase()}",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Black
                )
            }
        }
    }

    if (showInquiryDialog && detail != null) {
        var appointmentDate by remember { mutableStateOf("2026-12-01 10:00:00") }
        var offeredPriceStr by remember { mutableStateOf(detail.sellerPrice.toString()) }
        var notes by remember { mutableStateOf("Saya ingin cek fisik unit dan kelengkapan surat di lokasi.") }

        AlertDialog(
            onDismissRequest = { showInquiryDialog = false },
            title = {
                Text("Jadwalkan Survei Fisik", fontWeight = FontWeight.Black, fontSize = 16.sp)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = appointmentDate,
                        onValueChange = { appointmentDate = it },
                        label = { Text("Tanggal & Jam Survei (YYYY-MM-DD HH:mm:ss)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = offeredPriceStr,
                        onValueChange = { offeredPriceStr = it.filter { ch -> ch.isDigit() } },
                        label = { Text("Tawaran Harga Opsional (Rp)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = notes,
                        onValueChange = { notes = it },
                        label = { Text("Catatan untuk Penjual") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onSubmitInquiry(
                            detail.id,
                            appointmentDate,
                            offeredPriceStr.toLongOrNull(),
                            notes
                        )
                        showInquiryDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonRedPrimary)
                ) {
                    Text("Kirim Pengajuan", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showInquiryDialog = false }) {
                    Text("Batal")
                }
            }
        )
    }
}
