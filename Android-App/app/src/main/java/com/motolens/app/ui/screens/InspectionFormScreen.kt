package com.motolens.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.motolens.app.ui.theme.*
import com.motolens.app.ui.viewmodel.MotoLensUiState

/**
 * Vehicle Specification Form after Live CameraX Capture (`InspectionFormScreen`).
 * Sends `multipart/form-data` with `source_type = "android_camera"` to `POST /api/v1/motorcycles/inspect`.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InspectionFormScreen(
    uiState: MotoLensUiState,
    onRetakePhoto: () -> Unit,
    onRunInspection: (
        modelId: Int,
        year: Int,
        odometerKm: Int,
        taxStatus: String,
        sellerPrice: Long?
    ) -> Unit
) {
    val models = uiState.motorcycleModels
    var selectedModelId by remember(models) {
        mutableStateOf(models.firstOrNull()?.id ?: 1)
    }
    var modelDropdownExpanded by remember { mutableStateOf(false) }

    var yearStr by remember { mutableStateOf("2023") }
    var odometerStr by remember { mutableStateOf("14500") }
    var taxStatus by remember { mutableStateOf("active") }
    var sellerPriceStr by remember { mutableStateOf("24500000") }

    val selectedModel = models.find { it.id == selectedModelId }
    val photoFile = uiState.capturedPhotoFile
    val fileSizeKb = (photoFile?.length() ?: 0L) / 1024L

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ShowroomWhite)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(
            text = "Form Spesifikasi & Inferensi YOLOv8",
            fontSize = 20.sp,
            fontWeight = FontWeight.Black,
            color = ZincTextPrimary
        )

        // 1. Captured CameraX Photo Preview Card
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = CarbonBlack),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(190.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(CarbonSurface)
                ) {
                    AsyncImage(
                        model = photoFile,
                        contentDescription = "Foto CameraX",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )

                    Surface(
                        color = CrimsonRedPrimary,
                        contentColor = Color.White,
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .align(Alignment.TopStart)
                            .padding(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(Icons.Default.Verified, contentDescription = null, modifier = Modifier.size(12.dp))
                            Text(
                                text = "ANDROID_CAMERA (${fileSizeKb} KB <= 2MB)",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black
                            )
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (uiState.capturedLatitude != null) {
                            "GPS: ${"%.4f".format(uiState.capturedLatitude)}, ${"%.4f".format(uiState.capturedLongitude)}"
                        } else {
                            "EXIF Normalized • Siap dikirim ke ONNX Runtime"
                        },
                        color = Color(0xFFA1A1AA),
                        fontSize = 11.sp
                    )

                    TextButton(onClick = onRetakePhoto) {
                        Icon(
                            Icons.Default.CameraAlt,
                            contentDescription = null,
                            tint = Color(0xFFF87171),
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Foto Ulang", color = Color(0xFFF87171), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // 2. Vehicle Data Inputs
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
                // Reference Model Selector
                ExposedDropdownMenuBox(
                    expanded = modelDropdownExpanded,
                    onExpandedChange = { modelDropdownExpanded = !modelDropdownExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedModel?.displayTitle ?: "Pilih Model Referensi (#$selectedModelId)",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Model Referensi Motor (/api/v1/motorcycle-models)") },
                        trailingIcon = {
                            ExposedDropdownMenuDefaults.TrailingIcon(expanded = modelDropdownExpanded)
                        },
                        modifier = Modifier
                            .menuAnchor(MenuAnchorType.PrimaryNotEditable)
                            .fillMaxWidth()
                    )

                    ExposedDropdownMenu(
                        expanded = modelDropdownExpanded,
                        onDismissRequest = { modelDropdownExpanded = false }
                    ) {
                        models.forEach { m ->
                            DropdownMenuItem(
                                text = { Text(m.displayTitle, fontWeight = FontWeight.SemiBold) },
                                onClick = {
                                    selectedModelId = m.id
                                    modelDropdownExpanded = false
                                }
                            )
                        }
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = yearStr,
                        onValueChange = { yearStr = it.filter { ch -> ch.isDigit() }.take(4) },
                        label = { Text("Tahun Pembuatan") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )

                    OutlinedTextField(
                        value = odometerStr,
                        onValueChange = { odometerStr = it.filter { ch -> ch.isDigit() } },
                        label = { Text("Odometer (KM)") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                }

                // Tax Status Selector
                Text("Status Pajak STNK:", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    FilterChip(
                        selected = taxStatus == "active",
                        onClick = { taxStatus = "active" },
                        label = { Text("Pajak Hidup (Active)", fontWeight = FontWeight.Bold) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = CarbonBlack,
                            selectedLabelColor = Color.White
                        )
                    )
                    FilterChip(
                        selected = taxStatus == "expired",
                        onClick = { taxStatus = "expired" },
                        label = { Text("Pajak Mati (Expired)", fontWeight = FontWeight.Bold) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = CrimsonRedPrimary,
                            selectedLabelColor = Color.White
                        )
                    )
                }

                OutlinedTextField(
                    value = sellerPriceStr,
                    onValueChange = { sellerPriceStr = it.filter { ch -> ch.isDigit() } },
                    label = { Text("Rencana Harga Jual Penjual (Rp - Opsional)") },
                    placeholder = { Text("Contoh: 24500000") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Button(
                    onClick = {
                        onRunInspection(
                            selectedModelId,
                            yearStr.toIntOrNull() ?: 2023,
                            odometerStr.toIntOrNull() ?: 10000,
                            taxStatus,
                            sellerPriceStr.toLongOrNull()
                        )
                    },
                    enabled = !uiState.isInspecting,
                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonRedPrimary),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                ) {
                    if (uiState.isInspecting) {
                        CircularProgressIndicator(
                            color = Color.White,
                            strokeWidth = 2.dp,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text("Menjalankan Inferensi YOLOv8 ONNX...", fontWeight = FontWeight.Bold)
                    } else {
                        Icon(Icons.Default.Memory, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Jalankan Deteksi AI & Estimasi Harga",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Black
                        )
                    }
                }
            }
        }
    }
}
