package com.motolens.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.motolens.app.data.local.SessionManager
import com.motolens.app.ui.theme.CarbonBlack
import com.motolens.app.ui.theme.CrimsonRedPrimary
import com.motolens.app.ui.theme.SemanticGoodDealText
import com.motolens.app.ui.theme.ZincTextSecondary

/**
 * Dynamic Server API URL Dialog (No APK Rebuild Needed — PRD Bab 9 & Bab 12)
 */
@Composable
fun ServerUrlDialog(
    currentUrl: String,
    healthStatusMessage: String?,
    onSaveUrl: (String) -> Unit,
    onTestHealth: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var inputUrl by remember(currentUrl) { mutableStateOf(currentUrl) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column {
                Text(
                    text = "Pengaturan Server API (Base URL)",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Black
                )
                Text(
                    text = "Ubah endpoint backend Laravel tanpa build ulang APK",
                    fontSize = 11.sp,
                    color = ZincTextSecondary
                )
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = "Preset Cepat:",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = { inputUrl = SessionManager.PRESET_EMULATOR_URL },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("Emulator (10.0.2.2)", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }

                    OutlinedButton(
                        onClick = { inputUrl = SessionManager.PRESET_ADB_LOCALHOST_URL },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("ADB (127.0.0.1)", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }

                OutlinedTextField(
                    value = inputUrl,
                    onValueChange = { inputUrl = it },
                    label = { Text("Base URL (/api/v1/)", fontSize = 12.sp) },
                    placeholder = { Text("https://xxxx.trycloudflare.com/api/v1/") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Text(
                    text = "Tips: Gunakan IP LAN Wi-Fi (misal http://192.168.1.10:8000/api/v1/) atau URL HTTPS Cloudflare Tunnel saat menguji di HP fisik.",
                    fontSize = 11.sp,
                    color = ZincTextSecondary
                )

                if (!healthStatusMessage.isNullOrBlank()) {
                    Surface(
                        color = Color(0xFFF1F5F9),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = healthStatusMessage,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (healthStatusMessage.contains("Healthy", ignoreCase = true) ||
                                healthStatusMessage.contains("Online", ignoreCase = true)
                            ) SemanticGoodDealText else CrimsonRedPrimary,
                            modifier = Modifier.padding(10.dp)
                        )
                    }
                }
            }
        },
        confirmButton = {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = { onTestHealth(inputUrl) },
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Tes Koneksi", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                Button(
                    onClick = {
                        onSaveUrl(inputUrl)
                        onDismiss()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonRedPrimary),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Simpan URL", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Tutup", color = CarbonBlack)
            }
        }
    )
}
