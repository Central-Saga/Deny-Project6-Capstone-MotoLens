package com.motolens.app

import android.app.Application
import com.motolens.app.data.local.SessionManager
import com.motolens.app.data.remote.RetrofitClient
import com.motolens.app.data.repository.MotoLensRepository

class MotoLensApplication : Application() {

    lateinit var sessionManager: SessionManager
        private set

    lateinit var repository: MotoLensRepository
        private set

    override fun onCreate() {
        super.onCreate()
        sessionManager = SessionManager(this)
        val apiService = RetrofitClient.createApiService(sessionManager)
        repository = MotoLensRepository(apiService, sessionManager)
    }
}
