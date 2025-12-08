enum MessageType { text, image, audio }
enum MessageSender { user, ai }

class Message {
  final String id;
  final MessageType type;
  final String content;
  final MessageSender sender;
  final bool isStreaming;
  final String? localUri;
  final String? duration;

  const Message({
    required this.id,
    required this.type,
    required this.content,
    required this.sender,
    this.isStreaming = false,
    this.localUri,
    this.duration,
  });

  Message copyWith({
    String? id,
    MessageType? type,
    String? content,
    MessageSender? sender,
    bool? isStreaming,
    String? localUri,
    String? duration,
  }) {
    return Message(
      id: id ?? this.id,
      type: type ?? this.type,
      content: content ?? this.content,
      sender: sender ?? this.sender,
      isStreaming: isStreaming ?? this.isStreaming,
      localUri: localUri ?? this.localUri,
      duration: duration ?? this.duration,
    );
  }
}
