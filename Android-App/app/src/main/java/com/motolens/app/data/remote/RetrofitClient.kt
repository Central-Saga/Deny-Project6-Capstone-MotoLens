package com.motolens.app.data.remote

import com.motolens.app.BuildConfig
import com.motolens.app.data.local.SessionManager
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {

    /**
     * Dynamically rewrites the request URL host/port/prefix according to the latest Base URL
     * saved in SessionManager without requiring an APK rebuild (PRD Bab 9 & Bab 12).
     * Also attaches the Sanctum Bearer token and `Accept: application/json`.
     */
    fun createApiService(sessionManager: SessionManager): MotoLensApiService {
        val dynamicInterceptor = Interceptor { chain ->
            val originalRequest = chain.request()
            val configuredBaseUrl = sessionManager.getBaseUrl().toHttpUrlOrNull()

            val newUrl = if (configuredBaseUrl != null) {
                val defaultBase = BuildConfig.DEFAULT_API_BASE_URL.toHttpUrlOrNull()
                val relativePath = if (defaultBase != null) {
                    originalRequest.url.encodedPath.removePrefix(defaultBase.encodedPath)
                } else {
                    originalRequest.url.encodedPath
                }

                val cleanBasePath = configuredBaseUrl.encodedPath.trimEnd('/')
                val cleanRelPath = relativePath.trimStart('/')

                originalRequest.url.newBuilder()
                    .scheme(configuredBaseUrl.scheme)
                    .host(configuredBaseUrl.host)
                    .port(configuredBaseUrl.port)
                    .encodedPath("$cleanBasePath/$cleanRelPath")
                    .build()
            } else {
                originalRequest.url
            }

            val requestBuilder = originalRequest.newBuilder()
                .url(newUrl)
                .header("Accept", "application/json")

            val token = sessionManager.getAuthToken()
            if (!token.isNullOrBlank()) {
                requestBuilder.header("Authorization", "Bearer $token")
            }

            chain.proceed(requestBuilder.build())
        }

        // Security rule (PRD Bab 9.3): Never log Authorization header or sensitive tokens
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            redactHeader("Authorization")
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BASIC
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }

        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(dynamicInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(45, TimeUnit.SECONDS)
            .readTimeout(45, TimeUnit.SECONDS)
            .writeTimeout(45, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl(BuildConfig.DEFAULT_API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(MotoLensApiService::class.java)
    }
}
