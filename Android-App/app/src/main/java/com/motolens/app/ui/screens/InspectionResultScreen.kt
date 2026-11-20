package com.motolens.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Publish
import androidx.compose.material.icons.filled.RateReview
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

/**
 * Displays YOLOv8 ONNX Inference Results (`InspectionResultScreen`):
 * - Proportional `BoundingBoxPhotoCanvas` (`[x1, y1, x2, y2]` scaled to `image_width` & `image_height`)
 * - Detection counts per class (`Scratch`, `Dent`, `Accident`) & inference time (ms)
 * - Explainable Price Breakdown (Bab 4.8)
 * - AI Feedback submission (`POST /api/v1/inspections/{id}/feedback`)
 * - Direct Listing Publication (`POST /api/v1/motorcycles`)
 */
@Composable
fun InspectionResultScreen(
    uiState: MotoLensUiState,
    onSubmitFeedback: (inspectionId: Int, feedbackType: String, comment: String) -> Unit,
    onPublishListing: (
        inspectionId: Int,
        title: String,
        description: String?,
        sellerPrice: Long,
        locationAddress: String
    ) -> Unit
) {
    val inspection = uiState.latestInspection
    if (inspection == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Belum ada hasil inspeksi aktif.")
        }
        return
    }

    var showBboxOverlay by remember { mutableStateOf(true) }
    var showFeedbackDialog by remember { mutableStateOf(false) }

    var listingTitle by remember {
        mutableStateOf("Unit Terverifikasi CameraX #${inspection.certificateNumber}")
    }
    var sellerPriceStr by remember(inspection.mlPredictedPrice) {
        mutableStateOf(
            (inspection.priceBreakdown?.sellerPrice ?: inspection.mlPredictedPrice).toString()
        )
    }
    var locationAddress by remember { mutableStateOf("Denpasar Barat, Bali") }
    var description by remember {
        mutableStateOf("Motor terawat, telah diinspeksi langsung melalui kamera Android MotoLens YOLOv8.")
    }

    val imageModel = uiState.capturedPhotoFile
        ?: Formatters.resolveMediaUrl(
            inspection.rawImageUrl ?: inspection.annotatedImageUrl,
            uiState.activeBaseUrl
        )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ShowroomWhite)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // 1. Certificate Header Banner
        Surface(
            color = CarbonBlack,
            contentColor = Color.White,
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "SERTIFIKAT INSPEKSI AI YOLOv8",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        color = CrimsonRedPrimary
                    )
                    VerificationBadge(
                        sourceType = inspection.sourceType,
                        isCameraVerified = inspection.sourceType == "android_camera"
                    )
                }

                Text(
                    text = inspection.certificateNumber,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black
                )

                Text(
                    text = "Model: ${inspection.modelName} (${inspection.modelVersion}) • Latensi: ${inspection.inferenceTimeMs ?: 0} ms",
                    fontSize = 11.sp,
                    color = Color(0xFFA1A1AA)
                )
            }
        }

        // 2. Proportional Bounding Box Canvas (PRD Bab 3.5)
        BoundingBoxPhotoCanvas(
            imageModel = imageModel,
            imageWidth = inspection.imageWidth ?: 640,
            imageHeight = inspection.imageHeight ?: 640,
            detections = inspection.allDetections,
            showBoxes = showBboxOverlay
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            DamageSummaryPills(
                scratchCount = inspection.scratchCount,
                dentCount = inspection.dentCount,
                accidentCount = inspection.accidentCount
            )

            TextButton(onClick = { showBboxOverlay = !showBboxOverlay }) {
                Text(
                    text = if (showBboxOverlay) "Hide BBox" else "Show BBox",
                    color = CrimsonRedPrimary,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // 3. Explainable Price Breakdown Card (PRD Bab 4.8)
        inspection.priceBreakdown?.let { breakdown ->
            ExplainablePriceBreakdownCard(breakdown = breakdown)
        }

        // 4. Button to Submit AI Feedback (`POST /api/v1/inspections/{id}/feedback`)
        OutlinedButton(
            onClick = { showFeedbackDialog = true },
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(Icons.Default.RateReview, contentDescription = null, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text("Kirim Feedback Koreksi Deteksi AI", fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }

        // 5. Publish Listing Form (`POST /api/v1/motorcycles`)
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = CardSurfaceWhite),
            border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Terbitkan Listing ke Showroom Marketplace",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Black,
                    color = ZincTextPrimary
                )

                OutlinedTextField(
                    value = listingTitle,
                    onValueChange = { listingTitle = it },
                    label = { Text("Judul Iklan Motor") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = sellerPriceStr,
                    onValueChange = { sellerPriceStr = it.filter { ch -> ch.isDigit() } },
                    label = { Text("Harga Penjual Final (Rp)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = locationAddress,
                    onValueChange = { locationAddress = it },
                    label = { Text("Alamat / Area Lokasi di Bali") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Deskripsi Tambahan") },
                    modifier = Modifier.fillMaxWidth()
                )

                Button(
                    onClick = {
                        onPublishListing(
                            inspection.id,
                            listingTitle,
                            description,
                            sellerPriceStr.toLongOrNull() ?: inspection.mlPredictedPrice,
                            locationAddress
                        )
                    },
                    enabled = !uiState.isPublishing,
                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonRedPrimary),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                ) {
                    if (uiState.isPublishing) {
                        CircularProgressIndicator(
                            color = Color.White,
                            strokeWidth = 2.dp,
                            modifier = Modifier.size(20.dp)
                        )
                    } else {
                        Icon(Icons.Default.Publish, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Terbitkan Listing Sekarang",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Black
                        )
                    }
                }
            }
        }
    }

    if (showFeedbackDialog) {
        var feedbackType by remember { mutableStateOf("false_positive") }
        var comment by remember { mutableStateOf("Deteksi sudah cukup presisi pada bagian bodi utama.") }

        AlertDialog(
            onDismissRequest = { showFeedbackDialog = false },
            title = { Text("Feedback Hasil Deteksi AI", fontWeight = FontWeight.Black, fontSize = 16.sp) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf(
                            "false_positive" to "False Positive",
                            "false_negative" to "Missed",
                            "other" to "Akurat"
                        ).forEach { (typeKey, label) ->
                            FilterChip(
                                selected = feedbackType == typeKey,
                                onClick = { feedbackType = typeKey },
                                label = { Text(label, fontSize = 10.sp) }
                            )
                        }
                    }

                    OutlinedTextField(
                        value = comment,
                        onValueChange = { comment = it },
                        label = { Text("Catatan Evaluasi Bounding Box") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onSubmitFeedback(inspection.id, feedbackType, comment)
                        showFeedbackDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonRedPrimary)
                ) {
                    Text("Kirim Feedback", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showFeedbackDialog = false }) {
                    Text("Batal")
                }
            }
        )
    }
}
