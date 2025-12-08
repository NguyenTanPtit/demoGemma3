import 'dart:async';
import '../../data/services/gen_ai_service.dart';

class ChatRepository {
  final GenAIService _service;

  ChatRepository(this._service);

  Future<void> init() => _service.initModel();

  Future<void> sendText(String text) => _service.startStreamingResponse(text);

  Future<void> sendImage(String base64) => _service.sendImagePrompt(base64);

  Future<void> sendAudio(String base64) => _service.sendAudioPrompt(base64);

  Stream<String> get streamData => _service.onStreamData;
  Stream<void> get streamEnd => _service.onStreamEnd;
  Stream<String> get streamError => _service.onStreamError;

  Future<void> dispose() => _service.shutdown();
}
