package com.motolens.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.motolens.app.ui.theme.*
import com.motolens.app.ui.viewmodel.MotoLensUiState

@Composable
fun LoginScreen(
    uiState: MotoLensUiState,
    onLogin: (String, String) -> Unit,
    onNavigateToRegister: () -> Unit,
    onOpenServerDialog: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ShowroomWhite)
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Dark Carbon Brand Header Card
        Surface(
            color = CarbonBlack,
            contentColor = Color.White,
            shape = RoundedCornerShape(22.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(22.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        color = CrimsonRedPrimary,
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text(
                            text = "MOTOLENS ANDROID",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                        )
                    }

                    OutlinedButton(
                        onClick = onOpenServerDialog,
                        border = BorderStroke(1.dp, Color(0xFF3F3F46)),
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.SettingsEthernet,
                            contentDescription = "Server URL",
                            tint = Color.White,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(5.dp))
                        Text("Server URL", fontSize = 11.sp, color = Color.White)
                    }
                }

                Text(
                    text = "Masuk ke Showroom & Scanner AI",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Black
                )
                Text(
                    text = "Gunakan akun Sanctum untuk menjalankan inspeksi kamera lapangan CameraX dan mengelola garasi Anda.",
                    fontSize = 12.sp,
                    color = Color(0xFFA1A1AA)
                )
                Text(
                    text = "Endpoint Aktif: ${uiState.activeBaseUrl}",
                    fontSize = 10.sp,
                    color = Color(0xFFF87171),
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // One-Click Capstone Demo Login Card (PRD Bab 11.5 & Bab 14.2)
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
                Text(
                    text = "AKUN DEMO CAPSTONE (SEKALI KLIK)",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    color = CrimsonRedPrimary
                )
                Button(
                    onClick = {
                        email = "user@motolens.id"
                        password = "Password123!"
                        onLogin("user@motolens.id", "Password123!")
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CarbonBlack),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Demo User (user@motolens.id)", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // Manual Login Form
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
                    text = "Login Kredensial Akun",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.ExtraBold
                )

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    placeholder = { Text("user@motolens.id") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Button(
                    onClick = { onLogin(email, password) },
                    enabled = !uiState.isLoading,
                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonRedPrimary),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                ) {
                    if (uiState.isLoading) {
                        CircularProgressIndicator(
                            color = Color.White,
                            strokeWidth = 2.dp,
                            modifier = Modifier.size(20.dp)
                        )
                    } else {
                        Text("Masuk Sekarang", fontSize = 14.sp, fontWeight = FontWeight.ExtraBold)
                    }
                }

                TextButton(
                    onClick = onNavigateToRegister,
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                ) {
                    Text(
                        text = "Belum punya akun? Daftar Member Baru",
                        color = CrimsonRedPrimary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}

@Composable
fun RegisterScreen(
    uiState: MotoLensUiState,
    onRegister: (String, String, String, String) -> Unit,
    onNavigateToLogin: () -> Unit
) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("081234567890") }
    var password by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ShowroomWhite)
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Registrasi Member MotoLens",
            fontSize = 22.sp,
            fontWeight = FontWeight.Black,
            color = ZincTextPrimary
        )
        Text(
            text = "Pendaftaran publik otomatis menetapkan role 'user' sesuai kebijakan keamanan PRD Bab 11.1.",
            fontSize = 12.sp,
            color = ZincTextSecondary
        )

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
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nama Lengkap") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Alamat Email") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Nomor WhatsApp Aktif") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password (Min. 8 Karakter)") },
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Button(
                    onClick = { onRegister(name, email, password, phone) },
                    enabled = !uiState.isLoading,
                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonRedPrimary),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                ) {
                    Text("Daftar & Masuk", fontSize = 14.sp, fontWeight = FontWeight.ExtraBold)
                }

                TextButton(
                    onClick = onNavigateToLogin,
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                ) {
                    Text("Sudah punya akun? Kembali ke Login", color = CarbonBlack, fontSize = 12.sp)
                }
            }
        }
    }
}
