package com.motolens.app.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.google.gson.Gson
import com.motolens.app.BuildConfig
import com.motolens.app.data.model.UserDto
import com.motolens.app.util.Formatters

class SessionManager(context: Context) {

    private val gson = Gson()

    private val prefs: SharedPreferences = try {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        EncryptedSharedPreferences.create(
            context,
            PREF_NAME_ENCRYPTED,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    } catch (_: Exception) {
        // Safe fallback on devices/emulators with hardware Keystore anomalies
        context.getSharedPreferences(PREF_NAME_FALLBACK, Context.MODE_PRIVATE)
    }

    fun getBaseUrl(): String {
        val saved = prefs.getString(KEY_BASE_URL, null)
        return if (saved.isNullOrBlank()) {
            Formatters.normalizeBaseUrl(BuildConfig.DEFAULT_API_BASE_URL)
        } else {
            Formatters.normalizeBaseUrl(saved)
        }
    }

    fun setBaseUrl(url: String) {
        val normalized = Formatters.normalizeBaseUrl(url)
        prefs.edit().putString(KEY_BASE_URL, normalized).apply()
    }

    fun getAuthToken(): String? {
        return prefs.getString(KEY_AUTH_TOKEN, null)
    }

    fun saveSession(token: String, user: UserDto) {
        prefs.edit()
            .putString(KEY_AUTH_TOKEN, token)
            .putString(KEY_USER_JSON, gson.toJson(user))
            .apply()
    }

    fun getSavedUser(): UserDto? {
        val json = prefs.getString(KEY_USER_JSON, null) ?: return null
        return try {
            gson.fromJson(json, UserDto::class.java)
        } catch (_: Exception) {
            null
        }
    }

    fun clearSession() {
        prefs.edit()
            .remove(KEY_AUTH_TOKEN)
            .remove(KEY_USER_JSON)
            .apply()
    }

    companion object {
        private const val PREF_NAME_ENCRYPTED = "motolens_secure_prefs"
        private const val PREF_NAME_FALLBACK = "motolens_fallback_prefs"
        private const val KEY_BASE_URL = "api_base_url"
        private const val KEY_AUTH_TOKEN = "sanctum_token"
        private const val KEY_USER_JSON = "user_profile_json"

        const val PRESET_EMULATOR_URL = "http://10.0.2.2:8000/api/v1/"
        const val PRESET_ADB_LOCALHOST_URL = "http://127.0.0.1:8000/api/v1/"
    }
}
