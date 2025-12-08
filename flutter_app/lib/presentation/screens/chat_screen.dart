import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:record/record.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:path_provider/path_provider.dart';
import '../../logic/blocs/chat/chat_bloc.dart';
import '../../data/models/message.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({Key? key}) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final AudioRecorder _audioRecorder = AudioRecorder();
  final AudioPlayer _audioPlayer = AudioPlayer();

  bool _isRecording = false;
  XFile? _selectedImage;

  @override
  void initState() {
    super.initState();
    context.read<ChatBloc>().add(ChatInit());
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _handleSend() async {
    final text = _textController.text.trim();
    if (text.isEmpty && _selectedImage == null) return;

    if (_selectedImage != null) {
      // Process Image
      final bytes = await _selectedImage!.readAsBytes();
      // Compress if needed (mocked here, in real app use flutter_image_compress)
      final base64Image = base64Encode(bytes);

      context.read<ChatBloc>().add(ChatSendMessage(
        base64Image,
        type: MessageType.image,
        localUri: _selectedImage!.path
      ));

      setState(() => _selectedImage = null);
    } else {
      context.read<ChatBloc>().add(ChatSendMessage(text));
    }

    _textController.clear();
    _scrollToBottom();
  }

  Future<void> _pickImage(ImageSource source) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: source);
    if (picked != null) {
      setState(() => _selectedImage = picked);
    }
  }

  Future<void> _toggleRecording() async {
    if (_isRecording) {
      final path = await _audioRecorder.stop();
      setState(() => _isRecording = false);
      if (path != null) {
        final bytes = await File(path).readAsBytes();
        final base64Audio = base64Encode(bytes);
        context.read<ChatBloc>().add(ChatSendMessage(
           base64Audio,
           type: MessageType.audio,
           localUri: path,
           duration: "Audio" // Calculate duration if needed
        ));
      }
    } else {
      if (await Permission.microphone.request().isGranted) {
        final dir = await getTemporaryDirectory();
        final path = '${dir.path}/audio_${DateTime.now().millisecondsSinceEpoch}.m4a';
        await _audioRecorder.start(const RecordConfig(), path: path);
        setState(() => _isRecording = true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Gemma Chat')),
      body: BlocListener<ChatBloc, ChatState>(
        listener: (context, state) {
           // Auto scroll on new message
           if (state.messages.isNotEmpty) {
             // slight delay to allow list to render
             Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
           }
        },
        child: Column(
          children: [
            Expanded(
              child: BlocBuilder<ChatBloc, ChatState>(
                builder: (context, state) {
                  return ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(10),
                    itemCount: state.messages.length,
                    itemBuilder: (context, index) {
                      final msg = state.messages[index];
                      return _buildMessageBubble(msg);
                    },
                  );
                },
              ),
            ),
            if (_selectedImage != null)
              Container(
                padding: const EdgeInsets.all(8),
                color: Colors.grey[200],
                child: Row(
                  children: [
                    Image.file(File(_selectedImage!.path), height: 50, width: 50, fit: BoxFit.cover),
                    const SizedBox(width: 10),
                    IconButton(icon: const Icon(Icons.close), onPressed: () => setState(() => _selectedImage = null))
                  ],
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.photo),
                    onPressed: () => _pickImage(ImageSource.gallery),
                  ),
                  IconButton(
                    icon: const Icon(Icons.camera_alt),
                    onPressed: () => _pickImage(ImageSource.camera),
                  ),
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      decoration: const InputDecoration(
                        hintText: 'Nhập tin nhắn...',
                        border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(20))),
                        contentPadding: EdgeInsets.symmetric(horizontal: 15, vertical: 10),
                      ),
                    ),
                  ),
                  IconButton(
                    icon: Icon(_isRecording ? Icons.stop : Icons.mic),
                    color: _isRecording ? Colors.red : null,
                    onPressed: _toggleRecording,
                  ),
                  IconButton(
                    icon: const Icon(Icons.send),
                    color: Theme.of(context).primaryColor,
                    onPressed: _handleSend,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble(Message msg) {
    final isUser = msg.sender == MessageSender.user;
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 5),
        padding: const EdgeInsets.all(12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
        decoration: BoxDecoration(
          color: isUser ? Colors.pink[400] : Colors.pink[100],
          borderRadius: BorderRadius.circular(15),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (msg.type == MessageType.text)
              Text(
                msg.content + (msg.isStreaming ? ' ▋' : ''),
                style: TextStyle(color: isUser ? Colors.white : Colors.pink[900]),
              ),
            if (msg.type == MessageType.image)
               ClipRRect(
                 borderRadius: BorderRadius.circular(8),
                 child: Image.file(File(msg.localUri ?? ''), height: 150, width: 150, fit: BoxFit.cover)
               ),
            if (msg.type == MessageType.audio)
               InkWell(
                 onTap: () => _audioPlayer.play(DeviceFileSource(msg.localUri ?? '')),
                 child: Row(
                   mainAxisSize: MainAxisSize.min,
                   children: [
                     Icon(Icons.play_circle_fill, color: isUser ? Colors.white : Colors.pink[900]),
                     const SizedBox(width: 5),
                     Text('Audio', style: TextStyle(color: isUser ? Colors.white : Colors.pink[900])),
                   ],
                 ),
               )
          ],
        ),
      ),
    );
  }
}
