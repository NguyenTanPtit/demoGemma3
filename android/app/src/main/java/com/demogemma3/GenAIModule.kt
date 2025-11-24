package com.demogemma3

import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.mediapipe.tasks.genai.llminference.LlmInference
// Đã xóa import com.google.mediapipe.tasks.core.* gây lỗi
import java.io.File
import java.io.FileOutputStream
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

// Sử dụng NativeGenAISpec (Class do Codegen sinh ra)
class GenAIModule(reactContext: ReactApplicationContext) : NativeGenAISpec(reactContext) {

    private var llmInference: LlmInference? = null
    private val modelName = "gemma-3n-E2B-it-int4.task"
    private var isStreaming = false

    override fun getName(): String {
        return "GenAIModule"
    }

    private fun getModelPath(context: Context): String {
        val file = File(context.cacheDir, modelName)
        if (!file.exists()) {
            try {
                context.assets.open(modelName).use { inputStream ->
                    FileOutputStream(file).use { outputStream ->
                        inputStream.copyTo(outputStream)
                    }
                }
            } catch (e: Exception) {
                throw RuntimeException("Cannot copy model: ${e.message}")
            }
        }
        return file.absolutePath
    }

    override fun initModel(promise: Promise?) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                if (llmInference != null) {
                    promise?.resolve("Model already initialized")
                    return@launch
                }

                val modelPath = getModelPath(reactApplicationContext)

                // Cấu hình Options đơn giản, không dùng OutputHandler
                val options = LlmInference.LlmInferenceOptions.builder()
                    .setModelPath(modelPath)
                    .setMaxTokens(1024)
                    // Định nghĩa rõ kiểu dữ liệu trong lambda để Kotlin không bị nhầm lẫn
                    .setResultListener { partialResult: String, done: Boolean ->
                        sendStreamEvent(partialResult, done)
                    }
                    .build()

                llmInference = LlmInference.createFromOptions(reactApplicationContext, options)
                promise?.resolve("Model initialized successfully")
            } catch (e: Exception) {
                promise?.reject("INIT_ERROR", e)
            }
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        if (reactApplicationContext.hasActiveCatalystInstance()) {
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        }
    }

    private fun sendStreamEvent(partialResult: String?, done: Boolean) {
        if (done) {
            isStreaming = false
            val params = Arguments.createMap()
            params.putBoolean("done", true)
            sendEvent("onGenAIStreamEnd", params)
        } else {
            if (!partialResult.isNullOrEmpty()) {
                val params = Arguments.createMap()
                params.putString("chunk", partialResult)
                params.putBoolean("done", false)
                sendEvent("onGenAIStreamData", params)
            }
        }
    }

    override fun startStreamingResponse(prompt: String?) {
        if (prompt == null) return

        val inference = llmInference
        if (inference == null) {
            val params = Arguments.createMap()
            params.putString("error", "Model not initialized. Call initModel() first.")
            sendEvent("onGenAIStreamError", params)
            return
        }

        if (isStreaming) {
             val params = Arguments.createMap()
             params.putString("error", "Model is busy streaming.")
             sendEvent("onGenAIStreamError", params)
             return
        }

        isStreaming = true

        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Với bản 0.10.14, hàm generateResponseAsync chỉ kích hoạt process,
                // kết quả trả về qua ResultListener đã đăng ký ở initModel
                inference.generateResponseAsync(prompt)
            } catch (e: Exception) {
                isStreaming = false
                val params = Arguments.createMap()
                params.putString("error", e.message)
                sendEvent("onGenAIStreamError", params)
            }
        }
    }

    override fun addListener(eventName: String?) {}
    override fun removeListeners(count: Double) {}
}