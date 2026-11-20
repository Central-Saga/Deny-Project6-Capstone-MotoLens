package com.motolens.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.motolens.app.data.model.ExplainablePriceBreakdownDto
import com.motolens.app.data.model.MotorcycleListItemDto
import com.motolens.app.ui.theme.*
import com.motolens.app.util.Formatters

/**
 * PRD Compliant Semantic PriceBadge (Emerald for good_deal, Sky Blue for fair_price, Rose Red for overpriced)
 */
@Composable
fun PriceBadge(label: String?, modifier: Modifier = Modifier) {
    val normalized = label?.lowercase() ?: ""
    val (bgColor, textColor, borderColor, text) = when (normalized) {
        "good_deal" -> Quadruple(
            SemanticGoodDealBg,
            SemanticGoodDealText,
            SemanticGoodDealBorder,
            "GOOD DEAL"
        )
        "fair_price" -> Quadruple(
            SemanticFairPriceBg,
            SemanticFairPriceText,
            SemanticFairPriceBorder,
            "FAIR PRICE"
        )
        "overpriced", "above_market" -> Quadruple(
            SemanticOverpricedBg,
            SemanticOverpricedText,
            SemanticOverpricedBorder,
            "OVERPRICED"
        )
        else -> Quadruple(
            Color(0xFFF1F5F9),
            ZincTextSecondary,
            Color(0xFFCBD5E1),
            "ESTIMASI AI"
        )
    }

    Surface(
        modifier = modifier,
        color = bgColor,
        contentColor = textColor,
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, borderColor.copy(alpha = 0.5f))
    ) {
        Text(
            text = text,
            fontSize = 10.sp,
            fontWeight = FontWeight.ExtraBold,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}

@Composable
fun ConditionBadge(grade: String?, modifier: Modifier = Modifier) {
    val text = Formatters.formatConditionGradeText(grade)
    val isGood = grade?.lowercase() == "mulus" || grade?.lowercase() == "a"
    val bgColor = if (isGood) Color(0xFF064E3B).copy(alpha = 0.9f) else CarbonSurface.copy(alpha = 0.9f)
    val textColor = if (isGood) Color(0xFF6EE7B7) else Color(0xFFFDE047)

    Surface(
        modifier = modifier,
        color = bgColor,
        contentColor = textColor,
        shape = RoundedCornerShape(8.dp)
    ) {
        Text(
            text = text,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
        )
    }
}

@Composable
fun VerificationBadge(sourceType: String?, isCameraVerified: Boolean, modifier: Modifier = Modifier) {
    val label = Formatters.formatSourceBadgeText(sourceType, isCameraVerified)
    val isCam = isCameraVerified || sourceType == "android_camera"

    Surface(
        modifier = modifier,
        color = if (isCam) Color(0xFF1E293B) else Color(0xFF334155),
        contentColor = if (isCam) Color(0xFF38BDF8) else Color(0xFFCBD5E1),
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp)
        ) {
            Icon(
                imageVector = if (isCam) Icons.Default.Verified else Icons.Default.Info,
                contentDescription = null,
                modifier = Modifier.size(11.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = label,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun DamageSummaryPills(
    scratchCount: Int,
    dentCount: Int,
    accidentCount: Int,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        DamagePill("Scratch: $scratchCount", BboxScratchAmber)
        DamagePill("Dent: $dentCount", BboxDentOrange)
        DamagePill("Accident: $accidentCount", BboxAccidentRed)
    }
}

@Composable
private fun DamagePill(text: String, accent: Color) {
    Surface(
        color = accent.copy(alpha = 0.12f),
        contentColor = accent,
        shape = RoundedCornerShape(6.dp),
        border = BorderStroke(1.dp, accent.copy(alpha = 0.35f))
    ) {
        Text(
            text = text,
            fontSize = 10.sp,
            fontWeight = FontWeight.ExtraBold,
            modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp)
        )
    }
}

/**
 * Automotive Showroom Motorcycle Card matching Web Frontend `MotorcycleCard.tsx`
 */
@Composable
fun MotorcycleShowroomCard(
    item: MotorcycleListItemDto,
    activeBaseUrl: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val resolvedImg = Formatters.resolveMediaUrl(item.mainImageUrl, activeBaseUrl)
        ?: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80"

    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = CardSurfaceWhite),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        border = BorderStroke(1.dp, Color(0xFFE2E8F0))
    ) {
        Column {
            // Showroom Image Header
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(185.dp)
                    .background(CarbonSurface)
            ) {
                AsyncImage(
                    model = resolvedImg,
                    contentDescription = item.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )

                // Top Left PriceBadge
                PriceBadge(
                    label = item.priceLabel,
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(10.dp)
                )

                // Bottom Left Condition & Verification Badges
                Row(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(10.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    ConditionBadge(grade = item.conditionGrade)
                    VerificationBadge(
                        sourceType = item.sourceType,
                        isCameraVerified = item.isCameraVerified
                    )
                }
            }

            // Card Content Body
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
                        text = "${item.brand.uppercase()} • ${item.modelName.uppercase()}",
                        color = CrimsonRedPrimary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black
                    )
                    Text(
                        text = "${item.engineCc}CC",
                        color = ZincTextSecondary,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Text(
                    text = item.title,
                    color = ZincTextPrimary,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.ExtraBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                // 4-Pill Specs Row
                Surface(
                    color = ShowroomWhite,
                    shape = RoundedCornerShape(10.dp),
                    border = BorderStroke(1.dp, Color(0xFFE2E8F0))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 10.dp, vertical = 7.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Thn ${item.year}",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = ZincTextPrimary
                        )
                        Text(
                            text = "${Formatters.formatNumber(item.odometerKm)} km",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = ZincTextPrimary
                        )
                        Text(
                            text = if (item.taxStatus == "active") "Pajak Hidup" else "Pajak Mati",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (item.taxStatus == "active") SemanticGoodDealText else SemanticOverpricedText
                        )
                        Text(
                            text = item.locationAddress.take(12),
                            fontSize = 11.sp,
                            color = ZincTextSecondary,
                            maxLines = 1
                        )
                    }
                }

                // AI Damage Summary Pills
                item.inspectionSummary?.let { summary ->
                    DamageSummaryPills(
                        scratchCount = summary.scratchCount,
                        dentCount = summary.dentCount,
                        accidentCount = summary.accidentCount
                    )
                }

                HorizontalDivider(color = Color(0xFFF1F5F9))

                // Footer Price Comparison
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Bottom
                ) {
                    Column {
                        Text(
                            text = "HARGA PENJUAL",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = ZincMuted
                        )
                        Text(
                            text = Formatters.formatRupiah(item.sellerPrice),
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black,
                            color = CrimsonRedPrimary
                        )
                        Text(
                            text = "Taksiran AI: ${Formatters.formatRupiah(item.mlPredictedPrice)}",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = ZincTextSecondary
                        )
                    }

                    Surface(
                        color = CarbonBlack,
                        contentColor = Color.White,
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text(
                            text = "Sertifikat AI →",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.ExtraBold,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                        )
                    }
                }
            }
        }
    }
}

