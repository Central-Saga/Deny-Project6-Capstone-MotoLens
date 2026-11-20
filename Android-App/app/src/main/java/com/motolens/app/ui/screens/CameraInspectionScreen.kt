package com.motolens.app.ui.screens

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.GpsFixed
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.google.android.gms.location.LocationServices
import com.motolens.app.ui.theme.CarbonBlack
import com.motolens.app.ui.theme.CrimsonRedPrimary
import com.motolens.app.util.ImageCompressor
import java.io.File

/**
 * Live Field Inspection CameraX Screen (PRD Bab 2.2 & Bab 9).
 * Enforces direct back-camera capture (`source_type = "android_camera"`) with NO gallery picker route,
 * Frame Guide Overlay, lighting tips, EXIF rotation normalization, and JPEG compression <= 2 MB.
 */
@Composable
fun CameraInspectionScreen(
    onPhotoCaptured: (photoFile: File, lat: Double?, lng: Double?, accuracyM: Float?) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) ==
                PackageManager.PERMISSION_GRANTED
        )
    }
    var hasLocationPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) ==
                PackageManager.PERMISSION_GRANTED ||
                ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) ==
                PackageManager.PERMISSION_GRANTED
        )
    }

    var gpsLat by remember { mutableStateOf<Double?>(null) }
    var gpsLng by remember { mutableStateOf<Double?>(null) }
    var gpsAcc by remember { mutableStateOf<Float?>(null) }
    var isCapturing by remember { mutableStateOf(false) }
    var cameraError by remember { mutableStateOf<String?>(null) }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { result ->
        hasCameraPermission = result[Manifest.permission.CAMERA] == true
        hasLocationPermission =
            result[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                result[Manifest.permission.ACCESS_COARSE_LOCATION] == true
    }

    LaunchedEffect(Unit) {
        if (!hasCameraPermission || !hasLocationPermission) {
            permissionLauncher.launch(
                arrayOf(
                    Manifest.permission.CAMERA,
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
        }
    }

    // Fetch last known location if permitted (PRD Bab 9.4: Never fabricate coordinates if denied)
    LaunchedEffect(hasLocationPermission) {
        if (hasLocationPermission) {
            fetchLastLocationSafe(context) { lat, lng, acc ->
                gpsLat = lat
                gpsLng = lng
                gpsAcc = acc
            }
        }
    }

    val imageCapture = remember {
        ImageCapture.Builder()
            .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
            .build()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(CarbonBlack)
    ) {
        if (!hasCameraPermission) {
            // Permission Denied State
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(28.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    imageVector = Icons.Default.CameraAlt,
                    contentDescription = null,
                    tint = CrimsonRedPrimary,
                    modifier = Modifier.size(56.dp)
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "Izin Kamera Wajib untuk Inspeksi Resmi",
                    color = Color.White,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Sesuai PRD Bab 2.2 & Bab 9.4, inspeksi lapangan MotoLens hanya menggunakan kamera belakang langsung (CameraX) tanpa jalur galeri untuk menjaga integritas 'android_camera'.",
                    color = Color(0xFFA1A1AA),
                    fontSize = 12.sp
                )
                Spacer(modifier = Modifier.height(18.dp))
                Button(
                    onClick = {
                        permissionLauncher.launch(
                            arrayOf(
                                Manifest.permission.CAMERA,
                                Manifest.permission.ACCESS_FINE_LOCATION
                            )
                        )
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonRedPrimary)
                ) {
                    Text("Berikan Izin Kamera", fontWeight = FontWeight.Bold)
                }
            }
        } else {
            // 1. CameraX Live PreviewView
            AndroidView(
                factory = { ctx ->
                    val previewView = PreviewView(ctx)
                    val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                    cameraProviderFuture.addListener({
                        try {
                            val cameraProvider = cameraProviderFuture.get()
                            val preview = Preview.Builder().build().also {
                                it.surfaceProvider = previewView.surfaceProvider
                            }
                            cameraProvider.unbindAll()
                            cameraProvider.bindToLifecycle(
                                lifecycleOwner,
                                CameraSelector.DEFAULT_BACK_CAMERA,
                                preview,
                                imageCapture
                            )
                        } catch (e: Exception) {
                            cameraError = "Gagal memuat kamera belakang: ${e.localizedMessage}"
                        }
                    }, ContextCompat.getMainExecutor(ctx))
                    previewView
                },
                modifier = Modifier.fillMaxSize()
            )

            // 2. Frame Guide Overlay (Panduan Bingkai Bodi Motor di Tengah Layar)
            Canvas(modifier = Modifier.fillMaxSize()) {
                val frameW = size.width * 0.84f
                val frameH = size.height * 0.48f
                val left = (size.width - frameW) / 2f
                val top = (size.height - frameH) / 2f

                // Outer guide rectangle
                drawRoundRect(
                    color = Color.White.copy(alpha = 0.45f),
                    topLeft = Offset(left, top),
                    size = Size(frameW, frameH),
                    cornerRadius = CornerRadius(24.dp.toPx()),
                    style = Stroke(width = 2.dp.toPx())
                )

                // Sporty Red Corner Accents
                val cornerLen = 34.dp.toPx()
                val strokeW = 4.dp.toPx()
                // Top-Left
                drawLine(CrimsonRedPrimary, Offset(left, top), Offset(left + cornerLen, top), strokeW)
                drawLine(CrimsonRedPrimary, Offset(left, top), Offset(left, top + cornerLen), strokeW)
                // Top-Right
                drawLine(CrimsonRedPrimary, Offset(left + frameW - cornerLen, top), Offset(left + frameW, top), strokeW)
                drawLine(CrimsonRedPrimary, Offset(left + frameW, top), Offset(left + frameW, top + cornerLen), strokeW)
                // Bottom-Left
                drawLine(CrimsonRedPrimary, Offset(left, top + frameH), Offset(left + cornerLen, top + frameH), strokeW)
                drawLine(CrimsonRedPrimary, Offset(left, top + frameH - cornerLen), Offset(left, top + frameH), strokeW)
                // Bottom-Right
                drawLine(CrimsonRedPrimary, Offset(left + frameW - cornerLen, top + frameH), Offset(left + frameW, top + frameH), strokeW)
                drawLine(CrimsonRedPrimary, Offset(left + frameW, top + frameH - cornerLen), Offset(left + frameW, top + frameH), strokeW)
            }

            // 3. Top HUD Guidance & Verification Banner
            Column(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Surface(
                    color = CarbonBlack.copy(alpha = 0.88f),
                    contentColor = Color.White,
                    shape = RoundedCornerShape(14.dp),
                    border = BorderStroke(1.dp, CrimsonRedPrimary.copy(alpha = 0.5f))
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.VerifiedUser,
                                contentDescription = null,
                                tint = CrimsonRedPrimary,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = "CAMERAX LIVE SCANNER • SOURCE: ANDROID_CAMERA",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White
                            )
                        }
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.LightMode,
                                contentDescription = null,
                                tint = Color(0xFFFBBF24),
                                modifier = Modifier.size(14.dp)
                            )
                            Text(
                                text = "Arahkan bodi samping/depan motor tepat di dalam bingkai merah dengan pencahayaan terang (jarak 1.5–2 meter).",
                                fontSize = 11.sp,
                                color = Color(0xFFD4D4D8)
                            )
                        }
                    }
                }

                // GPS Status Pill
                Surface(
                    color = CarbonBlack.copy(alpha = 0.8f),
                    contentColor = Color.White,
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.GpsFixed,
                            contentDescription = null,
                            tint = if (gpsLat != null) Color(0xFF34D399) else Color(0xFF94A3B8),
                            modifier = Modifier.size(13.dp)
                        )
                        Text(
                            text = if (gpsLat != null) {
                                "Geotagging Aktif (±${gpsAcc?.toInt() ?: 15}m)"
                            } else {
                                "Geotagging Opsional (Tanpa Koordinat Palsu)"
                            },
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // 4. Bottom Shutter Control Bar (Strictly Live Capture, No Gallery Button)
            Column(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .background(CarbonBlack.copy(alpha = 0.88f))
                    .padding(vertical = 18.dp, horizontal = 20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (cameraError != null) {
                    Text(
                        text = cameraError!!,
                        color = Color(0xFFF87171),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Button(
                    onClick = {
                        if (isCapturing) return@Button
                        isCapturing = true
                        cameraError = null
                        val rawFile = File(
                            context.cacheDir,
                            "raw_capture_${System.currentTimeMillis()}.jpg"
                        )
                        val outputOptions = ImageCapture.OutputFileOptions.Builder(rawFile).build()
                        imageCapture.takePicture(
                            outputOptions,
                            ContextCompat.getMainExecutor(context),
                            object : ImageCapture.OnImageSavedCallback {
                                override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
                                    // Normalize EXIF orientation & compress <= 2 MB
                                    val compressed = ImageCompressor.normalizeAndCompressJpeg(
                                        sourceFile = rawFile,
                                        outputDir = context.cacheDir
                                    )
                                    isCapturing = false
                                    onPhotoCaptured(compressed, gpsLat, gpsLng, gpsAcc)
                                }

                                override fun onError(exception: ImageCaptureException) {
                                    isCapturing = false
                                    cameraError = "Gagal mengambil foto: ${exception.localizedMessage}"
                                }
                            }
                        )
                    },
                    enabled = !isCapturing,
                    shape = CircleShape,
                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonRedPrimary),
                    modifier = Modifier.size(74.dp)
                ) {
                    if (isCapturing) {
                        CircularProgressIndicator(
                            color = Color.White,
                            strokeWidth = 2.dp,
                            modifier = Modifier.size(26.dp)
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Default.CameraAlt,
                            contentDescription = "Ambil Foto Inspeksi",
                            tint = Color.White,
                            modifier = Modifier.size(32.dp)
                        )
                    }
                }

                Text(
                    text = "Tekan Tombol Merah untuk Mengambil Foto Kamera Langsung (Anti-Galeri)",
                    color = Color(0xFFA1A1AA),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}

@SuppressLint("MissingPermission")
private fun fetchLastLocationSafe(
    context: Context,
    onResult: (Double?, Double?, Float?) -> Unit
) {
    try {
        val client = LocationServices.getFusedLocationProviderClient(context)
        client.lastLocation.addOnSuccessListener { loc ->
            if (loc != null) {
                onResult(loc.latitude, loc.longitude, loc.accuracy)
            }
        }
    } catch (_: Exception) {
        // Ignore if Google Play Services Location is unavailable on bare emulator
    }
}
