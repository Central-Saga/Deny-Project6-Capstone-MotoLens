package com.motolens.app.ui.navigation

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.motolens.app.ui.components.ServerUrlDialog
import com.motolens.app.ui.screens.*
import com.motolens.app.ui.theme.CarbonBlack
import com.motolens.app.ui.theme.CrimsonRedPrimary
import com.motolens.app.ui.theme.SemanticGoodDealText
import com.motolens.app.ui.viewmodel.MotoLensViewModel

object Routes {
    const val CATALOG = "catalog"
    const val DETAIL = "detail"
    const val CAMERA_SCANNER = "camera_scanner"
    const val INSPECTION_FORM = "inspection_form"
    const val INSPECTION_RESULT = "inspection_result"
    const val GARAGE = "garage"
    const val LOGIN = "login"
    const val REGISTER = "register"
}

@Composable
fun MotoLensAppRoot(viewModel: MotoLensViewModel) {
    val navController = rememberNavController()
    val uiState by viewModel.uiState.collectAsState()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route ?: Routes.CATALOG

    var showServerDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            // Global Feedback Banner for errors or success messages
            val msg = uiState.errorMessage ?: uiState.successMessage
            if (!msg.isNullOrBlank()) {
                val isError = uiState.errorMessage != null
                Surface(
                    color = if (isError) CrimsonRedPrimary else SemanticGoodDealText,
                    contentColor = Color.White,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = msg,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.weight(1f)
                        )
                        TextButton(
                            onClick = { viewModel.clearBannerMessages() },
                            contentPadding = PaddingValues(0.dp)
                        ) {
                            Text("TUTUP", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Black)
                        }
                    }
                }
            }
        },
        bottomBar = {
            NavigationBar(
                containerColor = CarbonBlack,
                contentColor = Color.White
            ) {
                NavigationBarItem(
                    selected = currentRoute == Routes.CATALOG || currentRoute == Routes.DETAIL,
                    onClick = {
                        navController.navigate(Routes.CATALOG) {
                            launchSingleTop = true
                        }
                    },
                    icon = { Icon(Icons.Default.TwoWheeler, contentDescription = "Showroom") },
                    label = { Text("Showroom", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color.White,
                        selectedTextColor = CrimsonRedPrimary,
                        indicatorColor = CrimsonRedPrimary,
                        unselectedIconColor = Color(0xFFA1A1AA),
                        unselectedTextColor = Color(0xFFA1A1AA)
                    )
                )

                NavigationBarItem(
                    selected = currentRoute == Routes.CAMERA_SCANNER ||
                        currentRoute == Routes.INSPECTION_FORM ||
                        currentRoute == Routes.INSPECTION_RESULT,
                    onClick = {
                        if (!uiState.isAuthenticated) {
                            navController.navigate(Routes.LOGIN)
                        } else {
                            navController.navigate(Routes.CAMERA_SCANNER) {
                                launchSingleTop = true
                            }
                        }
                    },
                    icon = { Icon(Icons.Default.CameraAlt, contentDescription = "CameraX AI") },
                    label = { Text("Inspeksi AI", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color.White,
                        selectedTextColor = CrimsonRedPrimary,
                        indicatorColor = CrimsonRedPrimary,
                        unselectedIconColor = Color(0xFFA1A1AA),
                        unselectedTextColor = Color(0xFFA1A1AA)
                    )
                )

                NavigationBarItem(
                    selected = currentRoute == Routes.GARAGE || currentRoute == Routes.LOGIN,
                    onClick = {
                        if (uiState.isAuthenticated) {
                            viewModel.refreshGarageAndActivity()
                            navController.navigate(Routes.GARAGE) {
                                launchSingleTop = true
                            }
                        } else {
                            navController.navigate(Routes.LOGIN) {
                                launchSingleTop = true
                            }
                        }
                    },
                    icon = {
                        BadgedBox(
                            badge = {
                                if (uiState.unreadNotificationCount > 0) {
                                    Badge(containerColor = CrimsonRedPrimary) {
                                        Text(uiState.unreadNotificationCount.toString())
                                    }
                                }
                            }
                        ) {
                            Icon(
                                imageVector = if (uiState.isAuthenticated) Icons.Default.Garage else Icons.Default.Person,
                                contentDescription = "Garasi"
                            )
                        }
                    },
                    label = {
                        Text(
                            text = if (uiState.isAuthenticated) "Garasi Saya" else "Login",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color.White,
                        selectedTextColor = CrimsonRedPrimary,
                        indicatorColor = CrimsonRedPrimary,
                        unselectedIconColor = Color(0xFFA1A1AA),
                        unselectedTextColor = Color(0xFFA1A1AA)
                    )
                )
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Routes.CATALOG,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Routes.CATALOG) {
                HomeCatalogScreen(
                    uiState = uiState,
                    onUpdateFilters = { search, brand, priceLabel, grade ->
                        viewModel.updateCatalogFilters(search, brand, priceLabel, grade)
                    },
                    onRefreshCatalog = { viewModel.loadCatalog() },
                    onSelectMotorcycle = { id ->
                        viewModel.loadMotorcycleDetail(id)
                        navController.navigate(Routes.DETAIL)
                    },
                    onOpenCameraScanner = {
                        if (uiState.isAuthenticated) {
                            navController.navigate(Routes.CAMERA_SCANNER)
                        } else {
                            navController.navigate(Routes.LOGIN)
                        }
                    },
                    onOpenServerDialog = { showServerDialog = true }
                )
            }

            composable(Routes.DETAIL) {
                MotorcycleDetailScreen(
                    uiState = uiState,
                    onBack = { navController.popBackStack() },
                    onToggleFavorite = { id ->
                        if (!uiState.isAuthenticated) {
                            navController.navigate(Routes.LOGIN)
                        } else {
                            viewModel.toggleFavorite(id)
                        }
                    },
                    onSubmitInquiry = { id, date, price, notes ->
                        if (!uiState.isAuthenticated) {
                            navController.navigate(Routes.LOGIN)
                        } else {
                            viewModel.submitSurveyInquiry(id, date, price, notes)
                        }
                    }
                )
            }

            composable(Routes.CAMERA_SCANNER) {
                CameraInspectionScreen(
                    onPhotoCaptured = { file, lat, lng, acc ->
                        viewModel.onCameraPhotoCaptured(file, lat, lng, acc)
                        navController.navigate(Routes.INSPECTION_FORM)
                    }
                )
            }

            composable(Routes.INSPECTION_FORM) {
                InspectionFormScreen(
                    uiState = uiState,
                    onRetakePhoto = { navController.popBackStack() },
                    onRunInspection = { modelId, year, odo, tax, sellerPrice ->
                        viewModel.runCameraInspection(
                            motorcycleModelId = modelId,
                            year = year,
                            odometerKm = odo,
                            taxStatus = tax,
                            sellerPrice = sellerPrice,
                            onSuccess = {
                                navController.navigate(Routes.INSPECTION_RESULT)
                            }
                        )
                    }
                )
            }

            composable(Routes.INSPECTION_RESULT) {
                InspectionResultScreen(
                    uiState = uiState,
                    onSubmitFeedback = { id, type, comment ->
                        viewModel.submitInspectionFeedback(id, type, comment)
                    },
                    onPublishListing = { inspectionId, title, desc, price, loc ->
                        viewModel.publishListingFromInspection(
                            inspectionId = inspectionId,
                            title = title,
                            description = desc,
                            sellerPrice = price,
                            locationAddress = loc,
                            onPublished = {
                                navController.navigate(Routes.GARAGE) {
                                    popUpTo(Routes.CATALOG)
                                }
                            }
                        )
                    }
                )
            }

            composable(Routes.GARAGE) {
                GarageAndActivityScreen(
                    uiState = uiState,
                    onRefresh = { viewModel.refreshGarageAndActivity() },
                    onUpdateMotorcycle = { id, price, status ->
                        viewModel.updateMyMotorcycle(id, price, status)
                    },
                    onDeleteMotorcycle = { id ->
                        viewModel.deleteMyMotorcycle(id)
                    },
                    onRespondSellerInquiry = { id, status ->
                        viewModel.respondToSellerInquiry(id, status)
                    },
                    onCancelBuyerInquiry = { id ->
                        viewModel.cancelBuyerInquiry(id)
                    },
                    onMarkAllNotificationsRead = {
                        viewModel.markAllNotificationsRead()
                    },
                    onOpenServerDialog = { showServerDialog = true },
                    onLogout = {
                        viewModel.logout()
                        navController.navigate(Routes.LOGIN) {
                            popUpTo(Routes.CATALOG)
                        }
                    }
                )
            }

            composable(Routes.LOGIN) {
                LoginScreen(
                    uiState = uiState,
                    onLogin = { email, password ->
                        viewModel.login(email, password) {
                            navController.navigate(Routes.CATALOG) {
                                popUpTo(Routes.CATALOG) { inclusive = true }
                            }
                        }
                    },
                    onNavigateToRegister = { navController.navigate(Routes.REGISTER) },
                    onOpenServerDialog = { showServerDialog = true }
                )
            }

            composable(Routes.REGISTER) {
                RegisterScreen(
                    uiState = uiState,
                    onRegister = { name, email, pass, phone ->
                        viewModel.register(name, email, pass, phone) {
                            navController.navigate(Routes.CATALOG) {
                                popUpTo(Routes.CATALOG) { inclusive = true }
                            }
                        }
                    },
                    onNavigateToLogin = { navController.popBackStack() }
                )
            }
        }
    }

    if (showServerDialog) {
        ServerUrlDialog(
            currentUrl = uiState.activeBaseUrl,
            healthStatusMessage = uiState.healthCheckMessage,
            onSaveUrl = { viewModel.saveServerBaseUrl(it) },
            onTestHealth = { viewModel.testServerHealth(it) },
            onDismiss = { showServerDialog = false }
        )
    }
}
