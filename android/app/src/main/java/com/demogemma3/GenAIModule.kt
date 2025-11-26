package com.demogemma3

import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.mediapipe.tasks.genai.llminference.LlmInference
import com.google.mediapipe.tasks.genai.llminference.LlmInferenceSession
import android.util.Log
import java.io.File
import java.io.FileOutputStream
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

// Sử dụng NativeGenAISpec (Class do Codegen sinh ra)
class GenAIModule(reactContext: ReactApplicationContext) : NativeGenAISpec(reactContext) {

    private var llmInference: LlmInference? = null
    private var llmSession: LlmInferenceSession? = null  // Giữ session cho conversation
    private val modelName = "gemma-3n-E2B-it-int4.task"
    private var isStreaming = false

    override fun getName(): String {
        return "GenAIModule"
    }

    private fun getModelPath(context: Context): String {
        val file = File(context.cacheDir, modelName)
        if (file.exists()) {
            Log.d("GenAI", "Found model in cache. Size: ${file.length()} bytes")
        }
        if (!file.exists() || file.length() < 10 * 1024 * 1024) {
            Log.d("GenAI", "Copying model from assets...")
            try {
                context.assets.open(modelName).use { inputStream ->
                    FileOutputStream(file).use { outputStream ->
                        inputStream.copyTo(outputStream)
                    }
                }
                Log.d("GenAI", "Copy success. New Size: ${file.length()} bytes")
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

                val options = LlmInference.LlmInferenceOptions.builder()
                    .setModelPath(modelPath)
                    .setMaxTokens(1024)
                    .build()

                llmInference = LlmInference.createFromOptions(reactApplicationContext, options)

                // Tạo session ngay khi init model (cho conversation đầu tiên)
                createSession()

                promise?.resolve("Model and session initialized successfully")
            } catch (e: Exception) {
                promise?.reject("INIT_ERROR", e)
            }
        }
    }

    // Hàm tạo session mới (gọi khi init hoặc reset)
    private fun createSession() {
        val inference = llmInference ?: return
        try {
            val sessionOptions = LlmInferenceSession.LlmInferenceSessionOptions.builder()
                // .setTopK(40) // Uncomment nếu cần
                // .setTemperature(0.8f) // Uncomment nếu cần
                .build()

            llmSession = LlmInferenceSession.createFromOptions(inference, sessionOptions)
            Log.d("GenAI", "Session created")
        } catch (e: Exception) {
            Log.e("GenAI", "Error creating session: ${e.message}")
        }
    }

    // Hàm mới: Reset session (close cũ và tạo mới) - Gọi từ JS khi cần reset chat
    override fun resetConversation(promise: Promise?) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                llmSession?.close()
                llmSession = null
                createSession()
                promise?.resolve("Conversation reset successfully")
            } catch (e: Exception) {
                promise?.reject("RESET_ERROR", e)
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
        val session = llmSession
        if (inference == null || session == null) {
            val params = Arguments.createMap()
            params.putString("error", "Model or session not initialized. Call initModel() first.")
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
                // Add prompt user vào session (giữ lịch sử)
                session.addQueryChunk(prompt)

                // Gọi generate và truyền listener
                session.generateResponseAsync { partialResult: String, done: Boolean ->
                    sendStreamEvent(partialResult, done)

                    if (done) {
                        // Add response của model vào session để nhớ cho lần sau
                        // (Giả sử bạn có cách lấy full response; hiện tại partialResult là chunk, cần tổng hợp nếu cần)
                        // Ví dụ: session.addQueryChunk(fullResponse) // Nhưng thực tế, generateResponseAsync đã tự add response vào context
                    }
                }
            } catch (e: Exception) {
                isStreaming = false
                val params = Arguments.createMap()
                params.putString("error", e.message)
                sendEvent("onGenAIStreamError", params)
            }
        }
    }

    override fun shutdown(promise: Promise?) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                llmSession?.close()
                llmInference?.close()  // Nếu có hàm close cho inference
                llmSession = null
                llmInference = null
                promise?.resolve("Shutdown successfully")
            } catch (e: Exception) {
                promise?.reject("SHUTDOWN_ERROR", e)
            }
        }
    }

    override fun addListener(eventName: String?) {}
    override fun removeListeners(count: Double) {}
}