/**
 * Explainable Price Breakdown Card (PRD Bab 4.8)
 */
@Composable
fun ExplainablePriceBreakdownCard(
    breakdown: ExplainablePriceBreakdownDto,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CardSurfaceWhite),
        border = BorderStroke(1.dp, Color(0xFFE2E8F0))
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "EXPLAINABLE PRICE BREAKDOWN (BAB 4.8)",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    color = CrimsonRedPrimary
                )
                PriceBadge(label = breakdown.priceLabel)
            }

            Text(
                text = "Transparansi rumus depresiasi aturan pasar Bali & penalti deteksi YOLOv8 (${breakdown.modelVersion})",
                fontSize = 11.sp,
                color = ZincTextSecondary
            )

            HorizontalDivider(color = Color(0xFFE2E8F0))

            BreakdownRow("Harga Standar Referensi", Formatters.formatRupiah(breakdown.standardPrice), isBold = true)
            BreakdownRow(
                "Depresiasi Usia (${breakdown.vehicleAgeYears} thn / -${breakdown.ageDepreciationPercent}%)",
                "- ${Formatters.formatRupiah(breakdown.ageDepreciationAmount)}",
                valueColor = SemanticOverpricedText
            )
            BreakdownRow(
                "Penalti Odometer (${Formatters.formatNumber(breakdown.odometerKm)} km)",
                "- ${Formatters.formatRupiah(breakdown.odometerPenalty)}",
                valueColor = SemanticOverpricedText
            )
            BreakdownRow(
                "Penalti Pajak (${breakdown.taxStatus.uppercase()})",
                "- ${Formatters.formatRupiah(breakdown.taxPenalty)}",
                valueColor = SemanticOverpricedText
            )
            BreakdownRow(
                "Harga Dasar Terdepresiasi",
                Formatters.formatRupiah(breakdown.baseDepreciatedPrice),
                isBold = true
            )
            BreakdownRow(
                "Penalti Visual AI YOLOv8 (-${breakdown.damagePenaltyPercent}%)",
                "Conf >= ${breakdown.confidenceThreshold}",
                valueColor = CrimsonRedPrimary
            )

            HorizontalDivider(color = Color(0xFFE2E8F0))

            Surface(
                color = CarbonBlack,
                contentColor = Color.White,
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "REKOMENDASI HARGA SISTEM (AI)",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF94A3B8)
                        )
                        Text(
                            text = Formatters.formatRupiah(breakdown.mlPredictedPrice),
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFF34D399)
                        )
                    }
                    breakdown.sellerPrice?.let { sellerPrice ->
                        if (sellerPrice > 0) {
                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    text = "HARGA PENJUAL",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF94A3B8)
                                )
                                Text(
                                    text = Formatters.formatRupiah(sellerPrice),
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Color.White
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun BreakdownRow(
    label: String,
    value: String,
    isBold: Boolean = false,
    valueColor: Color = ZincTextPrimary
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            fontSize = 12.sp,
            color = if (isBold) ZincTextPrimary else ZincTextSecondary,
            fontWeight = if (isBold) FontWeight.Bold else FontWeight.Normal
        )
        Text(
            text = value,
            fontSize = 12.sp,
            color = valueColor,
            fontWeight = if (isBold) FontWeight.ExtraBold else FontWeight.SemiBold
        )
    }
}

private data class Quadruple<A, B, C, D>(
    val first: A,
    val second: B,
    val third: C,
    val fourth: D
)
