import 'dart:async';
import 'package:flutter/services.dart';

class GenAIService {
  static const MethodChannel _channel = MethodChannel('com.demogemma3/genai');
  static const EventChannel _eventChannel = EventChannel('com.demogemma3/genai_events');

  StreamSubscription? _streamSubscription;
  final StreamController<String> _responseController = StreamController<String>.broadcast();
  final StreamController<void> _endController = StreamController<void>.broadcast();
  final StreamController<String> _errorController = StreamController<String>.broadcast();

  Stream<String> get onStreamData => _responseController.stream;
  Stream<void> get onStreamEnd => _endController.stream;
  Stream<String> get onStreamError => _errorController.stream;

  Future<void> initModel() async {
    try {
      await _channel.invokeMethod('initModel');
      _listenToEvents();
    } catch (e) {
      throw Exception('Failed to init model: $e');
    }
  }

  Future<void> startStreamingResponse(String prompt) async {
    try {
      await _channel.invokeMethod('startStreamingResponse', {'prompt': prompt});
    } catch (e) {
      throw Exception('Failed to start streaming: $e');
    }
  }

  Future<void> sendImagePrompt(String base64Image) async {
     await startStreamingResponse('[IMAGE_DATA:$base64Image]');
  }

  Future<void> sendAudioPrompt(String base64Audio) async {
     await startStreamingResponse('[AUDIO_DATA:$base64Audio]');
  }

  Future<void> resetConversation() async {
    await _channel.invokeMethod('resetConversation');
  }

  Future<void> shutdown() async {
    await _streamSubscription?.cancel();
    await _channel.invokeMethod('shutdown');
  }

  void _listenToEvents() {
    _streamSubscription = _eventChannel.receiveBroadcastStream().listen((event) {
      final Map<dynamic, dynamic> map = event;
      if (map.containsKey('chunk')) {
        _responseController.add(map['chunk'] as String);
      } else if (map.containsKey('error')) {
        _errorController.add(map['error'] as String);
      } else if (map.containsKey('end')) {
         _endController.add(null);
      }
    }, onError: (error) {
       _errorController.add(error.toString());
    });
  }
}
