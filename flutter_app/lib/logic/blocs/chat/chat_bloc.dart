import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:uuid/uuid.dart';
import '../../../data/models/message.dart';
import '../../../domain/repositories/chat_repository.dart';

// Events
abstract class ChatEvent extends Equatable {
  const ChatEvent();
  @override
  List<Object?> get props => [];
}

class ChatInit extends ChatEvent {}
class ChatSendMessage extends ChatEvent {
  final String content;
  final MessageType type;
  final String? localUri;
  final String? duration;
  const ChatSendMessage(this.content, {this.type = MessageType.text, this.localUri, this.duration});
}
class _ChatStreamData extends ChatEvent {
  final String chunk;
  const _ChatStreamData(this.chunk);
}
class _ChatStreamEnd extends ChatEvent {}
class _ChatStreamError extends ChatEvent {
  final String error;
  const _ChatStreamError(this.error);
}

// State
class ChatState extends Equatable {
  final List<Message> messages;
  final bool isModelReady;
  final bool isGenerating;
  final String? error;

  const ChatState({
    this.messages = const [],
    this.isModelReady = false,
    this.isGenerating = false,
    this.error,
  });

  ChatState copyWith({
    List<Message>? messages,
    bool? isModelReady,
    bool? isGenerating,
    String? error,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      isModelReady: isModelReady ?? this.isModelReady,
      isGenerating: isGenerating ?? this.isGenerating,
      error: error,
    );
  }

  @override
  List<Object?> get props => [messages, isModelReady, isGenerating, error];
}

// Bloc
class ChatBloc extends Bloc<ChatEvent, ChatState> {
  final ChatRepository repository;
  StreamSubscription? _dataSub;
  StreamSubscription? _endSub;
  StreamSubscription? _errorSub;

  ChatBloc(this.repository) : super(const ChatState()) {
    on<ChatInit>(_onInit);
    on<ChatSendMessage>(_onSendMessage);
    on<_ChatStreamData>(_onStreamData);
    on<_ChatStreamEnd>(_onStreamEnd);
    on<_ChatStreamError>(_onStreamError);
  }

  Future<void> _onInit(ChatInit event, Emitter<ChatState> emit) async {
    try {
      await repository.init();
      emit(state.copyWith(
        isModelReady: true,
        messages: [
          const Message(id: 'intro', type: MessageType.text, content: 'Chào bạn! Tôi là Gemma, tôi có thể giúp gì cho bạn?', sender: MessageSender.ai)
        ]
      ));

      _dataSub = repository.streamData.listen((data) => add(_ChatStreamData(data)));
      _endSub = repository.streamEnd.listen((_) => add(_ChatStreamEnd()));
      _errorSub = repository.streamError.listen((err) => add(_ChatStreamError(err)));

    } catch (e) {
      emit(state.copyWith(error: e.toString()));
    }
  }

  Future<void> _onSendMessage(ChatSendMessage event, Emitter<ChatState> emit) async {
    final userMsg = Message(
      id: const Uuid().v4(),
      type: event.type,
      content: event.content, // Text or Uri/Base64
      sender: MessageSender.user,
      localUri: event.localUri,
      duration: event.duration,
    );

    final aiMsgId = const Uuid().v4();
    final aiPlaceholder = Message(
      id: aiMsgId,
      type: MessageType.text,
      content: '',
      sender: MessageSender.ai,
      isStreaming: true
    );

    emit(state.copyWith(
      messages: [...state.messages, userMsg, aiPlaceholder],
      isGenerating: true,
    ));

    try {
      if (event.type == MessageType.text) {
        await repository.sendText(event.content);
      } else if (event.type == MessageType.image) {
        // Assume content is base64 for sendImage
        await repository.sendImage(event.content);
      } else if (event.type == MessageType.audio) {
         // Assume content is base64
        await repository.sendAudio(event.content);
      }
    } catch (e) {
      add(_ChatStreamError(e.toString()));
    }
  }

  void _onStreamData(_ChatStreamData event, Emitter<ChatState> emit) {
    final lastMsg = state.messages.last;
    if (lastMsg.sender == MessageSender.ai && lastMsg.isStreaming) {
      final updatedMsg = lastMsg.copyWith(content: lastMsg.content + event.chunk);
      final newMessages = List<Message>.from(state.messages)..removeLast()..add(updatedMsg);
      emit(state.copyWith(messages: newMessages));
    }
  }

  void _onStreamEnd(_ChatStreamEnd event, Emitter<ChatState> emit) {
    final lastMsg = state.messages.last;
    if (lastMsg.sender == MessageSender.ai) {
      final updatedMsg = lastMsg.copyWith(isStreaming: false);
      final newMessages = List<Message>.from(state.messages)..removeLast()..add(updatedMsg);
      emit(state.copyWith(messages: newMessages, isGenerating: false));
    }
  }

  void _onStreamError(_ChatStreamError event, Emitter<ChatState> emit) {
     emit(state.copyWith(error: event.error, isGenerating: false));
  }

  @override
  Future<void> close() {
    _dataSub?.cancel();
    _endSub?.cancel();
    _errorSub?.cancel();
    repository.dispose();
    return super.close();
  }
}
