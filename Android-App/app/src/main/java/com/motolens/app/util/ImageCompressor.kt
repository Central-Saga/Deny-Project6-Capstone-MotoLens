package com.motolens.app.util

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import androidx.exifinterface.media.ExifInterface
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import kotlin.math.max

object ImageCompressor {

    private const val MAX_DIMENSION_PX = 1600
    private const val MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB limit per PRD Bab 9

    /**
     * Normalizes EXIF rotation from CameraX capture and compresses the JPEG
     * so it is guaranteed <= 2 MB while preserving crisp visual details for YOLOv8.
     */
    fun normalizeAndCompressJpeg(sourceFile: File, outputDir: File): File {
        val exif = ExifInterface(sourceFile.absolutePath)
        val orientation = exif.getAttributeInt(
            ExifInterface.TAG_ORIENTATION,
            ExifInterface.ORIENTATION_NORMAL
        )
        val rotationDegrees = when (orientation) {
            ExifInterface.ORIENTATION_ROTATE_90 -> 90f
            ExifInterface.ORIENTATION_ROTATE_180 -> 180f
            ExifInterface.ORIENTATION_ROTATE_270 -> 270f
            else -> 0f
        }

        // Decode bounds first
        val boundsOptions = BitmapFactory.Options().apply {
            inJustDecodeBounds = true
        }
        BitmapFactory.decodeFile(sourceFile.absolutePath, boundsOptions)

        var sampleSize = 1
        val longestSide = max(boundsOptions.outWidth, boundsOptions.outHeight)
        if (longestSide > MAX_DIMENSION_PX) {
            sampleSize = max(1, longestSide / MAX_DIMENSION_PX)
        }

        val decodeOptions = BitmapFactory.Options().apply {
            inSampleSize = sampleSize
            inPreferredConfig = Bitmap.Config.ARGB_8888
        }
        val rawBitmap = BitmapFactory.decodeFile(sourceFile.absolutePath, decodeOptions)
            ?: return sourceFile

        // Rotate if needed and scale down if still larger than MAX_DIMENSION_PX
        val matrix = Matrix()
        if (rotationDegrees != 0f) {
            matrix.postRotate(rotationDegrees)
        }
        val currentLongest = max(rawBitmap.width, rawBitmap.height)
        if (currentLongest > MAX_DIMENSION_PX) {
            val scale = MAX_DIMENSION_PX.toFloat() / currentLongest.toFloat()
            matrix.postScale(scale, scale)
        }

        val normalizedBitmap = Bitmap.createBitmap(
            rawBitmap,
            0,
            0,
            rawBitmap.width,
            rawBitmap.height,
            matrix,
            true
        )

        var quality = 88
        val baos = ByteArrayOutputStream()
        normalizedBitmap.compress(Bitmap.CompressFormat.JPEG, quality, baos)

        while (baos.size() > MAX_FILE_SIZE_BYTES && quality > 45) {
            baos.reset()
            quality -= 10
            normalizedBitmap.compress(Bitmap.CompressFormat.JPEG, quality, baos)
        }

        val outFile = File(outputDir, "motolens_camerax_${System.currentTimeMillis()}.jpg")
        FileOutputStream(outFile).use { fos ->
            fos.write(baos.toByteArray())
            fos.flush()
        }

        if (normalizedBitmap != rawBitmap) {
            rawBitmap.recycle()
        }
        normalizedBitmap.recycle()

        return outFile
    }
}
