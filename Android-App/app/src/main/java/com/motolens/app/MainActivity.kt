package com.motolens.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.ViewModelProvider
import com.motolens.app.ui.navigation.MotoLensAppRoot
import com.motolens.app.ui.theme.MotoLensTheme
import com.motolens.app.ui.viewmodel.MotoLensViewModel

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val app = application as MotoLensApplication
        val viewModel = ViewModelProvider(
            this,
            MotoLensViewModel.Factory(app.repository)
        )[MotoLensViewModel::class.java]

        setContent {
            MotoLensTheme {
                MotoLensAppRoot(viewModel = viewModel)
            }
        }
    }
}
