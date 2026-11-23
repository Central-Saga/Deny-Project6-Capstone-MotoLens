package com.motolens.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.motolens.app.data.model.InquiryItemDto
import com.motolens.app.data.model.MotorcycleListItemDto
import com.motolens.app.ui.theme.*
import com.motolens.app.ui.viewmodel.MotoLensUiState
import com.motolens.app.util.Formatters

/**
 * Combined My Garage, Inquiries (Seller & Buyer), and Notifications Screen
 * with Profile & Dynamic Server API Settings access.
 */
@Composable
fun GarageAndActivityScreen(
    uiState: MotoLensUiState,
    onRefresh: () -> Unit,
    onUpdateMotorcycle: (id: Int, price: Long, status: String) -> Unit,
    onDeleteMotorcycle: (id: Int) -> Unit,
    onRespondSellerInquiry: (inquiryId: Int, status: String) -> Unit,
    onCancelBuyerInquiry: (inquiryId: Int) -> Unit,
    onMarkAllNotificationsRead: () -> Unit,
    onOpenServerDialog: () -> Unit,
    onLogout: () -> Unit
) {
    var activeSubTab by remember { mutableIntStateOf(0) }
    var editingMotorcycle by remember { mutableStateOf<MotorcycleListItemDto?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ShowroomWhite)
    ) {
        // Top User Header & Server Settings
        Surface(
            color = CarbonBlack,
            contentColor = Color.White,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = uiState.currentUser?.name ?: "Member MotoLens",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black
                        )
                        Text(
                            text = "${uiState.currentUser?.email ?: ""} • ${if (uiState.currentUser?.isAdmin == true) "ADMIN" else "MEMBER"}",
                            fontSize = 11.sp,
                            color = Color(0xFFF87171),
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Row {
                        IconButton(onClick = onOpenServerDialog) {
                            Icon(
                                imageVector = Icons.Default.SettingsEthernet,
                                contentDescription = "Server URL",
                                tint = Color.White
                            )
                        }
                        IconButton(onClick = onRefresh) {
                            Icon(
                                imageVector = Icons.Default.Refresh,
                                contentDescription = "Segarkan",
                                tint = Color.White
                            )
                        }
                        IconButton(onClick = onLogout) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.Logout,
                                contentDescription = "Logout",
                                tint = CrimsonRedPrimary
                            )
                        }
                    }
                }

                // 4 Sub-Tab Pills
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf(
                        0 to "Motor Saya (${uiState.myMotorcycles.size})",
                        1 to "Survei Masuk (${uiState.sellerInquiries.size})",
                        2 to "Survei Keluar (${uiState.buyerInquiries.size})",
                        3 to "Notifikasi (${uiState.unreadNotificationCount})"
                    ).forEach { (idx, title) ->
                        Surface(
                            onClick = { activeSubTab = idx },
                            color = if (activeSubTab == idx) CrimsonRedPrimary else CarbonSurface,
                            contentColor = Color.White,
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text(
                                text = title,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold,
                                modifier = Modifier.padding(vertical = 8.dp, horizontal = 6.dp)
                            )
                        }
                    }
                }
            }
        }

        // Sub-Tab Content
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            when (activeSubTab) {
                // TAB 0: MOTOR SAYA
                0 -> {
                    if (uiState.myMotorcycles.isEmpty()) {
                        item {
                            EmptyActivityCard("Anda belum memiliki listing motor di garasi.")
                        }
                    } else {
                        items(uiState.myMotorcycles, key = { it.id }) { unit ->
                            Card(
                                shape = RoundedCornerShape(14.dp),
                                colors = CardDefaults.cardColors(containerColor = CardSurfaceWhite),
                                border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(
                                    modifier = Modifier.padding(14.dp),
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = unit.title,
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 15.sp,
                                            modifier = Modifier.weight(1f)
                                        )
                                        Surface(
                                            color = when (unit.moderationStatus) {
                                                "approved" -> SemanticGoodDealBg
                                                "rejected" -> SemanticOverpricedBg
                                                else -> Color(0xFFFEF3C7)
                                            },
                                            shape = RoundedCornerShape(6.dp)
                                        ) {
                                            Text(
                                                text = unit.moderationStatus.uppercase(),
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Black,
                                                color = CarbonBlack,
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                            )
                                        }
                                    }

                                    Text(
                                        text = "${Formatters.formatRupiah(unit.sellerPrice)} • Status: ${unit.status.uppercase()}",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = CrimsonRedPrimary
                                    )

                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        OutlinedButton(
                                            onClick = { editingMotorcycle = unit },
                                            shape = RoundedCornerShape(10.dp)
                                        ) {
                                            Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Ubah Harga/Status", fontSize = 11.sp)
                                        }

                                        OutlinedButton(
                                            onClick = { onDeleteMotorcycle(unit.id) },
                                            shape = RoundedCornerShape(10.dp),
                                            colors = ButtonDefaults.outlinedButtonColors(contentColor = CrimsonRedPrimary)
                                        ) {
                                            Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Arsipkan", fontSize = 11.sp)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // TAB 1: SURVEI MASUK (SEBAGAI PENJUAL)
                1 -> {
                    if (uiState.sellerInquiries.isEmpty()) {
                        item { EmptyActivityCard("Belum ada pengajuan jadwal survei masuk.") }
                    } else {
                        items(uiState.sellerInquiries, key = { it.id }) { inq ->
                            InquiryCard(
                                inq = inq,
                                isSellerView = true,
                                onRespondSeller = onRespondSellerInquiry,
                                onCancelBuyer = onCancelBuyerInquiry
                            )
                        }
                    }
                }

                // TAB 2: SURVEI KELUAR (SEBAGAI PEMBELI)
                2 -> {
                    if (uiState.buyerInquiries.isEmpty()) {
                        item { EmptyActivityCard("Anda belum mengajukan jadwal survei ke penjual.") }
                    } else {
                        items(uiState.buyerInquiries, key = { it.id }) { inq ->
                            InquiryCard(
                                inq = inq,
                                isSellerView = false,
                                onRespondSeller = onRespondSellerInquiry,
                                onCancelBuyer = onCancelBuyerInquiry
                            )
                        }
                    }
                }

                // TAB 3: NOTIFIKASI
                3 -> {
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Notifikasi Sistem (${uiState.unreadNotificationCount} belum dibaca)",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                            if (uiState.unreadNotificationCount > 0) {
                                TextButton(onClick = onMarkAllNotificationsRead) {
                                    Text("Tandai Semua Dibaca", color = CrimsonRedPrimary, fontSize = 11.sp)
                                }
                            }
                        }
                    }

                    if (uiState.notifications.isEmpty()) {
                        item { EmptyActivityCard("Belum ada notifikasi baru.") }
                    } else {
                        items(uiState.notifications, key = { it.id }) { notif ->
                            Card(
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = if (notif.isRead) CardSurfaceWhite else CrimsonRedLight.copy(alpha = 0.35f)
                                ),
                                border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text(
                                        text = notif.title,
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 13.sp
                                    )
                                    Spacer(modifier = Modifier.height(3.dp))
                                    Text(
                                        text = notif.message ?: "",
                                        fontSize = 12.sp,
                                        color = ZincTextSecondary
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Edit Motorcycle Modal
    editingMotorcycle?.let { unit ->
        var priceStr by remember(unit) { mutableStateOf(unit.sellerPrice.toString()) }
        var statusStr by remember(unit) { mutableStateOf(unit.status) }

        AlertDialog(
            onDismissRequest = { editingMotorcycle = null },
            title = { Text("Ubah Listing Motor", fontWeight = FontWeight.Black, fontSize = 16.sp) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = priceStr,
                        onValueChange = { priceStr = it.filter { ch -> ch.isDigit() } },
                        label = { Text("Harga Penjual (Rp)") },
                        singleLine = true
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("available", "booked", "sold").forEach { st ->
                            FilterChip(
                                selected = statusStr == st,
                                onClick = { statusStr = st },
                                label = { Text(st.uppercase(), fontSize = 10.sp) }
                            )
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onUpdateMotorcycle(unit.id, priceStr.toLongOrNull() ?: unit.sellerPrice, statusStr)
                        editingMotorcycle = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonRedPrimary)
                ) {
                    Text("Simpan")
                }
            },
            dismissButton = {
                TextButton(onClick = { editingMotorcycle = null }) {
                    Text("Batal")
                }
            }
        )
    }
}

@Composable
private fun InquiryCard(
    inq: InquiryItemDto,
    isSellerView: Boolean,
    onRespondSeller: (Int, String) -> Unit,
    onCancelBuyer: (Int) -> Unit
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = CardSurfaceWhite),
        border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = inq.motorcycle?.title ?: "Motor #${inq.motorcycleId}",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 14.sp
                )
                Text(
                    text = inq.status.uppercase(),
                    fontWeight = FontWeight.Black,
                    fontSize = 11.sp,
                    color = CrimsonRedPrimary
                )
            }

            Text(
                text = "Jadwal Survei: ${inq.appointmentDate}",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold
            )

            Text(
                text = if (isSellerView) {
                    "Pembeli: ${inq.buyer?.name ?: "-"} (${inq.buyer?.phoneWhatsapp ?: "-"})"
                } else {
                    "Penjual: ${inq.seller?.name ?: "-"} (${inq.seller?.phoneWhatsapp ?: "-"})"
                },
                fontSize = 11.sp,
                color = ZincTextSecondary
            )

            if (!inq.notes.isNullOrBlank()) {
                Text(
                    text = "\"${inq.notes}\"",
                    fontSize = 11.sp,
                    color = ZincTextSecondary
                )
            }

            val uriHandler = LocalUriHandler.current
            val isApprovedStatus = inq.status.equals("accepted", ignoreCase = true) ||
                inq.status.equals("approved", ignoreCase = true)
            val contactPhone = if (isSellerView) {
                inq.buyer?.phone ?: inq.buyer?.phoneWhatsapp
            } else {
                inq.seller?.phone ?: inq.seller?.phoneWhatsapp
            }
            val waUrl = Formatters.buildWhatsAppSurveyUrl(
                rawPhone = contactPhone,
                motorTitle = inq.motorcycle?.title ?: "Motor #${inq.motorcycleId}",
                appointmentDate = inq.appointmentDate
            )

            if (isApprovedStatus && waUrl != null) {
                Button(
                    onClick = { uriHandler.openUri(waUrl) },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A)),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(
                        imageVector = Icons.Default.Chat,
                        contentDescription = null,
                        modifier = Modifier.size(15.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Hubungi via WhatsApp",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                }
            }

            if (isSellerView && inq.status == "pending") {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = { onRespondSeller(inq.id, "accepted") },
                        colors = ButtonDefaults.buttonColors(containerColor = SemanticGoodDealText),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Terima", fontSize = 11.sp)
                    }
                    OutlinedButton(
                        onClick = { onRespondSeller(inq.id, "rejected") },
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Tolak", fontSize = 11.sp, color = CrimsonRedPrimary)
                    }
                }
            } else if (!isSellerView && inq.status == "pending") {
                OutlinedButton(
                    onClick = { onCancelBuyer(inq.id) },
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Batalkan Survei", fontSize = 11.sp, color = CrimsonRedPrimary)
                }
            }
        }
    }
}

@Composable
private fun EmptyActivityCard(message: String) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = CardSurfaceWhite),
        border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Text(
            text = message,
            fontSize = 12.sp,
            color = ZincTextSecondary,
            modifier = Modifier.padding(20.dp)
        )
    }
}
