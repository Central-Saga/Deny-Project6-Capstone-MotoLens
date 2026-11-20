package com.motolens.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.motolens.app.ui.components.MotorcycleShowroomCard
import com.motolens.app.ui.theme.*
import com.motolens.app.ui.viewmodel.MotoLensUiState

private val POPULAR_BRANDS = listOf("", "Honda", "Yamaha", "Kawasaki", "Suzuki", "Vespa")
private val PRICE_LABELS = listOf(
    "" to "Semua Harga",
    "good_deal" to "Good Deal",
    "fair_price" to "Fair Price",
    "overpriced" to "Overpriced"
)

@Composable
fun HomeCatalogScreen(
    uiState: MotoLensUiState,
    onUpdateFilters: (search: String, brand: String, priceLabel: String, conditionGrade: String) -> Unit,
    onRefreshCatalog: () -> Unit,
    onSelectMotorcycle: (Int) -> Unit,
    onOpenCameraScanner: () -> Unit,
    onOpenServerDialog: () -> Unit
) {
    var localSearch by remember(uiState.searchQuery) { mutableStateOf(uiState.searchQuery) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(ShowroomWhite),
        contentPadding = PaddingValues(bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // 1. Dark Automotive Showroom Hero Banner
        item {
            Surface(
                color = CarbonBlack,
                contentColor = Color.White,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 18.dp, vertical = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            color = CrimsonRedPrimary.copy(alpha = 0.2f),
                            border = BorderStroke(1.dp, CrimsonRedPrimary.copy(alpha = 0.5f)),
                            shape = RoundedCornerShape(20.dp)
                        ) {
                            Text(
                                text = "● AI AUTOMOTIVE SHOWROOM BALI",
                                color = Color(0xFFF87171),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }

                        IconButton(onClick = onOpenServerDialog) {
                            Icon(
                                imageVector = Icons.Default.SettingsEthernet,
                                contentDescription = "Pengaturan Server API",
                                tint = Color.White
                            )
                        }
                    }

                    Text(
                        text = "Pilih Motor Bekas Impianmu dengan Transparansi AI",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Black,
                        lineHeight = 27.sp
                    )

                    Text(
                        text = "Dilengkapi deteksi YOLOv8n ONNX (Scratch, Dent, Accident • 84.34% mAP) dan Explainable Price Breakdown.",
                        fontSize = 12.sp,
                        color = Color(0xFFA1A1AA)
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Button(
                            onClick = onOpenCameraScanner,
                            colors = ButtonDefaults.buttonColors(containerColor = CrimsonRedPrimary),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.CameraAlt,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Inspeksi Kamera AI",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.ExtraBold
                            )
                        }

                        OutlinedButton(
                            onClick = onRefreshCatalog,
                            border = BorderStroke(1.dp, Color(0xFF3F3F46)),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Refresh,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(5.dp))
                            Text("Segarkan", fontSize = 12.sp, color = Color.White)
                        }
                    }
                }
            }
        }

        // 2. Search & Brand Filter Strip
        item {
            Column(
                modifier = Modifier.padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedTextField(
                    value = localSearch,
                    onValueChange = {
                        localSearch = it
                        onUpdateFilters(
                            it,
                            uiState.selectedBrand,
                            uiState.selectedPriceLabel,
                            uiState.selectedConditionGrade
                        )
                    },
                    placeholder = { Text("Cari PCX 160, NMAX, Vario, Denpasar...", fontSize = 12.sp) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                    trailingIcon = {
                        if (localSearch.isNotEmpty()) {
                            IconButton(onClick = {
                                localSearch = ""
                                onUpdateFilters("", uiState.selectedBrand, uiState.selectedPriceLabel, uiState.selectedConditionGrade)
                            }) {
                                Icon(Icons.Default.Clear, contentDescription = "Reset")
                            }
                        }
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                // Quick Brand Pills
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    POPULAR_BRANDS.forEach { brandItem ->
                        val isSelected = uiState.selectedBrand == brandItem
                        FilterChip(
                            selected = isSelected,
                            onClick = {
                                onUpdateFilters(
                                    localSearch,
                                    brandItem,
                                    uiState.selectedPriceLabel,
                                    uiState.selectedConditionGrade
                                )
                            },
                            label = {
                                Text(
                                    text = if (brandItem.isEmpty()) "Semua Merek" else brandItem,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = CrimsonRedPrimary,
                                selectedLabelColor = Color.White
                            )
                        )
                    }
                }

                // Price Label Filter Pills
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    PRICE_LABELS.forEach { (key, title) ->
                        val isSelected = uiState.selectedPriceLabel == key
                        FilterChip(
                            selected = isSelected,
                            onClick = {
                                onUpdateFilters(
                                    localSearch,
                                    uiState.selectedBrand,
                                    key,
                                    uiState.selectedConditionGrade
                                )
                            },
                            label = {
                                Text(text = title, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                            },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = CarbonBlack,
                                selectedLabelColor = Color.White
                            )
                        )
                    }
                }
            }
        }

        // 3. Loading / Empty / Catalog List
        if (uiState.isLoading && uiState.catalogItems.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = CrimsonRedPrimary)
                }
            }
        } else if (uiState.catalogItems.isEmpty()) {
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = CardSurfaceWhite)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "Tidak Ada Motor Ditemukan",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 15.sp
                        )
                        Text(
                            text = "Coba ubah filter pencarian atau periksa koneksi Base URL (${uiState.activeBaseUrl}).",
                            fontSize = 12.sp,
                            color = ZincTextSecondary
                        )
                        Button(
                            onClick = {
                                localSearch = ""
                                onUpdateFilters("", "", "", "")
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = CrimsonRedPrimary)
                        ) {
                            Text("Reset Semua Filter", fontSize = 12.sp)
                        }
                    }
                }
            }
        } else {
            items(uiState.catalogItems, key = { it.id }) { motorcycle ->
                MotorcycleShowroomCard(
                    item = motorcycle,
                    activeBaseUrl = uiState.activeBaseUrl,
                    onClick = { onSelectMotorcycle(motorcycle.id) },
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
            }
        }
    }
}
