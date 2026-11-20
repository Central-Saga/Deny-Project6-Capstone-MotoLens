package com.motolens.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val AutomotiveShowroomColorScheme = lightColorScheme(
    primary = CrimsonRedPrimary,
    onPrimary = Color.White,
    primaryContainer = CrimsonRedLight,
    onPrimaryContainer = CrimsonRedDark,
    secondary = CarbonBlack,
    onSecondary = Color.White,
    secondaryContainer = CarbonSurface,
    onSecondaryContainer = Color.White,
    background = ShowroomWhite,
    onBackground = ZincTextPrimary,
    surface = CardSurfaceWhite,
    onSurface = ZincTextPrimary,
    surfaceVariant = Color(0xFFF1F5F9),
    onSurfaceVariant = ZincTextSecondary,
    outline = Color(0xFFE2E8F0)
)

@Composable
fun MotoLensTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = AutomotiveShowroomColorScheme,
        content = content
    )
}
